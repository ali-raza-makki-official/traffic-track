import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ success: true, pages: [] });
}

export async function POST() {
  return NextResponse.json({ success: false, message: "Facebook pages are discontinued" }, { status: 410 });
}
