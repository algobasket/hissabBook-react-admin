"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { isAuthenticated } from "../../utils/auth";
import { usersApi, CreateUserRequest } from "../../utils/api";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;
  
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    if (!mounted || !userId) return;

    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    fetchUser();
  }, [router, mounted, userId]);

  const fetchUser = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await usersApi.getAll();
      const user = response.users.find(u => u.id === userId);
      
      if (!user) {
        setError("User not found");
        return;
      }

      setFormData({
        email: user.email,
        password: "", // Don't pre-fill password
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        upiId: user.upiId || "",
        role: user.primaryRole as "staff" | "agents" | "managers" | "auditor",
      });
    } catch (err: any) {
      console.error("Error fetching user:", err);
      const errorMessage = err?.message || err?.error?.message || err?.error || "Failed to load user";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      await usersApi.update(userId, formData);
      setSuccess(true);
      
      // Redirect to end-users page after 2 seconds
      setTimeout(() => {
        router.push("/end-users");
      }, 2000);
    } catch (err: any) {
      console.error("Error updating user:", err);
      const errorMessage = err?.message || err?.error?.message || err?.error || "Failed to update user";
      setError(errorMessage);
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-100">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Header />
          <section className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-10">
            <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-panel">
              <p className="text-slate-600">Loading user details...</p>
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
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-dark">Edit User</h2>
              <p className="mt-2 text-sm text-slate-600">
                Update user account details and role assignment
              </p>
            </div>

            {success && (
              <div className="mb-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-600">
                User updated successfully! Redirecting to end users page...
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
                    disabled={saving}
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
                    disabled={saving}
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
                  disabled={saving}
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
                  disabled={saving}
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
                  disabled={saving}
                />
                <p className="mt-1 text-xs text-slate-500">Leave empty to auto-generate from phone number (phone@hissabbook)</p>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-600 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-dark focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Leave empty to keep current password"
                  minLength={8}
                  disabled={saving}
                />
                <p className="mt-1 text-xs text-slate-500">Leave empty to keep current password, or enter new password (min 8 characters)</p>
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
                  disabled={saving}
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
                  disabled={saving}
                  className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? "Updating User..." : "Update User"}
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/end-users")}
                  disabled={saving}
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

