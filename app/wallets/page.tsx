"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../utils/auth";
import { walletsApi, Wallet } from "../utils/api";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function WalletsPage() {
  const router = useRouter();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    fetchWallets();
  }, [router, mounted]);

  const fetchWallets = () => {
    setLoading(true);
    setError(null);

    walletsApi
      .getAll()
      .then((response) => {
        setWallets(response.wallets || []);
      })
      .catch((err: any) => {
        console.error("Error fetching wallets:", err);
        let errorMessage = err?.message || err?.error?.message || `Failed to load wallets (${err?.status || "Unknown error"})`;
        
        if (err?.status === 401) {
          errorMessage = "Session expired. Please log in again.";
          setTimeout(() => {
            router.push("/login");
          }, 2000);
        }
        
        setError(errorMessage);
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

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPhone = (phone: string | null) => {
    if (!phone) return "-";
    // Format Indian phone numbers
    if (phone.length === 10) {
      return `+91 ${phone.substring(0, 5)} ${phone.substring(5)}`;
    }
    return phone;
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header />
        <section className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-panel">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className="text-lg font-semibold text-dark">User Wallets</h2>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <button className="rounded-full border border-slate-200 px-4 py-2 hover:border-primary hover:text-primary transition-colors">
                  Export CSV
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-slate-600">Loading wallets...</p>
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
                      <th className="px-4 py-3">Mobile Number</th>
                      <th className="px-4 py-3">First Name</th>
                      <th className="px-4 py-3">Last Name</th>
                      <th className="px-4 py-3">UPI ID</th>
                      <th className="px-4 py-3">Email ID</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-slate-600">
                    {wallets.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                          No wallets found
                        </td>
                      </tr>
                    ) : (
                      wallets.map((wallet) => (
                        <tr key={wallet.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-4">{formatPhone(wallet.phone)}</td>
                          <td className="px-4 py-4 font-medium text-dark">
                            {wallet.firstName || "-"}
                          </td>
                          <td className="px-4 py-4 font-medium text-dark">
                            {wallet.lastName || "-"}
                          </td>
                          <td className="px-4 py-4">
                            {wallet.upiId ? (
                              <span className="font-medium text-slate-700">{wallet.upiId}</span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-4">{wallet.email}</td>
                          <td className="px-4 py-4 text-right">
                            <span className="font-semibold text-dark">
                              {formatAmount(wallet.balance)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
