import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { lookupIp } from "@/lib/geo";
import { parseUserAgent, isSocialCrawler } from "@/lib/ua";
import { detectSource } from "@/lib/source";
import { hashVisitor, hashIp } from "@/lib/crypto";

const RESERVED_WORDS = new Set([
  "api",
  "admin",
  "dashboard",
  "links",
  "analytics",
  "profile",
  "campaigns",
  "pages",
  "settings",
  "favicon.ico",
  "_next",
  "robots.txt",
  "sitemap.xml",
]);

export async function GET(
  request: NextRequest,
  { params }: { params: { shortCode: string } }
) {
  const shortCode = params.shortCode;

  if (RESERVED_WORDS.has(shortCode.toLowerCase())) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // 1. Resolve Link & Owner
  const link = await db.link.findUnique({
    where: { shortCode },
    include: {
      user: {
        select: {
          id: true,
          status: true,
          trafficPercentageOverride: true,
        },
      },
    },
  });

  // Settings
  const settings = await db.setting.findMany();
  const settingsMap = new Map(settings.map((s) => [s.settingKey, s.settingValue]));
  const defaultFallbackUrl = settingsMap.get("default_fallback_url") || "https://jii.life";
  const duplicateWindowMinutes = parseInt(
    settingsMap.get("duplicate_window_minutes") || "30",
    10
  );
  const botFiltering = settingsMap.get("bot_filtering_enabled") !== "false";
  const globalCreditRate = parseFloat(
    settingsMap.get("traffic_credit_percentage") || "50"
  );
  const internalTestIp = settingsMap.get("internal_test_ip") || "";

  if (!link || link.status === "DISABLED" || link.user.status !== "ACTIVE") {
    return NextResponse.redirect(new URL(defaultFallbackUrl), 302);
  }

  // Check Expiration
  if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
    return link.fallbackUrl
      ? NextResponse.redirect(new URL(link.fallbackUrl), 302)
      : new NextResponse(
          `<html><body style="font-family:sans-serif;text-align:center;padding:50px;"><h2>Link Expired</h2><p>This tracking link has reached its expiration date.</p></body></html>`,
          { status: 410, headers: { "content-type": "text/html" } }
        );
  }

  // Check Paused
  if (link.status === "PAUSED") {
    return link.fallbackUrl
      ? NextResponse.redirect(new URL(link.fallbackUrl), 302)
      : new NextResponse(
          `<html><body style="font-family:sans-serif;text-align:center;padding:50px;"><h2>Link Temporarily Inactive</h2><p>This link is currently paused by the campaign manager.</p></body></html>`,
          { status: 410, headers: { "content-type": "text/html" } }
        );
  }

  const userAgent = request.headers.get("user-agent") || "";
  const referrer = request.headers.get("referer") || "";
  const rawIp =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  // 2. Crawler / Social Platform Preview Interceptor
  if (isSocialCrawler(userAgent)) {
    const title = link.previewTitle || "Job Opportunity & Company Update";
    const desc = link.previewDescription || "Click to view full details and apply online.";
    const image = link.previewImage || "";
    const destination = link.destinationUrl;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(desc)}" />
  ${image ? `<meta property="og:image" content="${escapeHtml(image)}" />` : ""}
  <meta property="og:url" content="${escapeHtml(destination)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(desc)}" />
  ${image ? `<meta name="twitter:image" content="${escapeHtml(image)}" />` : ""}
  <meta http-equiv="refresh" content="0;url=${escapeHtml(destination)}" />
  <script>window.location.href = ${JSON.stringify(destination)};</script>
</head>
<body style="font-family: sans-serif; text-align: center; padding: 40px;">
  <p>Redirecting to <a href="${escapeHtml(destination)}">${escapeHtml(destination)}</a>...</p>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  // 3. Parse Real Visitor Context
  const isTestQuery = request.nextUrl.searchParams.get("test") === "1";
  const isInternalIp = Boolean(internalTestIp && rawIp.includes(internalTestIp));
  const isTest = Boolean(isTestQuery || isInternalIp);

  const geo = await lookupIp(rawIp, request.headers);
  const uaParsed = parseUserAgent(userAgent);
  const sourceInfo = detectSource(referrer, request.nextUrl.searchParams);
  const visitorHash = hashVisitor(rawIp, userAgent);
  const ipHash = hashIp(rawIp);

  const isBot = botFiltering && uaParsed.isBot;

  // Deduplication Check: Same visitor hash + same link within duplicate window
  const windowStart = new Date(Date.now() - duplicateWindowMinutes * 60 * 1000);
  const recentDuplicate = await db.trafficEvent.findFirst({
    where: {
      linkId: link.id,
      ipHash,
      timestampUtc: { gte: windowStart },
    },
    select: { id: true },
  });

  const isDuplicate = !!recentDuplicate;

  // Unique Visitor Check: Has this visitor ever visited this link?
  const previousVisit = await db.trafficEvent.findFirst({
    where: {
      linkId: link.id,
      ipHash,
    },
    select: { id: true },
  });

  const isUnique = !previousVisit;

  // Validity Logic
  let isValid = true;
  let invalidReason: string | null = null;

  if (isTest) {
    isValid = false;
    invalidReason = "internal_test";
  } else if (isBot) {
    isValid = false;
    invalidReason = "bot_detected";
  } else if (isDuplicate) {
    isValid = false;
    invalidReason = "duplicate_window";
  }

  // 4. Save Event Asynchronously
  try {
    const todayStr = new Date().toISOString().split("T")[0];
    const effectiveRate = link.user.trafficPercentageOverride ?? globalCreditRate;

    // Create event
    await db.trafficEvent.create({
      data: {
        linkId: link.id,
        userId: link.userId,
        timestampUtc: new Date(),
        ipAddress: rawIp.startsWith("127.") ? "127.0.0.1" : rawIp.split(".")[0] + ".xxx.xxx." + rawIp.split(".").pop(),
        ipHash,
        countryCode: geo.countryCode,
        countryName: geo.countryName,
        region: geo.region,
        city: geo.city,
        timezone: geo.timezone,
        referrer: sourceInfo.referrer,
        source: sourceInfo.source,
        utmSource: sourceInfo.utmSource,
        utmMedium: sourceInfo.utmMedium,
        utmCampaign: sourceInfo.utmCampaign,
        userAgent,
        browser: uaParsed.browser,
        browserVersion: uaParsed.browserVersion,
        os: uaParsed.os,
        osVersion: uaParsed.osVersion,
        deviceType: uaParsed.deviceType,
        isUnique,
        isDuplicate,
        isBot,
        isValid,
        isTest,
        invalidReason,
      },
    });

    // Update Daily Aggregate Stats
    const existingStat = await db.dailyTrafficStat.findUnique({
      where: {
        date_userId_linkId: {
          date: todayStr,
          userId: link.userId,
          linkId: link.id,
        },
      },
    });

    if (existingStat) {
      const newRaw = existingStat.rawHits + 1;
      const newValid = existingStat.validHits + (isValid ? 1 : 0);
      const newInvalid = existingStat.invalidHits + (!isValid && !isTest ? 1 : 0);
      const newCredited = Math.floor((newValid * effectiveRate) / 100);

      await db.dailyTrafficStat.update({
        where: { id: existingStat.id },
        data: {
          rawHits: newRaw,
          validHits: newValid,
          invalidHits: newInvalid,
          creditedHits: newCredited,
          appliedPercentage: effectiveRate,
        },
      });
    } else {
      const newValid = isValid ? 1 : 0;
      await db.dailyTrafficStat.create({
        data: {
          date: todayStr,
          userId: link.userId,
          linkId: link.id,
          rawHits: 1,
          validHits: newValid,
          invalidHits: !isValid && !isTest ? 1 : 0,
          creditedHits: Math.floor((newValid * effectiveRate) / 100),
          appliedPercentage: effectiveRate,
        },
      });
    }
  } catch (err) {
    console.error("Traffic logging error:", err);
  }

  // 5. Fast Redirect to Destination
  return NextResponse.redirect(new URL(link.destinationUrl), 302);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
