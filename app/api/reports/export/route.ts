import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDateRange } from "@/lib/analytics";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = user.role === "SUPER_ADMIN" || user.role === "ADMIN";
  const { searchParams } = request.nextUrl;

  const period = (searchParams.get("period") as any) || "30d";
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;
  const employeeId = searchParams.get("employeeId") || undefined;
  const linkId = searchParams.get("linkId") || undefined;
  const country = searchParams.get("country") || undefined;

  const { start, end } = getDateRange({ period, from, to });

  const where: any = {
    timestampUtc: { gte: start, lte: end },
    isTest: false,
    isBot: false,
  };

  if (!isAdmin) {
    where.userId = user.id;
  } else if (employeeId && employeeId !== "all") {
    where.userId = employeeId;
  }

  if (linkId && linkId !== "all") where.linkId = linkId;
  if (country && country !== "all") where.countryCode = country;

  const events = await db.trafficEvent.findMany({
    where,
    take: 5000,
    orderBy: { timestampUtc: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      link: { select: { shortCode: true, destinationUrl: true } },
    },
  });

  // Build CSV
  const headers = [
    "Timestamp (UTC)",
    "Employee",
    "Employee Email",
    "Short Code",
    "Destination URL",
    "Country",
    "City",
    "Source",
    "Device",
    "OS",
    "Browser",
    "Status",
    "Invalid Reason",
  ];

  if (isAdmin) {
    headers.push("IP Address");
  }

  const rows = events.map((ev) => {
    let status = "Valid";
    if (ev.isBot) status = "Bot";
    else if (ev.isDuplicate) status = "Duplicate";
    else if (!ev.isValid) status = "Invalid";

    const row = [
      ev.timestampUtc.toISOString(),
      `"${ev.user.name.replace(/"/g, '""')}"`,
      `"${ev.user.email}"`,
      ev.link.shortCode,
      `"${ev.link.destinationUrl.replace(/"/g, '""')}"`,
      `"${ev.countryName || "Unknown"}"`,
      `"${ev.city || "Unknown"}"`,
      `"${ev.source || "Direct"}"`,
      ev.deviceType || "Desktop",
      `"${ev.os || "Other"}"`,
      `"${ev.browser || "Other"}"`,
      status,
      `"${ev.invalidReason || ""}"`,
    ];

    if (isAdmin) {
      row.push(`"${ev.ipAddress || ""}"`);
    }

    return row.join(",");
  });

  const csv = [headers.join(","), ...rows].join("\r\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="traffic-report-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
