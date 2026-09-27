"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, Search, Loader2 } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { formatDateTime } from "@/lib/utils";

export default function AdminAuditLogsPage() {
  const [user, setUser] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchLogs = async () => {
    try {
      const res = await fetch(`/api/audit-logs?search=${encodeURIComponent(search)}`);
      const json = await res.json();
      if (json.success) setLogs(json.logs);
    } catch {
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

    fetchLogs();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [search]);

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
      title="System Audit Trail"
      subtitle="Immutable audit log of all administrative actions, rate alterations, and account interventions"
    >
      <div className="space-y-6">
        {/* Search */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-3 rounded-xl shadow-xs max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search audit actions, admins, or values..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] font-semibold">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Admin</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Type</th>
                  <th className="py-3 px-4">Previous Value</th>
                  <th className="py-3 px-4">New Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-[#94A3B8]">
                      No audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#F8FAFC] transition">
                      <td className="py-3 px-4 font-mono text-[11px] text-[#64748B] whitespace-nowrap">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#0F172A]">
                        {log.adminUser?.name || "System"}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] font-bold text-[#2563EB]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#64748B]">
                        {log.targetType}
                      </td>
                      <td className="py-3 px-4 text-[#94A3B8] font-mono">
                        {log.previousValue || "—"}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#0F172A]">
                        {log.newValue}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
