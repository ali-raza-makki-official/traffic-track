import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Initializing Real Production TrafficTrack on MySQL (jii.life)...");

  // 1. Production Settings
  const defaultSettings = [
    { settingKey: "traffic_credit_percentage", settingValue: "50" },
    { settingKey: "duplicate_window_minutes", settingValue: "30" },
    { settingKey: "bot_filtering_enabled", settingValue: "true" },
    { settingKey: "default_fallback_url", settingValue: "https://jii.life" },
    { settingKey: "allowed_domains", settingValue: "jii.life" },
    { settingKey: "business_timezone", settingValue: "Asia/Karachi" },
    { settingKey: "short_domain", settingValue: "jii.life" },
  ];

  for (const s of defaultSettings) {
    await prisma.setting.upsert({
      where: { settingKey: s.settingKey },
      update: { settingValue: s.settingValue },
      create: s,
    });
  }

  // 2. Real Super Admin Account
  const adminPasswordHash = await bcrypt.hash("Admin@123456", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@jii.life" },
    update: {
      passwordHash: adminPasswordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    },
    create: {
      name: "Super Administrator",
      email: "admin@jii.life",
      passwordHash: adminPasswordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    },
  });

  // 3. Welcome Announcement
  const existingAnnouncement = await prisma.announcement.findFirst();
  if (!existingAnnouncement) {
    await prisma.announcement.create({
      data: {
        title: "Welcome to TrafficTrack Platform",
        message: "System is in Real Production Mode. All traffic events will be captured and attributed in real-time.",
        priority: "NORMAL",
        targetRole: "EMPLOYEE",
        isActive: true,
      },
    });
  }

  // 4. Initial Audit Log
  await prisma.auditLog.create({
    data: {
      adminUserId: admin.id,
      action: "SYSTEM_INITIALIZED",
      targetType: "SYSTEM",
      targetId: "jii.life",
      previousValue: null,
      newValue: "Production mode active with MySQL",
    },
  });

  console.log("Real Production Initialization completed successfully!");
  console.log("Super Admin: admin@jii.life");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
