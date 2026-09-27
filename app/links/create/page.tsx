"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import LiveSocialPreviewCard from "@/components/links/LiveSocialPreviewCard";
import QRCodeModal from "@/components/ui/QRCodeModal";
import ImageLibraryModal from "@/components/media/ImageLibraryModal";
import { useToast } from "@/components/ui/ToastContext";
import {
  Link as LinkIcon,
  CheckCircle2,
  Copy,
  QrCode,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  UploadCloud,
  FolderOpen,
  Trash2,
} from "lucide-react";

export default function CreateLinkPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [user, setUser] = useState<any>(null);

  // Form State
  const [destinationUrl, setDestinationUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [tags, setTags] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  // Social Preview State
  const [showSocialSettings, setShowSocialSettings] = useState(false);
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewDescription, setPreviewDescription] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const directUploadRef = React.useRef<HTMLInputElement>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState("");
  const [createdLink, setCreatedLink] = useState<any>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const handleDirectImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image size exceeds 5MB limit", "error");
      return;
    }
    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/media", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.image) {
        setPreviewImage(data.image.url);
        showToast("Image uploaded and saved to shared library!", "success");
      } else {
        showToast(data.message || "Upload failed", "error");
      }
    } catch {
      showToast("Error uploading image", "error");
    } finally {
      setUploadingImage(false);
      if (directUploadRef.current) directUploadRef.current.value = "";
    }
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setUser(data.user);
      })
      .catch((err) => console.error("Init error", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setDuplicateWarning("");

    if (!destinationUrl.trim()) {
      setError("Please provide a valid destination URL.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinationUrl: destinationUrl.trim(),
          customAlias: customAlias.trim() || undefined,
          tags: tags.trim() || undefined,
          internalNotes: internalNotes.trim() || undefined,
          previewTitle: previewTitle.trim() || undefined,
          previewDescription: previewDescription.trim() || undefined,
          previewImage: previewImage.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Failed to create tracking link.");
        return;
      }

      setCreatedLink(data.link);
      if (data.duplicateWarning) {
        setDuplicateWarning(data.duplicateWarning);
      }
      showToast("Tracking link created successfully!", "success");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!createdLink) return;
    const url = `${window.location.origin}/${createdLink.shortCode}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Tracking link copied to clipboard", "success");
    } catch {
      showToast("Could not copy link", "error");
    }
  };

  const resetForm = () => {
    setCreatedLink(null);
    setDestinationUrl("");
    setCustomAlias("");
    setTags("");
    setInternalNotes("");
    setPreviewTitle("");
    setPreviewDescription("");
    setPreviewImage("");
    setError("");
    setDuplicateWarning("");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" />
      </div>
    );
  }

  const liveShortUrl = createdLink
    ? `${typeof window !== "undefined" ? window.location.origin : "https://jii.life"}/${createdLink.shortCode}`
    : "";

  return (
    <AppShell
      user={user}
      title="Create Tracking Link"
      subtitle="Generate a smart attributed tracking link with custom preview"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Success State Screen */}
        {createdLink ? (
          <div className="bg-[#FFFFFF] border border-[#BBF7D0] rounded-xl p-8 text-center shadow-xs animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <h2 className="text-[22px] font-bold text-[#0F172A]">
              Tracking Link Created!
            </h2>
            <p className="text-[13px] text-[#64748B] mt-1 max-w-md mx-auto">
              Your unique link is ready. Share it on Facebook or your promotional channels.
            </p>

            {duplicateWarning && (
              <div className="mt-4 p-3 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-[#D97706] text-xs max-w-lg mx-auto text-left flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{duplicateWarning}</span>
              </div>
            )}

            <div className="mt-6 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] max-w-lg mx-auto flex items-center justify-between gap-3">
              <span className="font-mono text-[15px] font-bold text-[#2563EB] truncate">
                {typeof window !== "undefined"
                  ? `${window.location.host}/${createdLink.shortCode}`
                  : `jii.life/${createdLink.shortCode}`}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition shrink-0 shadow-xs"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Link
              </button>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setQrModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[13px] font-medium text-[#0F172A] transition"
              >
                <QrCode className="w-4 h-4 text-[#64748B]" /> View QR Code
              </button>

              <Link
                href={`/links/${createdLink.id}/analytics`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[13px] font-medium text-[#0F172A] transition"
              >
                <ExternalLink className="w-4 h-4 text-[#64748B]" /> View Analytics
              </Link>

              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#E2E8F0] text-[#2563EB] text-[13px] font-medium transition"
              >
                Create Another Link
              </button>
            </div>

            <QRCodeModal
              isOpen={qrModalOpen}
              onClose={() => setQrModalOpen(false)}
              shortUrl={liveShortUrl}
              shortCode={createdLink.shortCode}
            />
          </div>
        ) : (
          /* Create Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </span>
                <button
                  type="button"
                  onClick={() => setError("")}
                  className="text-xs font-semibold underline hover:no-underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Core Link Details Card */}
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 shadow-xs space-y-5">
              <h3 className="text-[16px] font-bold text-[#0F172A]">
                1. Destination & Tracking Details
              </h3>

              <div>
                <label className="block text-[13px] font-semibold text-[#0F172A] mb-1.5">
                  Destination Website URL <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={destinationUrl}
                  onChange={(e) => setDestinationUrl(e.target.value)}
                  placeholder="https://example.com/jobs/software-engineer-lahore"
                  className="w-full px-3.5 py-2.5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-[14px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
                <span className="block text-[12px] text-[#64748B] mt-1">
                  The actual page where visitors will land after click registration.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[#0F172A] mb-1.5">
                    Custom Alias (Optional)
                  </label>
                  <div className="flex rounded-lg border border-[#E2E8F0] overflow-hidden focus-within:ring-2 focus-within:ring-[#2563EB]">
                    <span className="bg-[#F8FAFC] px-3 py-2 text-[13px] text-[#64748B] font-mono border-r border-[#E2E8F0] select-none flex items-center">
                      {typeof window !== "undefined" ? window.location.host : "jii.life"}/
                    </span>
                    <input
                      type="text"
                      value={customAlias}
                      onChange={(e) =>
                        setCustomAlias(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))
                      }
                      placeholder="my-custom-code"
                      className="w-full px-3 py-2 text-[14px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none font-mono"
                    />
                  </div>
                  <span className="block text-[12px] text-[#64748B] mt-1">
                    Leave blank to automatically generate a unique 6-character code.
                  </span>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#0F172A] mb-1.5">
                    Tags (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Jobs, Lahore, IT"
                    className="w-full px-3.5 py-2.5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-[14px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                  <span className="block text-[12px] text-[#64748B] mt-1">
                    Optional labels to organize and filter your links.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#0F172A] mb-1.5">
                  Internal Notes (Hidden from visitors)
                </label>
                <input
                  type="text"
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="e.g. Shared on Facebook Groups at 2 PM"
                  className="w-full px-3.5 py-2.5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-[14px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
            </div>

            {/* Social Share / Facebook Open Graph Preview Card */}
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 shadow-xs space-y-5">
              <div
                className="flex items-center justify-between cursor-pointer select-none"
                onClick={() => setShowSocialSettings(!showSocialSettings)}
              >
                <div>
                  <h3 className="text-[16px] font-bold text-[#0F172A] flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#2563EB]" /> 2. Social Media Preview (Facebook / WhatsApp)
                  </h3>
                  <p className="text-[12px] text-[#64748B] mt-0.5">
                    Customize the card title, description, and image displayed when shared on social networks
                  </p>
                </div>
                <button
                  type="button"
                  className="p-1 rounded text-[#64748B] hover:text-[#0F172A]"
                >
                  {showSocialSettings ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
              </div>

              {showSocialSettings && (
                <div className="pt-4 border-t border-[#E2E8F0] space-y-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#0F172A] mb-1.5">
                      Social Card Title
                    </label>
                    <input
                      type="text"
                      value={previewTitle}
                      onChange={(e) => setPreviewTitle(e.target.value)}
                      placeholder="Latest Software Engineer Jobs in Lahore 2026"
                      className="w-full px-3.5 py-2.5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-[14px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[#0F172A] mb-1.5">
                      Social Card Description
                    </label>
                    <textarea
                      rows={2}
                      value={previewDescription}
                      onChange={(e) => setPreviewDescription(e.target.value)}
                      placeholder="Multiple vacancies for senior and junior full-stack developers. Apply online before deadline."
                      className="w-full px-3.5 py-2.5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-[14px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB] resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[#0F172A] mb-1.5">
                      Social Preview Image
                    </label>

                    {previewImage ? (
                      <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <img
                            src={previewImage}
                            alt="Selected preview"
                            className="w-16 h-12 rounded-lg object-cover border border-[#E2E8F0] shrink-0"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-semibold text-[#0F172A] block truncate">
                              {previewImage.startsWith("/uploads/") ? previewImage.replace("/uploads/", "") : previewImage}
                            </span>
                            <span className="text-[11px] text-[#16A34A] font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Image selected for preview
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setLibraryOpen(true)}
                            className="px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F1F5F9] text-xs font-medium text-[#0F172A] transition shadow-2xs"
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewImage("")}
                            className="p-1.5 rounded-lg border border-[#FECACA] bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] transition"
                            title="Remove image"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            ref={directUploadRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            onChange={handleDirectImageUpload}
                            className="hidden"
                          />

                          <button
                            type="button"
                            disabled={uploadingImage}
                            onClick={() => directUploadRef.current?.click()}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs transition disabled:opacity-50"
                          >
                            {uploadingImage ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <UploadCloud className="w-4 h-4" />
                            )}
                            <span>{uploadingImage ? "Uploading..." : "Upload Image"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setLibraryOpen(true)}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#0F172A] text-xs font-semibold shadow-xs transition"
                          >
                            <FolderOpen className="w-4 h-4 text-[#2563EB]" />
                            <span>Choose from Shared Library</span>
                          </button>
                        </div>

                        <div className="relative">
                          <input
                            type="url"
                            value={previewImage}
                            onChange={(e) => setPreviewImage(e.target.value)}
                            placeholder="Or paste an external image URL (https://...)"
                            className="w-full px-3.5 py-2 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Live Card Preview */}
                  <div className="pt-2">
                    <span className="block text-[12px] font-bold text-[#64748B] uppercase tracking-wider mb-2">
                      Live Facebook Feed Preview
                    </span>
                    <LiveSocialPreviewCard
                      title={previewTitle}
                      description={previewDescription}
                      image={previewImage}
                      destinationUrl={destinationUrl}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Link
                href="/links"
                className="px-4 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[13px] font-semibold text-[#64748B] transition"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[14px] font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed shadow-xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Creating Link...
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4" /> Generate Tracking Link
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        <ImageLibraryModal
          isOpen={libraryOpen}
          onClose={() => setLibraryOpen(false)}
          onSelect={(url) => setPreviewImage(url)}
          currentSelectedUrl={previewImage}
        />
      </div>
    </AppShell>
  );
}
