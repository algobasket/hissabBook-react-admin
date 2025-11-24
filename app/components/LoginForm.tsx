"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "../utils/api";
import { setAuth } from "../utils/auth";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberDevice, setRememberDevice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await authApi.login({ email, password });
      
      // Check if user has admin role
      const userRole = response.user.role || response.user.roles?.[0];
      const isAdmin = userRole === "admin" || response.user.roles?.includes("admin");
      
      if (!isAdmin) {
        setError("Access denied. Only administrators can access the admin console.");
        // Clear any partial auth data
        if (typeof window !== "undefined") {
          localStorage.removeItem("adminAuthToken");
          localStorage.removeItem("adminUser");
        }
        return;
      }
      
      // Store authentication data
      setAuth(response.token, response.user);

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setError(apiError.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700" htmlFor="email">
          Email
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          </div>
          <input
            id="email"
            type="email"
            placeholder="admin@hissabbook.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 py-3.5 text-sm font-medium text-slate-900 placeholder-slate-400 transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            required
            disabled={loading}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700" htmlFor="password">
          Passcode
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <input
            id="password"
            type="password"
            placeholder="Enter your passcode"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 py-3.5 text-sm font-medium text-slate-900 placeholder-slate-400 transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            required
            disabled={loading}
          />
        </div>
      </div>
      
      <div className="pt-2">
        <label className="inline-flex items-center gap-2.5 text-sm font-medium text-slate-700 cursor-pointer group">
          <input
            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-2 focus:ring-primary/40 focus:ring-offset-0 cursor-pointer transition-colors"
            type="checkbox"
            checked={rememberDevice}
            onChange={(e) => setRememberDevice(e.target.checked)}
            disabled={loading}
          />
          <span className="group-hover:text-slate-900 transition-colors">Remember this device</span>
        </label>
      </div>
      
      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm font-medium text-rose-700 flex items-center gap-2">
          <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
      
      <button
        className="w-full rounded-xl bg-gradient-to-r from-primary to-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
        type="submit"
        disabled={loading}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Signing in...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            Sign in
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        )}
      </button>
    </form>
  );
}

