"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../utils/auth";
import { settingsApi } from "../utils/api";
import { clearCurrencyCache } from "../utils/currency";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

const CURRENCIES = [
  { code: "INR", name: "INR (Indian Rupee)" },
  { code: "USD", name: "USD (US Dollar)" },
  { code: "EUR", name: "EUR (Euro)" },
  { code: "GBP", name: "GBP (British Pound)" },
];

export default function PaymentSettingsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("INR");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    fetchPaymentCurrency();
  }, [router, mounted]);

  const fetchPaymentCurrency = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await settingsApi.getPaymentCurrency();
      setSelectedCurrency(data.currency || "INR");
    } catch (err: any) {
      console.error("Error fetching payment currency:", err);
      setError(err?.message || "Failed to load payment currency setting");
      // Default to INR on error
      setSelectedCurrency("INR");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await settingsApi.updatePaymentCurrency(selectedCurrency);
      setSuccess("Payment currency updated successfully!");
      
      // Clear currency cache so all pages will fetch the new currency
      clearCurrencyCache();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error updating payment currency:", err);
      setError(err?.message || "Failed to update payment currency");
    } finally {
      setSaving(false);
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
        <section className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-panel">
            <h2 className="text-lg font-semibold text-dark">Payment Settings</h2>
            <p className="mt-2 text-sm text-slate-600">
              Configure system-wide payment currency settings. This currency will be used across all cashbooks and payments.
            </p>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
                {success}
              </div>
            )}

            <div className="mt-6">
              <label htmlFor="currency" className="block text-sm font-medium text-slate-700 mb-2">
                Payment Currency <span className="text-rose-500">*</span>
              </label>
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-primary"></div>
                  Loading...
                </div>
              ) : (
                <>
                  <select
                    id="currency"
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                    className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    disabled={saving}
                  >
                    {CURRENCIES.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-slate-500">
                    This currency will be the only option available in currency dropdowns throughout the application.
                  </p>
                </>
              )}
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={loading || saving}
                className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

