"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getUser, clearAuth } from "../utils/auth";
import { authApi, dashboardApi, DashboardPayoutRequest, ComprehensiveStats } from "../utils/api";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(getUser());
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [comprehensiveStatsLoading, setComprehensiveStatsLoading] = useState(true);
  const [queueLoading, setQueueLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingReviews: 0,
    approvedToday: 0,
    exceptions: 0,
  });
  const [comprehensiveStats, setComprehensiveStats] = useState<ComprehensiveStats>({
    totalBusinesses: 0,
    totalCashbooks: 0,
    totalManagers: 0,
    totalStaffs: 0,
    totalPayoutRequests: 0,
    totalCashIn: 0,
    totalCashOut: 0,
  });
  const [payoutQueue, setPayoutQueue] = useState<DashboardPayoutRequest[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("pending review");
  const [activeTab, setActiveTab] = useState<'all' | 'today'>('all');

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
  const fetchStats = async (dateFilter: 'all' | 'today' = 'all') => {
    try {
      setStatsLoading(true);
      const response = await dashboardApi.getStats(dateFilter);
      setStats(response);
    } catch (err: any) {
      console.error("Error fetching dashboard stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch comprehensive stats
  const fetchComprehensiveStats = async (dateFilter: 'all' | 'today' = 'all') => {
    try {
      setComprehensiveStatsLoading(true);
      const response = await dashboardApi.getComprehensiveStats(dateFilter);
      setComprehensiveStats(response);
    } catch (err: any) {
      console.error("Error fetching comprehensive stats:", err);
    } finally {
      setComprehensiveStatsLoading(false);
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
    fetchStats(activeTab);
    fetchComprehensiveStats(activeTab);
    fetchPayoutQueue();
  }, [router]);

  // Refetch stats when tab changes
  useEffect(() => {
    if (isAuthenticated() && !loading) {
      fetchStats(activeTab);
      fetchComprehensiveStats(activeTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

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
        <section className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10">
          {/* Tabs */}
          <div className="flex items-center gap-4 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-3 px-4 text-sm font-semibold transition-colors ${
                activeTab === 'all'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setActiveTab('today')}
              className={`pb-3 px-4 text-sm font-semibold transition-colors ${
                activeTab === 'today'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today's Data
            </button>
          </div>

          {/* Comprehensive Statistics Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Businesses */}
            <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
              <div className="absolute right-4 top-4 rounded-full bg-blue-500/20 p-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                </svg>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600/70">Total Businesses</p>
              <p className="mt-3 text-4xl font-bold text-blue-900">
                {comprehensiveStatsLoading ? "..." : comprehensiveStats.totalBusinesses.toLocaleString()}
              </p>
              <p className="mt-2 text-sm text-blue-700/70">Active businesses</p>
            </article>

            {/* Total Cashbooks */}
            <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
              <div className="absolute right-4 top-4 rounded-full bg-emerald-500/20 p-3">
                <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600/70">Total Cashbooks</p>
              <p className="mt-3 text-4xl font-bold text-emerald-900">
                {comprehensiveStatsLoading ? "..." : comprehensiveStats.totalCashbooks.toLocaleString()}
              </p>
              <p className="mt-2 text-sm text-emerald-700/70">All cashbooks</p>
            </article>

            {/* Total Managers */}
            <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-purple-50 to-purple-100/50 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
              <div className="absolute right-4 top-4 rounded-full bg-purple-500/20 p-3">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-purple-600/70">Total Managers</p>
              <p className="mt-3 text-4xl font-bold text-purple-900">
                {comprehensiveStatsLoading ? "..." : comprehensiveStats.totalManagers.toLocaleString()}
              </p>
              <p className="mt-2 text-sm text-purple-700/70">Active managers</p>
            </article>

            {/* Total Staffs */}
            <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-amber-50 to-amber-100/50 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
              <div className="absolute right-4 top-4 rounded-full bg-amber-500/20 p-3">
                <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.059 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-600/70">Total Staffs</p>
              <p className="mt-3 text-4xl font-bold text-amber-900">
                {comprehensiveStatsLoading ? "..." : comprehensiveStats.totalStaffs.toLocaleString()}
              </p>
              <p className="mt-2 text-sm text-amber-700/70">Active staff members</p>
            </article>
          </div>

          {/* Financial Statistics Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Total Payout Requests */}
            <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-rose-50 to-rose-100/50 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
              <div className="absolute right-4 top-4 rounded-full bg-rose-500/20 p-3">
                <svg className="h-6 w-6 text-rose-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h4.125M8.25 8.25l5.25 5.25" />
                </svg>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-600/70">Total Payout Requests</p>
              <p className="mt-3 text-4xl font-bold text-rose-900">
                {comprehensiveStatsLoading ? "..." : comprehensiveStats.totalPayoutRequests.toLocaleString()}
              </p>
              <p className="mt-2 text-sm text-rose-700/70">All payout requests</p>
            </article>

            {/* Total Cash-In */}
            <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-green-50 to-green-100/50 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
              <div className="absolute right-4 top-4 rounded-full bg-green-500/20 p-3">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-green-600/70">Total Cash-In</p>
              <p className="mt-3 text-4xl font-bold text-green-900">
                {comprehensiveStatsLoading ? "..." : formatCurrency(comprehensiveStats.totalCashIn)}
              </p>
              <p className="mt-2 text-sm text-green-700/70">All cash-in transactions</p>
            </article>

            {/* Total Cash-Out */}
            <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-red-50 to-red-100/50 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
              <div className="absolute right-4 top-4 rounded-full bg-red-500/20 p-3">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5z" />
                </svg>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-red-600/70">Total Cash-Out</p>
              <p className="mt-3 text-4xl font-bold text-red-900">
                {comprehensiveStatsLoading ? "..." : formatCurrency(comprehensiveStats.totalCashOut)}
              </p>
              <p className="mt-2 text-sm text-red-700/70">All cash-out transactions</p>
            </article>
          </div>

          {/* Payout Review Statistics */}
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

        </section>
      </main>
    </div>
  );
}
