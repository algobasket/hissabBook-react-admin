"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../utils/auth";
import { subscriptionPlansApi, SubscriptionPlan, UpdateSubscriptionPlanRequest } from "../utils/api";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function SubscriptionPlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<UpdateSubscriptionPlanRequest>({});

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    fetchPlans();
  }, [router]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await subscriptionPlansApi.getAll();
      setPlans(response.plans || []);
    } catch (err: any) {
      setError(err.message || "Failed to load subscription plans");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setEditForm({
      name: plan.name,
      description: plan.description || "",
      price: plan.price,
      billingPeriod: plan.billingPeriod,
      businessLimit: typeof plan.businessLimit === "number" ? plan.businessLimit : plan.businessLimit === "Unlimited" ? -1 : 1,
      membersPerBusinessLimit: typeof plan.membersPerBusinessLimit === "number" ? plan.membersPerBusinessLimit : plan.membersPerBusinessLimit === "Unlimited" ? -1 : 5,
      features: plan.features || {},
      isActive: plan.isActive,
    });
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    setEditingPlan(null);
    setEditForm({});
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    if (!editingPlan) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await subscriptionPlansApi.update(editingPlan.id, editForm);
      setSuccess("Subscription plan updated successfully!");
      setEditingPlan(null);
      setEditForm({});
      await fetchPlans();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update subscription plan");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number, currency: string = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
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
              <h2 className="text-lg font-semibold text-dark">Subscription Plans</h2>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <button className="rounded-full border border-slate-200 px-4 py-2 hover:border-primary hover:text-primary transition-colors">
                  Export
                </button>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-8">
              Manage subscription plans and their features. Edit plans to update pricing, limits, and availability.
            </p>

            {success && (
              <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-600">
                {success}
              </div>
            )}
            {error && (
              <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-slate-600">Loading subscription plans...</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-100">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Plan Name</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Business Limit</th>
                      <th className="px-4 py-3">Members Limit</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-slate-600">
                    {plans.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                          No subscription plans found
                        </td>
                      </tr>
                    ) : (
                      plans.map((plan) => (
                        <tr key={plan.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-900">{plan.name}</td>
                          <td className="px-4 py-3 text-slate-600">{plan.description || "-"}</td>
                          <td className="px-4 py-3">
                            {plan.price === 0 ? "Free" : formatCurrency(plan.price, plan.currencyCode)}/{plan.billingPeriod}
                          </td>
                          <td className="px-4 py-3">
                            {plan.businessLimit === "Unlimited" || plan.businessLimit === -1 ? "Unlimited" : plan.businessLimit}
                          </td>
                          <td className="px-4 py-3">
                            {plan.membersPerBusinessLimit === "Unlimited" || plan.membersPerBusinessLimit === -1
                              ? "Unlimited"
                              : plan.membersPerBusinessLimit}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                plan.isActive
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {plan.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500">{formatDate(plan.createdAt)}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleEdit(plan)}
                              className="text-primary hover:text-primary/80 font-medium text-sm"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </section>

        {/* Edit Modal */}
        {editingPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="relative mx-4 w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-[#1f2937]">Edit Subscription Plan</h3>
                <button
                  onClick={handleCancel}
                  className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Plan Name</label>
                  <input
                    type="text"
                    value={editForm.name || ""}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    value={editForm.description || ""}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.price || 0}
                      onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Billing Period</label>
                    <select
                      value={editForm.billingPeriod || "month"}
                      onChange={(e) => setEditForm({ ...editForm, billingPeriod: e.target.value as "month" | "year" })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="month">Month</option>
                      <option value="year">Year</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Business Limit (-1 for Unlimited)</label>
                    <input
                      type="number"
                      value={editForm.businessLimit || 1}
                      onChange={(e) => setEditForm({ ...editForm, businessLimit: parseInt(e.target.value) || 1 })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Members per Business Limit (-1 for Unlimited)</label>
                    <input
                      type="number"
                      value={editForm.membersPerBusinessLimit || 5}
                      onChange={(e) => setEditForm({ ...editForm, membersPerBusinessLimit: parseInt(e.target.value) || 5 })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editForm.isActive ?? true}
                      onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                      className="rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-slate-700">Active</span>
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

