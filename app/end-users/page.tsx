"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../utils/auth";
import { usersApi, EndUser } from "../utils/api";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function EndUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<EndUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("All");
  const [mounted, setMounted] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [banningUserId, setBanningUserId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    fetchUsers();
  }, [router, selectedRole, mounted]);

  const fetchUsers = (suppressErrors = false) => {
    setLoading(true);
    if (!suppressErrors) {
      setError(null);
    }

    usersApi
      .getAll(selectedRole)
      .then((response) => {
        setUsers(response.users);
        if (suppressErrors) {
          setError(null); // Clear any previous errors on success
        }
      })
      .catch((err: any) => {
        console.error("Error fetching users:", err);
        if (!suppressErrors) {
          const errorMessage = err?.message || err?.error?.message || err?.error || "Failed to load users";
          setError(errorMessage);
        }
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      staff: "Staff",
      agents: "Agent",
      managers: "Manager",
    };
    return roleMap[role] || role.charAt(0).toUpperCase() + role.slice(1);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user? This will permanently delete all their records from all tables. This action cannot be undone.")) {
      setDeleteConfirmId(null);
      return;
    }

    setDeletingUserId(userId);
    setError(null);

    try {
      const response = await usersApi.delete(userId);
      console.log("Delete response:", response);
      
      // Clear the confirm state first
      setDeleteConfirmId(null);
      
      // Refresh the list after a short delay to ensure backend has processed
      // Use suppressErrors=true to avoid showing errors from refresh
      setTimeout(() => {
        fetchUsers(true);
      }, 500);
    } catch (err: any) {
      console.error("Error deleting user:", err);
      // Better error message extraction
      let errorMessage = "Failed to delete user";
      if (err?.message) {
        errorMessage = err.message;
      } else if (err?.error?.message) {
        errorMessage = err.error.message;
      } else if (err?.error) {
        errorMessage = typeof err.error === 'string' ? err.error : JSON.stringify(err.error);
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      setError(errorMessage);
      setDeleteConfirmId(null);
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleBanUser = async (userId: string, currentlyBanned: boolean) => {
    setBanningUserId(userId);
    setError(null);

    try {
      await usersApi.ban(userId, !currentlyBanned);
      // Refresh the list
      await fetchUsers();
    } catch (err: any) {
      console.error("Error banning/unbanning user:", err);
      const errorMessage = err?.message || err?.error?.message || err?.error || "Failed to ban/unban user";
      setError(errorMessage);
    } finally {
      setBanningUserId(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header />
        <section className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
          <article className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-panel">
            <h2 className="text-lg font-semibold text-dark">What end users can do</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>• Initiate payout requests for staff advances, vendor payments, reimbursements.</li>
              <li>• Attach bills and categorize requests by cost center and ledger.</li>
              <li>• Monitor request status: Pending, Accepted, Rejected; view reviewer notes.</li>
              <li>• Edit or cancel requests before owner review begins.</li>
            </ul>
          </article>

          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-panel">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-dark">Active End Users</h3>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <label>Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option>All</option>
                  <option>Staff</option>
                  <option>Agent</option>
                  <option>Manager</option>
                </select>
                <button
                  onClick={() => router.push("/add-new-user")}
                  className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-colors"
                >
                  + Add New User
                </button>
              </div>
            </div>

            {loading ? (
              <div className="mt-6 flex items-center justify-center py-12">
                <p className="text-slate-600">Loading users...</p>
              </div>
            ) : error ? (
              <div className="mt-6 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                {error}
              </div>
            ) : (
              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Pending Requests</th>
                      <th className="px-4 py-3">Last Active</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-slate-600">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-4 font-semibold text-dark">{user.name}</td>
                          <td className="px-4 py-4">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 capitalize">
                              {getRoleDisplayName(user.primaryRole)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-slate-600">{user.email}</td>
                          <td className="px-4 py-4">
                            {user.pendingRequests > 0 ? (
                              <span className="font-semibold text-dark">{user.pendingRequests}</span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-slate-500">
                            {formatDate(user.lastLoginAt)}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => router.push(`/edit-user/${user.id}`)}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleBanUser(user.id, user.status === 'inactive')}
                                disabled={banningUserId === user.id}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                  user.status === 'inactive'
                                    ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                }`}
                              >
                                {banningUserId === user.id
                                  ? "Processing..."
                                  : user.status === 'inactive'
                                  ? "Unban"
                                  : "Ban"}
                              </button>
                              {deleteConfirmId === user.id ? (
                                <>
                                  <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    disabled={deletingUserId === user.id}
                                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    {deletingUserId === user.id ? "Deleting..." : "Confirm Delete"}
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirmId(user.id)}
                                  disabled={deletingUserId === user.id}
                                  className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-panel">
            <h3 className="text-lg font-semibold text-dark">Request lifecycle for end users</h3>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-600">
                <p className="text-base font-semibold text-dark">Create</p>
                <p className="mt-2">Provide purpose, amount, ledger, attachments.</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-600">
                <p className="text-base font-semibold text-dark">Pending</p>
                <p className="mt-2">
                  Monitor queue, receive comments, upload additional proof if requested.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-600">
                <p className="text-base font-semibold text-dark">Decision</p>
                <p className="mt-2">
                  Accepted → auto cash-out; Rejected → edit &amp; resubmit with updated details.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
