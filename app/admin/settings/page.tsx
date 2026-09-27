"use client";

import React, { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { useToast } from "@/components/ui/ToastContext";
import {
  Settings,
  Sliders,
  Link as LinkIcon,
  ShieldAlert,
  Bell,
  Check,
  Loader2,
  ShieldCheck,
  Zap,
  Cpu,
} from "lucide-react";

export default function AdminSettingsPage() {
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings State
  const [activeTab, setActiveTab] = useState<"traffic" | "links" | "announcements" | "security">("traffic");

  const [creditRate, setCreditRate] = useState("50");
  const [duplicateWindow, setDuplicateWindow] = useState("30");
  const [botFilter, setBotFilter] = useState("true");
  const [botProtectionLevel, setBotProtectionLevel] = useState("STRICT");
  const [botBlockDatacenters, setBotBlockDatacenters] = useState("true");
  const [botCheckHeaders, setBotCheckHeaders] = useState("true");
  const [botAction, setBotAction] = useState("403_BLOCK");
  const [internalIp, setInternalIp] = useState("");
  const [allowedDomains, setAllowedDomains] = useState("example.com,jobs.example.com,company.com");
  const [fallbackUrl, setFallbackUrl] = useState("https://example.com");
  const [shortDomain, setShortDomain] = useState("go.example.com");

  // Announcement Form State
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [creatingAnnouncement, setCreatingAnnouncement] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ]).then(([userData, settingsData]) => {
      if (userData.success) setUser(userData.user);
      if (settingsData.success && settingsData.settings) {
        const s = settingsData.settings;
        if (s.traffic_credit_percentage) setCreditRate(s.traffic_credit_percentage);
        if (s.duplicate_window_minutes) setDuplicateWindow(s.duplicate_window_minutes);
        if (s.bot_filtering_enabled) setBotFilter(s.bot_filtering_enabled);
        if (s.bot_protection_level) setBotProtectionLevel(s.bot_protection_level);
        if (s.bot_block_datacenters) setBotBlockDatacenters(s.bot_block_datacenters);
        if (s.bot_check_headers) setBotCheckHeaders(s.bot_check_headers);
        if (s.bot_action) setBotAction(s.bot_action);
        if (s.internal_test_ip) setInternalIp(s.internal_test_ip);
        if (s.allowed_domains) setAllowedDomains(s.allowed_domains);
        if (s.default_fallback_url) setFallbackUrl(s.default_fallback_url);
        if (s.short_domain) setShortDomain(s.short_domain);
      }
      setLoading(false);
    });
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          traffic_credit_percentage: creditRate,
          duplicate_window_minutes: duplicateWindow,
          bot_filtering_enabled: botFilter,
          bot_protection_level: botProtectionLevel,
          bot_block_datacenters: botBlockDatacenters,
          bot_check_headers: botCheckHeaders,
          bot_action: botAction,
          internal_test_ip: internalIp,
          allowed_domains: allowedDomains,
          default_fallback_url: fallbackUrl,
          short_domain: shortDomain,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast("System settings saved and logged to audit trail", "success");
      } else {
        showToast(json.message || "Failed to save settings", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle || !announcementMessage) return;

    setCreatingAnnouncement(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: announcementTitle.trim(),
          message: announcementMessage.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("Announcement published to all employee dashboards", "success");
        setAnnouncementTitle("");
        setAnnouncementMessage("");
      } else {
        showToast(json.message || "Failed to publish", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setCreatingAnnouncement(false);
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" />
      </div>
    );
  }

  const parsedRate = parseFloat(creditRate) || 50;
  const exampleCredited = Math.floor((1000 * parsedRate) / 100);

  const subTabs = [
    {
      id: "traffic",
      label: "Traffic & Credit Settings",
      description: "Credit %, duplicate window & bot filters",
      icon: Sliders,
    },
    {
      id: "links",
      label: "Link & Domain Security",
      description: "Allowed domains, short URLs & fallback",
      icon: LinkIcon,
    },
    {
      id: "announcements",
      label: "Employee Announcements",
      description: "Broadcast alerts across team dashboards",
      icon: Bell,
    },
    {
      id: "security",
      label: "Security & Governance",
      description: "Audit trail, access control & safeguards",
      icon: ShieldAlert,
    },
  ];

  return (
    <AppShell
      user={user}
      title="System Configuration & Settings"
      subtitle="Configure global credit percentages, duplicate detection windows, security rules, and domain allowlists"
    >
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Settings Sub-Sidebar */}
        <aside className="w-full lg:w-72 shrink-0">
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-3 shadow-xs space-y-1 lg:sticky lg:top-6">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
              Settings Sections
            </div>

            {subTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition ${
                    isActive
                      ? "bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] shadow-2xs"
                      : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] border border-transparent"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 mt-0.5 shrink-0 ${
                      isActive ? "text-[#2563EB]" : "text-[#64748B]"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-[13px] font-semibold leading-tight ${
                        isActive ? "text-[#2563EB]" : "text-[#0F172A]"
                      }`}
                    >
                      {tab.label}
                    </div>
                    <div className="text-[11px] text-[#94A3B8] mt-0.5 leading-tight">
                      {tab.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Settings Content Area */}
        <div className="flex-1 min-w-0 w-full space-y-6">

        {/* 1. TRAFFIC SETTINGS */}
        {activeTab === "traffic" && (
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 shadow-xs space-y-5">
              <div>
                <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                  Global Employee Traffic Credit Percentage (%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={creditRate}
                    onChange={(e) => setCreditRate(e.target.value)}
                    className="w-32 px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                  <span className="text-sm font-bold text-[#64748B]">%</span>
                </div>

                {/* Helper Context Card */}
                <div className="mt-3 p-3.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg text-xs text-[#1D4ED8]">
                  <strong className="block font-bold mb-0.5">Live Calculation Formula:</strong>
                  If 1,000 valid visits are recorded on an employee link, the employee dashboard will show{" "}
                  <strong>{exampleCredited.toLocaleString()} credited clicks</strong>. Actual raw visits remain 100% immutable in the database.
                </div>
              </div>

              <div className="border-t border-[#E2E8F0] pt-4">
                <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                  Visitor Duplicate Window (Minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="1440"
                  required
                  value={duplicateWindow}
                  onChange={(e) => setDuplicateWindow(e.target.value)}
                  className="w-32 px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
                <span className="block text-[12px] text-[#64748B] mt-1">
                  Repeated clicks from the same visitor hash on the same link within this window will be flagged as duplicates and excluded from credited traffic.
                </span>
              </div>

              {/* Anti-Bot Shield & Zero-Latency Protection Card */}
              <div className="border-t border-[#E2E8F0] pt-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#2563EB]" />
                    <h4 className="text-[14px] font-bold text-[#0F172A]">
                      Anti-Bot Shield & Zero-Latency Redirection Protection
                    </h4>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                    <Zap className="w-3 h-3 text-[#059669]" /> Execution Speed: &lt; 0.1ms
                  </span>
                </div>

                <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-4">
                  {/* Master Bot Filter Toggle */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-bold text-[#0F172A] mb-1">
                        Bot Filtering Engine
                      </label>
                      <select
                        value={botFilter}
                        onChange={(e) => setBotFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-[#CBD5E1] bg-white rounded-lg text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                      >
                        <option value="true">Enabled (Shield Active)</option>
                        <option value="false">Disabled (Allow All Requests)</option>
                      </select>
                      <span className="block text-[11px] text-[#64748B] mt-1">
                        Intercepts automated scrapers, headless browsers, and datacenter traffic.
                      </span>
                    </div>

                    <div>
                      <label className="block text-[12px] font-bold text-[#0F172A] mb-1">
                        Protection Sensitivity Level
                      </label>
                      <select
                        value={botProtectionLevel}
                        onChange={(e) => setBotProtectionLevel(e.target.value)}
                        className="w-full px-3 py-2 border border-[#CBD5E1] bg-white rounded-lg text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                      >
                        <option value="STRICT">Strict Mode (Recommended: Full Zero-Delay Inspection)</option>
                        <option value="STANDARD">Standard Mode (Known Bot Signatures Only)</option>
                      </select>
                      <span className="block text-[11px] text-[#64748B] mt-1">
                        Strict mode checks browser client hints, header integrity, and platform spoofing.
                      </span>
                    </div>
                  </div>

                  {/* Datacenter & Headers Check */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-[#E2E8F0]">
                    <div>
                      <label className="block text-[12px] font-bold text-[#0F172A] mb-1">
                        Cloud Datacenter & Hosting IP Blocker
                      </label>
                      <select
                        value={botBlockDatacenters}
                        onChange={(e) => setBotBlockDatacenters(e.target.value)}
                        className="w-full px-3 py-2 border border-[#CBD5E1] bg-white rounded-lg text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                      >
                        <option value="true">Block Datacenter IPs (AWS, GCP, Azure, DO, Hetzner, OVH)</option>
                        <option value="false">Allow Datacenter IPs</option>
                      </select>
                      <span className="block text-[11px] text-[#64748B] mt-1">
                        Automated scrapers running on server farms are instantly terminated.
                      </span>
                    </div>

                    <div>
                      <label className="block text-[12px] font-bold text-[#0F172A] mb-1">
                        Browser Header Integrity Verification
                      </label>
                      <select
                        value={botCheckHeaders}
                        onChange={(e) => setBotCheckHeaders(e.target.value)}
                        className="w-full px-3 py-2 border border-[#CBD5E1] bg-white rounded-lg text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                      >
                        <option value="true">Enforce Real Browser Headers (Accept-Language / Sec-CH-UA)</option>
                        <option value="false">Bypass Header Inspection</option>
                      </select>
                      <span className="block text-[11px] text-[#64748B] mt-1">
                        Stops CLI tools (curl, wget, python-requests) that omit standard browser headers.
                      </span>
                    </div>
                  </div>

                  {/* Action on Bot Detection (Never Redirect) */}
                  <div className="pt-3 border-t border-[#E2E8F0]">
                    <label className="block text-[12px] font-bold text-[#0F172A] mb-1">
                      Action When Bot is Detected (Zero Redirection Guarantee)
                    </label>
                    <select
                      value={botAction}
                      onChange={(e) => setBotAction(e.target.value)}
                      className="w-full md:w-96 px-3 py-2 border border-[#CBD5E1] bg-white rounded-lg text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    >
                      <option value="403_BLOCK">Block with 403 Forbidden Shield (Never Redirect Destination)</option>
                      <option value="FALLBACK_REDIRECT">Redirect to Public Fallback URL (Keeps Client Link Safe)</option>
                      <option value="SILENT_DROP">Silent Drop (Empty 204 No Content)</option>
                    </select>
                    <span className="block text-[11px] text-[#EF4444] font-medium mt-1">
                      Ensures bots, crawlers, and scrapers are never redirected to the destination URL.
                    </span>
                  </div>

                  {/* Social Preview Status */}
                  <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg text-xs text-[#1D4ED8] flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">Social Media Card Protection Active:</strong>
                      WhatsApp, Facebook, Twitter/X, Telegram, and LinkedIn crawlers receive OpenGraph cards (title, description, image) for beautiful social previews, but are <strong>never redirected</strong> to advertiser destinations!
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#E2E8F0] pt-4">
                <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                  Internal Test IP Exclusion (Optional)
                </label>
                <input
                  type="text"
                  value={internalIp}
                  onChange={(e) => setInternalIp(e.target.value)}
                  placeholder="e.g. 182.185.12.34"
                  className="w-full max-w-sm px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
                <span className="block text-[12px] text-[#64748B] mt-1">
                  Visits originating from this IP address will be tagged as internal tests and excluded from employee statistics.
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg shadow-xs disabled:opacity-50"
              >
                {saving ? "Saving Changes..." : "Save Traffic Settings"}
              </button>
            </div>
          </form>
        )}

        {/* 2. LINK & DOMAIN SECURITY */}
        {activeTab === "links" && (
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 shadow-xs space-y-5">
              <div>
                <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                  Approved Destination Domains Allowlist
                </label>
                <textarea
                  rows={3}
                  value={allowedDomains}
                  onChange={(e) => setAllowedDomains(e.target.value)}
                  placeholder="example.com, jobs.example.com, company.com"
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] font-mono focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
                <span className="block text-[12px] text-[#64748B] mt-1">
                  Comma-separated domains. Protects against open redirect attacks and ensures employees only generate links to approved company websites.
                </span>
              </div>

              <div className="border-t border-[#E2E8F0] pt-4">
                <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                  Default Fallback Destination URL
                </label>
                <input
                  type="url"
                  value={fallbackUrl}
                  onChange={(e) => setFallbackUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full max-w-md px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
                <span className="block text-[12px] text-[#64748B] mt-1">
                  Visitors hitting paused, disabled, or non-existent links will be safely redirected here.
                </span>
              </div>

              <div className="border-t border-[#E2E8F0] pt-4">
                <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                  Short Domain Hostname
                </label>
                <input
                  type="text"
                  value={shortDomain}
                  onChange={(e) => setShortDomain(e.target.value)}
                  placeholder="go.example.com"
                  className="w-full max-w-sm px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] font-mono focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
                <span className="block text-[12px] text-[#64748B] mt-1">
                  Displayed prefix for generated tracking links.
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg shadow-xs disabled:opacity-50"
              >
                {saving ? "Saving Changes..." : "Save Link Settings"}
              </button>
            </div>
          </form>
        )}

        {/* 3. ANNOUNCEMENTS */}
        {activeTab === "announcements" && (
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 shadow-xs space-y-5">
            <div>
              <h3 className="text-[16px] font-bold text-[#0F172A] mb-1">
                Publish Employee Announcement
              </h3>
              <p className="text-[12px] text-[#64748B] mb-5">
                Displays a prominent banner across all employee dashboards
              </p>

              <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                    Announcement Headline
                  </label>
                  <input
                    type="text"
                    required
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                    placeholder="e.g. Focus on Islamabad Jobs campaign this week!"
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                    Announcement Details
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={announcementMessage}
                    onChange={(e) => setAnnouncementMessage(e.target.value)}
                    placeholder="Provide specific guidelines or incentives for team members..."
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={creatingAnnouncement}
                    className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg shadow-xs disabled:opacity-50"
                  >
                    {creatingAnnouncement ? "Publishing..." : "Publish Banner"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 4. SECURITY & GOVERNANCE */}
        {activeTab === "security" && (
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 shadow-xs space-y-4">
            <h3 className="text-[16px] font-bold text-[#0F172A] mb-2">
              Security Safeguards & Governance
            </h3>
            <div className="space-y-3 text-xs text-[#64748B] leading-relaxed">
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                <strong className="block text-[#0F172A] font-semibold mb-1">
                  Super Admin Account Protection:
                </strong>
                The system prevents accidental deletion or deactivation of the last active Super Admin account.
              </div>
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                <strong className="block text-[#0F172A] font-semibold mb-1">
                  Session & Cookie Policies:
                </strong>
                Sessions are signed with secure HTTP-only cookies (`tt_session`) with strict sameSite restrictions and 7-day expiration.
              </div>
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                <strong className="block text-[#0F172A] font-semibold mb-1">
                  Immutable Raw Audit History:
                </strong>
                All percentage adjustments, user status alterations, link transfers, and manual bonuses are permanently archived in the immutable `audit_logs` table.
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </AppShell>
  );
}
