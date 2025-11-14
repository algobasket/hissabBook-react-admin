// API utility for communicating with the backend
// NOTE: This admin app uses ONLY hissabbook-nodejs-backend (port 5000)
// It does NOT use hissabbook-api-system

import { getAuthToken } from "./auth";

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || "/backend";

export interface ApiError {
  message: string;
  status?: number;
  error?: any;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

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

export const dashboardApi = {
  getStats: () => {
    return apiRequest<DashboardStatsResponse>("/api/dashboard/stats");
  },
  getPayoutQueue: (status?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (limit) params.append('limit', limit.toString());
    const queryString = params.toString();
    return apiRequest<DashboardPayoutQueueResponse>(`/api/dashboard/payout-queue${queryString ? `?${queryString}` : ''}`);
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

