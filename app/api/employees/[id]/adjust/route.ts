import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
  }

  const employee = await db.user.findUnique({ where: { id: params.id } });
  if (!employee) {
    return NextResponse.json({ success: false, message: "Employee not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const amount = parseInt(body.amount, 10);
    const reason = body.reason?.trim();

    if (isNaN(amount) || amount === 0) {
      return NextResponse.json(
        { success: false, message: "Please provide a non-zero adjustment amount." },
        { status: 400 }
      );
    }

    if (!reason || reason.length < 5) {
      return NextResponse.json(
        { success: false, message: "A clear reason (at least 5 characters) is required for audit compliance." },
        { status: 400 }
      );
    }

    const adjustment = await db.trafficAdjustment.create({
      data: {
        userId: employee.id,
        adminId: user.id,
        amount,
        reason,
      },
    });

    // Record audit log
    await db.auditLog.create({
      data: {
        adminUserId: user.id,
        action: "TRAFFIC_MANUALLY_ADJUSTED",
        targetType: "USER",
        targetId: employee.id,
        previousValue: null,
        newValue: `${amount > 0 ? "+" : ""}${amount} visits. Reason: ${reason}`,
      },
    });

    return NextResponse.json({ success: true, adjustment });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to add adjustment" },
      { status: 500 }
    );
  }
}
