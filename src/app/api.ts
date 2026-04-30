import { projectId, publicAnonKey } from '../../utils/supabase/info';

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
async function fetchWithTimeout(url: string, options?: RequestInit, timeoutMs = 12000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function request(path: string, options?: RequestInit) {
  const res = await fetchWithTimeout(`${BASE}${path}`, {
    ...options,
    headers: { ...EDGE_HEADERS, ...(options?.headers || {}) },
  });

  const text = await res.text();

  let data: any = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }
      console.error(`JSON Parse Error on ${path}:`, text.slice(0, 200)); // Log first 200 chars for debugging
      throw new Error(`Invalid JSON response from ${path}`);
    }
  }

  if (!res.ok) {
    console.error(`API error [${res.status}] ${path}:`, data || text.slice(0, 200));
    throw new Error(data?.error || data?.message || `Request failed: ${res.status}`);
  }

  return data;
}

// ─── Init / Seed ───
export const initDatabase = () => request('/init', { method: 'POST' });

// ─── Users ───
export const getUsers = () => request('/users');
export const createUser = (user: any) =>
  request('/users', { method: 'POST', body: JSON.stringify(user) });
export const updateUser = (id: string, updates: any) =>
  request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(updates) });

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
export const getOrdersByUser = (userId: string) => request(`/orders?user_id=${encodeURIComponent(userId)}`);
export const createOrder = (order: any) =>
  request('/orders', { method: 'POST', body: JSON.stringify(order) });
export const updateOrder = (id: string, updates: any) =>
  request(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(updates) });

// ─── Cart Items (kumar_cart table) ───
export const createCartItems = async (orderId: string, items: any[]) => {
  // Insert items one by one since Supabase REST expects individual objects
  const results = [];
  for (const item of items) {
    const cartItem = {
      order_id: orderId,
      product_id: item.product.id,
      product_name: item.product.name,
      quantity: item.quantity,
      price: item.price,
      mrp: item.product.mrp,
      customer_price: item.product.customerPrice,
      shop_price: item.product.shopPrice,
      purchase_price: item.product.purchasePrice,
      image: item.product.image,
    };
    
    const res = await fetchWithTimeout(
      `${SUPABASE_REST}/kumar_cart`,
      {
        method: 'POST',
        headers: REST_HEADERS,
        body: JSON.stringify(cartItem),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      console.error('Failed to save cart item:', data);
      throw new Error(data.message || 'Failed to save cart item');
    }
    results.push(data);
  }
  return results;
};

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
  const safeId = encodeURIComponent(id);
  const res = await fetchWithTimeout(
    `${SUPABASE_REST}/kumar_product_requests?id=eq.${safeId}`,
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
  const safeUserId = encodeURIComponent(userId);
  const res = await fetchWithTimeout(
    `${SUPABASE_REST}/kumar_notifications?user_id=eq.${safeUserId}&select=*&order=created_at.desc`,
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
  const safeId = encodeURIComponent(id);
  const res = await fetchWithTimeout(
    `${SUPABASE_REST}/kumar_notifications?id=eq.${safeId}`,
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
  const safeUserId = encodeURIComponent(userId);
  const res = await fetchWithTimeout(
    `${SUPABASE_REST}/kumar_notifications?user_id=eq.${safeUserId}&is_read=eq.false`,
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
  const safeUserId = encodeURIComponent(userId);
  const res = await fetchWithTimeout(
    `${SUPABASE_REST}/kumar_notifications?user_id=eq.${safeUserId}`,
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

// ─── Cart (PostgREST direct) ───
export const getCartItems = async (userId: string): Promise<{ product_id: string; quantity: number }[]> => {
  const safeUserId = encodeURIComponent(userId);
  const res = await fetchWithTimeout(
    `${SUPABASE_REST}/kumar_cart_items?user_id=eq.${safeUserId}&select=product_id,quantity`,
    { headers: REST_HEADERS }
  );
  if (!res.ok) return [];
  return res.json();
};

export const upsertCartItem = async (userId: string, productId: string, quantity: number) => {
  const res = await fetchWithTimeout(
    `${SUPABASE_REST}/kumar_cart_items?on_conflict=user_id,product_id`,
    {
      method: 'POST',
      headers: { ...REST_HEADERS, Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({
        user_id: userId,
        product_id: productId,
        quantity,
        updated_at: new Date().toISOString(),
      }),
    }
  );
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || 'Failed to upsert cart item');
  }
  return { success: true };
};

export const removeCartItem = async (userId: string, productId: string) => {
  const safeUserId = encodeURIComponent(userId);
  const safeProductId = encodeURIComponent(productId);
  const res = await fetchWithTimeout(
    `${SUPABASE_REST}/kumar_cart_items?user_id=eq.${safeUserId}&product_id=eq.${safeProductId}`,
    { method: 'DELETE', headers: REST_HEADERS }
  );
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || 'Failed to remove cart item');
  }
  return { success: true };
};

export const clearCartItems = async (userId: string) => {
  const safeUserId = encodeURIComponent(userId);
  const res = await fetchWithTimeout(
    `${SUPABASE_REST}/kumar_cart_items?user_id=eq.${safeUserId}`,
    { method: 'DELETE', headers: REST_HEADERS }
  );
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || 'Failed to clear cart');
  }
  return { success: true };
};

// ─── Reviews (direct PostgREST) ───
export const getReviews = async (productId: string) => {
  const safeProductId = encodeURIComponent(productId);
  const res = await fetchWithTimeout(
    `${SUPABASE_REST}/kumar_reviews?product_id=eq.${safeProductId}&select=*&order=created_at.desc`,
    { headers: REST_HEADERS }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch reviews');
  return (data || []).map((row: any) => ({
    id: row.id,
    productId: row.product_id,
    userId: row.user_id,
    userName: row.user_name,
    rating: row.rating,
    comment: row.comment,
    date: row.created_at,
    likes: row.likes || 0,
    isAiSummarized: row.is_ai_summarized || false,
  }));
};

export const createReview = async (review: any) => {
  const body = {
    product_id: review.productId,
    user_id: review.userId,
    user_name: review.userName,
    rating: review.rating,
    comment: review.comment,
    is_ai_summarized: review.isAiSummarized || false,
    created_at: new Date().toISOString(),
  };
  const res = await fetchWithTimeout(`${SUPABASE_REST}/kumar_reviews`, {
    method: 'POST',
    headers: REST_HEADERS,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to create review');
  return { success: true };
};

export const updateReviewLikes = async (id: string, likes: number) => {
  const safeId = encodeURIComponent(id);
  const res = await fetchWithTimeout(
    `${SUPABASE_REST}/kumar_reviews?id=eq.${safeId}`,
    {
      method: 'PATCH',
      headers: REST_HEADERS,
      body: JSON.stringify({ likes }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update review likes');
  return { success: true };
};

// ─── Products ───(Edge Function) ───
export const getProducts = () => request('/products');
export const createProduct = (product: any) =>
  request('/products', { method: 'POST', body: JSON.stringify(product) });
export const updateProduct = (id: string, updates: any) =>
  request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
export const deleteProduct = (id: string) =>
  request(`/products/${id}`, { method: 'DELETE' });
e x p o r t   c o n s t   A P I _ R E A D Y   =   t r u e ; 
 
 

// API utilities for backend communication

// Client API utilities
