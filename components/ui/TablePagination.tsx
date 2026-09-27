"use client";

import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface TablePaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export default function TablePagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  className = "",
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, currentPage * pageSize);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#FFFFFF] border-t border-[#E2E8F0] text-xs text-[#64748B] ${className}`}
    >
      {/* Left: Summary & Rows Per Page */}
      <div className="flex flex-wrap items-center gap-4">
        <div>
          Showing <span className="font-semibold text-[#0F172A]">{startItem}</span> to{" "}
          <span className="font-semibold text-[#0F172A]">{endItem}</span> of{" "}
          <span className="font-semibold text-[#0F172A]">{totalItems}</span> entries
        </div>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <label htmlFor="pageSizeSelect" className="text-[#94A3B8]">
              Rows per page:
            </label>
            <select
              id="pageSizeSelect"
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1); // Reset to page 1 on page size change
              }}
              className="px-2 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-xs font-semibold text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Navigation Controls */}
      <div className="flex items-center gap-1">
        {/* First page */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          title="First page"
          className="p-1.5 rounded border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] disabled:opacity-40 disabled:hover:bg-white text-[#64748B] hover:text-[#0F172A] transition"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        {/* Previous page */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          title="Previous page"
          className="p-1.5 rounded border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] disabled:opacity-40 disabled:hover:bg-white text-[#64748B] hover:text-[#0F172A] transition"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Page numbers */}
        <div className="hidden sm:flex items-center gap-1 mx-1">
          {getPageNumbers().map((p, idx) => {
            if (p === "...") {
              return (
                <span key={`ellipsis-${idx}`} className="px-1 text-[#94A3B8]">
                  ...
                </span>
              );
            }
            const isCurrent = p === currentPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p as number)}
                className={`min-w-[28px] h-7 px-1.5 rounded text-xs font-semibold transition ${
                  isCurrent
                    ? "bg-[#2563EB] text-white shadow-2xs"
                    : "border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC]"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next page */}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          title="Next page"
          className="p-1.5 rounded border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] disabled:opacity-40 disabled:hover:bg-white text-[#64748B] hover:text-[#0F172A] transition"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Last page */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          title="Last page"
          className="p-1.5 rounded border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] disabled:opacity-40 disabled:hover:bg-white text-[#64748B] hover:text-[#0F172A] transition"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
