"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../utils/auth";
import { usersApi, AdminUser, businessesApi, Business } from "../utils/api";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || "http://localhost:5000";

export default function BusinessOwnerPage() {
  const router = useRouter();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessesLoading, setBusinessesLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businessesError, setBusinessesError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [deletingBusinessId, setDeletingBusinessId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalBusinesses: 0,
    totalOwners: 0,
    totalPartners: 0,
    totalStaff: 0,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    fetchAdmins();
    fetchBusinesses();
    fetchStats();
  }, [router, mounted]);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const token = localStorage.getItem("adminAuthToken");
      if (!token) return;

      const response = await fetch(`${API_BASE}/api/dashboard/business-stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats({
          totalBusinesses: data.totalBusinesses || 0,
          totalOwners: data.totalOwners || 0,
          totalPartners: data.totalPartners || 0,
          totalStaff: data.totalStaff || 0,
        });
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchAdmins = () => {
    setLoading(true);
    setError(null);

    usersApi
      .getAdmins()
      .then((response) => {
        setAdmins(response.admins);
      })
      .catch((err: any) => {
        console.error("Error fetching admin users:", err);
        const errorMessage = err?.message || err?.error?.message || err?.error || "Failed to load admin users";
        setError(errorMessage);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const fetchBusinesses = () => {
    setBusinessesLoading(true);
    setBusinessesError(null);

    businessesApi
      .getAllWithWallets()
      .then((response) => {
        setBusinesses(response.businesses);
      })
      .catch((err: any) => {
        console.error("Error fetching businesses:", err);
        const errorMessage = err?.message || err?.error?.message || err?.error || "Failed to load businesses";
        setBusinessesError(errorMessage);
      })
      .finally(() => {
        setBusinessesLoading(false);
      });
  };

  const handleDeleteBusiness = async (businessId: string) => {
    if (!window.confirm("Are you sure you want to delete this business? This action cannot be undone and will delete all associated records.")) {
      return;
    }

    setDeletingBusinessId(businessId);
    setDeleteConfirmId(null);

    try {
      await businessesApi.delete(businessId);
      // Refresh the businesses list
      fetchBusinesses();
    } catch (err: any) {
      console.error("Error deleting business:", err);
      const errorMessage = err?.message || err?.error?.message || err?.error || "Failed to delete business";
      alert(errorMessage);
    } finally {
      setDeletingBusinessId(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header />
        <section className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
          {/* Statistics Cards */}
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-panel">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-dark">Business Statistics</h2>
            </div>

            {statsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-slate-600">Loading statistics...</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Business</p>
                  <p className="mt-2 text-3xl font-bold text-dark">{stats.totalBusinesses}</p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-purple-50 to-white p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Owners</p>
                  <p className="mt-2 text-3xl font-bold text-dark">{stats.totalOwners}</p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Partners</p>
                  <p className="mt-2 text-3xl font-bold text-dark">{stats.totalPartners}</p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Staffs</p>
                  <p className="mt-2 text-3xl font-bold text-dark">{stats.totalStaff}</p>
                </div>
              </div>
            )}
          </div>

          {/* Businesses List Table */}
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-panel">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-dark">Businesses List</h2>
            </div>

            {businessesLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-slate-600">Loading businesses...</div>
              </div>
            )}

            {businessesError && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                {businessesError}
              </div>
            )}

            {!businessesLoading && !businessesError && businesses.length === 0 && (
              <div className="py-12 text-center text-slate-600">
                <p>No businesses found.</p>
              </div>
            )}

            {!businessesLoading && !businessesError && businesses.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Business Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Owner
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Master UPI Wallet ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Created At
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {businesses.map((business) => (
                      <tr key={business.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-dark">
                          {business.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          <div>
                            <div className="font-medium">{business.ownerName}</div>
                            <div className="text-xs text-slate-500">{business.ownerEmail}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-dark">
                          {business.masterWalletUpi || (
                            <span className="text-slate-400 italic">Not provided</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              business.status === "active"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-800"
                            }`}
                          >
                            {business.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {formatDate(business.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/edit-business/${business.id}`}
                              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (deleteConfirmId === business.id) {
                                  handleDeleteBusiness(business.id);
                                } else {
                                  setDeleteConfirmId(business.id);
                                }
                              }}
                              disabled={deletingBusinessId === business.id}
                              className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                deleteConfirmId === business.id
                                  ? "bg-red-600 text-white hover:bg-red-700"
                                  : "border border-red-200 bg-white text-red-600 hover:bg-red-50"
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {deletingBusinessId === business.id
                                ? "Deleting..."
                                : deleteConfirmId === business.id
                                ? "Confirm Delete"
                                : "Delete"}
                            </button>
                            {deleteConfirmId === business.id && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmId(null);
                                }}
                                className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
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
