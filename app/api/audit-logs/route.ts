import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") || "";

  const where: any = {};
  if (search) {
    where.OR = [
      { action: { contains: search } },
      { targetType: { contains: search } },
      { newValue: { contains: search } },
      { adminUser: { name: { contains: search } } },
    ];
  }

  const logs = await db.auditLog.findMany({
    where,
    include: {
      adminUser: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ success: true, logs });
}
