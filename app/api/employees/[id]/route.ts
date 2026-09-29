import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const employee = await db.user.findUnique({
    where: { id },
    include: {
      links: {
        orderBy: { createdAt: "desc" },
      },
      adjustmentsReceived: {
        include: { admin: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!employee) {
    return NextResponse.json({ success: false, message: "Employee not found" }, { status: 404 });
  }

  // Get global credit percentage
  const globalSetting = await db.setting.findUnique({
    where: { settingKey: "traffic_credit_percentage" },
  });
  const defaultRate = globalSetting ? parseFloat(globalSetting.settingValue) : 50.0;
  const effectiveRate = employee.trafficPercentageOverride ?? defaultRate;

  // Aggregate stats
  const stats = await db.dailyTrafficStat.aggregate({
    where: { userId: employee.id },
    _sum: {
      rawHits: true,
      validHits: true,
      creditedHits: true,
    },
  });

  const adjustmentsSum = employee.adjustmentsReceived.reduce(
    (sum, a) => sum + a.amount,
    0
  );

  return NextResponse.json({
    success: true,
    employee: {
      ...employee,
      effectiveRate,
      rawHits: stats._sum.rawHits || 0,
      validHits: stats._sum.validHits || 0,
      baseCredited: stats._sum.creditedHits || 0,
      adjustments: adjustmentsSum,
      finalCredited: Math.max(0, (stats._sum.creditedHits || 0) + adjustmentsSum),
    },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const employee = await db.user.findUnique({ where: { id } });
  if (!employee) {
    return NextResponse.json({ success: false, message: "Employee not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const updateData: any = {};
    const auditLogsToCreate: any[] = [];

    // Super Admin Protection: Prevent deactivating the last active SUPER_ADMIN
    if (employee.role === "SUPER_ADMIN") {
      if (body.status && body.status !== "ACTIVE") {
        const superAdminCount = await db.user.count({
          where: { role: "SUPER_ADMIN", status: "ACTIVE" },
        });
        if (superAdminCount <= 1) {
          return NextResponse.json(
            { success: false, message: "Cannot deactivate or suspend the only active Super Admin." },
            { status: 400 }
          );
        }
      }
    }

    if (body.name !== undefined) {
      updateData.name = body.name.trim();
    }

    if (body.status !== undefined && body.status !== employee.status) {
      updateData.status = body.status;
      auditLogsToCreate.push({
        action: "EMPLOYEE_STATUS_CHANGED",
        targetType: "USER",
        targetId: employee.id,
        previousValue: employee.status,
        newValue: body.status,
      });
    }

    if (body.trafficPercentageOverride !== undefined) {
      const newOverride =
        body.trafficPercentageOverride === null || body.trafficPercentageOverride === ""
          ? null
          : parseFloat(body.trafficPercentageOverride);
      updateData.trafficPercentageOverride = newOverride;
      auditLogsToCreate.push({
        action: "EMPLOYEE_RATE_CHANGED",
        targetType: "USER",
        targetId: employee.id,
        previousValue: employee.trafficPercentageOverride?.toString() || "Global",
        newValue: newOverride !== null ? `${newOverride}%` : "Global",
      });
    }

    if (body.dailyTarget !== undefined) {
      updateData.dailyTarget = body.dailyTarget ? parseInt(body.dailyTarget, 10) : null;
    }

    if (body.monthlyTarget !== undefined) {
      updateData.monthlyTarget = body.monthlyTarget ? parseInt(body.monthlyTarget, 10) : null;
    }

    if (body.internalNotes !== undefined) {
      updateData.internalNotes = body.internalNotes?.trim() || null;
    }

    // Password Reset
    if (body.newPassword && body.newPassword.trim()) {
      if (body.newPassword.length < 8) {
        return NextResponse.json(
          { success: false, message: "Password must be at least 8 characters long." },
          { status: 400 }
        );
      }
      updateData.passwordHash = await hashPassword(body.newPassword.trim());
      auditLogsToCreate.push({
        action: "PASSWORD_RESET_BY_ADMIN",
        targetType: "USER",
        targetId: employee.id,
        previousValue: null,
        newValue: "Password reset",
      });
    }

    const updated = await db.user.update({
      where: { id },
      data: updateData,
    });

    for (const log of auditLogsToCreate) {
      await db.auditLog.create({
        data: {
          adminUserId: user.id,
          ...log,
        },
      });
    }

    return NextResponse.json({ success: true, employee: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to update employee" },
      { status: 500 }
    );
  }
}
