"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  UploadCloud,
  Search,
  Check,
  Image as ImageIcon,
  Loader2,
  Calendar,
  User,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/ToastContext";

interface MediaImageItem {
  id: string;
  url: string;
  filename: string;
  originalName?: string | null;
  mimeType?: string | null;
  size?: number | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface ImageLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
  currentSelectedUrl?: string;
}

export default function ImageLibraryModal({
  isOpen,
  onClose,
  onSelect,
  currentSelectedUrl,
}: ImageLibraryModalProps) {
  const { showToast } = useToast();
  const [images, setImages] = useState<MediaImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState<string>(currentSelectedUrl || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchImages = async (searchQuery = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/media?search=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) {
        setImages(data.images);
      }
    } catch {
      showToast("Failed to load image library", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedUrl(currentSelectedUrl || "");
      fetchImages(search);
    }
  }, [isOpen]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    fetchImages(val);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast("File size exceeds 5MB limit", "error");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/media", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.image) {
        showToast("Image uploaded and added to shared library!", "success");
        setImages((prev) => [data.image, ...prev]);
        setSelectedUrl(data.image.url);
      } else {
        showToast(data.message || "Upload failed", "error");
      }
    } catch {
      showToast("Network error uploading image", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleConfirmSelect = () => {
    if (!selectedUrl) return;
    onSelect(selectedUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl w-full max-w-4xl shadow-xl flex flex-col max-h-[88vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h3 className="text-[17px] font-bold text-[#0F172A] flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#2563EB]" /> Shared Image Library
            </h3>
            <p className="text-[12px] text-[#64748B] mt-0.5">
              Select any image uploaded by team members or upload a new one for your link preview
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC] flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by filename or uploader name..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-[13px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileUpload}
              className="hidden"
              id="library-upload-input"
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs transition disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UploadCloud className="w-4 h-4" />
              )}
              <span>{uploading ? "Uploading..." : "Upload New Image"}</span>
            </button>
          </div>
        </div>

        {/* Images Grid */}
        <div className="flex-1 p-6 overflow-y-auto">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-[#94A3B8] gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" />
              <span className="text-xs">Loading shared library...</span>
            </div>
          ) : images.length === 0 ? (
            <div className="h-64 border-2 border-dashed border-[#E2E8F0] rounded-xl flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mb-3">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h4 className="text-[14px] font-bold text-[#0F172A]">No images found</h4>
              <p className="text-[12px] text-[#64748B] max-w-sm mt-1 mb-4">
                {search
                  ? "No images match your search query."
                  : "No images have been uploaded to the shared library yet. Be the first to upload one!"}
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] transition"
              >
                <UploadCloud className="w-4 h-4" /> Upload First Image
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((img) => {
                const isSelected = selectedUrl === img.url;
                return (
                  <div
                    key={img.id}
                    onClick={() => setSelectedUrl(img.url)}
                    className={`group relative rounded-xl border-2 overflow-hidden cursor-pointer transition flex flex-col bg-white ${
                      isSelected
                        ? "border-[#2563EB] ring-2 ring-[#2563EB]/20 shadow-md"
                        : "border-[#E2E8F0] hover:border-[#94A3B8]"
                    }`}
                  >
                    {/* Image Preview */}
                    <div className="w-full aspect-[16/10] bg-[#F1F5F9] relative overflow-hidden flex items-center justify-center">
                      <img
                        src={img.url}
                        alt={img.originalName || "Library image"}
                        className="w-full h-full object-cover transition group-hover:scale-105 duration-200"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />

                      {/* Selected check badge */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="p-2.5 flex-1 flex flex-col justify-between text-left bg-white">
                      <div className="truncate text-[12px] font-semibold text-[#0F172A]" title={img.originalName || img.filename}>
                        {img.originalName || img.filename}
                      </div>

                      <div className="mt-1 flex items-center justify-between text-[11px] text-[#64748B]">
                        <span className="flex items-center gap-1 truncate max-w-[100px]" title={img.user.name}>
                          <User className="w-3 h-3 text-[#94A3B8]" />
                          <span className="truncate">{img.user.name}</span>
                        </span>
                        <span className="text-[10px] text-[#94A3B8]">
                          {formatDate(img.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
          <div className="text-xs text-[#64748B]">
            {selectedUrl ? (
              <span className="text-[#0F172A] font-medium">1 image selected</span>
            ) : (
              "Click any image to select"
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#E2E8F0] bg-white text-xs font-semibold text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedUrl}
              onClick={handleConfirmSelect}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs transition disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>Use Selected Image</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
