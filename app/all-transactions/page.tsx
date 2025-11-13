"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../utils/auth";
import { transactionsApi, Transaction } from "../utils/api";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function AllTransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    fetchTransactions();
  }, [router, mounted, selectedType, selectedStatus]);

  const fetchTransactions = () => {
    setLoading(true);
    setError(null);

    transactionsApi
      .getAll({ type: selectedType, status: selectedStatus, limit: 100 })
      .then((response) => {
        setTransactions(response.transactions || []);
      })
      .catch((err: any) => {
        console.error("Error fetching transactions:", err);
        let errorMessage = err?.message || err?.error?.message || `Failed to load transactions (${err?.status || "Unknown error"})`;
        
        if (err?.status === 401) {
          errorMessage = "Session expired. Please log in again.";
          setTimeout(() => {
            router.push("/login");
          }, 2000);
        }
        
        setError(errorMessage);
      })
      .finally(() => {
        setLoading(false);
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

  const formatAmount = (amount: number, type: string) => {
    const formatted = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Math.abs(amount));

    // Show debit/credit indicator
    const isDebit = type?.toLowerCase().includes('debit') || type?.toLowerCase().includes('out') || type?.toLowerCase().includes('expense');
    const isCredit = type?.toLowerCase().includes('credit') || type?.toLowerCase().includes('in') || type?.toLowerCase().includes('income');

    if (isDebit) {
      return <span className="text-rose-600 font-semibold">-{formatted}</span>;
    } else if (isCredit) {
      return <span className="text-emerald-600 font-semibold">+{formatted}</span>;
    }
    return <span className="font-semibold">{formatted}</span>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string }> = {
      pending: { bg: "bg-amber-100", text: "text-amber-600" },
      completed: { bg: "bg-emerald-100", text: "text-emerald-600" },
      failed: { bg: "bg-rose-100", text: "text-rose-600" },
      cancelled: { bg: "bg-slate-100", text: "text-slate-600" },
    };

    const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;

    return (
      <span className={`rounded-full ${config.bg} ${config.text} px-3 py-1 text-xs font-semibold`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1) || "Pending"}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeColors: Record<string, string> = {
      credit: "bg-blue-100 text-blue-600",
      debit: "bg-purple-100 text-purple-600",
      transfer: "bg-indigo-100 text-indigo-600",
      payment: "bg-orange-100 text-orange-600",
    };

    const colorClass = typeColors[type?.toLowerCase()] || "bg-slate-100 text-slate-600";

    return (
      <span className={`rounded-full ${colorClass} px-3 py-1 text-xs font-semibold`}>
        {type || "Unknown"}
      </span>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header />
        <section className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-panel">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className="text-lg font-semibold text-dark">All Transactions</h2>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <label htmlFor="type-filter">Type</label>
                <select
                  id="type-filter"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 focus:border-primary focus:ring-primary/20"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  disabled={loading}
                >
                  <option value="all">All Types</option>
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                  <option value="transfer">Transfer</option>
                  <option value="payment">Payment</option>
                </select>
                <label htmlFor="status-filter">Status</label>
                <select
                  id="status-filter"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 focus:border-primary focus:ring-primary/20"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  disabled={loading}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button className="rounded-full border border-slate-200 px-4 py-2 hover:border-primary hover:text-primary transition-colors">
                  Export CSV
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-slate-600">Loading transactions...</p>
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
                      <th className="px-4 py-3">Transaction ID</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Book</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-slate-600">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                          No transactions found
                        </td>
                      </tr>
                    ) : (
                      transactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-4 font-mono text-xs text-slate-500">
                            {transaction.id.substring(0, 8)}...
                          </td>
                          <td className="px-4 py-4">
                            {getTypeBadge(transaction.type)}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-dark">{transaction.userFullName}</span>
                              {transaction.userEmail && (
                                <span className="text-xs text-slate-500">{transaction.userEmail}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 max-w-xs truncate" title={transaction.description || ""}>
                            {transaction.description || "-"}
                          </td>
                          <td className="px-4 py-4">
                            {transaction.bookName ? (
                              <span className="text-slate-700">{transaction.bookName}</span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right">
                            {formatAmount(transaction.amount, transaction.type)}
                          </td>
                          <td className="px-4 py-4">
                            {getStatusBadge(transaction.status)}
                          </td>
                          <td className="px-4 py-4 text-slate-500">
                            {formatDate(transaction.occurredAt)}
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
