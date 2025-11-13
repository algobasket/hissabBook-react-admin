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
    <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-600" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          placeholder="finance.lead@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-dark focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
          required
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm font-medium text-slate-600">
          <label htmlFor="password">Passcode</label>
          <a className="text-primary hover:underline" href="#">
            Forgot?
          </a>
        </div>
        <input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-dark focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
          required
          disabled={loading}
        />
      </div>
      <div className="flex items-center justify-between">
        <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
          <input
            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/40"
            type="checkbox"
            checked={rememberDevice}
            onChange={(e) => setRememberDevice(e.target.checked)}
            disabled={loading}
          />
          Remember this device
        </label>
        <a className="text-sm font-semibold text-primary hover:underline" href="#">
          Security Tips
        </a>
      </div>
      {error && (
        <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
          {error}
        </div>
      )}
      <button
        className="w-full rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(35,87,255,0.25)] transition hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
        type="submit"
        disabled={loading}
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}

