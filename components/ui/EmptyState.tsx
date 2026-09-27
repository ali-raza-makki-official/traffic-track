import React from "react";
import Link from "next/link";
import { FolderX, PlusCircle } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onActionClick?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
}

export default function EmptyState({
  title,
  description,
  actionText,
  actionHref,
  onActionClick,
  icon: Icon = FolderX,
}: EmptyStateProps) {
  return (
    <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-8 sm:p-12 text-center max-w-md mx-auto my-6">
      <div className="w-12 h-12 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#94A3B8] flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-[16px] font-bold text-[#0F172A]">{title}</h3>
      <p className="text-[13px] text-[#64748B] mt-1.5 mb-5 max-w-xs mx-auto leading-relaxed">
        {description}
      </p>

      {actionText && actionHref && (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-medium transition shadow-xs"
        >
          <PlusCircle className="w-4 h-4" />
          {actionText}
        </Link>
      )}

      {actionText && onActionClick && !actionHref && (
        <button
          onClick={onActionClick}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-medium transition shadow-xs"
        >
          <PlusCircle className="w-4 h-4" />
          {actionText}
        </button>
      )}
    </div>
  );
}
