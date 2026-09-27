import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAggregatedAnalytics, AnalyticsFilter } from "@/lib/analytics";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = user.role === "SUPER_ADMIN" || user.role === "ADMIN";
  const { searchParams } = request.nextUrl;

  const filter: AnalyticsFilter = {
    period: (searchParams.get("period") as any) || "7d",
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
    linkId: searchParams.get("linkId") || undefined,
    country: searchParams.get("country") || undefined,
    city: searchParams.get("city") || undefined,
    source: searchParams.get("source") || undefined,
    deviceType: searchParams.get("deviceType") || undefined,
    os: searchParams.get("os") || undefined,
  };

  if (!isAdmin) {
    filter.userId = user.id; // Enforce employee scope
  } else if (searchParams.get("userId") && searchParams.get("userId") !== "all") {
    filter.userId = searchParams.get("userId") || undefined;
  }

  try {
    const data = await getAggregatedAnalytics(filter, !isAdmin);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to load analytics" },
      { status: 500 }
    );
  }
}
