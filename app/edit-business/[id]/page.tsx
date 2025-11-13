"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { isAuthenticated } from "../../utils/auth";
import { businessesApi, UpdateBusinessRequest, Business } from "../../utils/api";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

export default function EditBusinessPage() {
  const router = useRouter();
  const params = useParams();
  const businessId = params?.id as string;
  
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState<UpdateBusinessRequest>({
    name: "",
    description: "",
    masterWalletUpi: "",
    status: "active",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !businessId) return;

    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    fetchBusiness();
  }, [router, mounted, businessId]);

  const fetchBusiness = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await businessesApi.getAllWithWallets();
      const business = response.businesses.find(b => b.id === businessId);
      
      if (!business) {
        setError("Business not found");
        return;
      }

      setFormData({
        name: business.name,
        description: business.description || "",
        masterWalletUpi: business.masterWalletUpi || "",
        status: business.status as "active" | "inactive",
      });
    } catch (err: any) {
      console.error("Error fetching business:", err);
      const errorMessage = err?.message || err?.error?.message || err?.error || "Failed to load business";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.name?.trim()) {
      setError("Business name is required");
      return;
    }

    setSaving(true);

    try {
      await businessesApi.update(businessId, {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        masterWalletUpi: formData.masterWalletUpi?.trim() || undefined,
        status: formData.status,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/business-owner");
      }, 1500);
    } catch (err: any) {
      console.error("Error updating business:", err);
      const errorMessage = err?.message || err?.error?.message || err?.error || "Failed to update business";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this business? This action cannot be undone and will delete all associated records.")) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await businessesApi.delete(businessId);
      // Redirect to business owner page after successful deletion
      router.push("/business-owner");
    } catch (err: any) {
      console.error("Error deleting business:", err);
      const errorMessage = err?.message || err?.error?.message || err?.error || "Failed to delete business";
      setError(errorMessage);
    } finally {
      setDeleting(false);
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

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-100">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Header />
          <section className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-10">
            <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-panel">
              <p className="text-slate-600">Loading business details...</p>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header />
        <section className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-10">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-panel">
            <h1 className="mb-2 text-2xl font-semibold text-dark">Edit Business</h1>
            <p className="mb-8 text-sm text-slate-500">
              Update business information and master wallet UPI
            </p>

            {error && (
              <div className="mb-6 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-600">
                Business updated successfully! Redirecting...
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                  Business Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Algobasket, Kripa"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  disabled={saving}
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Brief description of the business"
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  disabled={saving}
                />
              </div>

              <div>
                <label htmlFor="masterWalletUpi" className="block text-sm font-medium text-slate-700 mb-2">
                  Master Wallet UPI ID
                </label>
                <input
                  type="text"
                  id="masterWalletUpi"
                  name="masterWalletUpi"
                  value={formData.masterWalletUpi}
                  onChange={handleChange}
                  placeholder="e.g., businessname@hissabbook"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  disabled={saving}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Changing the UPI ID will regenerate the QR code
                </p>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  disabled={saving}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-4">
                  <button
                    type="submit"
                    disabled={saving || deleting}
                    className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/business-owner")}
                    disabled={saving || deleting}
                    className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving || deleting}
                  className="rounded-xl border border-red-200 bg-white px-6 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {deleting ? "Deleting..." : "Delete Business"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}

