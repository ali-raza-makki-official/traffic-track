"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail, ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/ui/ToastContext";

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Account not found");
        return;
      }

      setEmployeeName(data.name || "");
      setStep(2);
    } catch (err: any) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Invalid credentials");
        return;
      }

      showToast("Signed in successfully", "success");
      router.push(data.redirectUrl || "/dashboard");
      router.refresh();
    } catch (err: any) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#F8FAFC]">
      <div className="w-full max-w-[420px]">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] mb-3 shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-[26px] font-bold text-[#0F172A] tracking-tight">TrafficTrack</h1>
          <p className="text-[14px] text-[#64748B] mt-1">Team Traffic Tracking & Attribution</p>
        </div>

        {/* Card */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-7 shadow-sm">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-sm flex items-center justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError("")}
                className="text-xs font-semibold ml-2 underline hover:no-underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {step === 1 ? (
            <div>
              <div className="mb-6">
                <h2 className="text-[20px] font-semibold text-[#0F172A]">Welcome back</h2>
                <p className="text-[14px] text-[#64748B] mt-1">
                  Sign in to access your tracking links and analytics
                </p>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-[14px] font-medium text-[#0F172A] mb-1.5"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full pl-9 pr-3 py-2.5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-[14px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 flex items-center justify-center gap-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-[14px] transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Continue <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError("");
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8] mb-3 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Use another email
                </button>

                <h2 className="text-[20px] font-semibold text-[#0F172A]">Enter Password</h2>
                <p className="text-[13px] text-[#64748B] mt-1">
                  Signing in as <strong className="text-[#0F172A]">{email}</strong>
                  {employeeName ? ` (${employeeName})` : ""}
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="password"
                    className="block text-[14px] font-medium text-[#0F172A] mb-1.5"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      required
                      autoFocus
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2.5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-[14px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 flex items-center justify-center gap-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-[14px] transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Clean Production Footer */}
        <div className="mt-8 text-center text-xs text-[#94A3B8] flex flex-col items-center gap-2">
          <p>© 2026 TrafficTrack. All rights reserved.</p>
          <p className="text-[11px]">Authorized personnel only. Sessions are encrypted and monitored.</p>
        </div>
      </div>
    </div>
  );
}
