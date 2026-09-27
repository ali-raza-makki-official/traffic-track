"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type PeriodType =
  | "custom"
  | "today"
  | "yesterday"
  | "7d"
  | "30d"
  | "90d"
  | "this_month"
  | "last_month"
  | "month_to_date"
  | "quarter_to_date"
  | "all";

interface DateRangePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPeriod?: PeriodType;
  initialFrom?: string;
  initialTo?: string;
  onApply: (period: PeriodType, from?: string, to?: string) => void;
}

const PRESETS: { id: PeriodType; label: string }[] = [
  { id: "custom", label: "Custom" },
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 90 days" },
  { id: "last_month", label: "Last month" },
  { id: "month_to_date", label: "Month to date" },
  { id: "quarter_to_date", label: "Quarter to date" },
];

function formatMMDDYYYY(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

function formatYYYYMMDD(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
}

function calculatePresetDates(preset: PeriodType): { start: Date; end: Date } {
  const now = new Date();
  let start = new Date(now);
  let end = new Date(now);

  switch (preset) {
    case "today":
      break;
    case "yesterday":
      start.setDate(now.getDate() - 1);
      end.setDate(now.getDate() - 1);
      break;
    case "7d":
      start.setDate(now.getDate() - 7);
      break;
    case "30d":
      start.setDate(now.getDate() - 30);
      break;
    case "90d":
      start.setDate(now.getDate() - 90);
      break;
    case "this_month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case "last_month":
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    case "month_to_date":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "quarter_to_date":
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      start = new Date(now.getFullYear(), qMonth, 1);
      break;
    case "custom":
    default:
      break;
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export default function DateRangePickerModal({
  isOpen,
  onClose,
  initialPeriod = "7d",
  initialFrom,
  initialTo,
  onApply,
}: DateRangePickerModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<PeriodType>(initialPeriod);
  const [startDate, setStartDate] = useState<Date>(() => {
    if (initialFrom) return new Date(initialFrom);
    return calculatePresetDates(initialPeriod).start;
  });
  const [endDate, setEndDate] = useState<Date>(() => {
    if (initialTo) return new Date(initialTo);
    return calculatePresetDates(initialPeriod).end;
  });

  // Calendar view navigation (month and year)
  const [viewDate, setViewDate] = useState<Date>(() => new Date(startDate));

  // Selection step: 0 = start picking, 1 = picked start, waiting for end
  const [pickingEnd, setPickingEnd] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedPreset(initialPeriod);
      const dates = initialFrom && initialTo
        ? { start: new Date(initialFrom), end: new Date(initialTo) }
        : calculatePresetDates(initialPeriod);
      setStartDate(dates.start);
      setEndDate(dates.end);
      setViewDate(new Date(dates.start));
      setPickingEnd(false);
    }
  }, [isOpen, initialPeriod, initialFrom, initialTo]);

  if (!isOpen) return null;

  const handlePresetClick = (preset: PeriodType) => {
    setSelectedPreset(preset);
    if (preset !== "custom") {
      const dates = calculatePresetDates(preset);
      setStartDate(dates.start);
      setEndDate(dates.end);
      setViewDate(new Date(dates.start));
      setPickingEnd(false);
    }
  };

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDayClick = (dayDate: Date) => {
    setSelectedPreset("custom");

    if (!pickingEnd) {
      setStartDate(dayDate);
      setEndDate(dayDate);
      setPickingEnd(true);
    } else {
      if (dayDate < startDate) {
        setStartDate(dayDate);
        setEndDate(dayDate);
        setPickingEnd(true);
      } else {
        setEndDate(dayDate);
        setPickingEnd(false);
      }
    }
  };

  const handleApply = () => {
    if (selectedPreset === "custom") {
      onApply(
        "custom",
        formatYYYYMMDD(startDate) + "T00:00:00.000Z",
        formatYYYYMMDD(endDate) + "T23:59:59.999Z"
      );
    } else {
      onApply(selectedPreset);
    }
    onClose();
  };

  // Build calendar matrix for viewDate's month
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarDays: { date: Date; isCurrentMonth: boolean }[] = [];

  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarDays.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push({
      date: new Date(year, month, d),
      isCurrentMonth: true,
    });
  }

  // Next month leading days (fill up to 35 or 42 cells)
  const remaining = (7 - (calendarDays.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    calendarDays.push({
      date: new Date(year, month + 1, d),
      isCurrentMonth: false,
    });
  }

  const monthNames = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
  ];

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const isInRange = (d: Date) => {
    const time = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const s = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
    const e = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime();
    return time >= s && time <= e;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-w-xl w-full animate-in fade-in zoom-in-95 duration-150">
        {/* Left Column: Preset Ranges */}
        <div className="w-full md:w-44 border-b md:border-b-0 md:border-r border-[#E2E8F0] p-3 space-y-0.5 bg-[#FFFFFF]">
          {PRESETS.map((p) => {
            const isActive = selectedPreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePresetClick(p.id)}
                className={`w-full text-left px-3.5 py-2 rounded-lg text-[13px] font-medium transition ${
                  isActive
                    ? "bg-[#EFF6FF] text-[#2563EB] font-semibold"
                    : "text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Right Column: Date Box, Month Calendar, Actions */}
        <div className="flex-1 p-5 flex flex-col justify-between bg-[#FFFFFF]">
          <div>
            {/* Top Date Header Box */}
            <div className="border border-[#E2E8F0] rounded-lg p-2.5 px-4 mb-4 flex items-center justify-between text-xs bg-[#FFFFFF]">
              <div>
                <span className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                  Start Date
                </span>
                <span className="text-[14px] font-bold text-[#0F172A]">
                  {formatMMDDYYYY(startDate)}
                </span>
              </div>

              <div className="w-6 h-[1px] bg-[#94A3B8] self-center"></div>

              <div>
                <span className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                  End Date
                </span>
                <span className="text-[14px] font-bold text-[#0F172A]">
                  {formatMMDDYYYY(endDate)}
                </span>
              </div>
            </div>

            {/* Month & Navigation Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-[13px] font-bold tracking-wider text-[#0F172A] uppercase">
                {monthNames[month]} {year}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="w-7 h-7 rounded border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="w-7 h-7 rounded border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {["S", "M", "T", "W", "T", "F", "S"].map((dw, idx) => (
                <div key={idx} className="text-[11px] font-semibold text-[#94A3B8] py-1">
                  {dw}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-y-1 text-center">
              {calendarDays.map((cd, idx) => {
                const isStart = isSameDay(cd.date, startDate);
                const isEnd = isSameDay(cd.date, endDate);
                const inRange = isInRange(cd.date);
                const isSelectedCircle = isStart || isEnd;

                return (
                  <div
                    key={idx}
                    onClick={() => handleDayClick(cd.date)}
                    className={`h-8 flex items-center justify-center cursor-pointer transition relative text-[12px] font-medium ${
                      !cd.isCurrentMonth ? "text-[#CBD5E1]" : "text-[#1E293B]"
                    } ${
                      inRange && !isSelectedCircle
                        ? "bg-[#EFF6FF] text-[#2563EB]"
                        : ""
                    } ${
                      isStart && !isEnd ? "rounded-l-full bg-[#EFF6FF]" : ""
                    } ${
                      isEnd && !isStart ? "rounded-r-full bg-[#EFF6FF]" : ""
                    }`}
                  >
                    <span
                      className={`w-7 h-7 flex items-center justify-center rounded-full transition ${
                        isSelectedCircle
                          ? "bg-[#2563EB] text-white font-bold shadow-xs"
                          : "hover:bg-[#F1F5F9]"
                      }`}
                    >
                      {cd.date.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Actions Bar */}
          <div className="pt-4 mt-4 border-t border-[#E2E8F0] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-xs font-semibold text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs transition"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
