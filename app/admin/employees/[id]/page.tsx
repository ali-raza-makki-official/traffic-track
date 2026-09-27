"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Users,
  ShieldCheck,
  Percent,
  PlusCircle,
  SlidersHorizontal,
  ExternalLink,
  Loader2,
  Calendar,
  AlertCircle,
  X,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import StatCard from "@/components/ui/StatCard";
import DateFilterBar, { FilterState } from "@/components/analytics/DateFilterBar";
import AnalyticsTabs from "@/components/analytics/AnalyticsTabs";
import { useToast } from "@/components/ui/ToastContext";
import { formatDate, formatDateTime, formatNumber } from "@/lib/utils";

export default function EmployeeDetailPage() {
  const params = useParams();
  const employeeId = params.id as string;
  const { showToast } = useToast();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [employee, setEmployee] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Tab State
  const [activeTab, setActiveTab] = useState<"overview" | "links" | "analytics" | "adjustments">("overview");

  // Adjustment Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  // Analytics Filter
  const [filter, setFilter] = useState<FilterState>({
    period: "7d",
  });

  const fetchData = async () => {
    try {
      const [empRes, anaRes] = await Promise.all([
        fetch(`/api/employees/${employeeId}`),
        fetch(
          `/api/analytics?userId=${employeeId}&period=${filter.period}${
            filter.from ? `&from=${encodeURIComponent(filter.from)}` : ""
          }${filter.to ? `&to=${encodeURIComponent(filter.to)}` : ""}${
            filter.country ? `&country=${encodeURIComponent(filter.country)}` : ""
          }${filter.city ? `&city=${encodeURIComponent(filter.city)}` : ""}${
            filter.source ? `&source=${encodeURIComponent(filter.source)}` : ""
          }${
            filter.deviceType ? `&deviceType=${encodeURIComponent(filter.deviceType)}` : ""
          }`
        ),
      ]);

      const [empJson, anaJson] = await Promise.all([empRes.json(), anaRes.json()]);

      if (empJson.success) setEmployee(empJson.employee);
      if (anaJson.success) setAnalytics(anaJson.data);
    } catch {
      showToast("Error loading employee details", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCurrentUser(d.user);
      });
  }, []);

  useEffect(() => {
    fetchData();
  }, [employeeId, filter]);

  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustAmount || !adjustReason) {
      showToast("Amount and reason are required", "error");
      return;
    }

    setAdjusting(true);
    try {
      const res = await fetch(`/api/employees/${employeeId}/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseInt(adjustAmount, 10),
          reason: adjustReason.trim(),
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast("Traffic adjustment recorded successfully", "success");
        setAdjustModalOpen(false);
        setAdjustAmount("");
        setAdjustReason("");
        fetchData();
      } else {
        showToast(json.message || "Failed to add adjustment", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setAdjusting(false);
    }
  };

  if (!currentUser || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" />
      </div>
    );
  }

  return (
    <AppShell
      user={currentUser}
      title="Employee Intelligence & Audit"
      subtitle={employee ? `Complete metrics for ${employee.name} (${employee.email})` : ""}
    >
      <div className="space-y-6">
        {/* Header Profile Bar */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/employees"
              className="p-2 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="w-12 h-12 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center font-bold text-lg">
              {employee?.name?.charAt(0).toUpperCase()}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[18px] font-bold text-[#0F172A]">
                  {employee?.name}
                </h2>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                    employee?.status === "ACTIVE"
                      ? "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]"
                      : "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]"
                  }`}
                >
                  {employee?.status}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                  Rate: {employee?.effectiveRate}%
                </span>
              </div>
              <p className="text-[12px] text-[#64748B] mt-0.5">
                {employee?.email} • Joined {formatDate(employee?.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAdjustModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-xs font-semibold text-[#0F172A] transition shadow-xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Manual Adjustment</span>
            </button>
          </div>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Raw Hits"
            value={employee?.rawHits || 0}
            subtitle="All visits received"
            badge="Raw"
            badgeColor="blue"
          />
          <StatCard
            title="Actual Valid Traffic"
            value={employee?.validHits || 0}
            subtitle="Verified human traffic"
            badge="Valid"
            badgeColor="green"
          />
          <StatCard
            title="Final Credited Visits"
            value={employee?.finalCredited || 0}
            subtitle={
              employee?.adjustments !== 0
                ? `Includes ${employee?.adjustments > 0 ? "+" : ""}${employee?.adjustments} manual adjustment`
                : "Exact percentage calculation"
            }
            badge={`${employee?.effectiveRate}% Rate`}
            badgeColor="green"
            icon={ShieldCheck}
          />
          <StatCard
            title="Generated Links"
            value={employee?.links?.length || 0}
            subtitle="Total links created"
          />
        </div>

        {/* Tabs Navigation */}
        <div className="flex border-b border-[#E2E8F0] gap-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === "overview"
                ? "border-[#2563EB] text-[#2563EB]"
                : "border-transparent text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            Overview & Performance
          </button>
          <button
            onClick={() => setActiveTab("links")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === "links"
                ? "border-[#2563EB] text-[#2563EB]"
                : "border-transparent text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            Tracking Links ({employee?.links?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === "analytics"
                ? "border-[#2563EB] text-[#2563EB]"
                : "border-transparent text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            Deep Analytics
          </button>
          <button
            onClick={() => setActiveTab("adjustments")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === "adjustments"
                ? "border-[#2563EB] text-[#2563EB]"
                : "border-transparent text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            Manual Adjustments ({employee?.adjustmentsReceived?.length || 0})
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Employee Tracking Profile Card */}
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
              <h3 className="text-[15px] font-bold text-[#0F172A] mb-3">
                Tracking Link Profile
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-center justify-between text-xs">
                  <span className="text-[#64748B]">Total Created Links</span>
                  <span className="font-bold text-[#0F172A]">{employee?.links?.length || 0} links</span>
                </div>
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-center justify-between text-xs">
                  <span className="text-[#64748B]">Active Links</span>
                  <span className="font-bold text-[#16A34A]">
                    {employee?.links?.filter((l: any) => l.status === "ACTIVE").length || 0} active
                  </span>
                </div>
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-center justify-between text-xs">
                  <span className="text-[#64748B]">Account Status</span>
                  <span className="font-semibold text-[#0F172A]">{employee?.status}</span>
                </div>
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-center justify-between text-xs">
                  <span className="text-[#64748B]">Member Since</span>
                  <span className="font-medium text-[#0F172A]">{formatDate(employee?.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Formula Helper Card */}
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-[15px] font-bold text-[#0F172A] mb-2">
                  Transparent Credit Calculation Formula
                </h3>
                <p className="text-[12px] text-[#64748B] mb-4 leading-relaxed">
                  Raw analytics remain permanently unmodified in the database. The employee receives credited visits based on this auditable breakdown:
                </p>

                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-[#E2E8F0]">
                    <span className="text-[#64748B]">Total Raw Hits:</span>
                    <span className="font-bold text-[#0F172A]">
                      {formatNumber(employee?.rawHits || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#E2E8F0]">
                    <span className="text-[#64748B]">Actual Valid Visits:</span>
                    <span className="font-bold text-[#0F172A]">
                      {formatNumber(employee?.validHits || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#E2E8F0]">
                    <span className="text-[#64748B]">Applied Credit Rate:</span>
                    <span className="font-bold text-[#2563EB]">
                      {employee?.effectiveRate}%
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#E2E8F0]">
                    <span className="text-[#64748B]">Base Credited Traffic:</span>
                    <span className="font-bold text-[#0F172A]">
                      {formatNumber(employee?.baseCredited || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#E2E8F0]">
                    <span className="text-[#64748B]">Manual Adjustments:</span>
                    <span className="font-bold text-[#D97706]">
                      {employee?.adjustments > 0 ? "+" : ""}
                      {employee?.adjustments}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 pt-2 font-bold text-[13px] text-[#16A34A]">
                    <span>Final Credited Traffic:</span>
                    <span>{formatNumber(employee?.finalCredited || 0)} visits</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E2E8F0] text-xs text-[#64748B]">
                Last login activity: {employee?.lastLoginAt ? formatDateTime(employee.lastLoginAt) : "Never"}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LINKS */}
        {activeTab === "links" && (
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] font-semibold">
                    <th className="py-3 px-4">Tracking Link</th>
                    <th className="py-3 px-4">Destination</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Created</th>
                    <th className="py-3 px-4 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {employee?.links?.map((link: any) => (
                    <tr key={link.id} className="hover:bg-[#F8FAFC] transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#2563EB]">
                        {typeof window !== "undefined" ? window.location.host : "jii.life"}/{link.shortCode}
                      </td>
                      <td className="py-3.5 px-4 max-w-[220px] truncate text-[#0F172A]">
                        {link.destinationUrl}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">
                          {link.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#64748B]">
                        {formatDate(link.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/links/${link.id}/analytics`}
                          className="px-2.5 py-1 rounded border border-[#E2E8F0] hover:bg-[#EFF6FF] text-[#2563EB] font-medium transition text-xs"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: DEEP ANALYTICS */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <DateFilterBar
              filter={filter}
              onChange={(f) => setFilter(f)}
              showExport={true}
              onExportCsv={() => {
                window.open(`/api/reports/export?employeeId=${employeeId}&period=${filter.period}`, "_blank");
              }}
            />

            <AnalyticsTabs
              data={analytics}
              isEmployeeView={false}
              onDrilldown={(k, v) => setFilter((prev) => ({ ...prev, [k]: v }))}
            />
          </div>
        )}

        {/* TAB 4: MANUAL ADJUSTMENTS & AUDIT */}
        {activeTab === "adjustments" && (
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[16px] font-bold text-[#0F172A]">
                  Manual Traffic Adjustments History
                </h3>
                <p className="text-[12px] text-[#64748B]">
                  Complete immutable record of all bonus/deducted traffic credits
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAdjustModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Add Adjustment
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] font-semibold">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-right">Adjustment</th>
                    <th className="py-2.5 px-3">Reason</th>
                    <th className="py-2.5 px-3">Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {employee?.adjustmentsReceived?.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-xs text-[#94A3B8]">
                        No manual traffic adjustments recorded for this employee.
                      </td>
                    </tr>
                  ) : (
                    employee?.adjustmentsReceived?.map((adj: any) => (
                      <tr key={adj.id}>
                        <td className="py-3 px-3 text-[#64748B]">
                          {formatDateTime(adj.createdAt)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold">
                          <span
                            className={
                              adj.amount > 0 ? "text-[#16A34A]" : "text-[#DC2626]"
                            }
                          >
                            {adj.amount > 0 ? "+" : ""}
                            {adj.amount} visits
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[#0F172A] font-medium">
                          {adj.reason}
                        </td>
                        <td className="py-3 px-3 text-[#64748B]">
                          {adj.admin?.name}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Manual Adjustment Modal */}
        {adjustModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white border border-[#E2E8F0] rounded-xl max-w-sm w-full p-6 shadow-xl relative animate-in zoom-in-95">
              <button
                onClick={() => setAdjustModalOpen(false)}
                className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#0F172A]"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-[17px] font-bold text-[#0F172A] mb-1">
                Add Traffic Adjustment
              </h3>
              <p className="text-[12px] text-[#64748B] mb-4">
                Crediting or deducting visits for <strong>{employee?.name}</strong>
              </p>

              <form onSubmit={handleCreateAdjustment} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Adjustment Amount (e.g. +200 or -50)
                  </label>
                  <input
                    type="number"
                    required
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    placeholder="200"
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Mandatory Audit Reason
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    placeholder="e.g. Campaign bonus approved by management"
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setAdjustModalOpen(false)}
                    className="px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-xs text-[#64748B]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={adjusting}
                    className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                  >
                    {adjusting ? "Saving..." : "Apply Adjustment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
