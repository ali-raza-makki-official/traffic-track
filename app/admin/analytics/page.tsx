"use client";

import React, { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import DateFilterBar, { FilterState } from "@/components/analytics/DateFilterBar";
import AnalyticsTabs from "@/components/analytics/AnalyticsTabs";
import { useToast } from "@/components/ui/ToastContext";
import { Loader2 } from "lucide-react";

export default function AdminAnalyticsPage() {
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<FilterState>({
    period: "7d",
    employeeId: "all",
    linkId: "all",
  });

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(
        `/api/analytics?period=${filter.period}${
          filter.from ? `&from=${encodeURIComponent(filter.from)}` : ""
        }${filter.to ? `&to=${encodeURIComponent(filter.to)}` : ""}${
          filter.employeeId && filter.employeeId !== "all" ? `&userId=${filter.employeeId}` : ""
        }${filter.linkId && filter.linkId !== "all" ? `&linkId=${filter.linkId}` : ""}${
          filter.country ? `&country=${encodeURIComponent(filter.country)}` : ""
        }${filter.city ? `&city=${encodeURIComponent(filter.city)}` : ""}${
          filter.source ? `&source=${encodeURIComponent(filter.source)}` : ""
        }${filter.deviceType ? `&deviceType=${encodeURIComponent(filter.deviceType)}` : ""}${
          filter.os ? `&os=${encodeURIComponent(filter.os)}` : ""
        }`
      );
      const json = await res.json();
      if (json.success) setAnalytics(json.data);
    } catch {
      showToast("Failed to load analytics", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setUser(d.user);
      });

    fetch("/api/employees")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setEmployees(d.employees);
      });

    fetch("/api/links")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setLinks(d.links);
      });
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [filter]);

  const handleExportCsv = () => {
    const url = `/api/reports/export?period=${filter.period}${
      filter.employeeId && filter.employeeId !== "all" ? `&employeeId=${filter.employeeId}` : ""
    }${filter.linkId && filter.linkId !== "all" ? `&linkId=${filter.linkId}` : ""}`;
    window.open(url, "_blank");
  };

  const handleDrilldown = (key: string, value: string) => {
    setFilter((prev) => ({ ...prev, [key]: value }));
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" />
      </div>
    );
  }

  return (
    <AppShell
      user={user}
      title="Platform-Wide Traffic Analytics"
      subtitle="Multi-dimensional deep intelligence across team, geography, device, and marketing channels"
    >
      <div className="space-y-6">
        {/* Unified Scoping, Date Filter & Export Bar */}
        <DateFilterBar
          filter={filter}
          onChange={(newFilter) => setFilter(newFilter)}
          onExportCsv={handleExportCsv}
        >
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-[#64748B]">Employee:</label>
            <select
              value={filter.employeeId || "all"}
              onChange={(e) => setFilter({ ...filter, employeeId: e.target.value })}
              className="px-3 py-1.5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="all">All Employees</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-[#64748B]">Link:</label>
            <select
              value={filter.linkId || "all"}
              onChange={(e) => setFilter({ ...filter, linkId: e.target.value })}
              className="px-3 py-1.5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] max-w-xs truncate"
            >
              <option value="all">All Tracking Links</option>
              {links.map((l) => (
                <option key={l.id} value={l.id}>
                  go.example.com/{l.shortCode} ({l.user?.name})
                </option>
              ))}
            </select>
          </div>
        </DateFilterBar>

        {/* Tabbed Analytics */}
        <AnalyticsTabs
          data={analytics}
          isEmployeeView={false}
          onDrilldown={handleDrilldown}
        />
      </div>
    </AppShell>
  );
}
