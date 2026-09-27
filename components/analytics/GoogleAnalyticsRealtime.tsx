"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Activity,
  Globe,
  Link as LinkIcon,
  Share2,
  Smartphone,
  TrendingUp,
  Clock,
  ChevronRight,
} from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface CandleItem {
  index: number;
  minsAgo: number;
  label: string;
  timeLabel: string;
  validVisits: number;
  creditedVisits: number;
  rawHits: number;
}

interface RealtimeData {
  visits30m: number;
  visits5m: number;
  credited30m: number;
  perMinuteAvg: number;
  candles: CandleItem[];
  topCountries: { code: string; name: string; count: number; percentage: number }[];
  topLinks: { id: string; shortCode: string; destinationUrl: string; title?: string; count: number; percentage: number }[];
  topSources: { source: string; count: number; percentage: number }[];
  topDevices: { device: string; count: number; percentage: number }[];
}

interface GoogleAnalyticsRealtimeProps {
  userId?: string;
  linkId?: string;
  isEmployeeView?: boolean;
  title?: string;
}

export default function GoogleAnalyticsRealtime({
  userId,
  linkId,
  isEmployeeView = false,
  title = "Realtime Traffic Overview",
}: GoogleAnalyticsRealtimeProps) {
  const [data, setData] = useState<RealtimeData | null>(null);
  const [hoveredCandle, setHoveredCandle] = useState<CandleItem | null>(null);
  const [breakdownTab, setBreakdownTab] = useState<"countries" | "links" | "sources">("countries");
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchRealtime = async () => {
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const params = new URLSearchParams();
      if (userId && userId !== "all") params.set("userId", userId);
      if (linkId && linkId !== "all") params.set("linkId", linkId);

      const res = await fetch(`/api/analytics/realtime?${params.toString()}`, {
        signal: abortControllerRef.current.signal,
      });
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Realtime fetch error", err);
      }
    }
  };

  useEffect(() => {
    fetchRealtime();
    const interval = setInterval(fetchRealtime, 6000); // 6s poll
    return () => {
      clearInterval(interval);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [userId, linkId]);

  const candles = data?.candles || Array.from({ length: 30 }, (_, i) => ({
    index: i,
    minsAgo: 29 - i,
    label: 29 - i === 0 ? "Now" : `-${29 - i}m`,
    timeLabel: "",
    validVisits: 0,
    creditedVisits: 0,
    rawHits: 0,
  }));

  const maxVal = Math.max(1, ...candles.map((c) => c.validVisits));
  const visits30m = data?.visits30m || 0;
  const visits5m = data?.visits5m || 0;
  const credited30m = data?.credited30m || 0;
  const perMinuteAvg = data?.perMinuteAvg || 0;

  return (
    <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-xs transition duration-200">
      {/* Top Header & Live Beacon */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-bold text-[#0F172A] tracking-tight">
                {title}
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                Live
              </span>
            </div>
            <p className="text-[11px] text-[#64748B]">
              Real-time activity in the last 30 minutes (minute-by-minute)
            </p>
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="block text-[10px] uppercase font-bold text-[#64748B] tracking-wider">
              Last 5 Min
            </span>
            <span className="font-mono text-[16px] font-bold text-emerald-600">
              {formatNumber(visits5m)}
            </span>
          </div>

          <div className="h-7 w-[1px] bg-[#E2E8F0]"></div>

          <div className="text-right">
            <span className="block text-[10px] uppercase font-bold text-[#64748B] tracking-wider">
              {isEmployeeView ? "Credited (30m)" : "Avg / Min"}
            </span>
            <span className="font-mono text-[16px] font-bold text-[#2563EB]">
              {isEmployeeView ? formatNumber(credited30m) : perMinuteAvg}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Candles on Left/Top + Breakdown on Right/Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5">
        {/* Left: 30-Minute Minute-by-Minute Candle Chart */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <div>
                <span className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  Users in Last 30 Minutes
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="font-mono text-[36px] font-extrabold text-[#0F172A] leading-none">
                    {formatNumber(visits30m)}
                  </span>
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5">
                    <Activity className="w-3.5 h-3.5" /> active now
                  </span>
                </div>
              </div>

              {/* Hovered bar info */}
              <div className="text-right h-8 flex flex-col justify-end">
                {hoveredCandle ? (
                  <div className="text-xs font-mono bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-0.5 rounded shadow-2xs">
                    <span className="font-bold text-[#0F172A]">{hoveredCandle.validVisits} visits</span>
                    <span className="text-[#64748B] ml-1.5 text-[11px]">
                      ({hoveredCandle.label} • {hoveredCandle.timeLabel})
                    </span>
                  </div>
                ) : (
                  <span className="text-[11px] text-[#94A3B8]">
                    Hover over any bar to inspect minute
                  </span>
                )}
              </div>
            </div>

            {/* Google Analytics Style 30-Minute Bars */}
            <div className="mt-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4">
              <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-2">
                Users Per Minute (Last 30 Min)
              </div>

              {/* Bars container */}
              <div className="h-28 flex items-end gap-1 px-1 pt-2">
                {candles.map((candle, idx) => {
                  const isCurrentMinute = idx === 29;
                  const heightPct =
                    candle.validVisits > 0
                      ? Math.max(12, Math.round((candle.validVisits / maxVal) * 100))
                      : 4; // Baseline pip

                  const isHovered = hoveredCandle?.index === candle.index;

                  return (
                    <div
                      key={candle.index}
                      onMouseEnter={() => setHoveredCandle(candle)}
                      onMouseLeave={() => setHoveredCandle(null)}
                      className="flex-1 h-full flex items-end justify-center group cursor-pointer relative py-0.5"
                    >
                      {/* Bar candle */}
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full rounded-t-sm transition-all duration-150 ${
                          candle.validVisits > 0
                            ? isCurrentMinute
                              ? "bg-emerald-500 hover:bg-emerald-600 shadow-2xs"
                              : isHovered
                              ? "bg-[#1D4ED8]"
                              : "bg-[#2563EB] hover:bg-[#1D4ED8]"
                            : "bg-[#E2E8F0] hover:bg-[#CBD5E1]"
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* X-Axis labels matching GA4 */}
              <div className="flex justify-between text-[11px] font-semibold text-[#94A3B8] pt-2 border-t border-[#E2E8F0] mt-1 font-mono">
                <span>30 min ago</span>
                <span>15 min ago</span>
                <span className="text-[#2563EB] font-bold">Now</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Real-time Live Breakdowns */}
        <div className="lg:col-span-5 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-[#E2E8F0] lg:pl-6 pt-4 lg:pt-0">
          <div>
            {/* Breakdown Tabs */}
            <div className="flex items-center gap-1 border-b border-[#E2E8F0] pb-2 mb-3">
              <button
                type="button"
                onClick={() => setBreakdownTab("countries")}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                  breakdownTab === "countries"
                    ? "bg-[#EFF6FF] text-[#2563EB]"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                Top Countries
              </button>
              <button
                type="button"
                onClick={() => setBreakdownTab("links")}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                  breakdownTab === "links"
                    ? "bg-[#EFF6FF] text-[#2563EB]"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                Active Links
              </button>
              <button
                type="button"
                onClick={() => setBreakdownTab("sources")}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                  breakdownTab === "sources"
                    ? "bg-[#EFF6FF] text-[#2563EB]"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                Sources
              </button>
            </div>

            {/* Countries tab */}
            {breakdownTab === "countries" && (
              <div className="space-y-2.5">
                {(data?.topCountries || []).length === 0 ? (
                  <div className="text-center py-8 text-xs text-[#94A3B8]">
                    No country activity in the last 30 minutes
                  </div>
                ) : (
                  data?.topCountries.map((c) => (
                    <div key={c.code} className="text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-[#0F172A] truncate max-w-[140px]">
                          {c.name}
                        </span>
                        <span className="font-mono font-bold text-[#2563EB]">
                          {c.count} ({c.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-[#F1F5F9] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#2563EB] h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${c.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Links tab */}
            {breakdownTab === "links" && (
              <div className="space-y-2">
                {(data?.topLinks || []).length === 0 ? (
                  <div className="text-center py-8 text-xs text-[#94A3B8]">
                    No link clicks in the last 30 minutes
                  </div>
                ) : (
                  data?.topLinks.map((l) => (
                    <div
                      key={l.id}
                      className="p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-mono font-bold text-[#2563EB] block truncate">
                          /{l.shortCode}
                        </span>
                        <span className="text-[11px] text-[#64748B] block truncate max-w-[160px]">
                          {l.title || l.destinationUrl}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-[#0F172A] px-2 py-0.5 rounded bg-white border border-[#E2E8F0] shrink-0">
                        {l.count}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Sources tab */}
            {breakdownTab === "sources" && (
              <div className="space-y-2.5">
                {(data?.topSources || []).length === 0 ? (
                  <div className="text-center py-8 text-xs text-[#94A3B8]">
                    No source data in the last 30 minutes
                  </div>
                ) : (
                  data?.topSources.map((s) => (
                    <div key={s.source} className="text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-[#0F172A]">{s.source}</span>
                        <span className="font-mono font-bold text-[#16A34A]">
                          {s.count} ({s.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-[#F1F5F9] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#16A34A] h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${s.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="pt-3 mt-3 border-t border-[#E2E8F0] text-[11px] text-[#94A3B8] flex items-center justify-between font-mono">
            <span>Updates every 6 seconds</span>
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Connected
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
