"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Link as LinkIcon,
  Search,
  Users,
  Copy,
  ExternalLink,
  Pause,
  Play,
  QrCode,
  UserCheck,
  Check,
  Loader2,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import QRCodeModal from "@/components/ui/QRCodeModal";
import EmptyState from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import TablePagination from "@/components/ui/TablePagination";
import BulkActionBar, { BulkAction } from "@/components/ui/BulkActionBar";
import { useToast } from "@/components/ui/ToastContext";
import { formatDate, formatNumber } from "@/lib/utils";

type SortField = "shortCode" | "userName" | "rawHits" | "validHits" | "creditedHits" | "status" | "createdAt";
type SortDirection = "asc" | "desc";

export default function AdminLinksPage() {
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [links, setLinks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  // Selection for Bulk Management
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Reassign Modal
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<any>(null);
  const [newOwnerId, setNewOwnerId] = useState("");

  // QR Modal
  const [qrModal, setQrModal] = useState<{ isOpen: boolean; url: string; code: string }>({
    isOpen: false,
    url: "",
    code: "",
  });

  const fetchLinks = async () => {
    try {
      const res = await fetch(
        `/api/links?search=${encodeURIComponent(search)}&status=${statusFilter}&employeeId=${employeeFilter}`
      );
      const data = await res.json();
      if (data.success) {
        setLinks(data.links);
      }
    } catch {
      showToast("Failed to load links", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setUser(d.user);
      });

    fetch("/api/employees")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setEmployees(d.employees);
      });
  }, []);

  useEffect(() => {
    fetchLinks();
    setCurrentPage(1);
  }, [search, statusFilter, employeeFilter]);

  // Sorting
  const sortedLinks = useMemo(() => {
    const list = [...links];
    list.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === "userName") {
        aVal = a.user?.name || "";
        bVal = b.user?.name || "";
      } else if (sortField === "createdAt") {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      } else if (typeof aVal === "number") {
        aVal = aVal || 0;
        bVal = bVal || 0;
      } else if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = (bVal || "").toLowerCase();
      }

      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [links, sortField, sortDir]);

  // Paginated links
  const paginatedLinks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedLinks.slice(start, start + pageSize);
  }, [sortedLinks, currentPage, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  // Selection Handlers
  const handleToggleSelectAll = () => {
    if (selectedIds.size === paginatedLinks.length && paginatedLinks.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedLinks.map((l) => l.id)));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllEverywhere = () => {
    setSelectedIds(new Set(sortedLinks.map((l) => l.id)));
  };

  // Bulk Operations
  const handleBulkStatus = async (status: "ACTIVE" | "PAUSED") => {
    if (selectedIds.size === 0) return;
    setBulkActionLoading(true);
    try {
      const res = await fetch("/api/links/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SET_STATUS",
          linkIds: Array.from(selectedIds),
          status,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message, "success");
        setSelectedIds(new Set());
        fetchLinks();
      } else {
        showToast(json.message || "Bulk update failed", "error");
      }
    } catch {
      showToast("Network error during bulk update", "error");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkCopy = async () => {
    if (selectedIds.size === 0) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "https://jii.life";
    const selectedLinks = links.filter((l) => selectedIds.has(l.id));
    const urls = selectedLinks.map((l) => `${origin}/${l.shortCode}`).join("\n");
    try {
      await navigator.clipboard.writeText(urls);
      showToast(`Copied ${selectedLinks.length} URLs to clipboard`, "success");
    } catch {
      showToast("Failed to copy URLs", "error");
    }
  };

  const handleBulkExportCsv = () => {
    if (selectedIds.size === 0) return;
    const selectedLinks = links.filter((l) => selectedIds.has(l.id));
    const origin = typeof window !== "undefined" ? window.location.origin : "https://jii.life";

    const header = "Short Code,Employee,Destination URL,Raw Hits,Valid Hits,Credited Hits,Status,Created At\n";
    const rows = selectedLinks
      .map((l) =>
        `"${l.shortCode}","${l.user?.name || ""}","${l.destinationUrl}",${l.rawHits || 0},${l.validHits || 0},${l.creditedHits || 0},"${l.status}","${l.createdAt}"`
      )
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `admin-links-export-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${selectedLinks.length} links to CSV`, "success");
  };

  const bulkActions: BulkAction[] = [
    {
      label: "Copy URLs",
      icon: Copy,
      onClick: handleBulkCopy,
    },
    {
      label: "Set Active",
      icon: Play,
      variant: "success",
      onClick: () => handleBulkStatus("ACTIVE"),
      loading: bulkActionLoading,
    },
    {
      label: "Pause All",
      icon: Pause,
      variant: "warning",
      onClick: () => handleBulkStatus("PAUSED"),
      loading: bulkActionLoading,
    },
    {
      label: "Export Selected",
      icon: Download,
      onClick: handleBulkExportCsv,
    },
  ];

  const handleCopyLink = async (shortCode: string, id: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://jii.life";
    const url = `${origin}/${shortCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      showToast("Link copied to clipboard", "success");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showToast("Failed to copy link", "error");
    }
  };

  const handleToggleStatus = async (link: any) => {
    const newStatus = link.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      const res = await fetch(`/api/links/${link.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Status changed to ${newStatus.toLowerCase()}`, "success");
        fetchLinks();
      }
    } catch {
      showToast("Failed to update status", "error");
    }
  };

  const handleReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLink || !newOwnerId) return;

    try {
      const res = await fetch(`/api/links/${selectedLink.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: newOwnerId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Link ownership successfully reassigned", "success");
        setReassignModalOpen(false);
        fetchLinks();
      } else {
        showToast(data.message || "Failed to reassign link", "error");
      }
    } catch {
      showToast("Network error", "error");
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-[#94A3B8] inline ml-1 opacity-50 hover:opacity-100" />;
    }
    return sortDir === "asc" ? (
      <ArrowUp className="w-3 h-3 text-[#2563EB] inline ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#2563EB] inline ml-1" />
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" />
      </div>
    );
  }

  const allPageSelected =
    paginatedLinks.length > 0 && paginatedLinks.every((l) => selectedIds.has(l.id));

  return (
    <AppShell
      user={user}
      title="Global Tracking Links"
      subtitle="Complete inventory of all generated short links across team members"
    >
      <div className="space-y-6">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FFFFFF] border border-[#E2E8F0] p-3 rounded-xl shadow-xs">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code, URL, or tags..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-[13px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-[13px] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="all">All Employees</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-[13px] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="all">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="DISABLED">Disabled</option>
            </select>
          </div>
        </div>

        {/* Global Links Table with Shimmer Skeleton & Pagination */}
        {loading ? (
          <TableSkeleton rows={8} cols={8} />
        ) : links.length === 0 ? (
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
            <EmptyState
              title="No tracking links found"
              description="No links match your search or filter criteria."
              icon={LinkIcon}
            />
          </div>
        ) : (
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] font-semibold select-none">
                    <th className="py-3 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={handleToggleSelectAll}
                        className="rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB] cursor-pointer"
                        title="Select all on this page"
                      />
                    </th>
                    <th
                      className="py-3 px-4 cursor-pointer hover:text-[#0F172A] transition"
                      onClick={() => handleSort("shortCode")}
                    >
                      Tracking Link {renderSortIcon("shortCode")}
                    </th>
                    <th
                      className="py-3 px-4 cursor-pointer hover:text-[#0F172A] transition"
                      onClick={() => handleSort("userName")}
                    >
                      Owner {renderSortIcon("userName")}
                    </th>
                    <th className="py-3 px-4">Destination</th>
                    <th
                      className="py-3 px-4 text-center cursor-pointer hover:text-[#0F172A] transition"
                      onClick={() => handleSort("rawHits")}
                    >
                      Raw Hits {renderSortIcon("rawHits")}
                    </th>
                    <th
                      className="py-3 px-4 text-center cursor-pointer hover:text-[#0F172A] transition"
                      onClick={() => handleSort("validHits")}
                    >
                      Valid Traffic {renderSortIcon("validHits")}
                    </th>
                    <th
                      className="py-3 px-4 text-center cursor-pointer hover:text-[#0F172A] transition"
                      onClick={() => handleSort("creditedHits")}
                    >
                      Credited Clicks {renderSortIcon("creditedHits")}
                    </th>
                    <th
                      className="py-3 px-4 cursor-pointer hover:text-[#0F172A] transition"
                      onClick={() => handleSort("status")}
                    >
                      Status {renderSortIcon("status")}
                    </th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {paginatedLinks.map((link) => {
                    const isSelected = selectedIds.has(link.id);
                    return (
                      <tr
                        key={link.id}
                        className={`transition ${
                          isSelected ? "bg-[#EFF6FF]/60 hover:bg-[#EFF6FF]" : "hover:bg-[#F8FAFC]"
                        }`}
                      >
                        <td className="py-3.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectOne(link.id)}
                            className="rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB] cursor-pointer"
                          />
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-[#2563EB]">
                          {typeof window !== "undefined" ? window.location.host : "jii.life"}/
                          {link.shortCode}
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-[#0F172A]">
                          <Link
                            href={`/admin/employees/${link.user.id}`}
                            className="hover:underline flex items-center gap-1"
                          >
                            <Users className="w-3.5 h-3.5 text-[#64748B]" />
                            <span>{link.user.name}</span>
                          </Link>
                        </td>

                        <td className="py-3.5 px-4 max-w-[200px]">
                          <div className="truncate font-medium text-[#0F172A]">
                            {link.previewTitle || link.destinationUrl}
                          </div>
                          <div className="truncate text-[#64748B] text-[11px] font-mono">
                            {link.destinationUrl}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono font-medium text-[#64748B]">
                          {formatNumber(link.rawHits || 0)}
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono font-bold text-[#0F172A]">
                          {formatNumber(link.validHits || 0)}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block px-2.5 py-1 rounded-md bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] font-bold font-mono">
                            {formatNumber(link.creditedHits || 0)}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                              link.status === "ACTIVE"
                                ? "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]"
                                : link.status === "PAUSED"
                                ? "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]"
                                : "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]"
                            }`}
                          >
                            {link.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleCopyLink(link.shortCode, link.id)}
                              className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#EFF6FF] text-[#64748B] hover:text-[#2563EB] transition"
                              title="Copy Tracking Link"
                            >
                              {copiedId === link.id ? (
                                <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const origin =
                                  typeof window !== "undefined"
                                    ? window.location.origin
                                    : "https://jii.life";
                                setQrModal({
                                  isOpen: true,
                                  url: `${origin}/${link.shortCode}`,
                                  code: link.shortCode,
                                });
                              }}
                              className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] transition"
                              title="View QR Code"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedLink(link);
                                setNewOwnerId(link.user.id);
                                setReassignModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] transition"
                              title="Reassign Link Owner"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleStatus(link)}
                              className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] transition"
                              title={link.status === "ACTIVE" ? "Pause Link" : "Activate Link"}
                            >
                              {link.status === "ACTIVE" ? (
                                <Pause className="w-3.5 h-3.5" />
                              ) : (
                                <Play className="w-3.5 h-3.5 text-[#16A34A]" />
                              )}
                            </button>

                            <Link
                              href={`/links/${link.id}/analytics`}
                              className="p-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] transition"
                              title="Deep Analytics"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <TablePagination
              currentPage={currentPage}
              totalItems={sortedLinks.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </div>
        )}

        {/* Floating Bulk Action Bar */}
        <BulkActionBar
          selectedCount={selectedIds.size}
          totalCount={sortedLinks.length}
          onClearSelection={() => setSelectedIds(new Set())}
          onSelectAll={handleSelectAllEverywhere}
          actions={bulkActions}
        />

        {/* Reassign Ownership Modal */}
        {reassignModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl max-w-md w-full p-6 shadow-xl animate-in fade-in zoom-in-95">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[16px] font-bold text-[#0F172A]">
                  Reassign Link Ownership
                </h3>
                <button
                  onClick={() => setReassignModalOpen(false)}
                  className="text-[#94A3B8] hover:text-[#0F172A]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[#64748B] mb-4">
                Reassigning this link will immediately transfer all future attributed visits to the selected team member.
              </p>

              <form onSubmit={handleReassign} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Select New Employee
                  </label>
                  <select
                    value={newOwnerId}
                    onChange={(e) => setNewOwnerId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  >
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name} ({e.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReassignModalOpen(false)}
                    className="px-4 py-2 border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:text-[#0F172A] rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg shadow-xs"
                  >
                    Confirm Transfer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* QR Code Modal */}
        <QRCodeModal
          isOpen={qrModal.isOpen}
          onClose={() => setQrModal({ ...qrModal, isOpen: false })}
          shortUrl={qrModal.url}
          shortCode={qrModal.code}
        />
      </div>
    </AppShell>
  );
}
