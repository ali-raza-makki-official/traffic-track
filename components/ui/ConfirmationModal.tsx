"use client";

import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = false,
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl max-w-md w-full p-6 shadow-xl relative animate-in zoom-in-95">
        <button
          onClick={onCancel}
          disabled={loading}
          className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-md transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5 mb-4">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isDestructive
                ? "bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626]"
                : "bg-[#FFFBEB] border border-[#FDE68A] text-[#D97706]"
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-[17px] font-bold text-[#0F172A]">{title}</h3>
            <p className="text-[13px] text-[#64748B] mt-1 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-6 pt-3 border-t border-[#E2E8F0]">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[13px] font-medium text-[#64748B] hover:text-[#0F172A] transition disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium text-white transition disabled:opacity-50 ${
              isDestructive
                ? "bg-[#DC2626] hover:bg-[#B91C1C]"
                : "bg-[#2563EB] hover:bg-[#1D4ED8]"
            }`}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
