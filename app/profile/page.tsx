"use client";

import React, { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { useToast } from "@/components/ui/ToastContext";
import { User, Lock, Calendar, ShieldCheck, Loader2 } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";

export default function ProfilePage() {
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setUser(d.user);
        setLoading(false);
      });
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      showToast("Password must be at least 8 characters long.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match.", "error");
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch(`/api/employees/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Password changed successfully", "success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        showToast(data.message || "Failed to change password", "error");
      }
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setUpdating(false);
    }
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
      title="Account Profile"
      subtitle="View your account information and update password"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Details Card */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 shadow-xs">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#E2E8F0]">
            <div className="w-16 h-16 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center text-xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-[18px] font-bold text-[#0F172A]">{user.name}</h2>
              <p className="text-[13px] text-[#64748B]">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                  {user.role}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">
                  {user.status}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#64748B]">
            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
              <span className="block font-semibold text-[#0F172A] mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#2563EB]" /> Member Since
              </span>
              <span>{formatDate(user.createdAt)}</span>
            </div>

            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
              <span className="block font-semibold text-[#0F172A] mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" /> Last Login
              </span>
              <span>{user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Current session"}</span>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-[16px] font-bold text-[#0F172A]">Change Password</h3>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-3.5 py-2 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-[13px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-3.5 py-2 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-[13px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={updating}
                className="px-5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-semibold transition disabled:opacity-50"
              >
                {updating ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
