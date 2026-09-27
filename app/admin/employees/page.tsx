"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  PlusCircle,
  Search,
  MoreVertical,
  KeyRound,
  Percent,
  Ban,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { useToast } from "@/components/ui/ToastContext";
import { TableSkeleton } from "@/components/ui/Skeleton";
import TablePagination from "@/components/ui/TablePagination";
import { formatDate, formatNumber } from "@/lib/utils";

export default function AdminEmployeesPage() {
  const { showToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  // New Employee Form
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("EMPLOYEE");
  const [newOverride, setNewOverride] = useState("");
  const [newTarget, setNewTarget] = useState("10000");

  // Rate Form
  const [rateOverride, setRateOverride] = useState("");

  // Password Reset Form
  const [resetPass, setResetPass] = useState("");

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      const json = await res.json();
      if (json.success) setEmployees(json.employees);
    } catch {
      showToast("Failed to load employees", "error");
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
    fetchEmployees();
  }, []);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
          role: newRole,
          trafficPercentageOverride: newOverride || undefined,
          monthlyTarget: newTarget ? parseInt(newTarget, 10) : undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast("Employee created successfully", "success");
        setAddModalOpen(false);
        setNewName("");
        setNewEmail("");
        setNewPassword("");
        setNewOverride("");
        fetchEmployees();
      } else {
        showToast(json.message || "Failed to create employee", "error");
      }
    } catch {
      showToast("Network error", "error");
    }
  };

  const handleStatusChange = async (emp: any, newStatus: string) => {
    try {
      const res = await fetch(`/api/employees/${emp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Account status updated to ${newStatus}`, "success");
        fetchEmployees();
      } else {
        showToast(json.message || "Failed to update status", "error");
      }
    } catch {
      showToast("Network error", "error");
    }
  };

  const handleSaveRateOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    try {
      const res = await fetch(`/api/employees/${selectedEmployee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trafficPercentageOverride: rateOverride ? parseFloat(rateOverride) : null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("Credit percentage override updated", "success");
        setRateModalOpen(false);
        fetchEmployees();
      } else {
        showToast(json.message || "Failed to update rate", "error");
      }
    } catch {
      showToast("Network error", "error");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    if (resetPass.length < 8) {
      showToast("Password must be at least 8 characters", "error");
      return;
    }

    try {
      const res = await fetch(`/api/employees/${selectedEmployee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: resetPass }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("Password reset successfully", "success");
        setPasswordModalOpen(false);
        setResetPass("");
      } else {
        showToast(json.message || "Failed to reset password", "error");
      }
    } catch {
      showToast("Network error", "error");
    }
  };

  const filtered = employees.filter((emp) => {
    const matchSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || emp.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const paginatedEmployees = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" />
      </div>
    );
  }

  return (
    <AppShell
      user={user}
      title="Team Members & Employees"
      subtitle="Manage accounts, per-employee credit percentage overrides, and monthly targets"
      actionButton={{
        label: "Add Employee",
        href: "#",
        icon: PlusCircle,
      }}
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
              placeholder="Search team member by name or email..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-[13px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-[13px] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="all">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="DISABLED">Disabled</option>
            </select>

            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-medium transition shadow-xs"
            >
              <PlusCircle className="w-4 h-4" /> Add Employee
            </button>
          </div>
        </div>

        {/* Employees Table */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] font-semibold">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-center">Links</th>
                  <th className="py-3 px-4 text-right">Actual Valid</th>
                  <th className="py-3 px-4 text-right">Credited Clicks</th>
                  <th className="py-3 px-4 text-center">Effective Rate</th>
                  <th className="py-3 px-4 text-center">Target Progress</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {paginatedEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-[#F8FAFC] transition">
                    <td className="py-3.5 px-4 font-semibold text-[#0F172A]">
                      <Link
                        href={`/admin/employees/${emp.id}`}
                        className="hover:text-[#2563EB] transition"
                      >
                        {emp.name}
                      </Link>
                      <span className="block text-[11px] text-[#64748B] font-normal">
                        {emp.email}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                        {emp.role}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono">
                      {emp.totalLinks}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#0F172A]">
                      {formatNumber(emp.validHits)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#16A34A]">
                      {formatNumber(emp.creditedHits)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEmployee(emp);
                          setRateOverride(
                            emp.trafficPercentageOverride !== null &&
                              emp.trafficPercentageOverride !== undefined
                              ? emp.trafficPercentageOverride.toString()
                              : ""
                          );
                          setRateModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] hover:bg-[#DBEAFE] transition"
                        title="Click to override percentage"
                      >
                        <Percent className="w-3 h-3" />
                        <span>{emp.effectiveRate}%</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 font-semibold text-[#0F172A]">
                        <span>{emp.targetProgress}%</span>
                        <span className="text-[#94A3B8] font-normal text-[11px]">
                          ({formatNumber(emp.monthlyTarget || 10000)})
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          emp.status === "ACTIVE"
                            ? "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]"
                            : emp.status === "SUSPENDED"
                            ? "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]"
                            : "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]"
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEmployee(emp);
                            setPasswordModalOpen(true);
                          }}
                          className="p-1.5 rounded border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] transition"
                          title="Reset Password"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        {emp.status === "ACTIVE" ? (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(emp, "SUSPENDED")}
                            className="p-1.5 rounded border border-[#E2E8F0] hover:bg-[#FFFBEB] text-[#64748B] hover:text-[#D97706] transition"
                            title="Suspend Employee"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(emp, "ACTIVE")}
                            className="p-1.5 rounded border border-[#E2E8F0] hover:bg-[#F0FDF4] text-[#64748B] hover:text-[#16A34A] transition"
                            title="Activate Employee"
                          >
                            <CheckCircle className="w-3.5 h-3.5 text-[#16A34A]" />
                          </button>
                        )}

                        <Link
                          href={`/admin/employees/${emp.id}`}
                          className="px-2.5 py-1 rounded border border-[#E2E8F0] hover:bg-[#EFF6FF] text-[#2563EB] font-medium transition text-xs ml-1"
                        >
                          Inspect
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <TablePagination
            currentPage={currentPage}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        </div>

        {/* Add Employee Modal */}
        {addModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white border border-[#E2E8F0] rounded-xl max-w-md w-full p-6 shadow-xl relative animate-in zoom-in-95">
              <button
                onClick={() => setAddModalOpen(false)}
                className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#0F172A]"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-[17px] font-bold text-[#0F172A] mb-1">
                Add New Team Member
              </h3>
              <p className="text-[12px] text-[#64748B] mb-5">
                Create login credentials and attribution settings for the employee
              </p>

              <form onSubmit={handleAddEmployee} className="space-y-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                    Full Name <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Usman Tariq"
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                    Email Address <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="usman@company.com"
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                    Password <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                      Role
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                    >
                      <option value="EMPLOYEE">Employee</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                      Custom Rate %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newOverride}
                      onChange={(e) => setNewOverride(e.target.value)}
                      placeholder="Default: Global (50%)"
                      className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#0F172A] mb-1">
                    Monthly Traffic Goal
                  </label>
                  <input
                    type="number"
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value)}
                    placeholder="10000"
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#64748B]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold"
                  >
                    Create Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Rate Override Modal */}
        {rateModalOpen && selectedEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white border border-[#E2E8F0] rounded-xl max-w-sm w-full p-6 shadow-xl relative animate-in zoom-in-95">
              <button
                onClick={() => setRateModalOpen(false)}
                className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#0F172A]"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-[17px] font-bold text-[#0F172A] mb-1">
                Credit Percentage Override
              </h3>
              <p className="text-[12px] text-[#64748B] mb-4">
                Configuring effective rate for <strong>{selectedEmployee.name}</strong>
              </p>

              <form onSubmit={handleSaveRateOverride} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Credited Traffic Percentage (0 - 100%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={rateOverride}
                    onChange={(e) => setRateOverride(e.target.value)}
                    placeholder="Leave empty to use Global Rate"
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                  <span className="block text-[11px] text-[#64748B] mt-1.5 leading-relaxed">
                    If set, this employee will receive credit at this custom rate instead of the global platform default.
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRateModalOpen(false)}
                    className="px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-xs text-[#64748B]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold"
                  >
                    Save Override
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Password Reset Modal */}
        {passwordModalOpen && selectedEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white border border-[#E2E8F0] rounded-xl max-w-sm w-full p-6 shadow-xl relative animate-in zoom-in-95">
              <button
                onClick={() => setPasswordModalOpen(false)}
                className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#0F172A]"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-[17px] font-bold text-[#0F172A] mb-1">
                Reset Password
              </h3>
              <p className="text-[12px] text-[#64748B] mb-4">
                Set a new password for <strong>{selectedEmployee.name}</strong>
              </p>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    New Temporary Password
                  </label>
                  <input
                    type="password"
                    required
                    value={resetPass}
                    onChange={(e) => setResetPass(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPasswordModalOpen(false)}
                    className="px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-xs text-[#64748B]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
