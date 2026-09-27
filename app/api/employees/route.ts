import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
  }

  // Get global default credit percentage
  const globalSetting = await db.setting.findUnique({
    where: { settingKey: "traffic_credit_percentage" },
  });
  const defaultRate = globalSetting ? parseFloat(globalSetting.settingValue) : 50.0;

  const employees = await db.user.findMany({
    include: {
      _count: {
        select: { links: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Aggregate stats per employee
  const stats = await db.dailyTrafficStat.groupBy({
    by: ["userId"],
    _sum: {
      rawHits: true,
      validHits: true,
      creditedHits: true,
    },
  });

  const statsMap = new Map(
    stats.map((s) => [
      s.userId,
      {
        rawHits: s._sum.rawHits || 0,
        validHits: s._sum.validHits || 0,
        creditedHits: s._sum.creditedHits || 0,
      },
    ])
  );

  // Manual Adjustments per employee
  const adjustments = await db.trafficAdjustment.groupBy({
    by: ["userId"],
    _sum: { amount: true },
  });
  const adjustmentsMap = new Map(
    adjustments.map((a) => [a.userId, a._sum.amount || 0])
  );

  const formattedEmployees = employees.map((emp) => {
    const s = statsMap.get(emp.id) || { rawHits: 0, validHits: 0, creditedHits: 0 };
    const adj = adjustmentsMap.get(emp.id) || 0;
    const effectiveRate = emp.trafficPercentageOverride ?? defaultRate;
    const finalCredited = Math.max(0, s.creditedHits + adj);

    // Target calculation: e.g. monthlyTarget
    const target = emp.monthlyTarget || 10000;
    const targetProgress = Math.min(100, Math.round((s.validHits / target) * 100));

    return {
      id: emp.id,
      name: emp.name,
      email: emp.email,
      role: emp.role,
      status: emp.status,
      trafficPercentageOverride: emp.trafficPercentageOverride,
      effectiveRate,
      dailyTarget: emp.dailyTarget,
      monthlyTarget: emp.monthlyTarget,
      targetProgress,
      internalNotes: emp.internalNotes,
      totalLinks: emp._count.links,
      rawHits: s.rawHits,
      validHits: s.validHits,
      baseCredited: s.creditedHits,
      adjustments: adj,
      creditedHits: finalCredited,
      createdAt: emp.createdAt,
      lastLoginAt: emp.lastLoginAt,
    };
  });

  return NextResponse.json({ success: true, employees: formattedEmployees });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const name = body.name?.trim();
    const email = body.email?.toLowerCase().trim();
    const password = body.password?.trim();
    const role = body.role || "EMPLOYEE";
    const status = body.status || "ACTIVE";
    const trafficPercentageOverride =
      body.trafficPercentageOverride !== undefined && body.trafficPercentageOverride !== ""
        ? parseFloat(body.trafficPercentageOverride)
        : null;
    const dailyTarget = body.dailyTarget ? parseInt(body.dailyTarget, 10) : null;
    const monthlyTarget = body.monthlyTarget ? parseInt(body.monthlyTarget, 10) : null;
    const internalNotes = body.internalNotes?.trim() || null;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "A user with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const newEmployee = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        status,
        trafficPercentageOverride,
        dailyTarget,
        monthlyTarget,
        internalNotes,
      },
    });

    // Record audit log
    await db.auditLog.create({
      data: {
        adminUserId: user.id,
        action: "EMPLOYEE_CREATED",
        targetType: "USER",
        targetId: newEmployee.id,
        previousValue: null,
        newValue: `Created ${role} ${name} (${email})`,
      },
    });

    return NextResponse.json({
      success: true,
      employee: {
        id: newEmployee.id,
        name: newEmployee.name,
        email: newEmployee.email,
        role: newEmployee.role,
        status: newEmployee.status,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to create employee" },
      { status: 500 }
    );
  }
}
