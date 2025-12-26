"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../utils/auth";
import { settingsApi, ApkVersion } from "../utils/api";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

type TabType = "mobile-apis" | "mobile-traffic" | "mobile-stats" | "mobile-app-download";

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "/backend");

export default function MobileSettingsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("mobile-apis");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Mobile app download form fields
  const [googlePlayUrl, setGooglePlayUrl] = useState<string>("");
  const [appStoreUrl, setAppStoreUrl] = useState<string>("");
  const [apkDownloadUrl, setApkDownloadUrl] = useState<string>("");
  const [apkFile, setApkFile] = useState<File | null>(null);
  const [apkVersion, setApkVersion] = useState<string>("");
  const [apkFileSize, setApkFileSize] = useState<string>("");
  const [apkUploadMode, setApkUploadMode] = useState<"url" | "file">("url");
  const [apkVersions, setApkVersions] = useState<ApkVersion[]>([]);
  const [savedApkDownloadUrl, setSavedApkDownloadUrl] = useState<string>("");

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    fetchMobileAppSettings();
    fetchApkVersions();
  }, [router]);

  const fetchMobileAppSettings = async () => {
    try {
      setLoading(true);
      const settings = await settingsApi.getSiteSettings();
      setGooglePlayUrl(settings.googlePlayUrl || "");
      setAppStoreUrl(settings.appStoreUrl || "");
      const apkUrl = settings.apkDownloadUrl || "";
      
      // Construct the full download URL for display
      let fullDownloadUrl = "";
      if (apkUrl) {
        if (apkUrl.startsWith("http://") || apkUrl.startsWith("https://")) {
          // It's a full URL
          fullDownloadUrl = apkUrl;
        } else {
          // It's a filename (uploaded file), construct the full URL
          fullDownloadUrl = `${API_BASE}/uploads/${apkUrl}`;
        }
      }
      setSavedApkDownloadUrl(fullDownloadUrl);
      
      // If APK URL exists and doesn't start with http/https, it's a filename (uploaded file)
      if (apkUrl && !apkUrl.startsWith("http://") && !apkUrl.startsWith("https://")) {
        setApkUploadMode("file");
        // For uploaded files, we don't show the filename in the URL input
        // The file was already uploaded, so we leave the input empty
        setApkDownloadUrl("");
      } else {
        setApkUploadMode("url");
        setApkDownloadUrl(apkUrl);
      }
      setApkVersion(settings.apkVersion || "");
      setApkFileSize(settings.apkFileSize || "");
    } catch (err: any) {
      console.error("Error fetching mobile app settings:", err);
      setError(err?.message || "Failed to fetch mobile app settings");
    } finally {
      setLoading(false);
    }
  };

  const fetchApkVersions = async () => {
    try {
      const response = await settingsApi.getApkVersions();
      setApkVersions(response.versions || []);
    } catch (err: any) {
      console.error("Error fetching APK versions:", err);
      // Don't show error for this - just log it
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleApkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      setApkFile(null);
      return;
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.apk') && file.type !== 'application/vnd.android.package-archive' && file.type !== 'application/octet-stream') {
      setError("Please upload an APK file (.apk)");
      return;
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      setError("APK file size should be less than 100MB");
      return;
    }

    setApkFile(file);
    setError(null);

    // Auto-fill file size
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    setApkFileSize(`${sizeInMB} MB`);
  };

  const handleSaveMobileAppSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Convert APK file to base64 if uploaded
      const apkFileBase64 = apkFile ? await fileToBase64(apkFile) : null;

      await settingsApi.updateSiteSettings({
        googlePlayUrl: googlePlayUrl || undefined,
        appStoreUrl: appStoreUrl || undefined,
        apkDownloadUrl: apkUploadMode === "url" ? (apkDownloadUrl || undefined) : undefined,
        apkFile: apkUploadMode === "file" ? (apkFileBase64 || undefined) : undefined,
        apkVersion: apkVersion || undefined,
        apkFileSize: apkFileSize || undefined,
      });
      
      setSuccess("Mobile app download settings updated successfully!");
      
      // Clear file input after successful save
      if (apkFile) {
        setApkFile(null);
        // Reset file input
        const fileInput = document.getElementById('apk-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
      
      // Refresh data to get the updated URL
      await fetchMobileAppSettings();
      await fetchApkVersions();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error updating mobile app settings:", err);
      setError(err?.message || "Failed to update mobile app settings");
    } finally {
      setSaving(false);
    }
  };

  if (!mounted || !isAuthenticated()) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-100">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Header />
          <section className="mx-auto flex w-full flex-col gap-8 px-6 py-10">
            <div className="flex items-center justify-center py-20">
              <p className="text-slate-600">Loading mobile settings...</p>
            </div>
          </section>
        </main>
      </div>
    );
  }

  const tabs = [
    { id: "mobile-apis" as TabType, label: "Mobile APIs" },
    { id: "mobile-traffic" as TabType, label: "Mobile Traffic" },
    { id: "mobile-stats" as TabType, label: "Mobile Stats" },
    { id: "mobile-app-download" as TabType, label: "Mobile App Download" },
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

            {/* Success/Error Messages */}
            {success && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm font-medium text-green-800">{success}</p>
                </div>
              </div>
            )}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            )}

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

              {activeTab === "mobile-app-download" && (
                <div>
                  <h3 className="mb-4 text-base font-semibold text-dark">Mobile App Download</h3>
                  <p className="mb-6 text-sm text-slate-600">
                    Manage mobile app download links and versions for Google Play, App Store, and APK downloads.
                  </p>

                  <div className="space-y-6">
                    {/* Google Play Store */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                          <svg
                            className="h-6 w-6 text-blue-600"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5ZM16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12ZM20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.53 12.9 20.18 13.18L17.89 14.5L15.39 12L17.89 9.5L20.16 10.81ZM6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z" />
                          </svg>
                        </div>
                        <h4 className="text-base font-semibold text-slate-900">Google Play Store</h4>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Google Play Store URL
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="url"
                              value={googlePlayUrl}
                              onChange={(e) => setGooglePlayUrl(e.target.value)}
                              placeholder="https://play.google.com/store/apps/details?id=..."
                              className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                              disabled={loading || saving}
                            />
                            <button 
                              onClick={handleSaveMobileAppSettings}
                              disabled={loading || saving}
                              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {saving ? "Saving..." : "Save"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* App Store */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                          <svg
                            className="h-6 w-6 text-gray-900"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                          </svg>
                        </div>
                        <h4 className="text-base font-semibold text-slate-900">App Store</h4>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            App Store URL
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="url"
                              value={appStoreUrl}
                              onChange={(e) => setAppStoreUrl(e.target.value)}
                              placeholder="https://apps.apple.com/app/id..."
                              className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                              disabled={loading || saving}
                            />
                            <button 
                              onClick={handleSaveMobileAppSettings}
                              disabled={loading || saving}
                              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {saving ? "Saving..." : "Save"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* APK Download */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <svg
                            className="h-6 w-6 text-primary"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
                            />
                          </svg>
                        </div>
                        <h4 className="text-base font-semibold text-slate-900">APK Download</h4>
                      </div>
                      <div className="space-y-4">
                        {/* Upload Mode Toggle */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Upload Method
                          </label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="apk-upload-mode"
                                value="url"
                                checked={apkUploadMode === "url"}
                                onChange={() => setApkUploadMode("url")}
                                className="w-4 h-4 text-primary border-slate-300 focus:ring-primary"
                                disabled={loading || saving}
                              />
                              <span className="text-sm text-slate-700">Enter URL</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="apk-upload-mode"
                                value="file"
                                checked={apkUploadMode === "file"}
                                onChange={() => setApkUploadMode("file")}
                                className="w-4 h-4 text-primary border-slate-300 focus:ring-primary"
                                disabled={loading || saving}
                              />
                              <span className="text-sm text-slate-700">Upload APK File</span>
                            </label>
                          </div>
                        </div>

                        {/* URL Input (shown when mode is "url") */}
                        {apkUploadMode === "url" && (
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              APK Download URL
                            </label>
                            <input
                              type="url"
                              value={apkDownloadUrl}
                              onChange={(e) => setApkDownloadUrl(e.target.value)}
                              placeholder="https://example.com/downloads/hissabbook.apk"
                              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                              disabled={loading || saving}
                            />
                          </div>
                        )}

                        {/* File Upload (shown when mode is "file") */}
                        {apkUploadMode === "file" && (
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              APK File
                            </label>
                            <div className="space-y-2">
                              <input
                                id="apk-file-input"
                                type="file"
                                accept=".apk,application/vnd.android.package-archive"
                                onChange={handleApkFileChange}
                                className="block w-full text-sm text-slate-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={loading || saving}
                              />
                              {apkFile && (
                                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                                  <div className="flex items-center gap-2">
                                    <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-sm font-medium text-green-800">
                                      {apkFile.name} ({(apkFile.size / (1024 * 1024)).toFixed(2)} MB)
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* APK Version */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            APK Version
                          </label>
                          <input
                            type="text"
                            value={apkVersion}
                            onChange={(e) => setApkVersion(e.target.value)}
                            placeholder="1.0.0"
                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            disabled={loading || saving}
                          />
                        </div>

                        {/* File Size */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            File Size
                          </label>
                          <input
                            type="text"
                            value={apkFileSize}
                            onChange={(e) => setApkFileSize(e.target.value)}
                            placeholder="25 MB"
                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            disabled={loading || saving || (apkUploadMode === "file" && apkFile !== null)}
                          />
                          {apkUploadMode === "file" && apkFile && (
                            <p className="mt-1 text-xs text-slate-500">File size is auto-calculated from uploaded file</p>
                          )}
                        </div>

                        {/* Save Button */}
                        <div className="pt-2">
                          <button 
                            onClick={handleSaveMobileAppSettings}
                            disabled={loading || saving || (apkUploadMode === "file" && !apkFile && !apkDownloadUrl) || (apkUploadMode === "url" && !apkDownloadUrl)}
                            className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {saving ? "Saving..." : "Save APK Settings"}
                          </button>
                        </div>

                        {/* Saved APK Download Link */}
                        {savedApkDownloadUrl && (
                          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
                            <div className="flex items-start gap-2">
                              <svg className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-green-900 mb-2">APK Download Link</p>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <a
                                    href={savedApkDownloadUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary hover:text-primary/80 font-medium break-all underline"
                                  >
                                    {savedApkDownloadUrl}
                                  </a>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(savedApkDownloadUrl);
                                      setSuccess("Download link copied to clipboard!");
                                      setTimeout(() => setSuccess(null), 2000);
                                    }}
                                    className="ml-2 rounded-lg border border-green-300 bg-white px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-50 transition"
                                    title="Copy link"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                  </button>
                                </div>
                                {apkVersion && (
                                  <p className="text-xs text-green-700 mt-1">
                                    Version: {apkVersion} {apkFileSize && `• Size: ${apkFileSize}`}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* APK Versions List */}
                    {apkVersions.length > 0 && (
                      <div className="mt-6">
                        <h5 className="text-sm font-semibold text-slate-900 mb-3">Uploaded APK Versions</h5>
                        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-slate-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Version</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">File Size</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Uploaded</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Download</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {apkVersions.map((version) => (
                                  <tr key={version.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 text-sm text-slate-900">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">{version.version}</span>
                                        {version.isCurrent && (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                            Current
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{version.fileSize || 'N/A'}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">
                                      {new Date(version.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                      {version.isCurrent ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                          Active
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600">
                                          Archived
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                      {version.downloadUrl && (
                                        <a
                                          href={version.downloadUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 text-primary hover:text-primary/80 font-medium"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                          </svg>
                                          Download
                                        </a>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Info Note */}
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                      <div className="flex items-start gap-2">
                        <svg className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-sm font-semibold text-blue-900 mb-1">Download Links</p>
                          <p className="text-xs text-blue-700">
                            These download links will be used in the "Download App" modal popup on the website. Make sure URLs are valid and accessible. All uploaded APK versions are stored and can be downloaded.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}

