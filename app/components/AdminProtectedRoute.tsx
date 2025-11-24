"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAuthenticated, clearAuth } from "../utils/auth";
import { authApi } from "../utils/api";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Skip protection for login page
      if (pathname === "/login") {
        setIsLoading(false);
        setIsAuthorized(true);
        return;
      }

      // Check if user is authenticated
      if (!isAuthenticated()) {
        router.push("/login");
        return;
      }

      // Verify user is admin by checking with backend
      try {
        const response = await authApi.me();
        const userRole = response.user.role || response.user.roles?.[0];
        const userIsAdmin = userRole === "admin" || response.user.roles?.includes("admin");

        if (!userIsAdmin) {
          // User is not admin, clear auth and redirect
          clearAuth();
          router.push("/login");
          return;
        }

        // User is admin, allow access
        setIsAuthorized(true);
      } catch (error) {
        // Token might be invalid, clear auth and redirect
        clearAuth();
        router.push("/login");
        return;
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, pathname]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#2f4bff] border-r-transparent"></div>
          <p className="mt-4 text-sm text-slate-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}

