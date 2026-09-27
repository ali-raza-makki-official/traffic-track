"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Copy,
  QrCode,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Activity,
  Check,
} from "lucide-react";
import { useToast } from "@/components/ui/ToastContext";
import QRCodeModal from "@/components/ui/QRCodeModal";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { formatDate } from "@/lib/utils";
import GoogleAnalyticsRealtime from "@/components/analytics/GoogleAnalyticsRealtime";

interface DashboardClientProps {
  recentLinks: any[];
}

export default function DashboardClient({ recentLinks }: DashboardClientProps) {
  const { showToast } = useToast();
  const [liveStats, setLiveStats] = useState<{ visits5m: number; visits30m: number }>({
    visits5m: 0,
    visits30m: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loadingChart, setLoadingChart] = useState(true);

  const [qrModal, setQrModal] = useState<{ isOpen: boolean; url: string; code: string }>({
    isOpen: false,
    url: "",
    code: "",
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch live counts
    const fetchLive = async () => {
      try {
        const res = await fetch("/api/analytics/realtime");
        const json = await res.json();
        if (json.success) {
          setLiveStats({
            visits5m: json.data.visits5m || 0,
            visits30m: json.data.visits30m || 0,
          });
        }
      } catch {}
    };

    // Fetch 7d trend for employee
    const fetchTrend = async () => {
      try {
        const res = await fetch("/api/analytics?period=7d");
        const json = await res.json();
        if (json.success && json.data.dailyTrends) {
          setChartData(json.data.dailyTrends);
        }
      } catch {} finally {
        setLoadingChart(false);
      }
    };

    fetchLive();
    fetchTrend();
    const interval = setInterval(fetchLive, 10000); // 10s poll for live visits
    return () => clearInterval(interval);
  }, []);

  const handleCopyLink = async (shortCode: string, id: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://jii.life";
    const url = `${origin}/${shortCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      showToast("Tracking link copied to clipboard", "success");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showToast("Failed to copy link", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Google Analytics 4 Real-time 30-Minute Candles */}
      <GoogleAnalyticsRealtime
        isEmployeeView={true}
        title="My Live Traffic (Last 30 Min)"
      />

      {/* Credited Trend Chart */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[15px] font-bold text-[#0F172A] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#2563EB]" /> Credited Traffic (Last 7 Days)
            </h3>
            <p className="text-[12px] text-[#64748B]">
              Daily attributed visits credited to your account
            </p>
          </div>
          <Link
            href="/analytics"
            className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1"
          >
            Full Analytics <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="h-60 w-full">
          {loadingChart ? (
            <div className="h-full flex items-center justify-center text-xs text-[#94A3B8]">
              Loading trend...
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-[#94A3B8]">
              No traffic recorded in the last 7 days
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={{ stroke: "#E2E8F0" }}
                  tick={{ fill: "#64748B", fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={{ stroke: "#E2E8F0" }}
                  tick={{ fill: "#64748B", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="credited"
                  name="Credited Visits"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#2563EB" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Links Table */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[16px] font-bold text-[#0F172A]">Recent Tracking Links</h3>
            <p className="text-[12px] text-[#64748B]">
              Quickly copy or inspect your most recently generated links
            </p>
          </div>
          <Link
            href="/links"
            className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1"
          >
            View All Links <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentLinks.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#94A3B8]">
            No links generated yet. Click "Create Link" to begin tracking!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                  <th className="pb-3 pr-4">Tracking Link</th>
                  <th className="pb-3 pr-4">Destination</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Created</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {recentLinks.map((link) => (
                  <tr key={link.id} className="hover:bg-[#F8FAFC] transition">
                    <td className="py-3 pr-4 font-mono font-semibold text-[#2563EB]">
                      <div className="flex items-center gap-1.5">
                        {link.isPinned && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></span>
                        )}
                        <span>{typeof window !== "undefined" ? window.location.host : "jii.life"}/{link.shortCode}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 max-w-[200px] truncate text-[#0F172A]">
                      {link.destinationUrl}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          link.status === "ACTIVE"
                            ? "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]"
                            : link.status === "PAUSED"
                            ? "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]"
                            : "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]"
                        }`}
                      >
                        {link.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-[#64748B]">
                      {formatDate(link.createdAt)}
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(link.shortCode, link.id)}
                          className="p-1.5 rounded border border-[#E2E8F0] hover:bg-[#EFF6FF] text-[#64748B] hover:text-[#2563EB] transition"
                          title="Copy Link"
                        >
                          {copiedId === link.id ? (
                            <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const origin = typeof window !== "undefined" ? window.location.origin : "https://jii.life";
                            setQrModal({
                              isOpen: true,
                              url: `${origin}/${link.shortCode}`,
                              code: link.shortCode,
                            });
                          }}
                          className="p-1.5 rounded border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] transition"
                          title="View QR Code"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>

                        <Link
                          href={`/links/${link.id}/analytics`}
                          className="p-1.5 rounded border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] transition"
                          title="View Analytics"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={qrModal.isOpen}
        onClose={() => setQrModal({ ...qrModal, isOpen: false })}
        shortUrl={qrModal.url}
        shortCode={qrModal.code}
      />
    </div>
  );
}
