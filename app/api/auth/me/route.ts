import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, user: null }, { status: 401 });
  }

  const isAdmin = user.role === "SUPER_ADMIN" || user.role === "ADMIN";
  const sanitizedUser = {
    ...user,
    trafficPercentageOverride: isAdmin ? user.trafficPercentageOverride : undefined,
  };

  return NextResponse.json({ success: true, user: sanitizedUser });
}
