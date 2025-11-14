"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../utils/auth";
import { businessesApi, CreateBusinessRequest } from "../utils/api";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function AddNewBusinessPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState<CreateBusinessRequest>({
    name: "",
    description: "",
    masterWalletUpi: "",
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
  }, [router, mounted]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

    if (!formData.name.trim()) {
      setError("Business name is required");
      return;
    }

    setLoading(true);

    try {
      await businessesApi.create({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        masterWalletUpi: formData.masterWalletUpi.trim() || undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: any) {
      console.error("Error creating business:", err);
      const errorMessage = err?.message || err?.error?.message || err?.error || "Failed to create business";
      setError(errorMessage);
    } finally {
      setLoading(false);
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

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header />
        <section className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-10">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-panel">
            <h1 className="mb-2 text-2xl font-semibold text-dark">Add New Business</h1>
            <p className="mb-8 text-sm text-slate-500">
              Create a new business with a master wallet UPI for financial management
            </p>

            {error && (
              <div className="mb-6 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-600">
                Business created successfully! Redirecting...
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
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Leave empty to auto-generate from business name (format: businessname@hissabbook)
                </p>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Creating..." : "Create Business"}
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  disabled={loading}
                  className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}



