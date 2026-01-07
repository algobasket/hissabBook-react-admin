"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../utils/auth";
import { settingsApi, MaintenanceSettings } from "../utils/api";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function MaintainancePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  
  const [formData, setFormData] = useState<MaintenanceSettings>({
    title: "",
    message: "",
    blockStaff: false,
    blockManager: false,
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

    fetchMaintenanceSettings();
  }, [router, mounted]);

  const fetchMaintenanceSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await settingsApi.getMaintenanceSettings();
      console.log('Fetched maintenance settings:', {
        raw: data,
        blockStaff: data.blockStaff,
        blockStaffType: typeof data.blockStaff,
        blockManager: data.blockManager,
        blockManagerType: typeof data.blockManager,
      });
      
      // Ensure booleans are properly converted - handle all possible formats
      // The API might return strings, numbers, or booleans, so we need to handle all cases
      const blockStaffValue: unknown = data.blockStaff;
      let blockStaff = false;
      if (typeof blockStaffValue === 'boolean') {
        blockStaff = blockStaffValue;
      } else if (typeof blockStaffValue === 'string') {
        blockStaff = blockStaffValue.toLowerCase() === 'true' || blockStaffValue === '1';
      } else if (typeof blockStaffValue === 'number') {
        blockStaff = blockStaffValue === 1;
      } else {
        blockStaff = Boolean(blockStaffValue);
      }
      
      const blockManagerValue: unknown = data.blockManager;
      let blockManager = false;
      if (typeof blockManagerValue === 'boolean') {
        blockManager = blockManagerValue;
      } else if (typeof blockManagerValue === 'string') {
        blockManager = blockManagerValue.toLowerCase() === 'true' || blockManagerValue === '1';
      } else if (typeof blockManagerValue === 'number') {
        blockManager = blockManagerValue === 1;
      } else {
        blockManager = Boolean(blockManagerValue);
      }
      
      console.log('Converted values:', { blockStaff, blockManager });
      
      setFormData({
        title: data.title || "",
        message: data.message || "",
        blockStaff: blockStaff,
        blockManager: blockManager,
      });
    } catch (err: any) {
      console.error("Error fetching maintenance settings:", err);
      if (err?.status === 404) {
        // Settings don't exist yet, use defaults
        setFormData({
          title: "",
          message: "",
          blockStaff: false,
          blockManager: false,
        });
      } else {
        setError(err?.message || "Failed to load maintenance settings.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await settingsApi.updateMaintenanceSettings(formData);
      setSuccess("Maintenance settings saved successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error saving maintenance settings:", {
        error: err,
        message: err?.message,
        status: err?.status,
        errorObj: err?.error,
        fullError: JSON.stringify(err, null, 2),
      });
      
      // Extract error message from various possible locations
      const errorMessage = 
        err?.message || 
        err?.error?.message || 
        err?.error?.raw || 
        (typeof err?.error === 'string' ? err.error : null) ||
        "Failed to save maintenance settings.";
      
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const toggleBlockStaff = () => {
    const newValue = !formData.blockStaff;
    setFormData({ ...formData, blockStaff: newValue });
    setToast({
      message: newValue 
        ? 'Staff access blocked - Staff users will not be able to login' 
        : 'Staff access unblocked - Staff users can now login',
      type: 'info'
    });
    // Auto-hide toast after 3 seconds
    setTimeout(() => setToast(null), 3000);
  };

  const toggleBlockManager = () => {
    const newValue = !formData.blockManager;
    setFormData({ ...formData, blockManager: newValue });
    setToast({
      message: newValue 
        ? 'Manager access blocked - Manager users will not be able to login' 
        : 'Manager access unblocked - Manager users can now login',
      type: 'info'
    });
    // Auto-hide toast after 3 seconds
    setTimeout(() => setToast(null), 3000);
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
        
        {/* Toast Notification */}
        {toast && (
          <div 
            className="fixed top-4 right-4 z-50"
            style={{
              animation: 'fadeInSlide 0.3s ease-out',
            }}
          >
            <div className={`rounded-lg shadow-lg px-4 py-3 min-w-[300px] max-w-md ${
              toast.type === 'success' 
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                : 'bg-blue-50 border border-blue-200 text-blue-800'
            }`}>
              <div className="flex items-center gap-3">
                {toast.type === 'success' ? (
                  <svg className="h-5 w-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <p className="text-sm font-medium flex-1">{toast.message}</p>
                <button
                  onClick={() => setToast(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label="Close toast"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
        
        <section className="mx-auto flex w-full flex-col gap-8 px-6 py-10">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-panel">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-dark">Maintainance</h2>
              <p className="mt-2 text-sm text-slate-600">
                Configure system maintenance settings and schedules.
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-600">
                {success}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-slate-600">Loading maintainance settings...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Maintenance Title */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Maintainance Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Enter maintenance title"
                  />
                </div>

                {/* Maintenance Description/Message */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Maintainance Description or Message
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={5}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Enter maintenance message or description"
                  />
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>

                {/* Access Control Toggles */}
                <div className="mt-8 pt-8 border-t border-slate-200">
                  <h3 className="text-base font-semibold text-dark mb-4">Access Control</h3>
                  <p className="text-sm text-slate-600 mb-6">
                    When toggled ON, Staff or Manager users will not be able to login during maintenance.
                  </p>

                  {/* Staff Toggle */}
                  <div className="flex items-center justify-between py-4 border-b border-slate-100">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Block Staff Access
                      </label>
                      <p className="text-xs text-slate-500">
                        When ON, Staff users cannot login
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleBlockStaff}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        formData.blockStaff ? "bg-primary" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.blockStaff ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Manager Toggle */}
                  <div className="flex items-center justify-between py-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Block Manager Access
                      </label>
                      <p className="text-xs text-slate-500">
                        When ON, Manager users cannot login
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleBlockManager}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        formData.blockManager ? "bg-primary" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.blockManager ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}



