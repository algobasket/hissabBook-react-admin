"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../utils/auth";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

type TabType = "mobile-apis" | "mobile-traffic" | "mobile-stats";

export default function MobileSettingsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("mobile-apis");

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
  }, [router]);

  if (!mounted || !isAuthenticated()) {
    return null;
  }

  const tabs = [
    { id: "mobile-apis" as TabType, label: "Mobile APIs" },
    { id: "mobile-traffic" as TabType, label: "Mobile Traffic" },
    { id: "mobile-stats" as TabType, label: "Mobile Stats" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header />
        <section className="mx-auto flex w-full flex-col gap-8 px-6 py-10">
          <article className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-panel">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-dark">Mobile Settings</h2>
              <p className="mt-2 text-sm text-slate-600">
                Configure mobile application settings and preferences.
              </p>
            </div>

            {/* Tabs */}
            <div className="mb-6 border-b border-slate-200">
              <div className="flex gap-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-3 text-sm font-medium transition ${
                      activeTab === tab.id
                        ? "border-b-2 border-primary text-primary"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {activeTab === "mobile-apis" && (
                <div>
                  <h3 className="mb-4 text-base font-semibold text-dark">Mobile APIs</h3>
                  <p className="mb-6 text-sm text-slate-600">
                    API endpoints for mobile application integration. Use these endpoints in your mobile app.
                  </p>

                  <div className="space-y-4">
                    {/* API Base URL */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                        API Base URL
                      </label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 rounded-lg bg-white border border-slate-200 px-4 py-2 text-sm font-mono text-slate-900">
                          {typeof window !== "undefined" 
                            ? window.location.hostname === "localhost"
                              ? "http://localhost:5000"
                              : `${window.location.protocol}//${window.location.host}/backend`
                            : "http://localhost:5000"}
                        </code>
                        <button
                          onClick={() => {
                            const baseUrl = typeof window !== "undefined" 
                              ? window.location.hostname === "localhost"
                                ? "http://localhost:5000"
                                : `${window.location.protocol}//${window.location.host}/backend`
                              : "http://localhost:5000";
                            navigator.clipboard.writeText(baseUrl);
                          }}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    {/* API Endpoints */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-slate-700">Available Endpoints</h4>
                      
                      {/* Authentication Endpoints */}
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <h5 className="text-sm font-semibold text-slate-900 mb-3">Authentication</h5>
                        <div className="space-y-2">
                          <div className="flex items-start gap-3">
                            <span className="inline-flex items-center rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">POST</span>
                            <div className="flex-1">
                              <code className="text-sm font-mono text-slate-900">/api/auth/login</code>
                              <p className="text-xs text-slate-500 mt-1">User login endpoint</p>
                            </div>
                            <button
                              onClick={() => {
                                const url = `${typeof window !== "undefined" 
                                  ? window.location.hostname === "localhost"
                                    ? "http://localhost:5000"
                                    : `${window.location.protocol}//${window.location.host}/backend`
                                  : "http://localhost:5000"}/api/auth/login`;
                                navigator.clipboard.writeText(url);
                              }}
                              className="text-xs text-primary hover:text-primary/80"
                            >
                              Copy
                            </button>
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="inline-flex items-center rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">POST</span>
                            <div className="flex-1">
                              <code className="text-sm font-mono text-slate-900">/api/auth/register</code>
                              <p className="text-xs text-slate-500 mt-1">User registration endpoint</p>
                            </div>
                            <button
                              onClick={() => {
                                const url = `${typeof window !== "undefined" 
                                  ? window.location.hostname === "localhost"
                                    ? "http://localhost:5000"
                                    : `${window.location.protocol}//${window.location.host}/backend`
                                  : "http://localhost:5000"}/api/auth/register`;
                                navigator.clipboard.writeText(url);
                              }}
                              className="text-xs text-primary hover:text-primary/80"
                            >
                              Copy
                            </button>
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="inline-flex items-center rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">GET</span>
                            <div className="flex-1">
                              <code className="text-sm font-mono text-slate-900">/api/auth/me</code>
                              <p className="text-xs text-slate-500 mt-1">Get current user information</p>
                            </div>
                            <button
                              onClick={() => {
                                const url = `${typeof window !== "undefined" 
                                  ? window.location.hostname === "localhost"
                                    ? "http://localhost:5000"
                                    : `${window.location.protocol}//${window.location.host}/backend`
                                  : "http://localhost:5000"}/api/auth/me`;
                                navigator.clipboard.writeText(url);
                              }}
                              className="text-xs text-primary hover:text-primary/80"
                            >
                              Copy
                            </button>
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="inline-flex items-center rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">GET</span>
                            <div className="flex-1">
                              <code className="text-sm font-mono text-slate-900">/api/auth/account-details</code>
                              <p className="text-xs text-slate-500 mt-1">Get user account details</p>
                            </div>
                            <button
                              onClick={() => {
                                const url = `${typeof window !== "undefined" 
                                  ? window.location.hostname === "localhost"
                                    ? "http://localhost:5000"
                                    : `${window.location.protocol}//${window.location.host}/backend`
                                  : "http://localhost:5000"}/api/auth/account-details`;
                                navigator.clipboard.writeText(url);
                              }}
                              className="text-xs text-primary hover:text-primary/80"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Business Endpoints */}
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <h5 className="text-sm font-semibold text-slate-900 mb-3">Businesses</h5>
                        <div className="space-y-2">
                          <div className="flex items-start gap-3">
                            <span className="inline-flex items-center rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">GET</span>
                            <div className="flex-1">
                              <code className="text-sm font-mono text-slate-900">/api/businesses</code>
                              <p className="text-xs text-slate-500 mt-1">Get all businesses for the user</p>
                            </div>
                            <button
                              onClick={() => {
                                const url = `${typeof window !== "undefined" 
                                  ? window.location.hostname === "localhost"
                                    ? "http://localhost:5000"
                                    : `${window.location.protocol}//${window.location.host}/backend`
                                  : "http://localhost:5000"}/api/businesses`;
                                navigator.clipboard.writeText(url);
                              }}
                              className="text-xs text-primary hover:text-primary/80"
                            >
                              Copy
                            </button>
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="inline-flex items-center rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">GET</span>
                            <div className="flex-1">
                              <code className="text-sm font-mono text-slate-900">/api/businesses/:id</code>
                              <p className="text-xs text-slate-500 mt-1">Get specific business details</p>
                            </div>
                            <button
                              onClick={() => {
                                const url = `${typeof window !== "undefined" 
                                  ? window.location.hostname === "localhost"
                                    ? "http://localhost:5000"
                                    : `${window.location.protocol}//${window.location.host}/backend`
                                  : "http://localhost:5000"}/api/businesses/:id`;
                                navigator.clipboard.writeText(url);
                              }}
                              className="text-xs text-primary hover:text-primary/80"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Cashbooks Endpoints */}
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <h5 className="text-sm font-semibold text-slate-900 mb-3">Cashbooks</h5>
                        <div className="space-y-2">
                          <div className="flex items-start gap-3">
                            <span className="inline-flex items-center rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">GET</span>
                            <div className="flex-1">
                              <code className="text-sm font-mono text-slate-900">/api/books</code>
                              <p className="text-xs text-slate-500 mt-1">Get all cashbooks</p>
                            </div>
                            <button
                              onClick={() => {
                                const url = `${typeof window !== "undefined" 
                                  ? window.location.hostname === "localhost"
                                    ? "http://localhost:5000"
                                    : `${window.location.protocol}//${window.location.host}/backend`
                                  : "http://localhost:5000"}/api/books`;
                                navigator.clipboard.writeText(url);
                              }}
                              className="text-xs text-primary hover:text-primary/80"
                            >
                              Copy
                            </button>
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="inline-flex items-center rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">GET</span>
                            <div className="flex-1">
                              <code className="text-sm font-mono text-slate-900">/api/books/:id</code>
                              <p className="text-xs text-slate-500 mt-1">Get specific cashbook details</p>
                            </div>
                            <button
                              onClick={() => {
                                const url = `${typeof window !== "undefined" 
                                  ? window.location.hostname === "localhost"
                                    ? "http://localhost:5000"
                                    : `${window.location.protocol}//${window.location.host}/backend`
                                  : "http://localhost:5000"}/api/books/:id`;
                                navigator.clipboard.writeText(url);
                              }}
                              className="text-xs text-primary hover:text-primary/80"
                            >
                              Copy
                            </button>
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="inline-flex items-center rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">POST</span>
                            <div className="flex-1">
                              <code className="text-sm font-mono text-slate-900">/api/books</code>
                              <p className="text-xs text-slate-500 mt-1">Create a new cashbook</p>
                            </div>
                            <button
                              onClick={() => {
                                const url = `${typeof window !== "undefined" 
                                  ? window.location.hostname === "localhost"
                                    ? "http://localhost:5000"
                                    : `${window.location.protocol}//${window.location.host}/backend`
                                  : "http://localhost:5000"}/api/books`;
                                navigator.clipboard.writeText(url);
                              }}
                              className="text-xs text-primary hover:text-primary/80"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Transactions Endpoints */}
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <h5 className="text-sm font-semibold text-slate-900 mb-3">Transactions</h5>
                        <div className="space-y-2">
                          <div className="flex items-start gap-3">
                            <span className="inline-flex items-center rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">GET</span>
                            <div className="flex-1">
                              <code className="text-sm font-mono text-slate-900">/api/transactions</code>
                              <p className="text-xs text-slate-500 mt-1">Get all transactions</p>
                            </div>
                            <button
                              onClick={() => {
                                const url = `${typeof window !== "undefined" 
                                  ? window.location.hostname === "localhost"
                                    ? "http://localhost:5000"
                                    : `${window.location.protocol}//${window.location.host}/backend`
                                  : "http://localhost:5000"}/api/transactions`;
                                navigator.clipboard.writeText(url);
                              }}
                              className="text-xs text-primary hover:text-primary/80"
                            >
                              Copy
                            </button>
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="inline-flex items-center rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">POST</span>
                            <div className="flex-1">
                              <code className="text-sm font-mono text-slate-900">/api/transactions</code>
                              <p className="text-xs text-slate-500 mt-1">Create a new transaction</p>
                            </div>
                            <button
                              onClick={() => {
                                const url = `${typeof window !== "undefined" 
                                  ? window.location.hostname === "localhost"
                                    ? "http://localhost:5000"
                                    : `${window.location.protocol}//${window.location.host}/backend`
                                  : "http://localhost:5000"}/api/transactions`;
                                navigator.clipboard.writeText(url);
                              }}
                              className="text-xs text-primary hover:text-primary/80"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Subscription Endpoints */}
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <h5 className="text-sm font-semibold text-slate-900 mb-3">Subscriptions</h5>
                        <div className="space-y-2">
                          <div className="flex items-start gap-3">
                            <span className="inline-flex items-center rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">GET</span>
                            <div className="flex-1">
                              <code className="text-sm font-mono text-slate-900">/api/subscriptions/plans</code>
                              <p className="text-xs text-slate-500 mt-1">Get all subscription plans</p>
                            </div>
                            <button
                              onClick={() => {
                                const url = `${typeof window !== "undefined" 
                                  ? window.location.hostname === "localhost"
                                    ? "http://localhost:5000"
                                    : `${window.location.protocol}//${window.location.host}/backend`
                                  : "http://localhost:5000"}/api/subscriptions/plans`;
                                navigator.clipboard.writeText(url);
                              }}
                              className="text-xs text-primary hover:text-primary/80"
                            >
                              Copy
                            </button>
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="inline-flex items-center rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">GET</span>
                            <div className="flex-1">
                              <code className="text-sm font-mono text-slate-900">/api/subscriptions/current</code>
                              <p className="text-xs text-slate-500 mt-1">Get current business subscription</p>
                            </div>
                            <button
                              onClick={() => {
                                const url = `${typeof window !== "undefined" 
                                  ? window.location.hostname === "localhost"
                                    ? "http://localhost:5000"
                                    : `${window.location.protocol}//${window.location.host}/backend`
                                  : "http://localhost:5000"}/api/subscriptions/current`;
                                navigator.clipboard.writeText(url);
                              }}
                              className="text-xs text-primary hover:text-primary/80"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Settings Endpoints */}
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <h5 className="text-sm font-semibold text-slate-900 mb-3">Settings</h5>
                        <div className="space-y-2">
                          <div className="flex items-start gap-3">
                            <span className="inline-flex items-center rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">GET</span>
                            <div className="flex-1">
                              <code className="text-sm font-mono text-slate-900">/api/settings/payment-currency/public</code>
                              <p className="text-xs text-slate-500 mt-1">Get system payment currency (public endpoint)</p>
                            </div>
                            <button
                              onClick={() => {
                                const url = `${typeof window !== "undefined" 
                                  ? window.location.hostname === "localhost"
                                    ? "http://localhost:5000"
                                    : `${window.location.protocol}//${window.location.host}/backend`
                                  : "http://localhost:5000"}/api/settings/payment-currency/public`;
                                navigator.clipboard.writeText(url);
                              }}
                              className="text-xs text-primary hover:text-primary/80"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Authentication Note */}
                    <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <div className="flex items-start gap-2">
                        <svg className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-sm font-semibold text-amber-900 mb-1">Authentication Required</p>
                          <p className="text-xs text-amber-700">
                            Most endpoints require authentication. Include the JWT token in the Authorization header: <code className="bg-amber-100 px-1 rounded">Bearer YOUR_TOKEN</code>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "mobile-traffic" && (
                <div>
                  <h3 className="mb-4 text-base font-semibold text-dark">Mobile Traffic</h3>
                  <p className="text-sm text-slate-500">Mobile traffic analytics and monitoring coming soon...</p>
                </div>
              )}

              {activeTab === "mobile-stats" && (
                <div>
                  <h3 className="mb-4 text-base font-semibold text-dark">Mobile Stats</h3>
                  <p className="text-sm text-slate-500">Mobile application statistics and metrics coming soon...</p>
                </div>
              )}
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}

