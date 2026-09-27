"use client";

import React from "react";
import { CheckSquare, Copy, Play, Pause, Trash2, X, Download, ShieldAlert } from "lucide-react";

export interface BulkAction {
  label: string;
  icon?: any;
  variant?: "default" | "success" | "warning" | "danger";
  onClick: () => void | Promise<void>;
  loading?: boolean;
}

interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  onSelectAll?: () => void;
  actions: BulkAction[];
  className?: string;
}

export default function BulkActionBar({
  selectedCount,
  totalCount,
  onClearSelection,
  onSelectAll,
  actions,
  className = "",
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-[92%] sm:w-auto bg-[#0F172A] text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/60 backdrop-blur-md flex flex-wrap items-center justify-between sm:justify-start gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200 ${className}`}
    >
      {/* Selection counter badge */}
      <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
        <span className="flex items-center justify-center w-5 h-5 rounded-md bg-[#2563EB] text-white text-[11px] font-bold">
          {selectedCount}
        </span>
        <span className="text-xs font-semibold tracking-wide">
          Selected
        </span>

        {onSelectAll && selectedCount < totalCount && (
          <button
            type="button"
            onClick={onSelectAll}
            className="text-[11px] text-[#93C5FD] hover:underline ml-1 font-medium"
          >
            (Select all {totalCount})
          </button>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-1.5">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          let btnStyle = "bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700";
          if (action.variant === "success") {
            btnStyle = "bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border-emerald-700/60";
          } else if (action.variant === "warning") {
            btnStyle = "bg-amber-900/60 hover:bg-amber-800 text-amber-200 border-amber-700/60";
          } else if (action.variant === "danger") {
            btnStyle = "bg-red-900/60 hover:bg-red-800 text-red-200 border-red-700/60";
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={action.onClick}
              disabled={action.loading}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition disabled:opacity-50 ${btnStyle}`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dismiss / Clear button */}
      <button
        type="button"
        onClick={onClearSelection}
        title="Deselect all"
        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition ml-auto"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
