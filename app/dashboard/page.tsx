import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import AppShell from "@/components/layout/AppShell";
import StatCard from "@/components/ui/StatCard";
import {
  Link as LinkIcon,
  PlusCircle,
  Activity,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Copy,
} from "lucide-react";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function EmployeeDashboard() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  // Get active announcements
  const announcements = await db.announcement.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: 1,
  });

  // Calculate Employee Traffic for Today, Yesterday, This Month, and Total
  const todayStr = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];

  const [todayStats, yesterdayStats, monthStats, allStats, totalLinks, recentLinks] =
    await Promise.all([
      db.dailyTrafficStat.aggregate({
        where: { userId: user.id, date: todayStr },
        _sum: { creditedHits: true, validHits: true },
      }),
      db.dailyTrafficStat.aggregate({
        where: { userId: user.id, date: yesterdayStr },
        _sum: { creditedHits: true, validHits: true },
      }),
      db.dailyTrafficStat.aggregate({
        where: { userId: user.id, date: { gte: firstDayOfMonth } },
        _sum: { creditedHits: true, validHits: true },
      }),
      db.dailyTrafficStat.aggregate({
        where: { userId: user.id },
        _sum: { creditedHits: true, validHits: true },
      }),
      db.link.count({
        where: { userId: user.id },
      }),
      db.link.findMany({
        where: { userId: user.id },
        take: 5,
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      }),
    ]);

  // Adjustments received
  const adjustments = await db.trafficAdjustment.aggregate({
    where: { userId: user.id },
    _sum: { amount: true },
  });
  const totalAdjustments = adjustments._sum.amount || 0;

  const totalCredited = Math.max(0, (allStats._sum.creditedHits || 0) + totalAdjustments);
  const todayCredited = todayStats._sum.creditedHits || 0;
  const yesterdayCredited = yesterdayStats._sum.creditedHits || 0;
  const monthCredited = monthStats._sum.creditedHits || 0;

  // Monthly target progress
  const monthlyTarget = user.monthlyTarget || 10000;
  const validMonthTraffic = monthStats._sum.validHits || 0;
  const targetProgress = Math.min(100, Math.round((validMonthTraffic / monthlyTarget) * 100));

  return (
    <AppShell
      user={user}
      title="Employee Dashboard"
      subtitle="Overview of your attributed traffic performance"
      actionButton={{
        label: "Create Link",
        href: "/links/create",
      }}
    >
      <div className="space-y-6">
        {/* Announcement banner */}
        {announcements.length > 0 && (
          <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-4 flex items-start gap-3 shadow-2xs">
            <AlertCircle className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-[14px] font-bold text-[#0F172A]">
                {announcements[0].title}
              </h4>
              <p className="text-[13px] text-[#64748B] mt-0.5 leading-relaxed">
                {announcements[0].message}
              </p>
            </div>
          </div>
        )}

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Credited Clicks"
            value={totalCredited}
            subtitle="Your total credited visits"
            badge="Total"
            badgeColor="green"
          />
          <StatCard
            title="Today"
            value={todayCredited}
            subtitle="Visits recorded today"
            trend={
              yesterdayCredited > 0
                ? {
                    value: `${todayCredited >= yesterdayCredited ? "+" : ""}${Math.round(
                      ((todayCredited - yesterdayCredited) / yesterdayCredited) * 100
                    )}%`,
                    isPositive: todayCredited >= yesterdayCredited,
                  }
                : undefined
            }
          />
          <StatCard
            title="Yesterday"
            value={yesterdayCredited}
            subtitle="Previous day visits"
          />
          <StatCard
            title="This Month"
            value={monthCredited}
            subtitle="Current calendar month"
          />
          <StatCard
            title="Total Links"
            value={totalLinks}
            subtitle="Active tracking links"
            icon={LinkIcon}
          />
        </div>

        {/* Target Progress Bar & Live Counter Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Target Progress Card */}
          <div className="lg:col-span-2 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[14px] font-bold text-[#0F172A]">
                  Monthly Traffic Target
                </span>
                <span className="text-[12px] font-semibold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-full">
                  {targetProgress}% Achieved
                </span>
              </div>
              <p className="text-[12px] text-[#64748B] mb-4">
                Valid traffic generated this month vs your assigned goal
              </p>

              <div className="w-full bg-[#F1F5F9] h-3 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-[#2563EB] h-3 rounded-full transition-all duration-500"
                  style={{ width: `${targetProgress}%` }}
                />
              </div>

              <div className="flex justify-between text-xs font-semibold text-[#64748B]">
                <span>{validMonthTraffic.toLocaleString()} valid visits</span>
                <span>Goal: {monthlyTarget.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
              <span>Need help reaching your target? Check your tracking links.</span>
              <Link
                href="/links"
                className="font-medium text-[#2563EB] hover:text-[#1D4ED8] inline-flex items-center gap-1"
              >
                View Links <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Live Activity & Quick Actions */}
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[14px] font-bold text-[#0F172A]">
                  Quick Actions
                </span>
                <Activity className="w-4 h-4 text-[#2563EB]" />
              </div>
              <p className="text-[12px] text-[#64748B] mb-4">
                Fast shortcuts for daily marketing operations
              </p>

              <div className="space-y-2">
                <Link
                  href="/links/create"
                  className="w-full flex items-center justify-between p-2.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] text-xs font-semibold text-[#0F172A] transition"
                >
                  <span className="flex items-center gap-2">
                    <PlusCircle className="w-4 h-4 text-[#2563EB]" /> Create New Tracking Link
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                </Link>

                <Link
                  href="/links"
                  className="w-full flex items-center justify-between p-2.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] text-xs font-semibold text-[#0F172A] transition"
                >
                  <span className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-[#16A34A]" /> Browse My Links
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                </Link>

                <Link
                  href="/analytics"
                  className="w-full flex items-center justify-between p-2.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] text-xs font-semibold text-[#0F172A] transition"
                >
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#7C3AED]" /> Deep Traffic Analytics
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Client Analytics & Recent Links */}
        <DashboardClient recentLinks={recentLinks} />
      </div>
    </AppShell>
  );
}
