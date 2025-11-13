"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isAuthenticated } from "../utils/auth";
import { booksApi, CreateBookRequest, usersApi, EndUser } from "../utils/api";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

function AddNewCashbookContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [owners, setOwners] = useState<EndUser[]>([]);
  const [loadingOwners, setLoadingOwners] = useState(true);
  
  const [formData, setFormData] = useState<CreateBookRequest>({
    name: "",
    description: "",
    currencyCode: "INR",
    ownerUserId: "",
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

    // Get name from URL query parameter
    const nameParam = searchParams.get("name");
    if (nameParam) {
      setFormData((prev) => ({
        ...prev,
        name: decodeURIComponent(nameParam),
      }));
    }

    fetchOwners();
  }, [router, mounted, searchParams]);

  const fetchOwners = async () => {
    try {
      setLoadingOwners(true);
      setError(null);
      // Fetch all users (including admins, staff, agents, managers)
      const response = await usersApi.getAllUsers();
      console.log("Fetched users:", response);
      if (response && response.users) {
        setOwners(response.users);
        // Set first owner as default if available
        if (response.users.length > 0 && !formData.ownerUserId) {
          setFormData((prev) => ({
            ...prev,
            ownerUserId: response.users[0].id,
          }));
        }
      } else {
        console.error("Invalid response structure:", response);
        setError("Failed to load users: Invalid response");
      }
    } catch (err: any) {
      console.error("Error fetching owners:", err);
      const errorMessage = err?.message || err?.error?.message || err?.error || "Failed to load users";
      setError(errorMessage);
    } finally {
      setLoadingOwners(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      await booksApi.create(formData);
      setSuccess(true);
      setFormData({
        name: "",
        description: "",
        currencyCode: "INR",
        ownerUserId: owners.length > 0 ? owners[0].id : "",
      });
      
      // Redirect to cashbooks page after 2 seconds
      setTimeout(() => {
        router.push("/cashbooks");
      }, 2000);
    } catch (err: any) {
      console.error("Error creating cashbook:", err);
      const errorMessage = err?.message || err?.error?.message || err?.error || "Failed to create cashbook";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-dark">Add New Cashbook</h2>
              <p className="mt-2 text-sm text-slate-600">
                Create a new cashbook for financial tracking
              </p>
            </div>

            {success && (
              <div className="mb-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-600">
                Cashbook created successfully! Redirecting to cashbooks page...
              </div>
            )}

            {error && (
              <div className="mb-6 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                  Book Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g., Main Business Book, Expenses 2025"
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
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Optional description for this cashbook"
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="currencyCode" className="block text-sm font-medium text-slate-700 mb-2">
                    Currency <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="currencyCode"
                    name="currencyCode"
                    required
                    value={formData.currencyCode}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="INR">INR (Indian Rupee)</option>
                    <option value="USD">USD (US Dollar)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="GBP">GBP (British Pound)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="ownerUserId" className="block text-sm font-medium text-slate-700 mb-2">
                    Owner <span className="text-rose-500">*</span>
                  </label>
                  {loadingOwners ? (
                    <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                      Loading owners...
                    </div>
                  ) : (
                    <select
                      id="ownerUserId"
                      name="ownerUserId"
                      required
                      value={formData.ownerUserId}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select Owner</option>
                      {owners.length === 0 ? (
                        <option value="" disabled>No users available</option>
                      ) : (
                        owners.map((owner) => {
                          const displayName = owner.name || 
                            (owner.firstName || owner.lastName 
                              ? `${owner.firstName || ''} ${owner.lastName || ''}`.trim()
                              : owner.email?.split('@')[0] || 'Unknown');
                          return (
                            <option key={owner.id} value={owner.id}>
                              {displayName} ({owner.email}) - {owner.primaryRole || 'N/A'}
                            </option>
                          );
                        })
                      )}
                    </select>
                  )}
                  {!loadingOwners && owners.length === 0 && (
                    <p className="mt-1 text-xs text-amber-600">
                      No users found. Please create users first.
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-500">
                    Select the user who will own this cashbook. Cashbooks are used to track financial transactions and maintain separate ledgers for different purposes (e.g., expenses, revenue, specific projects).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading || loadingOwners}
                  className="flex-1 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Creating..." : "Create Cashbook"}
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/cashbooks")}
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

export default function AddNewCashbookPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-600">Loading...</p>
      </div>
    }>
      <AddNewCashbookContent />
    </Suspense>
  );
}

