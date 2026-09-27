"use client";

import React, { useEffect, useState } from "react";
import {
  Activity,
  Pause,
  Play,
  Search,
  Filter,
  Eye,
  CheckCircle,
  AlertTriangle,
  Bot,
  X,
  Loader2,
  RefreshCw,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { useToast } from "@/components/ui/ToastContext";
import { formatDateTime } from "@/lib/utils";

export default function AdminTrafficExplorerPage() {
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [liveStats, setLiveStats] = useState<{ visits5m: number; visits30m: number }>({
    visits5m: 0,
    visits30m: 0,
  });
  const [isLive, setIsLive] = useState(true);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Inspect Modal
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const fetchRealtimeEvents = async () => {
    try {
      const res = await fetch("/api/analytics/realtime");
      const json = await res.json();
      if (json.success) {
        setEvents(json.data.events || []);
        setLiveStats({
          visits5m: json.data.visits5m || 0,
          visits30m: json.data.visits30m || 0,
        });
      }
    } catch {
      showToast("Error updating traffic feed", "error");
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

    fetchRealtimeEvents();
  }, []);

  // Poll for live feed if isLive is true
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(fetchRealtimeEvents, 5000);
    return () => clearInterval(interval);
  }, [isLive]);

  const filteredEvents = events.filter((ev) => {
    const matchSearch =
      ev.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
      ev.shortCode?.toLowerCase().includes(search.toLowerCase()) ||
      ev.country?.toLowerCase().includes(search.toLowerCase()) ||
      ev.city?.toLowerCase().includes(search.toLowerCase()) ||
      ev.source?.toLowerCase().includes(search.toLowerCase()) ||
      ev.ipAddress?.includes(search);

    let matchStatus = true;
    if (statusFilter === "valid") matchStatus = ev.isValid;
    else if (statusFilter === "duplicate") matchStatus = ev.isDuplicate;
    else if (statusFilter === "bot") matchStatus = ev.isBot;

    return matchSearch && matchStatus;
  });

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
      title="Traffic Explorer & Live Stream"
      subtitle="Inspect live incoming clicks with instant bot, duplicate, and geo diagnostics"
    >
      <div className="space-y-6">
        {/* Top Control Bar with 5m/30m counters & live toggle */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-4 flex items-center justify-between shadow-xs">
            <div>
              <span className="block text-xs font-semibold text-[#64748B]">
                Live In Last 5 Mins
              </span>
              <span className="text-2xl font-bold font-mono text-[#16A34A]">
                {liveStats.visits5m}
              </span>
            </div>
            <span className="w-3 h-3 rounded-full bg-[#16A34A] animate-ping"></span>
          </div>

          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-4 flex items-center justify-between shadow-xs">
            <div>
              <span className="block text-xs font-semibold text-[#64748B]">
                Live In Last 30 Mins
              </span>
              <span className="text-2xl font-bold font-mono text-[#2563EB]">
                {liveStats.visits30m}
              </span>
            </div>
            <Activity className="w-5 h-5 text-[#2563EB]" />
          </div>

          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-4 flex items-center justify-between shadow-xs">
            <div>
              <span className="block text-xs font-semibold text-[#64748B]">
                Realtime Feed Status
              </span>
              <span className="text-sm font-bold text-[#0F172A] flex items-center gap-1.5 mt-1">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isLive ? "bg-[#16A34A]" : "bg-[#D97706]"
                  }`}
                />
                {isLive ? "Streaming Live" : "Stream Paused"}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsLive(!isLive)}
                className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ${
                  isLive
                    ? "bg-[#FFFBEB] border-[#FDE68A] text-[#D97706] hover:bg-[#FEF3C7]"
                    : "bg-[#F0FDF4] border-[#BBF7D0] text-[#16A34A] hover:bg-[#DCFCE7]"
                }`}
              >
                {isLive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isLive ? "Pause" : "Resume"}</span>
              </button>

              <button
                type="button"
                onClick={fetchRealtimeEvents}
                className="p-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#64748B] transition"
                title="Refresh manually"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FFFFFF] border border-[#E2E8F0] p-3 rounded-xl shadow-xs">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by IP, employee, code, country, or source..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-[13px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-[13px] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="all">All Traffic Statuses</option>
              <option value="valid">Valid Human Only</option>
              <option value="duplicate">Duplicates (Window)</option>
              <option value="bot">Bots / Crawlers</option>
            </select>
          </div>
        </div>

        {/* Realtime Event Stream Table */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] font-semibold">
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Short Code</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Device & OS</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-xs text-[#94A3B8]">
                      No events matching filters recorded in current window.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((ev) => (
                    <tr key={ev.id} className="hover:bg-[#F8FAFC] transition">
                      <td className="py-3 px-4 text-[#64748B] font-mono text-[11px] whitespace-nowrap">
                        {formatDateTime(ev.timestamp)}
                      </td>

                      <td className="py-3 px-4 font-semibold text-[#0F172A]">
                        {ev.employeeName}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-[#2563EB]">
                        /{ev.shortCode}
                      </td>

                      <td className="py-3 px-4 text-[#0F172A]">
                        <span className="font-semibold">{ev.city}</span>,{" "}
                        <span className="text-[#64748B]">{ev.country}</span>
                      </td>

                      <td className="py-3 px-4 font-semibold text-[#0F172A]">
                        {ev.source}
                      </td>

                      <td className="py-3 px-4 text-[#64748B]">
                        <span>{ev.deviceType}</span> • <span>{ev.os}</span>
                      </td>

                      <td className="py-3 px-4 font-mono text-[#64748B] text-[11px]">
                        {ev.ipAddress || "182.xxx.xxx.xxx"}
                      </td>

                      <td className="py-3 px-4">
                        {ev.isBot ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
                            <Bot className="w-3 h-3" /> Bot
                          </span>
                        ) : ev.isDuplicate ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
                            <AlertTriangle className="w-3 h-3" /> Duplicate
                          </span>
                        ) : ev.isValid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">
                            <CheckCircle className="w-3 h-3" /> Valid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
                            Invalid
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedEvent(ev)}
                          className="p-1 rounded-md border border-[#E2E8F0] hover:bg-[#EFF6FF] text-[#64748B] hover:text-[#2563EB] transition"
                          title="Inspect Click Event"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Event Detail Inspector Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white border border-[#E2E8F0] rounded-xl max-w-lg w-full p-6 shadow-xl relative animate-in zoom-in-95">
              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#0F172A]"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-[17px] font-bold text-[#0F172A] mb-1">
                Traffic Event Inspection
              </h3>
              <p className="text-[12px] text-[#64748B] mb-5">
                Full forensic diagnosis for click event #{selectedEvent.id.substring(0, 10)}
              </p>

              <div className="space-y-2 text-xs font-mono bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-xl max-h-96 overflow-y-auto">
                <div className="flex justify-between py-1 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Timestamp:</span>
                  <span className="font-bold text-[#0F172A]">
                    {formatDateTime(selectedEvent.timestamp)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Employee:</span>
                  <span className="font-bold text-[#0F172A]">
                    {selectedEvent.employeeName}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Tracking Link:</span>
                  <span className="font-bold text-[#2563EB]">
                    go.example.com/{selectedEvent.shortCode}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Destination:</span>
                  <span className="font-bold text-[#0F172A] truncate max-w-[240px]">
                    {selectedEvent.destinationUrl}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">IP Address:</span>
                  <span className="font-bold text-[#0F172A]">
                    {selectedEvent.ipAddress || "Internal"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Country & City:</span>
                  <span className="font-bold text-[#0F172A]">
                    {selectedEvent.city}, {selectedEvent.country}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Source Channel:</span>
                  <span className="font-bold text-[#0F172A]">
                    {selectedEvent.source}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Referrer Header:</span>
                  <span className="text-[#0F172A] truncate max-w-[240px]">
                    {selectedEvent.referrer || "Direct / App"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Device / OS:</span>
                  <span className="font-bold text-[#0F172A]">
                    {selectedEvent.deviceType} • {selectedEvent.os}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2E8F0]">
                  <span className="text-[#64748B]">Browser / WebView:</span>
                  <span className="font-bold text-[#0F172A]">
                    {selectedEvent.browser}
                  </span>
                </div>
                <div className="flex justify-between py-1 pt-2 font-bold text-[13px]">
                  <span className="text-[#64748B]">Validation Verdict:</span>
                  <span
                    className={
                      selectedEvent.isValid
                        ? "text-[#16A34A]"
                        : "text-[#DC2626]"
                    }
                  >
                    {selectedEvent.isValid
                      ? "VALID VISITOR"
                      : `FILTERED (${selectedEvent.invalidReason || "INVALID"})`}
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg"
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
