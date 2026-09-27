"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container top-right */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between px-4 py-3 rounded-lg border shadow-sm transition-all duration-200 animate-in slide-in-from-top-2 ${
              toast.type === "success"
                ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#16A34A]"
                : toast.type === "error"
                ? "bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]"
                : "bg-[#EFF6FF] border-[#BFDBFE] text-[#2563EB]"
            }`}
          >
            <div className="flex items-center gap-2.5 text-sm font-medium">
              {toast.type === "success" && <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16A34A]" />}
              {toast.type === "error" && <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />}
              {toast.type === "info" && <Info className="w-4 h-4 shrink-0 text-[#2563EB]" />}
              <span className="text-[#0F172A]">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-3 text-[#94A3B8] hover:text-[#0F172A] p-0.5 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
