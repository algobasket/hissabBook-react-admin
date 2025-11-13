"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../utils/auth";
import { rolesApi, Role } from "../utils/api";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function RolesPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    // Fetch roles data
    rolesApi
      .getAll()
      .then((response) => {
        setRoles(response.roles);
      })
      .catch((err) => {
        setError(err.message || "Failed to load roles");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  if (!isAuthenticated()) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header />
        <section className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
          <article className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-panel">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-dark">Role Overview</h2>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <button className="rounded-full border border-slate-200 px-4 py-2 hover:border-primary hover:text-primary transition-colors">
                  Export
                </button>
                <button className="rounded-full border border-slate-200 px-4 py-2 hover:border-primary hover:text-primary transition-colors">
                  Audit Trail
                </button>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-8">
              Roles enforce least-privilege access and streamline payout governance. Each persona has
              clearly defined capabilities that align with their job responsibilities.
            </p>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-slate-600">Loading roles...</p>
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
                      <th className="px-4 py-3">Role Name</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Users</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-slate-600">
                    {roles.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                          No roles found
                        </td>
                      </tr>
                    ) : (
                      roles.map((role) => (
                        <tr key={role.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-4">
                            <span className="font-semibold text-dark capitalize">{role.name}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-slate-600">
                              {role.description || "No description"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                              {role.userCount} {role.userCount === 1 ? "user" : "users"}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-slate-500">{formatDate(role.createdAt)}</td>
                          <td className="px-4 py-4 text-slate-500">{formatDate(role.updatedAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </article>

          <div className="grid gap-6 md:grid-cols-2">
            <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-panel">
              <h3 className="text-base font-semibold text-dark">End User (Staff / Agent / Manager)</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li>• Initiate payout requests with amount, category, and ledger mapping</li>
                <li>• Upload supporting bills, invoices, receipts</li>
                <li>• Track status and comments while request is pending or after decision</li>
              </ul>
            </article>
            <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-panel">
              <h3 className="text-base font-semibold text-dark">Business Owner / Admin</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li>• Review queue with filters, inspect attachments, and add decision notes</li>
                <li>• Accept / Reject requests; accepted requests auto-post to cash-out ledgers</li>
                <li>• Rejections capture reason; reversals require escalation to platform admin</li>
              </ul>
            </article>
            <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-panel">
              <h3 className="text-base font-semibold text-dark">Auditor (Optional)</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li>• Read-only access to requests, ledgers, and decisions</li>
                <li>• Download audit logs for compliance</li>
                <li>• Flag anomalies for follow-up without altering records</li>
              </ul>
            </article>
            <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-panel">
              <h3 className="text-base font-semibold text-dark">Platform Admin (Controlled)</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li>• Manage role assignments and critical overrides</li>
                <li>• Handle rare payout reversals with dual approval trail</li>
              </ul>
            </article>
          </div>

          <article className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-panel">
            <h2 className="text-lg font-semibold text-dark">Lifecycle Guardrails</h2>
            <p className="mt-4 text-sm text-slate-600">
              Each payout moves through a controlled lifecycle. Owners can only move requests forward;
              regressions or reversals are locked behind the platform admin process to prevent tampering.
              All actions are captured in the immutable audit log for auditor review.
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}
