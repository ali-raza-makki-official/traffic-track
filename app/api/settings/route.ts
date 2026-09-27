import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const settings = await db.setting.findMany();
  const settingsObj = settings.reduce((acc, curr) => {
    acc[curr.settingKey] = curr.settingValue;
    return acc;
  }, {} as Record<string, string>);

  return NextResponse.json({ success: true, settings: settingsObj });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json(); // e.g. { traffic_credit_percentage: "50", duplicate_window_minutes: "30", ... }

    for (const [key, value] of Object.entries(body)) {
      if (typeof value === "string") {
        const existing = await db.setting.findUnique({ where: { settingKey: key } });
        await db.setting.upsert({
          where: { settingKey: key },
          update: { settingValue: value },
          create: { settingKey: key, settingValue: value },
        });

        // Audit log for setting update
        if (!existing || existing.settingValue !== value) {
          await db.auditLog.create({
            data: {
              adminUserId: user.id,
              action: "SETTING_UPDATED",
              targetType: "SETTING",
              targetId: key,
              previousValue: existing?.settingValue || "none",
              newValue: value,
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true, message: "Settings updated successfully." });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}
