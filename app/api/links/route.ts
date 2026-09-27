import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

function generateShortCode(length = 6): string {
  const chars = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const RESERVED_WORDS = new Set([
  "api", "admin", "dashboard", "links", "analytics", "profile", "campaigns",
  "pages", "settings", "audit", "login", "register", "support", "help",
  "terms", "privacy", "favicon.ico", "robots.txt", "sitemap.xml", "_next"
]);

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const employeeId = searchParams.get("employeeId");
  const tag = searchParams.get("tag");

  const isAdmin = user.role === "SUPER_ADMIN" || user.role === "ADMIN";

  const where: any = {};

  // Role scoping: employee can only see their own links
  if (!isAdmin) {
    where.userId = user.id;
  } else if (employeeId && employeeId !== "all") {
    where.userId = employeeId;
  }

  if (status && status !== "all") {
    where.status = status;
  }

  if (tag) {
    where.tags = { contains: tag };
  }

  if (search) {
    where.OR = [
      { shortCode: { contains: search } },
      { destinationUrl: { contains: search } },
      { previewTitle: { contains: search } },
      { tags: { contains: search } },
    ];
  }

  const links = await db.link.findMany({
    where,
    include: {
      user: {
        select: { id: true, name: true, email: true, trafficPercentageOverride: true },
      },
      _count: {
        select: { trafficEvents: true },
      },
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });

  // Calculate aggregated stats for each link
  const stats = await db.dailyTrafficStat.groupBy({
    by: ["linkId"],
    _sum: {
      rawHits: true,
      validHits: true,
      creditedHits: true,
    },
    where: {
      linkId: { in: links.map((l) => l.id) },
    },
  });

  const statsMap = new Map(
    stats.map((s) => [
      s.linkId,
      {
        rawHits: s._sum.rawHits || 0,
        validHits: s._sum.validHits || 0,
        creditedHits: s._sum.creditedHits || 0,
      },
    ])
  );

  const formattedLinks = links.map((link) => {
    const linkStats = statsMap.get(link.id) || { rawHits: 0, validHits: 0, creditedHits: 0 };
    return {
      id: link.id,
      shortCode: link.shortCode,
      destinationUrl: link.destinationUrl,
      previewTitle: link.previewTitle,
      previewDescription: link.previewDescription,
      previewImage: link.previewImage,
      tags: link.tags,
      internalNotes: isAdmin || link.userId === user.id ? link.internalNotes : undefined,
      status: link.status,
      healthStatus: link.healthStatus,
      isPinned: link.isPinned,
      expiresAt: link.expiresAt,
      fallbackUrl: link.fallbackUrl,
      createdAt: link.createdAt,
      user: link.user,
      rawHits: isAdmin ? linkStats.rawHits : undefined,
      validHits: isAdmin ? linkStats.validHits : undefined,
      creditedHits: linkStats.creditedHits,
    };
  });

  return NextResponse.json({ success: true, links: formattedLinks });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const destinationUrl = body.destinationUrl?.trim();
    let shortCode = body.customAlias?.trim() || "";
    const previewTitle = body.previewTitle?.trim() || null;
    const previewDescription = body.previewDescription?.trim() || null;
    const previewImage = body.previewImage?.trim() || null;
    const tags = body.tags?.trim() || null;
    const internalNotes = body.internalNotes?.trim() || null;
    const fallbackUrl = body.fallbackUrl?.trim() || null;
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

    if (!destinationUrl) {
      return NextResponse.json(
        { success: false, message: "Destination URL is required." },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(destinationUrl);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid Destination URL format. Must start with http:// or https://" },
        { status: 400 }
      );
    }

    // Check Allowed Domains from Settings
    const setting = await db.setting.findUnique({
      where: { settingKey: "allowed_domains" },
    });
    if (setting?.settingValue) {
      const allowedList = setting.settingValue
        .split(",")
        .map((d) => d.trim().toLowerCase())
        .filter(Boolean);
      if (allowedList.length > 0) {
        try {
          const destHost = new URL(destinationUrl).hostname.toLowerCase();
          const isAllowed = allowedList.some(
            (domain) => destHost === domain || destHost.endsWith("." + domain)
          );
          if (!isAllowed) {
            return NextResponse.json(
              {
                success: false,
                message: `Destination domain "${destHost}" is not in the company approved domains list: ${allowedList.join(
                  ", "
                )}`,
              },
              { status: 400 }
            );
          }
        } catch {}
      }
    }

    // Handle Custom Alias or Auto Short Code
    if (shortCode) {
      if (RESERVED_WORDS.has(shortCode.toLowerCase())) {
        return NextResponse.json(
          { success: false, message: `"${shortCode}" is a reserved system word. Please choose another alias.` },
          { status: 400 }
        );
      }
      if (!/^[a-zA-Z0-9_-]{3,50}$/.test(shortCode)) {
        return NextResponse.json(
          { success: false, message: "Custom alias must be 3-50 characters with only letters, numbers, hyphens or underscores." },
          { status: 400 }
        );
      }
      const existing = await db.link.findUnique({ where: { shortCode } });
      if (existing) {
        return NextResponse.json(
          { success: false, message: `Short code "${shortCode}" is already in use. Please select a different one.` },
          { status: 409 }
        );
      }
    } else {
      let unique = false;
      while (!unique) {
        shortCode = generateShortCode();
        const existing = await db.link.findUnique({ where: { shortCode } });
        if (!existing && !RESERVED_WORDS.has(shortCode.toLowerCase())) {
          unique = true;
        }
      }
    }

    // Check duplicate destination warning for employee
    const duplicateForUser = await db.link.findFirst({
      where: {
        userId: user.id,
        destinationUrl,
        status: "ACTIVE",
      },
      select: { shortCode: true },
    });

    const newLink = await db.link.create({
      data: {
        userId: user.id,
        shortCode,
        destinationUrl,
        previewTitle,
        previewDescription,
        previewImage,
        tags,
        internalNotes,
        fallbackUrl,
        expiresAt,
        status: "ACTIVE",
        healthStatus: "HEALTHY",
      },
    });

    const host = request.headers.get("host") || "jii.life";
    const protocol = request.headers.get("x-forwarded-proto") || "https";
    const origin = `${protocol}://${host}`;
    const fullShortUrl = `${origin}/${newLink.shortCode}`;
    const displayUrl = `${host}/${newLink.shortCode}`;

    return NextResponse.json({
      success: true,
      link: {
        ...newLink,
        fullShortUrl,
        displayUrl,
      },
      duplicateWarning: duplicateForUser
        ? `Notice: You already have an active link (${host}/${duplicateForUser.shortCode}) pointing to this destination.`
        : null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to create link." },
      { status: 500 }
    );
  }
}
