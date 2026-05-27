const BASE = import.meta.env.VITE_API_BASE_URL || '/api';

function resolveToken() {
  return localStorage.getItem('chipzo_token');
}

async function request(path, options = {}) {
  const token = resolveToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

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

export const authAPI = {
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  signup: (name, email, password) =>
    request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  updateProfile: (data) =>
    request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getMe: () => request('/auth/me'),
};

export const productsAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', params.page);
    if (params.limit) qs.set('limit', params.limit);
    if (params.category) qs.set('category', params.category);
    if (params.search) qs.set('search', params.search);
    return request(`/products?${qs.toString()}`);
  },

  getOne: (id) => request(`/products/${id}`),

  getBySlug: (slug) => request(`/products/slug/${slug}`),
};

export const cartAPI = {
  get: () => request('/cart'),

  addItem: (productId, quantity = 1) =>
    request('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    }),

  updateItem: (productId, quantity) =>
    request(`/cart/items/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    }),

  removeItem: (productId) =>
    request(`/cart/items/${productId}`, { method: 'DELETE' }),

  clear: () => request('/cart', { method: 'DELETE' }),
};

export const ordersAPI = {
  create: (address) =>
    request('/orders', {
      method: 'POST',
      body: JSON.stringify({ address }),
    }),

  createCOD: (address) =>
    request('/orders/cod', {
      method: 'POST',
      body: JSON.stringify({ address }),
    }),

  getAll: () => request('/orders'),

  getOne: (id) => request(`/orders/${id}`),
};

export const paymentAPI = {
  verify: (payload) =>
    request('/payment/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  reportFailure: ({ razorpayOrderId, razorpayPaymentId, reason, step }) =>
    request('/payment/failure', {
      method: 'POST',
      body: JSON.stringify({ razorpay_order_id: razorpayOrderId, razorpayPaymentId, reason, step }),
    }),
};

export const addressAPI = {
  getAll: () => request('/addresses'),
  getOne: (id) => request(`/addresses/${id}`),
  create: (data) => request('/addresses', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/addresses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/addresses/${id}`, { method: 'DELETE' }),
  setDefault: (id) => request(`/addresses/${id}/default`, { method: 'PATCH' }),
};

export const deliveryAPI = {
  track: (orderId) => request(`/delivery/track/${orderId}`),

  cancel: (orderId, reason = '') =>
    request(`/delivery/cancel/${orderId}`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
};
