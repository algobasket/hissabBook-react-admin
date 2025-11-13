// Authentication utility functions for Admin Panel

export interface User {
  id: string;
  email: string;
  status: string;
  roles?: string[];
  role?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("adminAuthToken");
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem("adminUser");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
}

export function setAuth(token: string, user: User): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("adminAuthToken", token);
  localStorage.setItem("adminUser", JSON.stringify(user));
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("adminAuthToken");
  localStorage.removeItem("adminUser");
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

export function getUserRole(): string | null {
  const user = getUser();
  return user?.role || user?.roles?.[0] || null;
}

export function hasRole(role: string): boolean {
  const user = getUser();
  if (!user) return false;
  return user.roles?.includes(role) || user.role === role || false;
}

export function isAdmin(): boolean {
  return hasRole("admin");
}

