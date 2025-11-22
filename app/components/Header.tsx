"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser, clearAuth } from "../utils/auth";
import { authApi } from "../utils/api";

export default function Header() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setUser(getUser());
  }, []);

  const userInitials = user?.email
    ?.split("@")[0]
    .substring(0, 2)
    .toUpperCase() || "AD";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Ignore logout errors
    } finally {
      clearAuth();
      router.push("/login");
    }
  };

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold text-dark">Admin Control Center</h1>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
          Live
        </span>
      </div>
      <div className="flex items-center gap-4">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 hover:border-primary transition-colors text-slate-700"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {mounted ? userInitials : "AD"}
              </span>
              <span className="text-sm font-medium text-slate-700">{mounted ? (user?.email || "Admin") : "Admin"}</span>
              <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white shadow-lg z-50 overflow-hidden">
                {/* User Info Section */}
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {mounted ? userInitials : "AD"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">
                        {mounted ? (user?.email?.split("@")[0] || "Admin") : "Admin"}
                      </div>
                      {user?.email && (
                        <div className="text-xs text-slate-500 truncate">{user.email}</div>
                      )}
                    </div>
                  </div>
                  <a
                    href="/account-info"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Your Profile
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>

                {/* Logout */}
                <div className="py-1 border-b border-slate-100">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                    </svg>
                    Logout
                  </button>
                </div>

                {/* Mobile App Section */}
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="text-xs font-medium text-slate-500 mb-2">Mobile App</div>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      // Add download app logic here
                      alert("Mobile app download coming soon!");
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group"
                  >
                    <svg className="h-5 w-5 text-slate-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5A2.25 2.25 0 008.25 22.5h7.5A2.25 2.25 0 0018 20.25V3.75A2.25 2.25 0 0015.75 1.5H10.5M12 2.25v.75m0 3v.75m0 3v.75m0 3v.75m6-9.75H18a.75.75 0 00-.75.75v4.5c0 .414.336.75.75.75h.75a.75.75 0 00.75-.75V6a.75.75 0 00-.75-.75z" />
                    </svg>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Download App</span>
                  </a>
                </div>

                {/* Copyright and Version */}
                <div className="px-4 py-2 bg-slate-50">
                  <div className="text-xs text-slate-500 text-center">
                    © HissabBook • Version 1.0.0
                  </div>
                </div>
              </div>
            )}
          </div>
      </div>
    </header>
  );
}

