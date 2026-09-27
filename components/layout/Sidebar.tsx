"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Link as LinkIcon,
  PlusCircle,
  BarChart3,
  Target,
  Share2,
  Users,
  Activity,
  Settings,
  ShieldCheck,
  User,
  LogOut,
  X,
} from "lucide-react";
import { useToast } from "@/components/ui/ToastContext";
import CreatedByBadge from "@/components/ui/CreatedByBadge";

interface SidebarProps {
  userRole?: string;
  userName?: string;
  userEmail?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: any;
  highlight?: boolean;
}

export default function Sidebar({
  userRole = "EMPLOYEE",
  userName = "User",
  userEmail = "",
  isOpen = false,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();

  const isAdmin = userRole === "SUPER_ADMIN" || userRole === "ADMIN";

  const employeeLinks: NavItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "My Links", href: "/links", icon: LinkIcon },
    { label: "Create Link", href: "/links/create", icon: PlusCircle, highlight: true },
    { label: "Analytics", href: "/analytics", icon: BarChart3 },
    { label: "Profile", href: "/profile", icon: User },
  ];

  const adminLinks: NavItem[] = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Employees", href: "/admin/employees", icon: Users },
    { label: "All Links", href: "/admin/links", icon: LinkIcon },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { label: "Traffic Explorer", href: "/admin/traffic", icon: Activity },
    { label: "Settings", href: "/admin/settings", icon: Settings },
    { label: "Audit Logs", href: "/admin/audit", icon: ShieldCheck },
  ];

  const links = isAdmin ? adminLinks : employeeLinks;

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      showToast("Signed out successfully", "info");
      router.push("/");
      router.refresh();
    } catch {
      router.push("/");
    }
  };

  const navContent = (
    <div className="flex flex-col h-full bg-[#FFFFFF] border-r border-[#E2E8F0]">
      {/* Brand header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white font-bold text-sm shadow-xs">
            TT
          </div>
          <div>
            <span className="font-bold text-[#0F172A] text-[16px] tracking-tight">
              TrafficTrack
            </span>
            <span className="block text-[11px] text-[#64748B] font-medium leading-none">
              {isAdmin ? "Admin Console" : "Team Workspace"}
            </span>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden text-[#94A3B8] hover:text-[#0F172A] p-1"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href === "/links"
              ? pathname.startsWith("/links/") && pathname !== "/links/create"
              : item.href === "/admin" || item.href === "/dashboard"
              ? false
              : pathname.startsWith(item.href + "/"));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors ${
                isActive
                  ? "bg-[#EFF6FF] text-[#2563EB]"
                  : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? "text-[#2563EB]" : "text-[#64748B]"
                }`}
              />
              <span className="truncate">{item.label}</span>
              {item.highlight && !isActive && (
                <span className="ml-auto text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB]">
                  New
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User profile & Logout at bottom */}
      <div className="p-3 border-t border-[#E2E8F0] bg-[#FFFFFF]">
        <div className="flex items-center gap-3 px-2 py-2 mb-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
          <div className="w-8 h-8 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center font-bold text-xs shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold text-[#0F172A] truncate leading-tight">
              {userName}
            </div>
            <div className="text-[11px] text-[#64748B] truncate leading-tight">
              {userEmail}
            </div>
          </div>
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase shrink-0 ${
              isAdmin
                ? "bg-[#EFF6FF] text-[#2563EB]"
                : "bg-[#F0FDF4] text-[#16A34A]"
            }`}
          >
            {userRole === "SUPER_ADMIN" ? "Super" : userRole === "ADMIN" ? "Admin" : "Team"}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>

        <CreatedByBadge variant="sidebar" />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[240px] shrink-0 fixed inset-y-0 left-0 z-30">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <div className="relative flex-1 flex flex-col max-w-[260px] w-full bg-white z-10 shadow-xl">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
