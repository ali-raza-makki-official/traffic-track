"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { formatNumber } from "@/lib/utils";
import { Globe, Share2, ArrowRight } from "lucide-react";
import GoogleAnalyticsRealtime from "@/components/analytics/GoogleAnalyticsRealtime";

export default function AdminDashboardClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics?period=7d")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setData(json.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-[#94A3B8]">
        Loading analytics visualizations...
      </div>
    );
  }

  if (!data) return null;

  const { dailyTrends = [], sources = [], countries = [] } = data;

  return (
    <div className="space-y-6">
      {/* Real-time 30-Minute Google Analytics Candles */}
      <GoogleAnalyticsRealtime
        isEmployeeView={false}
        title="Live Company-Wide Traffic (Last 30 Min)"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Trend Chart */}
        <div className="lg:col-span-2 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[16px] font-bold text-[#0F172A]">
              Platform Traffic: Valid vs. Credited
            </h3>
            <p className="text-[12px] text-[#64748B]">
              Last 7 days company-wide volume comparison
            </p>
          </div>
          <Link
            href="/admin/analytics"
            className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1"
          >
            All Analytics <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyTrends}>
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
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              <Line
                type="monotone"
                dataKey="valid"
                name="Actual Valid Visits"
                stroke="#2563EB"
                strokeWidth={2}
                dot={{ r: 3, fill: "#2563EB" }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="credited"
                name="Credited Traffic"
                stroke="#16A34A"
                strokeWidth={2}
                dot={{ r: 3, fill: "#16A34A" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Countries & Sources Mini Breakdown */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-bold text-[#0F172A] flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#2563EB]" /> Top Countries
            </h3>
            <Link
              href="/admin/analytics"
              className="text-xs text-[#2563EB] hover:underline"
            >
              Drill-down
            </Link>
          </div>

          <div className="space-y-3 mb-6">
            {countries.slice(0, 4).map((c: any) => (
              <div key={c.code} className="text-xs">
                <div className="flex justify-between font-semibold text-[#0F172A] mb-1">
                  <span>{c.name}</span>
                  <span>
                    {formatNumber(c.visits)} ({c.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#2563EB] h-2 rounded-full"
                    style={{ width: `${c.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-[#E2E8F0] pt-4">
            <h4 className="text-[13px] font-bold text-[#0F172A] flex items-center gap-1.5 mb-3">
              <Share2 className="w-3.5 h-3.5 text-[#16A34A]" /> Primary Sources
            </h4>
            <div className="space-y-2">
              {sources.slice(0, 3).map((s: any) => (
                <div
                  key={s.name}
                  className="flex justify-between text-xs text-[#64748B] py-1 border-b border-[#F8FAFC]"
                >
                  <span className="font-semibold text-[#0F172A]">{s.name}</span>
                  <span className="font-mono">
                    {formatNumber(s.count)} visits ({s.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
