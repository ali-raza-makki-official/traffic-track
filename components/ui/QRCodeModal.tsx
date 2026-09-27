"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, Copy, X, Check } from "lucide-react";
import { useToast } from "@/components/ui/ToastContext";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortUrl: string;
  shortCode: string;
}

export default function QRCodeModal({
  isOpen,
  onClose,
  shortUrl,
  shortCode,
}: QRCodeModalProps) {
  const [dataUrl, setDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen && shortUrl) {
      QRCode.toDataURL(shortUrl, { width: 300, margin: 2 }, (err, url) => {
        if (!err && url) {
          setDataUrl(url);
        }
      });
    }
  }, [isOpen, shortUrl]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      showToast("Link copied to clipboard", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Could not copy link", "error");
    }
  };

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `qrcode-${shortCode}.png`;
    a.click();
    showToast("QR Code downloaded", "success");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl max-w-sm w-full p-6 shadow-xl relative animate-in zoom-in-95 text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-md transition"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-[17px] font-bold text-[#0F172A] mb-1">
          Tracking Link QR Code
        </h3>
        <p className="text-[12px] text-[#64748B] mb-5">
          Scan to test or download for marketing material
        </p>

        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 inline-block mb-4">
          {dataUrl ? (
            <img
              src={dataUrl}
              alt="QR Code"
              className="w-48 h-48 mx-auto rounded-lg shadow-2xs"
            />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-xs text-[#94A3B8]">
              Generating QR...
            </div>
          )}
        </div>

        <div className="text-[12px] font-mono text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] py-1.5 px-3 rounded-lg truncate mb-5">
          {shortUrl}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[13px] font-medium text-[#0F172A] transition shadow-xs"
          >
            {copied ? <Check className="w-4 h-4 text-[#16A34A]" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "Copied" : "Copy Link"}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-medium transition shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
        </div>
      </div>
    </div>
  );
}
