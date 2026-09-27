"use client";

import React from "react";
import { Globe, Image as ImageIcon } from "lucide-react";

interface LiveSocialPreviewCardProps {
  title?: string;
  description?: string;
  image?: string;
  destinationUrl?: string;
}

export default function LiveSocialPreviewCard({
  title = "Your Campaign Title Goes Here",
  description = "A compelling description that encourages clicks will appear here once configured.",
  image = "",
  destinationUrl = "example.com",
}: LiveSocialPreviewCardProps) {
  let domain = "example.com";
  try {
    if (destinationUrl) {
      domain = new URL(
        destinationUrl.startsWith("http") ? destinationUrl : `https://${destinationUrl}`
      ).hostname;
    }
  } catch {
    domain = "example.com";
  }

  return (
    <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs max-w-md w-full">
      {/* Social card image */}
      <div className="w-full aspect-[1.91/1] bg-[#F1F5F9] relative flex items-center justify-center overflow-hidden border-b border-[#E2E8F0]">
        {image ? (
          <img
            src={image}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-[#94A3B8]">
            <ImageIcon className="w-8 h-8 stroke-1" />
            <span className="text-[11px] font-medium">Recommended: 1200 × 630 px</span>
          </div>
        )}
      </div>

      {/* Social card text details */}
      <div className="p-3.5 bg-[#F8FAFC]">
        <div className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-semibold text-[#64748B] mb-1">
          <Globe className="w-3 h-3 text-[#94A3B8]" />
          <span>{domain}</span>
        </div>

        <h4 className="text-[14px] font-bold text-[#0F172A] line-clamp-1 leading-snug">
          {title || "Untitled Link Preview"}
        </h4>

        <p className="text-[12px] text-[#64748B] line-clamp-2 mt-1 leading-relaxed">
          {description || "No description provided."}
        </p>
      </div>
    </div>
  );
}
