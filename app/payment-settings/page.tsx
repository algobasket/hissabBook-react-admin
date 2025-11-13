"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../utils/auth";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function PaymentSettingsPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [router]);

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
            <p className="mt-4 text-sm text-slate-600">Payment settings page coming soon...</p>
          </div>
        </section>
      </main>
    </div>
  );
}

