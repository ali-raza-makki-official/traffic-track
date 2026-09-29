"use client";

import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface AppShellProps {
  children: React.ReactNode;
  user: {
    name: string;
    email: string;
    role: string;
  };
  title: string;
  subtitle?: string;
  actionButton?: {
    label: string;
    href: string;
    icon?: any;
  };
}

export default function AppShell({
  children,
  user,
  title,
  subtitle,
  actionButton,
}: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      <Sidebar
        userName={user.name}
        userEmail={user.email}
        userRole={user.role}
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 md:pl-[240px]">
        <Header
          title={title}
          subtitle={subtitle}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          userRole={user.role}
          actionButton={actionButton}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>

        <footer className="border-t border-[#E2E8F0] bg-white py-3.5 px-6 text-xs text-[#64748B] flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span>© 2026 TrafficTrack Platform</span>
            <span>•</span>
            <span className="text-[#94A3B8]">High Precision Tracking System</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
