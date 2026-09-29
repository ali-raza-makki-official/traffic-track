import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toString();
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

export function formatProgressPercent(current: number, target: number): {
  percent: number;
  display: string;
  barWidth: number;
} {
  if (!target || target <= 0 || !current || current <= 0) {
    return { percent: 0, display: "0%", barWidth: 0 };
  }
  const raw = (current / target) * 100;
  let display: string;
  if (raw < 0.1) {
    display = `${raw.toFixed(2)}%`;
  } else if (raw < 10) {
    display = `${raw.toFixed(1)}%`;
  } else {
    display = `${Math.min(100, Math.round(raw))}%`;
  }
  // Ensure that if current > 0, the bar is visibly started (at least 2.5% visual width)
  const barWidth = Math.max(2.5, Math.min(100, Number(raw.toFixed(2))));
  return { percent: raw, display, barWidth };
}
