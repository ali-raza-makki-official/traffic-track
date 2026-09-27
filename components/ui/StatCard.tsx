import React from "react";
import { formatNumber, formatCompactNumber } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  icon?: React.ComponentType<{ className?: string }>;
  compact?: boolean;
  badge?: string;
  badgeColor?: "blue" | "green" | "orange" | "red";
}

export default function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  compact = false,
  badge,
  badgeColor = "blue",
}: StatCardProps) {
  const displayValue =
    typeof value === "number"
      ? compact
        ? formatCompactNumber(value)
        : formatNumber(value)
      : value;

  const badgeStyles = {
    blue: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
    green: "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]",
    orange: "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]",
    red: "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]",
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-xs transition hover:border-[#CBD5E1]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[13px] font-medium text-[#64748B]">{title}</span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B]">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <div className="text-[26px] sm:text-[28px] font-bold text-[#0F172A] tracking-tight">
          {displayValue}
        </div>
        {badge && (
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badgeStyles[badgeColor]}`}
          >
            {badge}
          </span>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-1 flex items-center gap-1.5 text-[12px] text-[#64748B]">
          {trend && (
            <span
              className={`font-semibold ${
                trend.isPositive ? "text-[#16A34A]" : "text-[#DC2626]"
              }`}
            >
              {trend.value}
            </span>
          )}
          {subtitle && <span>{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
