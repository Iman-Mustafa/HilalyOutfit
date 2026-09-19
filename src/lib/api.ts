import type { PaymentProvider, PaymentStatus, Product, Transaction, User } from '../types';

const TOKEN_KEY = 'hilaly_token';

/** Error returned by the API: `message` is ready to show to the user (Swahili) */
export class ApiError extends Error {
  status: number;
  fieldErrors: Record<string, string>;

  constructor(message: string, status: number, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export const tokenStore = {
  get: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
      console.error('Could not save session', e);
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      console.error('Could not clear session', e);
    }
  }
};

// Called when the server rejects our token, so the app can sign the user out
let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  onUnauthorized = handler;
};

async function request<T>(path: string, options: { method?: string; body?: unknown; formData?: FormData } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.formData ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined)
    });
  } catch {
    throw new ApiError('Imeshindikana kuwasiliana na seva. Kagua intaneti yako kisha ujaribu tena.', 0);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && token && onUnauthorized) onUnauthorized();
    throw new ApiError(
      data?.message || 'Hitilafu imetokea. Tafadhali jaribu tena.',
      response.status,
      data?.errors || {}
    );
  }

  return data as T;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface OrderItemInput {
  productId: string;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}

export interface CreateOrderInput {
  items: OrderItemInput[];
  paymentPhone: string;
  provider?: PaymentProvider;
  deliveryLocation: string;
  deliveryNotes?: string;
}

export interface ServerConfig {
  paymentDriver: 'simulator' | 'gateway';
  cloudinaryEnabled: boolean;
}

export interface AdminStats {
  revenue: number;
  successful: number;
  pending: number;
  failed: number;
  customers: number;
  products: number;
}

export const api = {
  config: () => request<ServerConfig>('/config'),

  // Auth
  register: (input: { name: string; phone: string; password: string }) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: input }),
  login: (input: { phone: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: input }),
  me: () => request<{ user: User }>('/auth/me'),

  // Products
  listProducts: () => request<{ products: Product[] }>('/products'),
  getProduct: (id: string) =>
    request<{ product: Product; related: Product[] }>(`/products/${encodeURIComponent(id)}`),
  createProduct: (formData: FormData) =>
    request<{ product: Product }>('/products', { method: 'POST', formData }),
  updateProduct: (id: string, formData: FormData) =>
    request<{ product: Product }>(`/products/${encodeURIComponent(id)}`, { method: 'PUT', formData }),
  deleteProduct: (id: string) =>
    request<{ ok: true }>(`/products/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // Orders & payments
  createOrder: (input: CreateOrderInput) =>
    request<{ order: Transaction; simulated: boolean }>('/orders', { method: 'POST', body: input }),
  myOrders: () => request<{ orders: Transaction[] }>('/orders/mine'),
  getOrder: (id: string) => request<{ order: Transaction }>(`/orders/${encodeURIComponent(id)}`),
  simulatePayment: (id: string, decision: 'approve' | 'wrong_pin' | 'cancel') =>
    request<{ order: Transaction }>(`/payments/simulate/${encodeURIComponent(id)}`, { method: 'POST', body: { decision } }),

  // Admin
  adminOrders: () => request<{ orders: Transaction[] }>('/admin/orders'),
  adminSetOrderStatus: (id: string, status: PaymentStatus, note?: string) =>
    request<{ order: Transaction }>(`/admin/orders/${encodeURIComponent(id)}/status`, { method: 'POST', body: { status, note } }),
  adminStats: () => request<AdminStats>('/admin/stats')
};
