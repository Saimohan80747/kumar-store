import { projectId, publicAnonKey } from '/utils/supabase/info';

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-8a0a2a06`;
const SUPABASE_REST = `https://${projectId}.supabase.co/rest/v1`;

// Cached header objects — avoid re-creating on every call
const EDGE_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${publicAnonKey}`,
};

const REST_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${publicAnonKey}`,
  apikey: publicAnonKey,
  Prefer: 'return=representation',
};

/** Fetch with automatic timeout (default 12s) to prevent indefinite hanging */
function fetchWithTimeout(url: string, options?: RequestInit, timeoutMs = 12000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function request(path: string, options?: RequestInit) {
  const res = await fetchWithTimeout(`${BASE}${path}`, {
    ...options,
    headers: { ...EDGE_HEADERS, ...(options?.headers || {}) },
  });
  const data = await res.json();
  if (!res.ok) {
    console.error(`API error [${res.status}] ${path}:`, data);
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return data;
}

// ─── Init / Seed ───
export const initDatabase = () => request('/init', { method: 'POST' });

// ─── Users ───
export const getUsers = () => request('/users');
export const createUser = (user: any) =>
  request('/users', { method: 'POST', body: JSON.stringify(user) });

// ─── Auth ───
export const loginUser = (email: string, password: string, role: string) =>
  request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, role }),
  });

// ─── Shop Requests ───
export const getShopRequests = () => request('/shop-requests');
export const createShopRequest = (req: any) =>
  request('/shop-requests', { method: 'POST', body: JSON.stringify(req) });
export const approveShopRequest = (id: string) =>
  request(`/shop-requests/${id}/approve`, { method: 'PUT' });
export const rejectShopRequest = (id: string) =>
  request(`/shop-requests/${id}/reject`, { method: 'PUT' });

// ─── Orders ───
export const getOrders = () => request('/orders');
export const createOrder = (order: any) =>
  request('/orders', { method: 'POST', body: JSON.stringify(order) });
export const updateOrder = (id: string, updates: any) =>
  request(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(updates) });

// ─── Coupons ───
export const getCoupons = () => request('/coupons');
export const createCoupon = (coupon: any) =>
  request('/coupons', { method: 'POST', body: JSON.stringify(coupon) });
export const deleteCoupon = (code: string) =>
  request(`/coupons/${code}`, { method: 'DELETE' });

// ─── Product Requests (direct PostgREST — no Edge Function needed) ───
export const getProductRequests = async () => {
  const res = await fetchWithTimeout(
    `${SUPABASE_REST}/kumar_product_requests?select=*&order=request_date.desc`,
    { headers: REST_HEADERS }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch product requests');
  return (data || []).map((row: any) => ({
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    userRole: row.user_role,
    status: row.status,
    requestDate: row.request_date,
  }));
};

export const createProductRequest = async (req: any) => {
  const body = {
    id: req.id,
    product_id: req.productId,
    product_name: req.productName,
    user_id: req.userId,
    user_name: req.userName,
    user_email: req.userEmail,
    user_role: req.userRole,
    status: req.status,
    request_date: req.requestDate,
  };
  const res = await fetchWithTimeout(`${SUPABASE_REST}/kumar_product_requests`, {
    method: 'POST',
    headers: REST_HEADERS,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create product request');
  return { success: true, request: req };
};

export const updateProductRequest = async (id: string, status: string) => {
  const res = await fetchWithTimeout(
    `${SUPABASE_REST}/kumar_product_requests?id=eq.${id}`,
    {
      method: 'PATCH',
      headers: REST_HEADERS,
      body: JSON.stringify({ status, reviewed_at: new Date().toISOString() }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update product request');
  return { success: true };
};

// ─── Notifications (direct PostgREST) ───
export const getNotifications = async (userId: string) => {
  const res = await fetchWithTimeout(
    `${SUPABASE_REST}/kumar_notifications?user_id=eq.${userId}&select=*&order=created_at.desc`,
    { headers: REST_HEADERS }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch notifications');
  return (data || []).map((row: any) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    productId: row.product_id || undefined,
    read: row.is_read,
    date: row.created_at,
  }));
};

export const createNotification = async (notification: {
  id: string; userId: string; type: string; title: string;
  message: string; productId?: string;
}) => {
  const body = {
    id: notification.id,
    user_id: notification.userId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    product_id: notification.productId || null,
    is_read: false,
  };
  const res = await fetchWithTimeout(`${SUPABASE_REST}/kumar_notifications`, {
    method: 'POST',
    headers: REST_HEADERS,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create notification');
  return { success: true };
};

export const markNotificationRead = async (id: string) => {
  const res = await fetchWithTimeout(
    `${SUPABASE_REST}/kumar_notifications?id=eq.${id}`,
    {
      method: 'PATCH',
      headers: REST_HEADERS,
      body: JSON.stringify({ is_read: true }),
    }
  );
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || 'Failed to mark notification read');
  }
  return { success: true };
};

export const markAllNotificationsRead = async (userId: string) => {
  const res = await fetchWithTimeout(
    `${SUPABASE_REST}/kumar_notifications?user_id=eq.${userId}&is_read=eq.false`,
    {
      method: 'PATCH',
      headers: REST_HEADERS,
      body: JSON.stringify({ is_read: true }),
    }
  );
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || 'Failed to mark all notifications read');
  }
  return { success: true };
};

export const deleteAllNotifications = async (userId: string) => {
  const res = await fetchWithTimeout(
    `${SUPABASE_REST}/kumar_notifications?user_id=eq.${userId}`,
    { method: 'DELETE', headers: REST_HEADERS }
  );
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || 'Failed to clear notifications');
  }
  return { success: true };
};

// ─── Analytics ───
export const getAnalytics = () => request('/analytics');
