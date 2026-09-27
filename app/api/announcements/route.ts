import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const announcements = await db.announcement.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return NextResponse.json({ success: true, announcements });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const title = body.title?.trim();
    const message = body.message?.trim();
    const priority = body.priority || "NORMAL";

    if (!title || !message) {
      return NextResponse.json({ success: false, message: "Title and message are required." }, { status: 400 });
    }

    const announcement = await db.announcement.create({
      data: {
        title,
        message,
        priority,
      },
    });

    return NextResponse.json({ success: true, announcement });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: "Failed to create announcement" }, { status: 500 });
  }
}
