import React from "react";

export function Skeleton({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={style}
      className={`animate-shimmer rounded-md ${className}`}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
      <div className="flex justify-between items-center mb-3">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-7 w-7 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-28 mb-2" />
      <Skeleton className="h-3 w-36" />
    </div>
  );
}

export function TableSkeleton({
  rows = 5,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
      {/* Header bar placeholder */}
      <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>

      {/* Table rows shimmer */}
      <div className="p-4 space-y-3.5">
        <div className="flex gap-4 pb-2 border-b border-[#F1F5F9]">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 py-2 border-b border-[#F8FAFC]">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton
                key={c}
                className={`h-4 flex-1 ${c === 0 ? "w-1/3" : ""}`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Pagination bar placeholder */}
      <div className="p-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between">
        <Skeleton className="h-3 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-7 w-16 rounded-md" />
          <Skeleton className="h-7 w-16 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function ChartSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
      <div className="flex justify-between items-center mb-4">
        <div>
          <Skeleton className="h-4 w-40 mb-1.5" />
          <Skeleton className="h-3 w-56" />
        </div>
        <Skeleton className="h-4 w-20" />
      </div>
      <div className={`${height} w-full flex items-end gap-2 pt-6 px-2`}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 flex flex-col justify-end items-center h-full"
          >
            <Skeleton
              className="w-full rounded-t-sm"
              style={{ height: `${20 + ((i * 17) % 75)}%` } as React.CSSProperties}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
