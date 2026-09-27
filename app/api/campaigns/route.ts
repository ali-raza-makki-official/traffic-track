import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ success: true, campaigns: [] });
}

export async function POST() {
  return NextResponse.json({ success: false, message: "Campaigns are discontinued" }, { status: 410 });
}
