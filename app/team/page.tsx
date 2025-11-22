"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../utils/auth";
import { invitesApi, Invite } from "../utils/api";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function TeamPage() {
  const router = useRouter();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [filteredInvites, setFilteredInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    fetchInvites();
  }, [router]);

  const fetchInvites = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await invitesApi.getAll();
      setInvites(response.invites || []);
      setFilteredInvites(response.invites || []);
    } catch (err: any) {
      console.error("Error fetching invites:", err);
      setError(err.message || "Failed to load invites");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = invites;

    // Filter by tab
    if (activeTab === "Pending Invites") {
      filtered = filtered.filter((invite) => invite.status === "pending");
    } else if (activeTab === "Owner/Partner") {
      filtered = filtered.filter((invite) => invite.role === "Partner");
    } else if (activeTab === "Staff") {
      filtered = filtered.filter((invite) => invite.role === "Staff");
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (invite) =>
          invite.email?.toLowerCase().includes(query) ||
          invite.phone?.toLowerCase().includes(query) ||
          invite.businessName?.toLowerCase().includes(query) ||
          invite.inviterEmail?.toLowerCase().includes(query)
      );
    }

    setFilteredInvites(filtered);
  }, [invites, activeTab, searchQuery]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { bg: "bg-amber-100", text: "text-amber-600", label: "Pending" },
      accepted: { bg: "bg-emerald-100", text: "text-emerald-600", label: "Accepted" },
      expired: { bg: "bg-slate-100", text: "text-slate-600", label: "Expired" },
      rejected: { bg: "bg-rose-100", text: "text-rose-600", label: "Rejected" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <span className={`rounded-full ${config.bg} ${config.text} px-3 py-1 text-xs font-semibold`}>
        {config.label}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      Partner: { bg: "bg-purple-100", text: "text-purple-600", label: "Partner" },
      Staff: { bg: "bg-blue-100", text: "text-blue-600", label: "Staff" },
    };

    const config = roleConfig[role as keyof typeof roleConfig] || {
      bg: "bg-slate-100",
      text: "text-slate-600",
      label: role,
    };

    return (
      <span className={`rounded-full ${config.bg} ${config.text} px-3 py-1 text-xs font-semibold`}>
        {config.label}
      </span>
    );
  };

  const tabs = ["All", "Pending Invites", "Owner/Partner", "Staff"];

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header />
        <section className="mx-auto flex w-full flex-col gap-8 px-6 py-10">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-panel">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-dark">Team Invites</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Manage all business invites for staff and partners
                </p>
              </div>
              <div className="text-sm text-slate-500">
                Total Invites ({filteredInvites.length})
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search by name, email, phone, business..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 py-3 text-sm font-medium text-dark placeholder-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-6 flex gap-2 border-b border-slate-200">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-semibold transition-colors ${
                    activeTab === tab
                      ? "border-b-2 border-primary text-primary"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-slate-600">Loading invites...</p>
              </div>
            ) : error ? (
              <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                {error}
              </div>
            ) : filteredInvites.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-slate-500">
                  {activeTab === "All"
                    ? "No invites found"
                    : `No ${activeTab.toLowerCase()} invites found`}
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-100">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Business</th>
                      <th className="px-4 py-3">Email / Phone</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Invited By</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Expires At</th>
                      <th className="px-4 py-3">Created At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-slate-600">
                    {filteredInvites.map((invite) => (
                      <tr key={invite.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4 font-semibold text-dark">
                          {invite.businessName}
                        </td>
                        <td className="px-4 py-4">
                          {invite.email ? (
                            <div className="flex flex-col">
                              <span className="font-medium">{invite.email}</span>
                              {invite.phone && (
                                <span className="text-xs text-slate-500">{invite.phone}</span>
                              )}
                            </div>
                          ) : invite.phone ? (
                            <span className="font-medium">{invite.phone}</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4">{getRoleBadge(invite.role)}</td>
                        <td className="px-4 py-4">
                          <span className="text-slate-600">{invite.inviterEmail || "-"}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-1">
                            {getStatusBadge(invite.status)}
                            {invite.acceptedUserEmail && (
                              <span className="text-xs text-emerald-600 font-medium">
                                ✓ Accepted by: {invite.acceptedUserEmail}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-slate-500">
                          {invite.acceptedAt ? (
                            <div className="flex flex-col">
                              <span className="text-emerald-600 font-medium">Accepted</span>
                              <span className="text-xs">{formatDate(invite.acceptedAt)}</span>
                            </div>
                          ) : invite.expiresAt ? (
                            formatDate(invite.expiresAt)
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-4 text-slate-500">{formatDate(invite.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

