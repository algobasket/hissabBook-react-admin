import type { Metadata } from "next";
import LoginForm from "../components/LoginForm";
import FloatingBook from "../components/FloatingBooks";

export const metadata: Metadata = {
  title: "HissabBook Admin • Login",
  description: "Admin Console Login - Use your organisation email and secure passcode to continue",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-slate-50 relative overflow-hidden">
      {/* Left Sidebar - Enhanced */}
      <aside className="hidden w-1/2 bg-gradient-to-br from-primary via-indigo-600 to-purple-700 p-12 text-white lg:flex relative overflow-hidden">
        {/* Floating Books */}
        <FloatingBook delay={0} duration={15} x={10} y={15} size={36} opacity={0.25} />
        <FloatingBook delay={2} duration={18} x={75} y={20} size={32} opacity={0.22} />
        <FloatingBook delay={4} duration={16} x={45} y={60} size={28} opacity={0.28} />
        <FloatingBook delay={6} duration={20} x={20} y={70} size={34} opacity={0.24} />
        <FloatingBook delay={8} duration={17} x={80} y={50} size={30} opacity={0.26} />
        <FloatingBook delay={10} duration={19} x={5} y={40} size={26} opacity={0.23} />
        <FloatingBook delay={12} duration={16} x={90} y={75} size={32} opacity={0.25} />
        <FloatingBook delay={14} duration={18} x={60} y={10} size={28} opacity={0.27} />
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 h-72 w-72 rounded-full bg-white blur-3xl"></div>
          <div className="absolute bottom-20 right-20 h-96 w-96 rounded-full bg-indigo-300 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 h-64 w-64 rounded-full bg-purple-300 blur-3xl"></div>
        </div>
        
        <div className="flex flex-col justify-between relative z-10">
          <div>
            <div className="flex items-center gap-3 text-2xl font-bold mb-16">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-2xl font-bold shadow-lg border border-white/30">
                H
              </span>
              <div>
                <div className="text-white font-bold">HissabBook</div>
                <div className="text-white/80 text-sm font-medium">Admin Console</div>
              </div>
            </div>
            <h1 className="text-5xl font-bold leading-tight mb-6">
              Control finance operations with role-based guardrails.
            </h1>
            <p className="max-w-lg text-base text-white/90 leading-relaxed">
              Review payouts, enforce approval hierarchies, and audit every cash movement with
              bank-grade compliance. Manage your entire financial ecosystem from one secure dashboard.
            </p>
            
            {/* Feature List */}
            <div className="mt-10 space-y-4">
              <div className="flex items-center gap-3 text-white/90">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm border border-white/30">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold">Bank-Grade Security</div>
                  <div className="text-sm text-white/70">Enterprise-level encryption and compliance</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm border border-white/30">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold">24/7 Monitored Infrastructure</div>
                  <div className="text-sm text-white/70">Always-on monitoring and support</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm border border-white/30">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold">NPCI Certified UPI Platform</div>
                  <div className="text-sm text-white/70">Trusted payment infrastructure</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/20">
            <p className="text-sm text-white/70">
              © 2025 HissabBook. All rights reserved.
            </p>
          </div>
        </div>
      </aside>

      {/* Right Side - Login Form */}
      <main className="flex flex-1 items-center justify-center px-6 py-12 bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
        {/* Floating Books on Right Side */}
        <FloatingBook delay={1} duration={14} x={5} y={10} size={24} opacity={0.15} color="slate" />
        <FloatingBook delay={3} duration={17} x={92} y={15} size={22} opacity={0.18} color="slate" />
        <FloatingBook delay={5} duration={15} x={15} y={70} size={26} opacity={0.16} color="slate" />
        <FloatingBook delay={7} duration={19} x={88} y={65} size={24} opacity={0.17} color="slate" />
        <FloatingBook delay={9} duration={16} x={3} y={45} size={22} opacity={0.15} color="slate" />
        <FloatingBook delay={11} duration={18} x={95} y={40} size={26} opacity={0.16} color="slate" />
        <FloatingBook delay={13} duration={15} x={10} y={85} size={24} opacity={0.17} color="slate" />
        <FloatingBook delay={15} duration={20} x={90} y={80} size={22} opacity={0.15} color="slate" />
        
        <div className="w-full max-w-md relative z-10">
          <div className="rounded-[32px] bg-white p-10 shadow-2xl border border-slate-100">
            <div className="space-y-4 text-center mb-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-indigo-600 text-2xl font-bold text-white shadow-lg">
                H
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Admin Console Login</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Use your organisation email and secure passcode to continue.
                </p>
              </div>
            </div>

            <LoginForm />

            <div className="mt-8 space-y-4 text-center">
              <p className="text-xs text-slate-500">
                Need admin access?{" "}
                <a className="font-semibold text-primary hover:text-primary/80 hover:underline transition-colors" href="#">
                  Request approval
                </a>
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                <svg className="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Secured by multi-factor authentication, device fingerprinting and IP allowlists.</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

