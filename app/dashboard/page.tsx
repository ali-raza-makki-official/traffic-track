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
  Target,
} from "lucide-react";
import DashboardClient from "./DashboardClient";

import { getPakistanTodayRange } from "@/lib/timezone";
import { formatProgressPercent } from "@/lib/utils";

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

  // Calculate Employee Traffic for Today (12:00 AM to 11:59 PM PKT), Yesterday, and Month
  const { todayDateStr, yesterdayDateStr } = getPakistanTodayRange();
  const todayStr = todayDateStr;
  const yesterdayStr = yesterdayDateStr;

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

  // Targets & Progress calculations
  const monthlyTarget = user.monthlyTarget || 10000;
  const dailyTarget = user.dailyTarget || Math.round(monthlyTarget / 30) || 500;
  const validMonthTraffic = monthStats._sum.validHits || 0;
  const validTodayTraffic = todayStats._sum.validHits || 0;

  const monthProgress = formatProgressPercent(validMonthTraffic, monthlyTarget);
  const todayProgress = formatProgressPercent(validTodayTraffic, dailyTarget);

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

        {/* Top Metric Cards: Focus on Today (12:00 AM to 11:59 PM PKT) */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse"></span>
            <span className="text-[13px] font-bold text-[#0F172A]">
              Today's Performance
            </span>
            <span className="text-[12px] text-[#64748B]">
              (12:00 AM – 11:59 PM Pakistan Standard Time)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title="Today's Credited Clicks"
              value={todayCredited}
              subtitle="12:00 AM – 11:59 PM PKT"
              badge="Today"
              badgeColor="green"
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
              subtitle="Previous day visits (PKT)"
              badge="Yesterday"
            />
            <StatCard
              title="Active Links"
              value={totalLinks}
              subtitle="Your tracking links"
              icon={LinkIcon}
            />
            <StatCard
              title="This Month"
              value={monthCredited}
              subtitle="Current calendar month"
            />
            <StatCard
              title="All-Time Credited"
              value={totalCredited}
              subtitle="Lifetime verified traffic"
              badge="Total"
              badgeColor="blue"
            />
          </div>
        </div>

        {/* Target Progress Bar & Live Counter Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Target Progress Card */}
          <div className="lg:col-span-2 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#2563EB]" />
                  Traffic Target Progress
                </span>
                <span className="text-[12px] font-semibold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#DBEAFE]">
                  {monthProgress.display} Monthly Achieved
                </span>
              </div>
              <p className="text-[12px] text-[#64748B] mb-4">
                Real-time tracking of your daily and monthly traffic milestones
              </p>

              {/* Today's Daily Target Progress */}
              <div className="mb-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-[#0F172A] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
                    Today's Target (12:00 AM – 11:59 PM PKT)
                  </span>
                  <span className="font-bold text-[#10B981] bg-[#ECFDF5] px-2 py-0.5 rounded-full border border-[#A7F3D0]">
                    {todayProgress.display} Achieved
                  </span>
                </div>
                <div className="w-full bg-[#E2E8F0] h-2.5 rounded-full overflow-hidden mb-1.5">
                  <div
                    className="bg-gradient-to-r from-[#10B981] to-[#059669] h-2.5 rounded-full transition-all duration-500 shadow-xs"
                    style={{ width: `${todayProgress.barWidth}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-medium text-[#64748B]">
                  <span>{validTodayTraffic.toLocaleString()} visits today</span>
                  <span>Goal: {dailyTarget.toLocaleString()}/day</span>
                </div>
              </div>

              {/* Monthly Target Progress */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-[#0F172A]">
                    Monthly Goal Progress
                  </span>
                  <span className="font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-full border border-[#BFDBFE]">
                    {monthProgress.display} Achieved
                  </span>
                </div>
                <div className="w-full bg-[#E2E8F0] h-2.5 rounded-full overflow-hidden mb-1.5">
                  <div
                    className="bg-gradient-to-r from-[#2563EB] to-[#4F46E5] h-2.5 rounded-full transition-all duration-500 shadow-xs"
                    style={{ width: `${monthProgress.barWidth}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-medium text-[#64748B]">
                  <span>{validMonthTraffic.toLocaleString()} visits this month</span>
                  <span>Goal: {monthlyTarget.toLocaleString()}</span>
                </div>
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
