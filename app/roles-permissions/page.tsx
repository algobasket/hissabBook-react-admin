"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../utils/auth";
import { rolesApi, permissionsApi, Role, Permission } from "../utils/api";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

type PermissionWithGranted = Permission & {
  granted: boolean;
};

export default function RolesPermissionsPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<PermissionWithGranted[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    fetchRoles();
  }, [router]);

  useEffect(() => {
    if (selectedRole) {
      fetchRolePermissions(selectedRole.id);
    }
  }, [selectedRole]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await rolesApi.getAll();
      setRoles(response.roles);
      if (response.roles.length > 0 && !selectedRole) {
        setSelectedRole(response.roles[0]);
      }
    } catch (err: any) {
      console.error("Error fetching roles:", err);
      setError(err?.message || err?.error?.message || err?.error || "Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  const fetchRolePermissions = async (roleId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await permissionsApi.getRolePermissions(roleId);
      // Map permissions to ensure granted is always a boolean
      const permissionsWithGranted: PermissionWithGranted[] = response.permissions.map(permission => ({
        ...permission,
        granted: permission.granted ?? false,
      }));
      setPermissions(permissionsWithGranted);
    } catch (err: any) {
      console.error("Error fetching role permissions:", err);
      setError(err?.message || err?.error?.message || err?.error || "Failed to load permissions");
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (permissionId: string) => {
    setPermissions((prev) =>
      prev.map((p) => (p.id === permissionId ? { ...p, granted: !p.granted } : p))
    );
  };

  const handleSave = async () => {
    if (!selectedRole) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const grantedPermissionIds = permissions.filter((p) => p.granted).map((p) => p.id);

      await permissionsApi.updateRolePermissions(selectedRole.id, {
        permissionIds: grantedPermissionIds,
      });

      setSuccess("Permissions updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error saving permissions:", err);
      setError(err?.message || err?.error?.message || err?.error || "Failed to save permissions");
    } finally {
      setSaving(false);
    }
  };

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, PermissionWithGranted[]>);

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header />
        <section className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-panel">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-dark">Roles & Permissions</h2>
              <p className="mt-2 text-sm text-slate-600">
                Manage permissions for each role. Permissions control what features users with each role can access.
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                {success}
              </div>
            )}

            {loading && !selectedRole ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-slate-600">Loading roles...</div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Role Selector */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Select Role</label>
                  <select
                    value={selectedRole?.id || ""}
                    onChange={(e) => {
                      const role = roles.find((r) => r.id === e.target.value);
                      setSelectedRole(role || null);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name} {role.description && `- ${role.description}`} ({role.userCount} users)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Permissions by Category */}
                {selectedRole && (
                  <>
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-slate-600">Loading permissions...</div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {Object.entries(groupedPermissions).map(([category, perms]) => (
                          <div key={category} className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                            <h3 className="mb-4 text-lg font-semibold text-[#1f2937]">{category}</h3>
                            <div className="space-y-3">
                              {perms.map((permission) => (
                                <label
                                  key={permission.id}
                                  className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 hover:bg-slate-50 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={permission.granted}
                                    onChange={() => handlePermissionToggle(permission.id)}
                                    className="mt-1 h-4 w-4 rounded border-slate-300 text-[#2f4bff] focus:ring-2 focus:ring-[#2f4bff]"
                                  />
                                  <div className="flex-1">
                                    <div className="font-medium text-[#1f2937]">{permission.name}</div>
                                    {permission.description && (
                                      <div className="mt-1 text-sm text-slate-500">{permission.description}</div>
                                    )}
                                    <div className="mt-1 text-xs text-slate-400 font-mono">{permission.code}</div>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Save Button */}
                    <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="rounded-xl bg-[#2f4bff] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(47,75,255,0.35)] transition hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {saving ? "Saving..." : "Save Permissions"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
