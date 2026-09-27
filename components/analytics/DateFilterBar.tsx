"use client";

import React, { useState } from "react";
import { Calendar, Download, Filter, X, ChevronDown } from "lucide-react";
import DateRangePickerModal, { PeriodType } from "./DateRangePickerModal";

export interface FilterState {
  period: "today" | "yesterday" | "7d" | "30d" | "90d" | "this_month" | "last_month" | "month_to_date" | "quarter_to_date" | "all" | "custom";
  from?: string;
  to?: string;
  country?: string;
  city?: string;
  source?: string;
  deviceType?: string;
  os?: string;
  employeeId?: string;
  linkId?: string;
}

interface DateFilterBarProps {
  filter: FilterState;
  onChange: (newFilter: FilterState) => void;
  onExportCsv?: () => void;
  showExport?: boolean;
  children?: React.ReactNode;
}

export default function DateFilterBar({
  filter,
  onChange,
  onExportCsv,
  showExport = true,
  children,
}: DateFilterBarProps) {
  const [showPickerModal, setShowPickerModal] = useState(false);

  const handlePickerApply = (period: PeriodType, from?: string, to?: string) => {
    onChange({
      ...filter,
      period,
      from,
      to,
    });
  };

  const activeDrilldowns = [
    filter.country && filter.country !== "all" && { key: "country", label: `Country: ${filter.country}` },
    filter.city && filter.city !== "all" && { key: "city", label: `City: ${filter.city}` },
    filter.source && filter.source !== "all" && { key: "source", label: `Source: ${filter.source}` },
    filter.deviceType && filter.deviceType !== "all" && { key: "deviceType", label: `Device: ${filter.deviceType}` },
    filter.os && filter.os !== "all" && { key: "os", label: `OS: ${filter.os}` },
  ].filter(Boolean) as { key: string; label: string }[];

  const clearDrilldown = (key: string) => {
    onChange({
      ...filter,
      [key]: undefined,
    });
  };

  // Human readable label for current filter
  const getPeriodLabel = () => {
    if (filter.period === "custom" && filter.from && filter.to) {
      const f = new Date(filter.from).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
      const t = new Date(filter.to).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
      return `${f} — ${t}`;
    }
    const map: Record<string, string> = {
      today: "Today",
      yesterday: "Yesterday",
      "7d": "Last 7 Days",
      "30d": "Last 30 Days",
      "90d": "Last 90 Days",
      this_month: "This Month",
      last_month: "Last Month",
      month_to_date: "Month to Date",
      quarter_to_date: "Quarter to Date",
      all: "All Time",
    };
    return map[filter.period] || "Select Dates";
  };

  return (
    <div className="space-y-2 mb-6">
      {/* Top Single Toolbar: Left items + Right Date Picker & Export CSV */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FFFFFF] border border-[#E2E8F0] p-3 rounded-xl shadow-xs">
        {/* Left Side: Scoping elements (Employee dropdown, Link dropdown, or filters) */}
        {children ? (
          <div className="flex flex-wrap items-center gap-3">
            {children}
          </div>
        ) : (
          <div className="text-xs font-semibold text-[#0F172A] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>
            <span>Analytics Filter</span>
          </div>
        )}

        {/* Right Side: Date Picker Module + Export CSV */}
        <div className="flex items-center gap-2.5 ml-auto">
          {/* Date Range Modal Trigger */}
          <button
            type="button"
            onClick={() => setShowPickerModal(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC] transition shadow-2xs"
          >
            <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>{getPeriodLabel()}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" />
          </button>

          {/* Export action */}
          {showExport && onExportCsv && (
            <button
              type="button"
              onClick={onExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-xs font-semibold text-[#0F172A] transition shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-[#64748B]" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Active drill-down badges */}
      {activeDrilldowns.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1 px-1">
          <span className="text-xs text-[#94A3B8] font-medium flex items-center gap-1">
            <Filter className="w-3 h-3" /> Active Filters:
          </span>
          {activeDrilldowns.map((d) => (
            <span
              key={d.key}
              className="inline-flex items-center gap-1.5 py-0.5 pl-2.5 pr-1.5 rounded-md bg-[#EFF6FF] border border-[#BFDBFE] text-xs font-medium text-[#2563EB]"
            >
              {d.label}
              <button
                type="button"
                onClick={() => clearDrilldown(d.key)}
                className="hover:bg-[#DBEAFE] p-0.5 rounded transition text-[#2563EB]"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() =>
              onChange({
                period: filter.period,
                from: filter.from,
                to: filter.to,
                employeeId: filter.employeeId,
                linkId: filter.linkId,
              })
            }
            className="text-xs text-[#64748B] hover:text-[#0F172A] hover:underline ml-1"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Date Range Modal */}
      <DateRangePickerModal
        isOpen={showPickerModal}
        onClose={() => setShowPickerModal(false)}
        initialPeriod={filter.period}
        initialFrom={filter.from}
        initialTo={filter.to}
        onApply={handlePickerApply}
      />
    </div>
  );
}
