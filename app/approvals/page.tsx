"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../utils/auth";
import { payoutRequestsApi, PayoutRequest } from "../utils/api";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function ApprovalsPage() {
  const router = useRouter();
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchPayoutRequests = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await payoutRequestsApi.getAll(selectedStatus);
      setPayoutRequests(response.payoutRequests || []);
    } catch (err: any) {
      console.error("Error fetching payout requests:", {
        message: err?.message,
        status: err?.status,
        error: err?.error,
        fullError: err,
      });
      
      let errorMessage = err?.message || err?.error?.message || err?.error?.raw || `Failed to load payout requests (${err?.status || "Unknown error"})`;
      
      // If unauthorized, redirect to login
      if (err?.status === 401) {
        errorMessage = "Session expired. Please log in again.";
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mounted) return;

    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    fetchPayoutRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, selectedStatus, mounted]);

  const handleStatusUpdate = async (id: string, status: "accepted" | "rejected") => {
    if (processingId) return;

    setProcessingId(id);
    setError(null); // Clear previous errors
    try {
      await payoutRequestsApi.updateStatus(id, {
        status,
        notes: status === "accepted" ? "Approved by admin" : "Rejected by admin",
      });

      // Refresh the list
      await fetchPayoutRequests();
    } catch (err: any) {
      console.error("Error updating payout request status:", err);
      const errorMessage = err?.message || err?.error?.message || err?.error || "Failed to update request status";
      setError(errorMessage);
    } finally {
      setProcessingId(null);
    }
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    
    // Format: DD-MM-YY H:MMam/pm (like 02-11-98 5:30pm)
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    
    return `${day}-${month}-${year} ${hours}:${minutes}${ampm}`;
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { bg: "bg-amber-100", text: "text-amber-600", label: "Pending" },
      accepted: { bg: "bg-emerald-100", text: "text-emerald-600", label: "Accepted" },
      rejected: { bg: "bg-rose-100", text: "text-rose-600", label: "Rejected" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <span className={`rounded-full ${config.bg} ${config.text} px-3 py-1 text-xs font-semibold`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header />
        <section className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-panel">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className="text-lg font-semibold text-dark">Payout Requests</h2>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <label>Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending Review</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-slate-600">Loading payout requests...</p>
              </div>
            ) : error ? (
              <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                {error}
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-100">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Request #</th>
                      <th className="px-4 py-3">Submitted By</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">UTR / Reference</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Created At</th>
                      <th className="px-4 py-3">Updated</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-slate-600">
                    {payoutRequests.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                          No payout requests found
                        </td>
                      </tr>
                    ) : (
                      payoutRequests.map((request) => (
                        <tr key={request.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-4 font-semibold text-dark">{request.reference}</td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-dark">{request.submittedBy}</span>
                              {request.userEmail && (
                                <span className="text-xs text-slate-500">{request.userEmail}</span>
                              )}
                              {request.userPhone && (
                                <span className="text-xs text-slate-500">{request.userPhone}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 font-semibold text-dark">
                            {formatAmount(request.amount)}
                          </td>
                          <td className="px-4 py-4">{request.utr}</td>
                          <td className="px-4 py-4">{getStatusBadge(request.status)}</td>
                          <td className="px-4 py-4 text-slate-500">
                            {formatDate(request.createdAt)}
                          </td>
                          <td className="px-4 py-4 text-slate-500">
                            {formatDate(request.updatedAt)}
                          </td>
                          <td className="px-4 py-4">
                            {request.status === "pending" ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleStatusUpdate(request.id, "accepted")}
                                  disabled={processingId === request.id}
                                  className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  {processingId === request.id ? "Processing..." : "Accept"}
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(request.id, "rejected")}
                                  disabled={processingId === request.id}
                                  className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  {processingId === request.id ? "Processing..." : "Reject"}
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">No actions</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
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
