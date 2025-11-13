"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getUser, clearAuth } from "../utils/auth";
import { authApi, dashboardApi, DashboardPayoutRequest } from "../utils/api";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(getUser());
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [queueLoading, setQueueLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingReviews: 0,
    approvedToday: 0,
    exceptions: 0,
  });
  const [payoutQueue, setPayoutQueue] = useState<DashboardPayoutRequest[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("pending review");

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds} sec ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} min ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hr ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'pending') {
      return (
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-600">
          Pending
        </span>
      );
    } else if (statusLower === 'accepted') {
      return (
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-600">
          Accepted
        </span>
      );
    } else if (statusLower === 'rejected') {
      return (
        <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-600">
          Rejected
        </span>
      );
    }
    return (
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
        {status}
      </span>
    );
  };

  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await dashboardApi.getStats();
      setStats(response);
    } catch (err: any) {
      console.error("Error fetching dashboard stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch payout queue
  const fetchPayoutQueue = async () => {
    try {
      setQueueLoading(true);
      const response = await dashboardApi.getPayoutQueue(selectedStatus, 10);
      setPayoutQueue(response.payoutRequests || []);
    } catch (err: any) {
      console.error("Error fetching payout queue:", err);
    } finally {
      setQueueLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    // Fetch current user data
    authApi
      .me()
      .then((response) => {
        setUser(response.user);
      })
      .catch(() => {
        // If token is invalid, clear auth and redirect
        clearAuth();
        router.push("/login");
      })
      .finally(() => {
        setLoading(false);
      });

    // Fetch dashboard data
    fetchStats();
    fetchPayoutQueue();
  }, [router]);

  // Refetch queue when status changes
  useEffect(() => {
    if (isAuthenticated() && !loading) {
      fetchPayoutQueue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header />
        <section className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
          <div className="grid gap-6 lg:grid-cols-3">
            <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-panel">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Pending Reviews
              </p>
              <p className="mt-4 text-3xl font-bold text-dark">
                {statsLoading ? "..." : stats.pendingReviews}
              </p>
              <p className="mt-2 text-sm text-slate-500">Payout requests awaiting owner review</p>
            </article>
            <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-panel">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Approved Today
              </p>
              <p className="mt-4 text-3xl font-bold text-dark">
                {statsLoading ? "..." : formatCurrency(stats.approvedToday)}
              </p>
              <p className="mt-2 text-sm text-slate-500">Auto posted to ledgers</p>
            </article>
            <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-panel">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Exceptions
              </p>
              <p className="mt-4 text-3xl font-bold text-dark">
                {statsLoading ? "..." : stats.exceptions}
              </p>
              <p className="mt-2 text-sm text-slate-500">Requires manual intervention</p>
            </article>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-panel">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-dark">Live Payout Queue</h2>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <label>Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="pending review">Pending Review</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="all">All</option>
                </select>
              </div>
            </div>
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Request #</th>
                    <th className="px-4 py-3">Submitted By</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">UTR / Reference Number*</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-600">
                  {queueLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        Loading...
                      </td>
                    </tr>
                  ) : payoutQueue.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        No payout requests found
                      </td>
                    </tr>
                  ) : (
                    payoutQueue.map((request) => (
                      <tr key={request.id}>
                        <td className="px-4 py-4 font-semibold text-dark">{request.requestId}</td>
                        <td className="px-4 py-4">
                          {request.userName} ({request.userRole})
                        </td>
                        <td className="px-4 py-4 text-dark">{formatCurrency(request.amount)}</td>
                        <td className="px-4 py-4">{request.utr || request.remarks}</td>
                        <td className="px-4 py-4">{getStatusBadge(request.status)}</td>
                        <td className="px-4 py-4">{formatTimeAgo(request.updatedAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-panel">
              <h3 className="text-lg font-semibold text-dark">Workflow Snapshot</h3>
              <ul className="mt-6 space-y-4 text-sm text-slate-600">
                <li>
                  <span className="font-semibold text-dark">End User</span> → creates payout request
                  with ledger &amp; attachment
                </li>
                <li>
                  <span className="font-semibold text-dark">Business Owner/Admin</span> → performs
                  review, Accepts/Rejects, leaves notes
                </li>
                <li>
                  <span className="font-semibold text-dark">System</span> → on acceptance, auto
                  posts Cash-Out entry into mapped ledger
                </li>
                <li>
                  <span className="font-semibold text-dark">Auditor</span> → monitors read-only
                  history, variance flags and comments
                </li>
              </ul>
            </article>
            <article className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-panel">
              <h3 className="text-lg font-semibold text-dark">Controlled Admin Process</h3>
              <p className="mt-4 text-sm text-slate-600">
                Reverts are disallowed at the owner level. Any payout reversal must be escalated to
                the platform admin team with supporting documents. Approval triggers
                auto-notifications to auditors and updates the ledger with a reversal note.
              </p>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
