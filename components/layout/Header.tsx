"use client";

import React from "react";
import Link from "next/link";
import { Menu, PlusCircle, Activity } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenMobileNav?: () => void;
  userRole?: string;
  actionButton?: {
    label: string;
    href: string;
    icon?: any;
  };
}

export default function Header({
  title,
  subtitle,
  onOpenMobileNav,
  userRole,
  actionButton,
}: HeaderProps) {
  const isAdmin = userRole === "SUPER_ADMIN" || userRole === "ADMIN";

  return (
    <header className="h-16 bg-[#FFFFFF] border-b border-[#E2E8F0] px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {onOpenMobileNav && (
          <button
            onClick={onOpenMobileNav}
            className="md:hidden p-2 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div>
          <h1 className="text-[18px] sm:text-[20px] font-bold text-[#0F172A] tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[12px] sm:text-[13px] text-[#64748B] hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isAdmin && (
          <Link
            href="/admin/traffic"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] hover:bg-[#F8FAFC] text-[13px] font-medium text-[#64748B] hover:text-[#0F172A] transition"
          >
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
            <Activity className="w-3.5 h-3.5" /> Live Traffic
          </Link>
        )}

        {actionButton ? (
          <Link
            href={actionButton.href}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-medium transition shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{actionButton.label}</span>
          </Link>
        ) : !isAdmin ? (
          <Link
            href="/links/create"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-medium transition shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Link</span>
          </Link>
        ) : null}
      </div>
    </header>
  );
}
