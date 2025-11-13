"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../utils/auth";
import { rolesApi, PermissionMatrixItem } from "../utils/api";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function RolesPermissionsPage() {
  const router = useRouter();
  const [permissionsMatrix, setPermissionsMatrix] = useState<PermissionMatrixItem[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    fetchPermissionsMatrix();
  }, [router]);

  const fetchPermissionsMatrix = () => {
    setLoading(true);
    setError(null);

    rolesApi
      .getPermissionsMatrix()
      .then((response) => {
        setPermissionsMatrix(response.permissionsMatrix);
        setNotes(response.notes);
      })
      .catch((err: any) => {
        console.error("Error fetching permissions matrix:", err);
        const errorMessage = err?.message || err?.error?.message || err?.error || "Failed to load permissions matrix";
        setError(errorMessage);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const renderPermission = (permission: string) => {
    if (permission === "✔") {
      return <span className="text-emerald-600 font-semibold">✔</span>;
    }
    if (permission === "—") {
      return <span className="text-slate-400">—</span>;
    }
    return <span className="text-slate-600">{permission}</span>;
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
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-panel">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-dark">Roles & Permissions Matrix</h2>
              <p className="mt-2 text-sm text-slate-600">
                The following matrix summarises what each persona can do within the HissabBook finance control center. Permissions are additive: higher roles inherit capabilities of lower tiers unless explicitly noted.
              </p>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-slate-600">Loading permissions matrix...</div>
              </div>
            )}

            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                {error}
              </div>
            )}

            {!loading && !error && permissionsMatrix.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Capability</th>
                      <th className="px-6 py-4">End User</th>
                      <th className="px-6 py-4">Business Owner / Admin</th>
                      <th className="px-6 py-4">Auditor</th>
                      <th className="px-6 py-4">Platform Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-slate-600">
                    {permissionsMatrix.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-semibold text-dark">{item.capability}</td>
                        <td className="px-6 py-4">{renderPermission(item.endUser)}</td>
                        <td className="px-6 py-4">{renderPermission(item.businessOwner)}</td>
                        <td className="px-6 py-4">{renderPermission(item.auditor)}</td>
                        <td className="px-6 py-4">{renderPermission(item.platformAdmin)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>

          {!loading && !error && notes.length > 0 && (
            <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-panel">
              <h3 className="text-lg font-semibold text-dark">Key Notes</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                {notes.map((note, index) => (
                  <li key={index}>• {note}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

