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
  const [error, setError] = useState<string | null>(null);
  const [businessesError, setBusinessesError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [deletingBusinessId, setDeletingBusinessId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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
  }, [router, mounted]);

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
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-panel">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-dark">Business Owner / Admin</h2>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-slate-600">Loading admin information...</div>
              </div>
            )}

            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                {error}
              </div>
            )}

            {!loading && !error && admins.length === 0 && (
              <div className="py-12 text-center text-slate-600">
                <p>No admin users found.</p>
              </div>
            )}

            {!loading && !error && admins.length > 0 && (
              <div className="space-y-6">
                {admins.map((admin) => (
                  <div
                    key={admin.id}
                    className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-4 flex items-center gap-4">
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                            {admin.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-dark">{admin.fullName}</h3>
                            <p className="text-sm text-slate-600">{admin.email}</p>
                            <div className="mt-1 flex items-center gap-2">
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                  admin.status === "active"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-slate-100 text-slate-800"
                                }`}
                              >
                                {admin.status}
                              </span>
                              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                Admin
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                          <div className="rounded-lg border border-slate-200 bg-white p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</p>
                            <p className="mt-1 text-sm font-medium text-dark">{admin.phone || "Not provided"}</p>
                          </div>

                          <div className="rounded-lg border border-slate-200 bg-white p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">UPI ID</p>
                            <p className="mt-1 text-sm font-medium text-dark">{admin.upiId || "Not provided"}</p>
                          </div>

                          <div className="rounded-lg border border-slate-200 bg-white p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Wallet Balance</p>
                            <p className="mt-1 text-lg font-semibold text-dark">
                              {admin.walletCurrency} {admin.walletBalance.toFixed(2)}
                            </p>
                          </div>

                          <div className="rounded-lg border border-slate-200 bg-white p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account Created</p>
                            <p className="mt-1 text-sm font-medium text-dark">{formatDate(admin.createdAt)}</p>
                          </div>

                          <div className="rounded-lg border border-slate-200 bg-white p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last Login</p>
                            <p className="mt-1 text-sm font-medium text-dark">{formatDate(admin.lastLoginAt)}</p>
                          </div>

                          {admin.upiQrCode && (
                            <div className="rounded-lg border border-slate-200 bg-white p-4">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">UPI QR Code</p>
                              <div className="mt-2 flex justify-center">
                                <img
                                  src={`${API_BASE}/uploads/${admin.upiQrCode}`}
                                  alt="UPI QR Code"
                                  className="h-24 w-24 object-contain"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = "none";
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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
