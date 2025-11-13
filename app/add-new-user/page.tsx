"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../utils/auth";
import { usersApi, CreateUserRequest } from "../utils/api";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function AddNewUserPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState<CreateUserRequest>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    upiId: "",
    role: "staff",
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      await usersApi.create(formData);
      setSuccess(true);
      setFormData({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        phone: "",
        upiId: "",
        role: "staff",
      });
      
      // Redirect to end-users page after 2 seconds
      setTimeout(() => {
        router.push("/end-users");
      }, 2000);
    } catch (err: any) {
      console.error("Error creating user:", err);
      const errorMessage = err?.message || err?.error?.message || err?.error || "Failed to create user";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
              <h2 className="text-lg font-semibold text-dark">Add New User</h2>
              <p className="mt-2 text-sm text-slate-600">
                Create a new end user account with role assignment
              </p>
            </div>

            {success && (
              <div className="mb-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-600">
                User created successfully! Redirecting to end users page...
              </div>
            )}

            {error && (
              <div className="mb-6 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-slate-600 mb-2">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-dark focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="John"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-slate-600 mb-2">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-dark focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Doe"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-600 mb-2">
                  Email <span className="text-rose-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-dark focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="user@example.com"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-600 mb-2">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-dark focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="+91 9876543210"
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-slate-500">If UPI ID is not provided, it will auto-generate as phone@hissabbook</p>
              </div>

              <div>
                <label htmlFor="upiId" className="block text-sm font-medium text-slate-600 mb-2">
                  UPI ID
                </label>
                <input
                  id="upiId"
                  name="upiId"
                  type="text"
                  value={formData.upiId}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-dark focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="user@paytm or leave empty to auto-generate"
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-slate-500">Leave empty to auto-generate from phone number (phone@hissabbook)</p>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-600 mb-2">
                  Password <span className="text-rose-500">*</span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-dark focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Minimum 8 characters"
                  minLength={8}
                  required
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-slate-500">Password must be at least 8 characters long</p>
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-slate-600 mb-2">
                  Role <span className="text-rose-500">*</span>
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-dark focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                  disabled={loading}
                >
                  <option value="staff">Staff</option>
                  <option value="agents">Agent</option>
                  <option value="managers">Manager</option>
                  <option value="auditor">Auditor</option>
                </select>
                <p className="mt-1 text-xs text-slate-500">Select the role for this user</p>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating User..." : "Create User"}
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/end-users")}
                  disabled={loading}
                  className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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

