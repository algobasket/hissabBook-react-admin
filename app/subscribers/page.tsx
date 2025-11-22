"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../utils/auth";
import { subscribersApi, Subscriber } from "../utils/api";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function SubscribersPage() {
  const router = useRouter();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    fetchSubscribers();
  }, [router]);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await subscribersApi.getAll();
      setSubscribers(response.subscribers || []);
    } catch (err: any) {
      setError(err.message || "Failed to load subscribers");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-700";
      case "cancelled":
        return "bg-rose-100 text-rose-700";
      case "expired":
        return "bg-slate-100 text-slate-700";
      case "pending":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header />
        <section className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
          <article className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-panel">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-dark">Subscribers</h2>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <button className="rounded-full border border-slate-200 px-4 py-2 hover:border-primary hover:text-primary transition-colors">
                  Export
                </button>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-8">
              View all businesses subscribed to subscription plans and their subscription details.
            </p>

            {error && (
              <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-slate-600">Loading subscribers...</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-100">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Business Name</th>
                      <th className="px-4 py-3">Plan Name</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Start Date</th>
                      <th className="px-4 py-3">End Date</th>
                      <th className="px-4 py-3">Billing Period</th>
                      <th className="px-4 py-3">Auto Renew</th>
                      <th className="px-4 py-3">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-slate-600">
                    {subscribers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                          No subscribers found
                        </td>
                      </tr>
                    ) : (
                      subscribers.map((subscriber) => (
                        <tr key={subscriber.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-900">{subscriber.businessName}</td>
                          <td className="px-4 py-3 text-slate-600">{subscriber.planName}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getStatusColor(
                                subscriber.status
                              )}`}
                            >
                              {subscriber.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500">{formatDate(subscriber.startDate)}</td>
                          <td className="px-4 py-3 text-slate-500">
                            {subscriber.endDate ? formatDate(subscriber.endDate) : "-"}
                          </td>
                          <td className="px-4 py-3 text-slate-500 capitalize">{subscriber.billingPeriod}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                subscriber.autoRenew
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {subscriber.autoRenew ? "Yes" : "No"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500">{formatDate(subscriber.createdAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </section>
      </main>
    </div>
  );
}

