import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = user.role === "SUPER_ADMIN" || user.role === "ADMIN";
  const { searchParams } = request.nextUrl;
  const requestedUserId = searchParams.get("userId");
  const requestedLinkId = searchParams.get("linkId");

  const now = new Date();
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);

  const whereClause: any = {
    isTest: false,
    timestampUtc: { gte: thirtyMinAgo },
  };

  // Scope: Employee can ONLY see their own traffic
  if (!isAdmin) {
    whereClause.userId = user.id;
  } else if (requestedUserId && requestedUserId !== "all") {
    whereClause.userId = requestedUserId;
  }

  if (requestedLinkId && requestedLinkId !== "all") {
    whereClause.linkId = requestedLinkId;
  }

  // Get global credit percentage if needed
  const globalSetting = await db.setting.findUnique({
    where: { settingKey: "traffic_credit_percentage" },
  });
  const defaultRate = globalSetting ? parseFloat(globalSetting.settingValue) : 50.0;

  // Fetch events in last 30 minutes
  const events30m = await db.trafficEvent.findMany({
    where: whereClause,
    orderBy: { timestampUtc: "asc" },
    include: {
      user: { select: { id: true, name: true, email: true, trafficPercentageOverride: true } },
      link: { select: { id: true, shortCode: true, destinationUrl: true, previewTitle: true } },
    },
  });

  // 1. Prepare 30 minute buckets (from 29 minutes ago to current minute 0)
  const nowMs = now.getTime();
  const minuteBuckets = Array.from({ length: 30 }, (_, i) => {
    const minsAgo = 29 - i; // 29, 28, ... 1, 0
    const bucketDate = new Date(nowMs - minsAgo * 60 * 1000);
    const timeLabel = bucketDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return {
      index: i,
      minsAgo,
      label: minsAgo === 0 ? "Now" : `-${minsAgo}m`,
      timeLabel,
      validVisits: 0,
      creditedVisits: 0,
      rawHits: 0,
    };
  });

  // Track breakdown dimensions in last 30 minutes
  let visits5m = 0;
  let visits30m = 0;
  let credited30m = 0;

  const countryCounts: Record<string, { code: string; name: string; count: number }> = {};
  const linkCounts: Record<string, { id: string; shortCode: string; destinationUrl: string; title?: string; count: number }> = {};
  const sourceCounts: Record<string, number> = {};
  const deviceCounts: Record<string, number> = {};

  for (const ev of events30m) {
    const evTime = ev.timestampUtc.getTime();
    const diffMs = nowMs - evTime;
    const diffMins = Math.floor(diffMs / (60 * 1000));

    // Assign to minute bucket
    if (diffMins >= 0 && diffMins < 30) {
      const bucketIdx = 29 - diffMins;
      if (minuteBuckets[bucketIdx]) {
        minuteBuckets[bucketIdx].rawHits++;
        if (ev.isValid) {
          minuteBuckets[bucketIdx].validVisits++;
          const rate = ev.user?.trafficPercentageOverride ?? defaultRate;
          minuteBuckets[bucketIdx].creditedVisits += rate / 100;
        }
      }
    }

    if (ev.isValid) {
      visits30m++;
      const rate = ev.user?.trafficPercentageOverride ?? defaultRate;
      credited30m += rate / 100;

      if (evTime >= fiveMinAgo.getTime()) {
        visits5m++;
      }

      // Countries
      const cCode = ev.countryCode || "Other";
      const cName = ev.countryName || "Unknown";
      if (!countryCounts[cCode]) {
        countryCounts[cCode] = { code: cCode, name: cName, count: 0 };
      }
      countryCounts[cCode].count++;

      // Links
      if (ev.link) {
        if (!linkCounts[ev.link.id]) {
          linkCounts[ev.link.id] = {
            id: ev.link.id,
            shortCode: ev.link.shortCode,
            destinationUrl: ev.link.destinationUrl,
            title: ev.link.previewTitle || undefined,
            count: 0,
          };
        }
        linkCounts[ev.link.id].count++;
      }

      // Sources
      const src = ev.source || "Direct";
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;

      // Devices
      const dev = ev.deviceType || "Desktop";
      deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;
    }
  }

  // Format buckets
  const candles = minuteBuckets.map((b) => ({
    ...b,
    creditedVisits: Math.round(b.creditedVisits * 10) / 10,
  }));

  // Top dimensions sorted
  const topCountries = Object.values(countryCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((c) => ({
      ...c,
      percentage: visits30m > 0 ? Math.round((c.count / visits30m) * 100) : 0,
    }));

  const topLinks = Object.values(linkCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((l) => ({
      ...l,
      percentage: visits30m > 0 ? Math.round((l.count / visits30m) * 100) : 0,
    }));

  const topSources = Object.entries(sourceCounts)
    .map(([source, count]) => ({
      source,
      count,
      percentage: visits30m > 0 ? Math.round((count / visits30m) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topDevices = Object.entries(deviceCounts)
    .map(([device, count]) => ({
      device,
      count,
      percentage: visits30m > 0 ? Math.round((count / visits30m) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Recent 15 events for live activity ticker
  const latestEvents = events30m
    .slice(-15)
    .reverse()
    .map((ev) => ({
      id: ev.id,
      timestamp: ev.timestampUtc,
      shortCode: ev.link?.shortCode,
      destinationUrl: ev.link?.destinationUrl,
      country: ev.countryName || "Unknown",
      countryCode: ev.countryCode || "Other",
      city: ev.city || "Unknown",
      deviceType: ev.deviceType || "Desktop",
      source: ev.source || "Direct",
      isValid: ev.isValid,
      employeeName: isAdmin ? ev.user?.name : undefined,
    }));

  return NextResponse.json({
    success: true,
    data: {
      visits30m,
      visits5m,
      credited30m: Math.floor(credited30m),
      perMinuteAvg: Math.round((visits30m / 30) * 10) / 10,
      candles,
      topCountries,
      topLinks,
      topSources,
      topDevices,
      events: latestEvents,
    },
  });
}
