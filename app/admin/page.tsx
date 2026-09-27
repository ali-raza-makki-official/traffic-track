import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import AppShell from "@/components/layout/AppShell";
import StatCard from "@/components/ui/StatCard";
import {
  Users,
  Link as LinkIcon,
  CheckCircle2,
  TrendingUp,
  Activity,
  ArrowRight,
  ShieldCheck,
  Target,
  PlusCircle,
  Share2,
} from "lucide-react";
import AdminDashboardClient from "./AdminDashboardClient";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
    redirect("/");
  }

  // 1. Fetch Global Settings
  const globalSetting = await db.setting.findUnique({
    where: { settingKey: "traffic_credit_percentage" },
  });
  const defaultRate = globalSetting ? parseFloat(globalSetting.settingValue) : 50.0;

  // 2. Fetch Organization Metrics
  const todayStr = new Date().toISOString().split("T")[0];

  const [
    allEventsCount,
    validEventsCount,
    todayStats,
    activeEmployeesCount,
    totalLinksCount,
    employees,
    dailyStatsAggregate,
    adjustmentsAggregate,
  ] = await Promise.all([
    db.trafficEvent.count({ where: { isTest: false } }),
    db.trafficEvent.count({ where: { isTest: false, isValid: true } }),
    db.dailyTrafficStat.aggregate({
      where: { date: todayStr },
      _sum: { rawHits: true, validHits: true, creditedHits: true },
    }),
    db.user.count({
      where: { role: "EMPLOYEE", status: "ACTIVE" },
    }),
    db.link.count(),
    db.user.findMany({
      where: { role: "EMPLOYEE" },
      include: {
        _count: { select: { links: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.dailyTrafficStat.groupBy({
      by: ["userId"],
      _sum: { validHits: true, creditedHits: true, rawHits: true },
    }),
    db.trafficAdjustment.groupBy({
      by: ["userId"],
      _sum: { amount: true },
    }),
  ]);

  const statsMap = new Map(
    dailyStatsAggregate.map((s) => [
      s.userId,
      {
        raw: s._sum.rawHits || 0,
        valid: s._sum.validHits || 0,
        credited: s._sum.creditedHits || 0,
      },
    ])
  );

  const adjustmentsMap = new Map(
    adjustmentsAggregate.map((a) => [a.userId, a._sum.amount || 0])
  );

  let totalCreditedSum = 0;
  const employeePerformance = employees.map((emp) => {
    const s = statsMap.get(emp.id) || { raw: 0, valid: 0, credited: 0 };
    const adj = adjustmentsMap.get(emp.id) || 0;
    const effectiveRate = emp.trafficPercentageOverride ?? defaultRate;
    const finalCredited = Math.max(0, s.credited + adj);
    totalCreditedSum += finalCredited;

    const target = emp.monthlyTarget || 10000;
    const achievement = Math.round((s.valid / target) * 100);

    return {
      id: emp.id,
      name: emp.name,
      email: emp.email,
      status: emp.status,
      linksCount: emp._count.links,
      validTraffic: s.valid,
      creditedTraffic: finalCredited,
      effectiveRate,
      target,
      achievement,
    };
  });

  // Sort employees by valid traffic descending
  employeePerformance.sort((a, b) => b.validTraffic - a.validTraffic);

  return (
    <AppShell
      user={user}
      title="Organization Overview"
      subtitle="Complete visibility over team traffic generation, attribution, and credited performance"
      actionButton={{
        label: "Add Employee",
        href: "/admin/employees",
      }}
    >
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total Raw Hits"
            value={allEventsCount}
            subtitle="All incoming requests"
            badge="Raw"
            badgeColor="blue"
          />
          <StatCard
            title="Total Valid Traffic"
            value={validEventsCount}
            subtitle="Filtered human visits"
            badge="Valid"
            badgeColor="green"
            icon={CheckCircle2}
          />
          <StatCard
            title="Total Credited Traffic"
            value={totalCreditedSum}
            subtitle={`Calculated via credit rates`}
            badge="Credited"
            badgeColor="green"
            icon={ShieldCheck}
          />
          <StatCard
            title="Active Employees"
            value={activeEmployeesCount}
            subtitle="Team members generating"
            icon={Users}
          />
          <StatCard
            title="Active Tracking Links"
            value={totalLinksCount}
            subtitle="Total links in system"
            icon={LinkIcon}
          />
        </div>

        {/* Quick Operational Shortcuts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            href="/admin/employees"
            className="p-3.5 bg-[#FFFFFF] border border-[#E2E8F0] hover:border-[#2563EB] rounded-xl flex items-center justify-between text-xs font-semibold text-[#0F172A] transition shadow-xs group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <span>Manage Employees</span>
            </div>
            <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#2563EB] transition" />
          </Link>

          <Link
            href="/admin/links"
            className="p-3.5 bg-[#FFFFFF] border border-[#E2E8F0] hover:border-[#2563EB] rounded-xl flex items-center justify-between text-xs font-semibold text-[#0F172A] transition shadow-xs group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                <LinkIcon className="w-4 h-4" />
              </div>
              <span>All Tracking Links</span>
            </div>
            <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#2563EB] transition" />
          </Link>

          <Link
            href="/admin/settings"
            className="p-3.5 bg-[#FFFFFF] border border-[#E2E8F0] hover:border-[#2563EB] rounded-xl flex items-center justify-between text-xs font-semibold text-[#0F172A] transition shadow-xs group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span>System Settings</span>
            </div>
            <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#2563EB] transition" />
          </Link>

          <Link
            href="/admin/traffic"
            className="p-3.5 bg-[#FFFFFF] border border-[#E2E8F0] hover:border-[#2563EB] rounded-xl flex items-center justify-between text-xs font-semibold text-[#0F172A] transition shadow-xs group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <span>Traffic Explorer</span>
            </div>
            <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#16A34A] transition" />
          </Link>
        </div>

        {/* Employee Performance Table */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[16px] font-bold text-[#0F172A]">
                Employee Performance Overview
              </h3>
              <p className="text-[12px] text-[#64748B]">
                Comparison between actual valid traffic generated and credited traffic
              </p>
            </div>
            <Link
              href="/admin/employees"
              className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1"
            >
              All Employees <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] font-semibold">
                  <th className="py-3 px-4">Team Member</th>
                  <th className="py-3 px-4 text-center">Links</th>
                  <th className="py-3 px-4 text-right">Actual Valid</th>
                  <th className="py-3 px-4 text-right">Credited Clicks</th>
                  <th className="py-3 px-4 text-center">Effective Rate</th>
                  <th className="py-3 px-4 text-center">Monthly Target</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {employeePerformance.map((emp) => (
                  <tr key={emp.id} className="hover:bg-[#F8FAFC] transition">
                    <td className="py-3 px-4 font-semibold text-[#0F172A]">
                      <Link
                        href={`/admin/employees/${emp.id}`}
                        className="hover:text-[#2563EB] transition"
                      >
                        {emp.name}
                      </Link>
                      <span className="block text-[11px] text-[#64748B] font-normal">
                        {emp.email}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-medium">
                      {emp.linksCount}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#0F172A]">
                      {formatNumber(emp.validTraffic)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#16A34A]">
                      {formatNumber(emp.creditedTraffic)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                        {emp.effectiveRate}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 font-semibold text-[#0F172A]">
                        <span>{emp.achievement}%</span>
                        <span className="text-[#94A3B8] font-normal">
                          ({formatNumber(emp.target)})
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/admin/employees/${emp.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#E2E8F0] hover:bg-[#EFF6FF] text-[#2563EB] font-medium transition text-xs"
                      >
                        Deep View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dynamic Admin Analytics Charts Client */}
        <AdminDashboardClient />
      </div>
    </AppShell>
  );
}
