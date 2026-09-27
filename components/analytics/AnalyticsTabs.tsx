"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import StatCard from "@/components/ui/StatCard";
import { formatNumber } from "@/lib/utils";
import {
  Globe,
  Smartphone,
  Share2,
  Clock,
  Layers,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import GoogleAnalyticsRealtime from "./GoogleAnalyticsRealtime";

interface AnalyticsTabsProps {
  data: any;
  isEmployeeView?: boolean;
  onDrilldown?: (key: string, value: string) => void;
}

export default function AnalyticsTabs({
  data,
  isEmployeeView = false,
  onDrilldown,
}: AnalyticsTabsProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "location" | "technology" | "sources" | "time"
  >("overview");

  const [selectedCountry, setSelectedCountry] = useState<any>(null);

  if (!data) return null;

  const {
    kpis = {},
    dailyTrends = [],
    hourly = [],
    dayOfWeek = [],
    countries = [],
    cities = [],
    devices = [],
    operatingSystems = [],
    browsers = [],
    sources = [],
  } = data;

  const tabs = [
    { id: "overview", label: "Overview", icon: Layers },
    { id: "location", label: "Location", icon: Globe },
    { id: "technology", label: "Technology", icon: Smartphone },
    { id: "sources", label: "Sources", icon: Share2 },
    { id: "time", label: "Time Analysis", icon: Clock },
  ];

  const totalValid = kpis.validVisits || 1;

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-[#E2E8F0] gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-[14px] font-medium border-b-2 transition whitespace-nowrap ${
                isActive
                  ? "border-[#2563EB] text-[#2563EB]"
                  : "border-transparent text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1]"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {!isEmployeeView && (
              <>
                <StatCard
                  title="Total Raw Hits"
                  value={kpis.rawHits || 0}
                  subtitle="All incoming HTTP requests"
                  badge="Raw"
                  badgeColor="blue"
                />
                <StatCard
                  title="Valid Traffic"
                  value={kpis.validVisits || 0}
                  subtitle="Filtered humans (non-bot)"
                  badge="Accepted"
                  badgeColor="green"
                  icon={CheckCircle2}
                />
                <StatCard
                  title="Estimated Unique Visitors"
                  value={kpis.uniqueVisitors || 0}
                  subtitle={`${kpis.repeatVisits || 0} repeat visits`}
                  badge="Unique"
                  badgeColor="blue"
                  icon={Users}
                />
              </>
            )}

            <StatCard
              title={isEmployeeView ? "Credited Clicks" : "Total Credited Traffic"}
              value={kpis.creditedClicks || 0}
              subtitle={`Calculated at ${kpis.effectiveRate}% effective credit rate`}
              badge={`${kpis.effectiveRate}% Rate`}
              badgeColor="green"
              icon={ShieldCheck}
            />
          </div>

          {/* Real-time 30-Minute Google Analytics Candles */}
          <GoogleAnalyticsRealtime
            isEmployeeView={isEmployeeView}
            title={isEmployeeView ? "My Live Traffic (Last 30 Min)" : "Platform Live Traffic (Last 30 Min)"}
          />

          {/* Graph ABOVE: Traffic Trend Line Chart */}
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[16px] font-bold text-[#0F172A] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#2563EB]" /> Traffic Trend Over Time
                </h3>
                <p className="text-[12px] text-[#64748B]">
                  {isEmployeeView
                    ? "Daily credited clicks breakdown"
                    : "Actual valid traffic compared to credited clicks"}
                </p>
              </div>
            </div>

            <div className="h-72 w-full">
              {dailyTrends.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-[#94A3B8]">
                  No traffic recorded for the selected period
                </div>
              ) : (
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
                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                    {!isEmployeeView && (
                      <Line
                        type="monotone"
                        dataKey="valid"
                        name="Valid Traffic"
                        stroke="#2563EB"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "#2563EB" }}
                        activeDot={{ r: 5 }}
                      />
                    )}
                    <Line
                      type="monotone"
                      dataKey="credited"
                      name="Credited Clicks"
                      stroke="#16A34A"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#16A34A" }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Data Table BELOW: Daily Breakdown Table */}
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <h4 className="text-[14px] font-bold text-[#0F172A]">Daily Traffic Breakdown Table</h4>
              <p className="text-[12px] text-[#64748B]">Detailed log of traffic activity for each day in range</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] font-semibold">
                    <th className="py-3 px-4">Date</th>
                    {!isEmployeeView && <th className="py-3 px-4 text-center">Raw Hits</th>}
                    {!isEmployeeView && <th className="py-3 px-4 text-center">Valid Traffic</th>}
                    <th className="py-3 px-4 text-center">Credited Clicks</th>
                    <th className="py-3 px-4 text-right">Share of Period</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {dailyTrends.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#94A3B8]">
                        No daily records found
                      </td>
                    </tr>
                  ) : (
                    dailyTrends.map((d: any) => {
                      const sharePct = kpis.creditedClicks > 0
                        ? Math.round((d.credited / kpis.creditedClicks) * 100)
                        : 0;
                      return (
                        <tr key={d.date} className="hover:bg-[#F8FAFC] transition">
                          <td className="py-3 px-4 font-mono font-medium text-[#0F172A]">{d.date}</td>
                          {!isEmployeeView && (
                            <td className="py-3 px-4 text-center font-mono text-[#64748B]">
                              {formatNumber(d.raw || 0)}
                            </td>
                          )}
                          {!isEmployeeView && (
                            <td className="py-3 px-4 text-center font-mono font-bold text-[#2563EB]">
                              {formatNumber(d.valid || 0)}
                            </td>
                          )}
                          <td className="py-3 px-4 text-center font-mono font-bold text-[#16A34A]">
                            <span className="inline-block px-2 py-0.5 rounded bg-[#F0FDF4] border border-[#BBF7D0]">
                              {formatNumber(d.credited || 0)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-2 justify-end w-28">
                              <span className="text-[#64748B] font-mono text-[11px]">{sharePct}%</span>
                              <div className="w-16 bg-[#F1F5F9] h-2 rounded-full overflow-hidden">
                                <div className="bg-[#2563EB] h-2 rounded-full" style={{ width: `${sharePct}%` }} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. LOCATION TAB */}
      {activeTab === "location" && (
        <div className="space-y-6">
          {/* Graph ABOVE: Top Countries Horizontal Bar Chart */}
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
            <h3 className="text-[16px] font-bold text-[#0F172A] mb-1 flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#2563EB]" /> Country Traffic Distribution
            </h3>
            <p className="text-[12px] text-[#64748B] mb-4">
              Geographical concentration of incoming visits
            </p>

            <div className="h-64 w-full">
              {countries.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-[#94A3B8]">
                  No country records found
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={countries.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis
                      dataKey="name"
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
                    <Bar dataKey="visits" name="Visits" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Data Tables BELOW the Graph: Countries & Cities Table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Countries Table */}
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <h4 className="text-[14px] font-bold text-[#0F172A]">Country Data List</h4>
                <p className="text-[12px] text-[#64748B]">Click any country to filter cities</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] font-semibold">
                      <th className="py-3 px-4">Country</th>
                      <th className="py-3 px-4 text-center">Visits</th>
                      <th className="py-3 px-4 text-right">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {countries.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-[#94A3B8]">
                          No records found
                        </td>
                      </tr>
                    ) : (
                      countries.map((c: any) => {
                        const isSelected = selectedCountry?.code === c.code;
                        return (
                          <tr
                            key={c.code}
                            onClick={() => {
                              setSelectedCountry(c);
                              onDrilldown?.("country", c.code);
                            }}
                            className={`cursor-pointer transition ${
                              isSelected ? "bg-[#EFF6FF] font-semibold text-[#2563EB]" : "hover:bg-[#F8FAFC]"
                            }`}
                          >
                            <td className="py-3 px-4 flex items-center justify-between">
                              <span className="font-medium text-[#0F172A]">{c.name}</span>
                              <span className="text-[10px] text-[#94A3B8] font-mono px-1.5 py-0.5 rounded bg-[#F1F5F9]">
                                {c.code}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-bold text-[#0F172A]">
                              {formatNumber(c.visits)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="inline-flex items-center gap-2 justify-end w-28">
                                <span className="font-mono text-[#64748B]">{c.percentage}%</span>
                                <div className="w-14 bg-[#F1F5F9] h-2 rounded-full overflow-hidden">
                                  <div className="bg-[#2563EB] h-2 rounded-full" style={{ width: `${c.percentage}%` }} />
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* City Breakdown Table */}
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <h4 className="text-[14px] font-bold text-[#0F172A]">
                  City Data List {selectedCountry ? `(${selectedCountry.name})` : "(All Locations)"}
                </h4>
                <p className="text-[12px] text-[#64748B]">Granular regional breakdown</p>
              </div>

              <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] font-semibold sticky top-0 bg-[#F8FAFC]">
                      <th className="py-3 px-4">City</th>
                      <th className="py-3 px-4 text-right">Visits</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {((selectedCountry ? selectedCountry.cities : cities) || []).length === 0 ? (
                      <tr>
                        <td colSpan={2} className="py-8 text-center text-[#94A3B8]">
                          No city records found
                        </td>
                      </tr>
                    ) : (
                      (selectedCountry ? selectedCountry.cities : cities).map((ct: any) => (
                        <tr
                          key={ct.city}
                          onClick={() => onDrilldown?.("city", ct.city)}
                          className="hover:bg-[#F8FAFC] cursor-pointer transition"
                        >
                          <td className="py-3 px-4 font-medium text-[#0F172A]">{ct.city}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-[#0F172A]">
                            {formatNumber(ct.visits)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. TECHNOLOGY TAB */}
      {activeTab === "technology" && (
        <div className="space-y-6">
          {/* Graphs ABOVE: Devices, OS, Browsers side by side */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Device Chart */}
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
              <h3 className="text-[14px] font-bold text-[#0F172A] mb-1">Device Breakdown</h3>
              <p className="text-[11px] text-[#64748B] mb-3">Visits by hardware type</p>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={devices}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748B" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748B" }} />
                    <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px" }} />
                    <Bar dataKey="count" name="Visits" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* OS Chart */}
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
              <h3 className="text-[14px] font-bold text-[#0F172A] mb-1">Operating Systems</h3>
              <p className="text-[11px] text-[#64748B] mb-3">Visits by platform</p>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={operatingSystems.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748B" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748B" }} />
                    <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px" }} />
                    <Bar dataKey="count" name="Visits" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Browser Chart */}
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
              <h3 className="text-[14px] font-bold text-[#0F172A] mb-1">Browsers</h3>
              <p className="text-[11px] text-[#64748B] mb-3">Visits by browser application</p>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={browsers.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748B" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748B" }} />
                    <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px" }} />
                    <Bar dataKey="count" name="Visits" fill="#16A34A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Data Tables BELOW the Graphs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Devices Table */}
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
              <div className="p-3.5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <h4 className="text-[13px] font-bold text-[#0F172A]">Device List</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]">
                      <th className="py-2.5 px-3">Device</th>
                      <th className="py-2.5 px-3 text-center">Visits</th>
                      <th className="py-2.5 px-3 text-right">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {devices.map((d: any) => (
                      <tr key={d.name} onClick={() => onDrilldown?.("deviceType", d.name)} className="hover:bg-[#F8FAFC] cursor-pointer">
                        <td className="py-2.5 px-3 font-medium text-[#0F172A]">{d.name}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold">{formatNumber(d.count)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-[#64748B]">{d.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* OS Table */}
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
              <div className="p-3.5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <h4 className="text-[13px] font-bold text-[#0F172A]">Operating Systems List</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]">
                      <th className="py-2.5 px-3">OS</th>
                      <th className="py-2.5 px-3 text-center">Visits</th>
                      <th className="py-2.5 px-3 text-right">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {operatingSystems.map((os: any) => (
                      <tr key={os.name} onClick={() => onDrilldown?.("os", os.name)} className="hover:bg-[#F8FAFC] cursor-pointer">
                        <td className="py-2.5 px-3 font-medium text-[#0F172A]">{os.name}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold">{formatNumber(os.count)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-[#64748B]">{os.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Browsers Table */}
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
              <div className="p-3.5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <h4 className="text-[13px] font-bold text-[#0F172A]">Browsers List</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]">
                      <th className="py-2.5 px-3">Browser</th>
                      <th className="py-2.5 px-3 text-center">Visits</th>
                      <th className="py-2.5 px-3 text-right">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {browsers.map((b: any) => (
                      <tr key={b.name} className="hover:bg-[#F8FAFC]">
                        <td className="py-2.5 px-3 font-medium text-[#0F172A]">{b.name}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold">{formatNumber(b.count)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-[#64748B]">{b.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. SOURCES TAB */}
      {activeTab === "sources" && (
        <div className="space-y-6">
          {/* Graph ABOVE: Acquisition Sources Bar Chart */}
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
            <h3 className="text-[16px] font-bold text-[#0F172A] mb-1 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#2563EB]" /> Traffic Acquisition Channels
            </h3>
            <p className="text-[12px] text-[#64748B] mb-4">
              Breakdown of traffic origins by marketing channel and referral source
            </p>

            <div className="h-64 w-full">
              {sources.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-[#94A3B8]">
                  No sources recorded yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sources}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis
                      dataKey="name"
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
                    <Bar dataKey="count" name="Visits" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Data Table BELOW the Graph: Sources Table */}
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <h4 className="text-[14px] font-bold text-[#0F172A]">Acquisition Sources List & Table</h4>
              <p className="text-[12px] text-[#64748B]">Click any source channel to filter traffic</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] font-semibold">
                    <th className="py-3 px-4">Channel / Source</th>
                    <th className="py-3 px-4 text-center">Visits</th>
                    <th className="py-3 px-4 text-right">Share of Total Traffic</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {sources.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-[#94A3B8]">
                        No sources recorded yet
                      </td>
                    </tr>
                  ) : (
                    sources.map((s: any) => (
                      <tr
                        key={s.name}
                        onClick={() => onDrilldown?.("source", s.name)}
                        className="hover:bg-[#F8FAFC] cursor-pointer transition"
                      >
                        <td className="py-3.5 px-4 font-semibold text-[#0F172A]">{s.name}</td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-[#0F172A]">
                          {formatNumber(s.count)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-2 justify-end w-32">
                            <span className="font-mono text-[#64748B]">{s.percentage}%</span>
                            <div className="w-16 bg-[#F1F5F9] h-2 rounded-full overflow-hidden">
                              <div className="bg-[#2563EB] h-2 rounded-full" style={{ width: `${s.percentage}%` }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. TIME ANALYSIS TAB */}
      {activeTab === "time" && (
        <div className="space-y-6">
          {/* Graphs ABOVE: Hourly & Day of Week Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hourly chart */}
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
              <h3 className="text-[16px] font-bold text-[#0F172A] mb-1">
                Hourly Traffic Distribution
              </h3>
              <p className="text-[12px] text-[#64748B] mb-4">
                Visits by hour of the day (24-hour cycle)
              </p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourly}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis
                      dataKey="hour"
                      tickLine={false}
                      axisLine={{ stroke: "#E2E8F0" }}
                      tick={{ fill: "#64748B", fontSize: 10 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={{ stroke: "#E2E8F0" }}
                      tick={{ fill: "#64748B", fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="count" name="Visits" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Day of Week chart */}
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
              <h3 className="text-[16px] font-bold text-[#0F172A] mb-1">
                Day of Week Performance
              </h3>
              <p className="text-[12px] text-[#64748B] mb-4">
                Aggregated traffic across Monday to Sunday
              </p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dayOfWeek}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis
                      dataKey="day"
                      tickLine={false}
                      axisLine={{ stroke: "#E2E8F0" }}
                      tick={{ fill: "#64748B", fontSize: 10 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={{ stroke: "#E2E8F0" }}
                      tick={{ fill: "#64748B", fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="count" name="Visits" fill="#16A34A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Data Tables BELOW the Graphs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hourly Table */}
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <h4 className="text-[14px] font-bold text-[#0F172A]">Hourly Data Table</h4>
              </div>
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] sticky top-0 bg-[#F8FAFC]">
                      <th className="py-2.5 px-4">Hour</th>
                      <th className="py-2.5 px-4 text-right">Visits</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {hourly.map((h: any) => (
                      <tr key={h.hour} className="hover:bg-[#F8FAFC]">
                        <td className="py-2.5 px-4 font-mono font-medium text-[#0F172A]">{h.hour}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-[#0F172A]">{formatNumber(h.count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Day of Week Table */}
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <h4 className="text-[14px] font-bold text-[#0F172A]">Day of Week Data Table</h4>
              </div>
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] sticky top-0 bg-[#F8FAFC]">
                      <th className="py-2.5 px-4">Day</th>
                      <th className="py-2.5 px-4 text-right">Visits</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {dayOfWeek.map((d: any) => (
                      <tr key={d.day} className="hover:bg-[#F8FAFC]">
                        <td className="py-2.5 px-4 font-semibold text-[#0F172A]">{d.day}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-[#16A34A]">{formatNumber(d.count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
