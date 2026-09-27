"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  QrCode,
  ExternalLink,
  Check,
  Loader2,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import DateFilterBar, { FilterState } from "@/components/analytics/DateFilterBar";
import AnalyticsTabs from "@/components/analytics/AnalyticsTabs";
import QRCodeModal from "@/components/ui/QRCodeModal";
import { useToast } from "@/components/ui/ToastContext";

export default function LinkAnalyticsPage() {
  const params = useParams();
  const linkId = params.id as string;
  const { showToast } = useToast();

  const [user, setUser] = useState<any>(null);
  const [link, setLink] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const [filter, setFilter] = useState<FilterState>({
    period: "7d",
  });

  const fetchData = async () => {
    try {
      const [linkRes, anaRes] = await Promise.all([
        fetch(`/api/links/${linkId}`),
        fetch(
          `/api/analytics?linkId=${linkId}&period=${filter.period}${
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

      const [linkJson, anaJson] = await Promise.all([linkRes.json(), anaRes.json()]);

      if (linkJson.success) setLink(linkJson.link);
      if (anaJson.success) setAnalytics(anaJson.data);
    } catch {
      showToast("Error loading analytics", "error");
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
  }, []);

  useEffect(() => {
    fetchData();
  }, [linkId, filter]);

  const handleCopy = async () => {
    if (!link) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "https://jii.life";
    const url = `${origin}/${link.shortCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      showToast("Tracking link copied", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Failed to copy link", "error");
    }
  };

  const handleExportCsv = () => {
    const url = `/api/reports/export?linkId=${linkId}&period=${filter.period}`;
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

  const origin = typeof window !== "undefined" ? window.location.origin : "https://jii.life";
  const host = typeof window !== "undefined" ? window.location.host : "jii.life";
  const shortUrl = link ? `${origin}/${link.shortCode}` : "";

  return (
    <AppShell
      user={user}
      title="Link Traffic Analytics"
      subtitle={link ? `Performance metrics for ${host}/${link.shortCode}` : ""}
    >
      <div className="space-y-6">
        {/* Back Link & Info Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#FFFFFF] border border-[#E2E8F0] p-4 rounded-xl shadow-xs">
          <div className="flex items-center gap-3">
            <Link
              href="/links"
              className="p-2 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-[16px] text-[#2563EB]">
                  {host}/{link?.shortCode}
                </span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                    link?.status === "ACTIVE"
                      ? "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]"
                      : "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]"
                  }`}
                >
                  {link?.status}
                </span>
              </div>
              <div className="text-[12px] text-[#64748B] truncate max-w-md mt-0.5">
                Destination: {link?.destinationUrl}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-xs font-semibold text-[#0F172A] transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy Link"}</span>
            </button>

            <button
              type="button"
              onClick={() => setQrModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-xs font-semibold text-[#0F172A] transition"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR Code</span>
            </button>
          </div>
        </div>

        {/* Date Filter & Export Bar */}
        <DateFilterBar
          filter={filter}
          onChange={(newFilter) => setFilter(newFilter)}
          onExportCsv={handleExportCsv}
        />

        {/* Tabbed Analytics */}
        <AnalyticsTabs
          data={analytics}
          isEmployeeView={user.role !== "SUPER_ADMIN" && user.role !== "ADMIN"}
          onDrilldown={handleDrilldown}
        />

        {/* QR Modal */}
        <QRCodeModal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          shortUrl={shortUrl}
          shortCode={link?.shortCode || ""}
        />
      </div>
    </AppShell>
  );
}
