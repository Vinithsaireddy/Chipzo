/**
 * Chipzo API Service Layer
 * Central fetch wrapper — attaches auth token, handles errors uniformly.
 * All paths are relative (/api/...) so Vite proxy routes them to port 5000.
 */

const BASE = import.meta.env.VITE_API_BASE_URL || '/api';

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function request(path, options = {}) {
  const token = localStorage.getItem('chipzo_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  // Try to parse JSON body for both success and error responses
  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    const err = new Error(data?.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authAPI = {
  /** POST /api/auth/login */
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  /** POST /api/auth/signup */
  signup: (name, email, password) =>
    request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  /** PUT /api/auth/profile */
  updateProfile: (data) =>
    request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /** GET /api/auth/me */
  getMe: () => request('/auth/me'),

  /** POST /api/auth/verify-otp */
  verifyOTP: (otp) =>
    request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ otp }),
    }),

  /** POST /api/auth/resend-otp */
  resendOTP: () =>
    request('/auth/resend-otp', {
      method: 'POST',
    }),
};

// ─── Products ─────────────────────────────────────────────────────────────────

export const productsAPI = {
  /** GET /api/products?page=1&limit=20&category=X&search=X */
  getAll: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', params.page);
    if (params.limit) qs.set('limit', params.limit);
    if (params.category) qs.set('category', params.category);
    if (params.search) qs.set('search', params.search);
    return request(`/products?${qs.toString()}`);
  },

  /** GET /api/products/:id */
  getOne: (id) => request(`/products/${id}`),

  /** GET /api/products/slug/:slug */
  getBySlug: (slug) => request(`/products/slug/${slug}`),
};

// ─── Cart ─────────────────────────────────────────────────────────────────────

export const cartAPI = {
  /** GET /api/cart */
  get: () => request('/cart'),

  /** POST /api/cart/items */
  addItem: (productId, quantity = 1) =>
    request('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    }),

  /** PUT /api/cart/items/:productId */
  updateItem: (productId, quantity) =>
    request(`/cart/items/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    }),

  /** DELETE /api/cart/items/:productId */
  removeItem: (productId) =>
    request(`/cart/items/${productId}`, { method: 'DELETE' }),

  /** DELETE /api/cart */
  clear: () => request('/cart', { method: 'DELETE' }),
};

// ─── Orders ───────────────────────────────────────────────────────────────────

export const ordersAPI = {
  /**
   * POST /api/orders
   * Creates a Razorpay order. Returns { razorpay_order_id, amount, currency }
   */
  create: (address) =>
    request('/orders', {
      method: 'POST',
      body: JSON.stringify({ address }),
    }),

  /**
   * POST /api/orders/cod
   * Creates a COD order directly (no Razorpay).
   */
  createCOD: (address) =>
    request('/orders/cod', {
      method: 'POST',
      body: JSON.stringify({ address }),
    }),

  /** GET /api/orders */
  getAll: () => request('/orders'),

  /** GET /api/orders/:id */
  getOne: (id) => request(`/orders/${id}`),

  // --- Admin Order Management ---
  adminGetAll: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', params.page);
    if (params.limit) qs.set('limit', params.limit);
    if (params.search) qs.set('search', params.search);
    if (params.status) qs.set('status', params.status);
    return request(`/orders/admin?${qs.toString()}`);
  },

  adminGetOne: (id) => request(`/orders/admin/${id}`),

  adminUpdate: (id, updates) =>
    request(`/orders/admin/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  adminDelete: (id) =>
    request(`/orders/admin/${id}`, {
      method: 'DELETE',
    }),
};

// ─── Payment ──────────────────────────────────────────────────────────────────

export const paymentAPI = {
  /**
   * POST /api/payment/verify
   * Verifies Razorpay signature and creates the final DB order.
   */
  verify: (payload) =>
    request('/payment/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /**
   * POST /api/payment/failure
   * Reports a payment failure/cancellation to the backend.
   */
  reportFailure: ({ razorpayOrderId, razorpayPaymentId, reason, step }) =>
    request('/payment/failure', {
      method: 'POST',
      body: JSON.stringify({ razorpay_order_id: razorpayOrderId, razorpayPaymentId, reason, step }),
    }),
};

// ─── Address ──────────────────────────────────────────────────────────────────

export const addressAPI = {
  getAll: () => request('/addresses'),
  getOne: (id) => request(`/addresses/${id}`),
  create: (data) => request('/addresses', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/addresses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/addresses/${id}`, { method: 'DELETE' }),
  setDefault: (id) => request(`/addresses/${id}/default`, { method: 'PATCH' }),
};

// ─── Delivery ─────────────────────────────────────────────────────────────────

export const deliveryAPI = {
  /** GET /api/delivery/track/:orderId */
  track: (orderId) => request(`/delivery/track/${orderId}`),
};
