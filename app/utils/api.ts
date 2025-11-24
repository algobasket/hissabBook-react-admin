// API utility for communicating with the backend
// NOTE: This admin app uses ONLY hissabbook-nodejs-backend (port 5000)
// It does NOT use hissabbook-api-system

import { getAuthToken, setAuth } from "./auth";

// For local development, use localhost:5000 directly
// For production (with nginx), use /backend
const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "/backend");

export interface ApiError {
  message: string;
  status?: number;
  error?: any;
}

// Helper function to check if token is about to expire (within 1 hour)
function isTokenExpiringSoon(token: string | null): boolean {
  if (!token) return false;
  try {
    // JWT tokens have 3 parts: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Decode the payload (base64)
    const payload = JSON.parse(atob(parts[1]));
    const exp = payload.exp; // Expiration time in seconds
    
    if (!exp) return false;
    
    // Check if token expires within 1 hour (3600 seconds)
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = exp - now;
    
    return timeUntilExpiry < 3600 && timeUntilExpiry > 0;
  } catch {
    return false;
  }
}

// Helper function to refresh token proactively
async function refreshTokenIfNeeded(): Promise<boolean> {
  const token = getAuthToken();
  if (!token) return false;
  
  // Check if token is expiring soon
  if (!isTokenExpiringSoon(token)) return false;
  
  try {
    const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ||
      (typeof window !== "undefined" && window.location.hostname === "localhost"
        ? "http://localhost:5000"
        : "/backend");
    
    const refreshResponse = await fetch(`${API_BASE}/api/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (refreshResponse.ok) {
      const refreshData = await refreshResponse.json();
      if (refreshData.token && refreshData.user) {
        setAuth(refreshData.token, refreshData.user);
        return true;
      }
    }
  } catch (error) {
    console.error('Failed to refresh token proactively:', error);
  }
  
  return false;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Proactively refresh token if it's expiring soon
  await refreshTokenIfNeeded();
  
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  // Only set Content-Type if there's a body
  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint}`;
  console.log(`[API] ${options.method || 'GET'} ${url}`, token ? 'with token' : 'no token');

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (fetchError: any) {
    console.error(`[API] Fetch failed for ${options.method || 'GET'} ${url}:`, fetchError);
    const error: ApiError = {
      message: fetchError.message || 'Failed to fetch - check if backend server is running',
      error: fetchError,
    };
    throw error;
  }

  if (!response.ok) {
    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401 && getAuthToken()) {
      try {
        // Try to refresh the token
        const refreshResponse = await fetch(`${API_BASE}/api/auth/refresh-token`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
          },
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          // Update token using setAuth utility
          if (refreshData.token && refreshData.user) {
            setAuth(refreshData.token, refreshData.user);
          }
          
          // Retry the original request with new token
          const retryHeaders: Record<string, string> = {
            ...(options.headers as Record<string, string> || {}),
            'Authorization': `Bearer ${refreshData.token}`,
          };
          if (options.body) {
            retryHeaders['Content-Type'] = 'application/json';
          }

          const retryResponse = await fetch(url, {
            ...options,
            headers: retryHeaders,
          });

          if (retryResponse.ok) {
            return retryResponse.json() as Promise<T>;
          }
        }
      } catch (refreshError) {
        // If refresh fails, clear auth and let the error propagate
        if (typeof window !== 'undefined') {
          localStorage.removeItem('adminAuthToken');
          localStorage.removeItem('adminUser');
        }
      }
    }

    let errorData: any = {};
    let responseText = '';
    try {
      responseText = await response.text();
      if (responseText) {
        errorData = JSON.parse(responseText);
      }
    } catch {
      // If response is not JSON, use status text
      errorData = { message: response.statusText || `HTTP error! status: ${response.status}`, raw: responseText };
    }
    
    const error: ApiError = {
      message: errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      status: response.status,
      error: errorData,
    };
    console.error(`[API Error] ${options.method || 'GET'} ${url} - Status: ${response.status}`, errorData);
    throw error;
  }

  return response.json() as Promise<T>;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    status: string;
    roles?: string[];
    role?: string;
  };
}

export interface MeResponse {
  user: {
    id: string;
    email: string;
    status: string;
    roles?: string[];
    role?: string;
    createdAt: string;
    lastLoginAt?: string;
  };
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RolesResponse {
  roles: Role[];
}

export interface PermissionMatrixItem {
  capability: string;
  endUser: string;
  businessOwner: string;
  auditor: string;
  platformAdmin: string;
}

export interface RolesPermissionsResponse {
  permissionsMatrix: PermissionMatrixItem[];
  notes: string[];
}

export const authApi = {
  login: (credentials: LoginRequest) =>
    apiRequest<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  logout: () =>
    apiRequest<{ success: boolean }>("/api/auth/logout", {
      method: "POST",
    }),

  me: () => apiRequest<MeResponse>("/api/auth/me"),
};

export const rolesApi = {
  getAll: () => apiRequest<RolesResponse>("/api/roles"),
  getPermissionsMatrix: () => apiRequest<RolesPermissionsResponse>("/api/roles-permissions"),
};

export interface Permission {
  id: string;
  name: string;
  code: string;
  description: string | null;
  category: string;
  granted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PermissionsResponse {
  permissions: Permission[];
}

export interface UpdateRolePermissionsRequest {
  permissionIds: string[];
}

export interface UpdateRolePermissionsResponse {
  success: boolean;
  message: string;
}

export const permissionsApi = {
  getAll: () => apiRequest<PermissionsResponse>("/api/permissions"),
  getRolePermissions: (roleId: string) =>
    apiRequest<PermissionsResponse>(`/api/roles/${roleId}/permissions`),
  updateRolePermissions: (roleId: string, data: UpdateRolePermissionsRequest) =>
    apiRequest<UpdateRolePermissionsResponse>(`/api/roles/${roleId}/permissions`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

export interface EndUser {
  id: string;
  email: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  upiId: string | null;
  status: string;
  roles: string[];
  primaryRole: string;
  pendingRequests: number;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface EndUsersResponse {
  users: EndUser[];
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  upiId?: string;
  role: "staff" | "agents" | "managers" | "auditor";
}

export interface CreateUserResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    upiId: string | null;
    status: string;
    roles: string[];
    createdAt: string;
  };
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  phone: string | null;
  upiId: string | null;
  upiQrCode: string | null;
  status: string;
  roles: Array<{ name: string; description: string | null }>;
  walletBalance: number;
  walletCurrency: string;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AdminUsersResponse {
  admins: AdminUser[];
}

export const usersApi = {
  getAll: (role?: string) => {
    const params = role && role !== 'All' ? `?role=${encodeURIComponent(role)}` : '';
    return apiRequest<EndUsersResponse>(`/api/users${params}`);
  },

  getAllUsers: () => {
    return apiRequest<EndUsersResponse>("/api/users/all");
  },

  getAdmins: () => {
    return apiRequest<AdminUsersResponse>("/api/users/admin");
  },

  create: (data: CreateUserRequest) =>
    apiRequest<CreateUserResponse>("/api/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<CreateUserRequest>) =>
    apiRequest<CreateUserResponse>(`/api/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  ban: (id: string, banned: boolean) =>
    apiRequest<{ success: boolean; message: string; status: string }>(`/api/users/${id}/ban`, {
      method: "PATCH",
      body: JSON.stringify({ banned }),
    }),

  delete: (id: string) =>
    apiRequest<{ success: boolean; message: string }>(`/api/users/${id}`, {
      method: "DELETE",
    }),
};

export interface PayoutRequest {
  id: string;
  reference: string;
  submittedBy: string;
  amount: number;
  utr: string;
  remarks: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  userEmail: string;
  userPhone: string | null;
  proofFilename?: string | null;
}

export interface PayoutRequestsResponse {
  payoutRequests: PayoutRequest[];
}

export interface UpdateStatusRequest {
  status: "accepted" | "rejected";
  notes: string;
}

export interface UpdateStatusResponse {
  success: boolean;
  request: PayoutRequest;
}

export interface DeletePayoutRequestResponse {
  success: boolean;
  message: string;
}

export const payoutRequestsApi = {
  getAll: (status?: string) => {
    const params = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
    return apiRequest<PayoutRequestsResponse>(`/api/payout-requests${params}`);
  },

  updateStatus: (id: string, data: UpdateStatusRequest) =>
    apiRequest<UpdateStatusResponse>(`/api/payout-requests/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<DeletePayoutRequestResponse>(`/api/payout-requests/${id}`, {
      method: "DELETE",
    }),
};

export interface Wallet {
  id: string;
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  phone: string | null;
  upiId: string | null;
  balance: number;
  currencyCode: string;
  userStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletsResponse {
  wallets: Wallet[];
}

export interface Book {
  id: string;
  name: string;
  description: string | null;
  currencyCode: string;
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  ownerFirstName: string | null;
  ownerLastName: string | null;
  ownerPhone: string | null;
  transactionCount: number;
  totalBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface BooksResponse {
  books: Book[];
}

export interface CreateBookRequest {
  name: string;
  description?: string;
  currencyCode?: string;
  ownerUserId: string;
}

export interface CreateBookResponse {
  success: boolean;
  book: Book;
}

export interface BookResponse {
  book: Book;
}

export interface BookUsersResponse {
  users: EndUser[];
}

export interface AddUserToBookRequest {
  userId: string;
}

export interface AddUserToBookResponse {
  success: boolean;
  user: EndUser;
}

export interface RemoveUserFromBookResponse {
  success: boolean;
  message: string;
}

export const booksApi = {
  getAll: (filters?: { status?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }
    if (filters?.search && filters.search.trim() !== '') {
      params.append('search', filters.search.trim());
    }
    const queryString = params.toString();
    return apiRequest<BooksResponse>(`/api/books${queryString ? `?${queryString}` : ''}`);
  },

  getById: (id: string) => {
    return apiRequest<BookResponse>(`/api/books/${id}`);
  },

  getUsers: (id: string) => {
    return apiRequest<BookUsersResponse>(`/api/books/${id}/users`);
  },

  addUser: (bookId: string, data: AddUserToBookRequest) => {
    return apiRequest<AddUserToBookResponse>(`/api/books/${bookId}/users`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  removeUser: (bookId: string, userId: string) => {
    return apiRequest<RemoveUserFromBookResponse>(`/api/books/${bookId}/users/${userId}`, {
      method: "DELETE",
    });
  },

  create: (data: CreateBookRequest) =>
    apiRequest<CreateBookResponse>("/api/books", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  delete: (id: string) => {
    return apiRequest<{ success: boolean; message: string }>(`/api/books/${id}`, {
      method: "DELETE",
    });
  },
};

export const walletsApi = {
  getAll: () => apiRequest<WalletsResponse>("/api/wallets"),
};

export interface Transaction {
  id: string;
  type: string;
  status: string;
  amount: number;
  currencyCode: string;
  description: string | null;
  metadata: any;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
  userId: string | null;
  bookId: string | null;
  walletId: string | null;
  userEmail: string | null;
  userFirstName: string | null;
  userLastName: string | null;
  userFullName: string;
  userPhone: string | null;
  bookName: string | null;
}

export interface TransactionsResponse {
  transactions: Transaction[];
}

export interface DeleteTransactionResponse {
  success: boolean;
  message: string;
}

export const transactionsApi = {
  getAll: (filters?: { type?: string; status?: string; limit?: number; offset?: number }) => {
    const params = new URLSearchParams();
    if (filters?.type && filters.type !== 'all') params.append('type', filters.type);
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());
    const queryString = params.toString();
    return apiRequest<TransactionsResponse>(`/api/transactions${queryString ? `?${queryString}` : ''}`);
  },

  getByBookId: (bookId: string, filters?: { type?: string; status?: string; limit?: number; offset?: number }) => {
    const params = new URLSearchParams();
    if (filters?.type && filters.type !== 'all') params.append('type', filters.type);
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());
    const queryString = params.toString();
    return apiRequest<TransactionsResponse>(`/api/transactions/book/${bookId}${queryString ? `?${queryString}` : ''}`);
  },

  delete: (id: string) =>
    apiRequest<DeleteTransactionResponse>(`/api/transactions/${id}`, {
      method: "DELETE",
    }),
};

// Dashboard API
export interface DashboardStats {
  pendingReviews: number;
  approvedToday: number;
  exceptions: number;
}

export interface DashboardStatsResponse {
  pendingReviews: number;
  approvedToday: number;
  exceptions: number;
}

export interface DashboardPayoutRequest {
  id: string;
  requestId: string;
  amount: number;
  utr: string;
  remarks: string;
  status: string;
  userEmail: string | null;
  userName: string;
  userRole: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardPayoutQueueResponse {
  payoutRequests: DashboardPayoutRequest[];
}

export interface PaymentCurrencyResponse {
  currency: string;
}

export interface UpdatePaymentCurrencyRequest {
  currency: string;
}

export interface UpdatePaymentCurrencyResponse {
  success: boolean;
  message: string;
  currency: string;
}

export const settingsApi = {
  getPaymentCurrency: () => {
    return apiRequest<PaymentCurrencyResponse>('/api/settings/payment-currency');
  },

  updatePaymentCurrency: (currency: string) => {
    return apiRequest<UpdatePaymentCurrencyResponse>('/api/settings/payment-currency', {
      method: 'PUT',
      body: JSON.stringify({ currency }),
    });
  },
};

export interface ComprehensiveStats {
  totalBusinesses: number;
  totalCashbooks: number;
  totalManagers: number;
  totalStaffs: number;
  totalPayoutRequests: number;
  totalCashIn: number;
  totalCashOut: number;
}

export const dashboardApi = {
  getStats: (dateFilter?: 'all' | 'today') => {
    const params = new URLSearchParams();
    if (dateFilter) {
      params.append('date_filter', dateFilter);
    }
    const queryString = params.toString();
    return apiRequest<DashboardStatsResponse>(`/api/dashboard/stats${queryString ? `?${queryString}` : ''}`);
  },
  getPayoutQueue: (status?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (limit) params.append('limit', limit.toString());
    const queryString = params.toString();
    return apiRequest<DashboardPayoutQueueResponse>(`/api/dashboard/payout-queue${queryString ? `?${queryString}` : ''}`);
  },
  getComprehensiveStats: (dateFilter?: 'all' | 'today') => {
    const params = new URLSearchParams();
    if (dateFilter) {
      params.append('date_filter', dateFilter);
    }
    const queryString = params.toString();
    return apiRequest<ComprehensiveStats>(`/api/dashboard/comprehensive-stats${queryString ? `?${queryString}` : ''}`);
  },
};

// Business API
export interface Business {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  masterWalletUpi: string | null;
  masterWalletQrCode: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessesResponse {
  businesses: Business[];
}

export interface CreateBusinessRequest {
  name: string;
  description?: string;
  masterWalletUpi?: string;
}

export interface CreateBusinessResponse {
  success: boolean;
  business: Business;
}

export interface UpdateBusinessRequest {
  name?: string;
  description?: string;
  masterWalletUpi?: string;
  status?: 'active' | 'inactive';
}

export interface DeleteBusinessResponse {
  success: boolean;
  message: string;
}

export const businessesApi = {
  getAll: () => {
    return apiRequest<BusinessesResponse>("/api/businesses");
  },
  getAllWithWallets: () => {
    return apiRequest<BusinessesResponse>("/api/businesses-wallets");
  },
  create: (data: CreateBusinessRequest) => {
    return apiRequest<CreateBusinessResponse>("/api/businesses", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  update: (id: string, data: UpdateBusinessRequest) => {
    return apiRequest<CreateBusinessResponse>(`/api/businesses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
  delete: (id: string) => {
    return apiRequest<DeleteBusinessResponse>(`/api/businesses/${id}`, {
      method: "DELETE",
    });
  },
};

// Subscription Plans API
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currencyCode: string;
  billingPeriod: string;
  businessLimit: number | string;
  membersPerBusinessLimit: number | string;
  features: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlansResponse {
  plans: SubscriptionPlan[];
}

export interface UpdateSubscriptionPlanRequest {
  name?: string;
  description?: string;
  price?: number;
  billingPeriod?: string;
  businessLimit?: number;
  membersPerBusinessLimit?: number;
  features?: any;
  isActive?: boolean;
}

export interface UpdateSubscriptionPlanResponse {
  success: boolean;
  plan: SubscriptionPlan;
}

export const subscriptionPlansApi = {
  getAll: () => {
    return apiRequest<SubscriptionPlansResponse>("/api/subscriptions/plans");
  },
  update: (id: string, data: UpdateSubscriptionPlanRequest) => {
    return apiRequest<UpdateSubscriptionPlanResponse>(`/api/subscriptions/plans/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};

// Subscribers API
export interface Subscriber {
  id: string;
  businessId: string;
  businessName: string;
  planId: string;
  planName: string;
  status: string;
  startDate: string;
  endDate: string | null;
  billingPeriod: string;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscribersResponse {
  subscribers: Subscriber[];
}

export const subscribersApi = {
  getAll: () => {
    return apiRequest<SubscribersResponse>("/api/subscriptions/subscribers");
  },
};

// Invites API
export interface Invite {
  id: string;
  businessId: string;
  businessName: string;
  email: string | null;
  phone: string | null;
  role: string;
  inviteToken: string;
  status: string;
  invitedBy: string;
  inviterEmail: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  acceptedAt: string | null;
  acceptedBy: string | null;
  acceptedUserEmail?: string | null;
  userInviteStatus?: string | null;
}

export interface InvitesResponse {
  invites: Invite[];
}

export const invitesApi = {
  getAll: (status?: string) => {
    const params = new URLSearchParams();
    if (status && status !== 'all') {
      params.append('status', status);
    }
    const queryString = params.toString();
    return apiRequest<InvitesResponse>(`/api/invites${queryString ? `?${queryString}` : ''}`);
  },
};

