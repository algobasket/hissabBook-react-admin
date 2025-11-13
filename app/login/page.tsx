import type { Metadata } from "next";
import LoginForm from "../components/LoginForm";

export const metadata: Metadata = {
  title: "HissabBook Admin • Login",
  description: "Admin Console Login - Use your organisation email and secure passcode to continue",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="hidden w-1/2 bg-gradient-to-br from-primary via-indigo-500 to-slate-900 p-12 text-white lg:flex">
        <div className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 text-xl font-semibold">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-lg font-bold">
                H
              </span>
              HissabBook Admin
            </div>
            <h1 className="mt-16 text-4xl font-bold leading-tight">
              Control finance operations with role-based guardrails.
            </h1>
            <p className="mt-6 max-w-md text-sm text-white/70">
              Review payouts, enforce approval hierarchies, and audit every cash movement with
              bank-grade compliance.
            </p>
          </div>
          <div className="space-y-3 text-sm text-white/60">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              24/7 monitored infrastructure
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-sky-400"></span>
              NPCI certified UPI platform
            </div>
          </div>
        </div>
      </aside>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-[32px] bg-white p-10 shadow-card">
          <div className="space-y-3 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-lg font-semibold text-primary">
              H
            </div>
            <h2 className="text-2xl font-semibold text-dark">Admin Console Login</h2>
            <p className="text-sm text-slate-500">
              Use your organisation email and secure passcode to continue.
            </p>
          </div>

          <LoginForm />

          <div className="mt-10 space-y-3 text-center text-xs text-slate-500">
            <p>
              Need admin access?{" "}
              <a className="font-semibold text-primary hover:underline" href="#">
                Request approval
              </a>
            </p>
            <p>
              Secured by multi-factor authentication, device fingerprinting and IP allowlists.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

