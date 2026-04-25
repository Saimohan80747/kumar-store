import { create } from 'zustand';
import * as api from './api';
import { products as seedProducts } from './data';
import { supabase } from './services/supabase';
import { sanitizeInput, checkRateLimit } from './utils/security';

export type UserRole = 'customer' | 'shopowner' | 'admin';

/** System user representation */`nexport interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  password?: string;
  address?: string;
  shopName?: string;
  shopLocation?: string;
  shopLocationUrl?: string; // Google Maps Location Link
  gstNumber?: string;
  approved?: boolean;
  blocked?: boolean;
  creditLimit?: number;
  profit?: number;
  totalSavings?: number;
  totalProfit?: number;
  language?: string;
}

export interface ShopRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  shopName: string;
  shopLocation: string;
  shopLocationUrl?: string; // Google Maps Location Link
  password: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  language?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  description: string;
  image: string;
  mrp: number;
  purchasePrice: number;
  shopPrice: number;
  customerPrice: number;
  minWholesaleQty: number;
  stock: number;
  sku: string;
  unitType: 'Piece' | 'Box' | 'Carton';
  featured: boolean;
  rating: number;
  reviews: number;
}

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  likes: number;
  isAiSummarized?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  price?: number;
}

export type OrderStatus = 'placed' | 'accepted' | 'rejected' | 'cancelled' | 'shipped' | 'delivered';

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  deliveryFee: number;
  status: OrderStatus;
  date: string;
  paymentMethod: string;
  userRole: UserRole;
  userName: string;
  userId?: string;
  deliveryAddress?: string;
  deliveryLocationUrl?: string; // Google Maps Location Link
  deliverySlot?: string;
  couponCode?: string;
  couponDiscount?: number;
  adminProfit?: number;
  shopProfit?: number;
  customerSavings?: number;
}

/** Delivery fee threshold: orders above this amount get free delivery */
export const FREE_DELIVERY_THRESHOLD = 999;
export const DELIVERY_FEE = 49;

export interface InventoryLedger {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  action: 'reserve' | 'release';
  previousStock: number;
  newStock: number;
  date: string;
  reason: string;
}

export interface ProductRequest {
  id: string;
  productId: string;
  productName: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: UserRole;
  status: 'pending' | 'fulfilled' | 'dismissed';
  requestDate: string;
}

export interface Notification {
  id: string;
  type: 'product_available' | 'order_update' | 'general';
  title: string;
  message: string;
  productId?: string;
  read: boolean;
  date: string;
}

// Customer gets 40% of the (MRP – wholesale) gap as discount
export const CUSTOMER_DISCOUNT_RATIO = 0.4;

const FORCED_UNBLOCK_EMAILS = new Set(['mohansai152006@gmail.com']);

function normalizeUserBlock<T extends Partial<User>>(user: T): T {
  if (!user?.email) return user;
  if (!FORCED_UNBLOCK_EMAILS.has(user.email.trim().toLowerCase())) return user;
  return { ...user, blocked: false };
}

function getCartStep(product: Product, role?: UserRole | null) {
  return role === 'shopowner' ? Math.max(1, product.minWholesaleQty || 1) : 1;
}

function normalizeCartQuantity(product: Product, requestedQty: number, role?: UserRole | null) {
  const step = getCartStep(product, role);
  const maxQty = Math.max(0, product.stock || 0);

  if (maxQty <= 0) return 0;

  if (role === 'shopowner') {
    const desiredQty = Math.max(step, requestedQty);
    let normalized = Math.ceil(desiredQty / step) * step;
    if (normalized > maxQty) {
      normalized = Math.floor(maxQty / step) * step;
    }
    return normalized >= step ? normalized : 0;
  }

  return Math.max(1, Math.min(Math.round(requestedQty), maxQty));
}

function validateCartLine(item: CartItem, role?: UserRole | null) {
  if (item.product.stock <= 0) {
    return `"${item.product.name}" is out of stock.`;
  }

  if (item.quantity > item.product.stock) {
    return `"${item.product.name}" only has ${item.product.stock} units left.`;
  }

  if (role === 'shopowner') {
    const step = getCartStep(item.product, role);
    if (item.quantity < step) {
      return `"${item.product.name}" requires at least ${step} ${item.product.unitType.toLowerCase()}s per wholesale order.`;
    }
    if (item.quantity % step !== 0) {
      return `"${item.product.name}" must be ordered in multiples of ${step}.`;
    }
  }

  return null;
}

interface AppState {
  user: User | null;
  registeredUsers: User[];
  shopRequests: ShopRequest[];
  products: Product[];
  cart: CartItem[];
  wishlist: string[];
  orders: Order[];
  inventoryLedger: InventoryLedger[];
  productRequests: ProductRequest[];
  notifications: Notification[];
  searchQuery: string;
  selectedCategory: string;
  recentlyViewed: string[];
  productReviews: ProductReview[];
  dbReady: boolean;
  dbLoading: boolean;
  users: User[];

  // Init
  initDB: () => Promise<void>;
  loadAllData: () => Promise<void>;
  initAuth: () => void;

  // Auth
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  registerCustomer: (user: Omit<User, 'id' | 'role'>) => Promise<{ success: boolean; error?: string }>;
  registerShopOwner: (request: Omit<ShopRequest, 'id' | 'status' | 'date'>) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<void>;
  checkEmailExists: (email: string) => Promise<boolean>;

  // Admin
  approveShop: (requestId: string) => Promise<void>;
  rejectShop: (requestId: string) => Promise<void>;
  toggleBlockUser: (userId: string, blocked: boolean) => Promise<void>;

  // Cart
  addToCart: (product: Product, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  loadCart: () => Promise<void>;

  // Wishlist
  toggleWishlist: (productId: string) => void;

  // Orders
  placeOrder: (paymentMethod: string, deliveryFee: number, deliveryAddress?: string, deliveryLocationUrl?: string, couponCode?: string, couponDiscount?: number, deliverySlot?: string) => Promise<void>;
  acceptOrder: (orderId: string) => { success: boolean; message: string };
  rejectOrder: (orderId: string) => void;
  cancelOrder: (orderId: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  setOrders: (orders: Order[]) => void;

  // Products (admin CRUD)
  loadProducts: () => Promise<void>;
  addProduct: (product: Product) => Promise<void>;
  editProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProductById: (id: string) => Promise<void>;

  // Product Requests
  requestProduct: (productId: string, productName: string) => Promise<void>;
  loadProductRequests: () => Promise<void>;
  updateProductRequest: (id: string, status: 'fulfilled' | 'dismissed') => Promise<void>;

  // Reviews
  loadReviews: (productId: string) => Promise<void>;
  addReview: (review: Omit<ProductReview, 'id' | 'date' | 'likes'>) => Promise<void>;
  toggleReviewLike: (reviewId: string) => Promise<void>;

  // Notifications
  loadNotifications: () => Promise<void>;
  addNotification: (userId: string, notification: Notification) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  clearNotifications: () => Promise<void>;

  // UI
  setSearchQuery: (q: string) => void;
  setSelectedCategory: (c: string) => void;
  addRecentlyViewed: (productId: string) => void;

  // Pricing
  getPrice: (product: Product) => number;
  getCartTotal: () => number;
  getRealTimeStats: () => {
    totalOrders: number;
    placedOrders: number;
    acceptedOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    rejectedOrders: number;
    totalRevenue: number;
    pipelineValue: number;
    todayRevenue: number;
    averageOrderValue: number;
    totalCustomers: number;
    activeCustomers: number;
    returningCustomers: number;
    customerRetentionRate: number;
    totalShopOwners: number;
    activeShopOwners: number;
    totalAdminProfit: number;
    totalAdminProfitFromCustomers: number;
    totalAdminProfitFromShops: number;
    totalShopProfit: number;
    totalCustomerSavings: number;
    totalProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    todayOrders: number;
    todayPlacedOrders: number;
    todayDeliveredOrders: number;
    monthlyGrowth: number;
    orderCompletionRate: number;
  };
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  registeredUsers: [],
  users: [],
  shopRequests: [],
  products: [...seedProducts],
  cart: [],
  wishlist: [],
  orders: [],
  inventoryLedger: [],
  productRequests: [],
  notifications: [],
  productReviews: [],
  searchQuery: '',
  selectedCategory: '',
  recentlyViewed: [],
  dbReady: false,
  dbLoading: false,

  // ─── Initialize database & load data ───
  initAuth: () => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = session.user;
        const meta = u.user_metadata || {};
        // Lookup the user in registeredUsers to retain backend/admin properties (like approved, creditLimit)
        // If they don't exist yet, fallback to meta properties
        const existingUser = get().registeredUsers.find(ru => ru.id === u.id || ru.email === u.email);

        set({
          user: normalizeUserBlock({
            id: u.id,
            email: u.email!,
            name: meta.full_name || meta.name || existingUser?.name || 'User',
            phone: meta.phone || existingUser?.phone || '',
            role: meta.role || existingUser?.role || 'customer',
            address: meta.address || existingUser?.address,
            shopName: meta.shopName || existingUser?.shopName,
            shopLocation: meta.shopLocation || existingUser?.shopLocation,
            shopLocationUrl: meta.shopLocationUrl || existingUser?.shopLocationUrl,
            approved: existingUser?.approved ?? meta.approved,
            blocked: existingUser?.blocked ?? meta.blocked,
            gstNumber: meta.gstNumber || existingUser?.gstNumber,
            creditLimit: existingUser?.creditLimit ?? meta.creditLimit
          })
        });
      } else {
        set({ user: null });
      }
    });

    // Listen to changes (login/logout/refresh)
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u = session.user;
        const meta = u.user_metadata || {};
        const existingUser = get().registeredUsers.find(ru => ru.id === u.id || ru.email === u.email);

        set({
          user: normalizeUserBlock({
            id: u.id,
            email: u.email!,
            name: meta.full_name || meta.name || existingUser?.name || 'User',
            phone: meta.phone || existingUser?.phone || '',
            role: meta.role || existingUser?.role || 'customer',
            address: meta.address || existingUser?.address,
            shopName: meta.shopName || existingUser?.shopName,
            shopLocation: meta.shopLocation || existingUser?.shopLocation,
            shopLocationUrl: meta.shopLocationUrl || existingUser?.shopLocationUrl,
            approved: existingUser?.approved ?? meta.approved,
            blocked: existingUser?.blocked ?? meta.blocked,
            gstNumber: meta.gstNumber || existingUser?.gstNumber,
            creditLimit: existingUser?.creditLimit ?? meta.creditLimit
          })
        });
      } else {
        set({ user: null });
        set({ cart: [], wishlist: [], orders: [] });
      }
    });
  },

  initDB: async () => {
    get().initAuth();
    if (get().dbReady || get().dbLoading) return;
    set({ dbLoading: true });
    try {
      // Run init and data loading in parallel — data load doesn't depend on init
      // for already-initialized databases (the common case)
      const dbInited = sessionStorage.getItem('kumarstore_db_inited');
      if (dbInited) {
        // DB was already initialized this session — just load data
        await get().loadAllData();
      } else {
        // First load: run init and data load in parallel, then mark initialized
        await Promise.all([
          api.initDatabase().then(() => sessionStorage.setItem('kumarstore_db_inited', '1')),
          get().loadAllData(),
        ]);
      }
      set({ dbReady: true, dbLoading: false });
    } catch (err) {
      console.error('DB init error:', err);
      // Still mark ready so the app isn't stuck — data from data.ts still works
      set({ dbReady: true, dbLoading: false });
    }
  },

  loadAllData: async () => {
    try {
      const [users, shopRequests, rawOrders, productRequests, dbProducts] = await Promise.all([
        api.getUsers(),
        api.getShopRequests(),
        api.getOrders(),
        api.getProductRequests().catch(() => []),
        api.getProducts().catch(() => []),
      ]);
      // Normalize orders — ensure deliveryFee exists for older DB records
      // Filter out test orders that may be in the database
      const orders = (rawOrders || [])
        .filter((o: any) => !o.id?.startsWith?.('ORD-TEST'))
        .map((o: any) => ({
          ...o,
          deliveryFee: Number(o.deliveryFee) || 0,
        }));
      // Use DB products if available, otherwise keep seed data
      const products = (dbProducts && dbProducts.length > 0) ? dbProducts : [...seedProducts];
      const registeredUsers = (users || []).map((user: User) => normalizeUserBlock(user));
      const currentUser = get().user;
      const syncedUser = currentUser
        ? registeredUsers.find((user: User) => user.id === currentUser.id || user.email === currentUser.email)
        : null;

      set({
        registeredUsers,
        shopRequests,
        orders,
        productRequests,
        products,
        ...(syncedUser ? { user: normalizeUserBlock({ ...currentUser!, ...syncedUser }) } : {}),
      });
    } catch (err) {
      console.error('Error loading data:', err);
    }
  },

  // ─── Auth actions (Supabase) ───
  login: async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();

    // Rate limit login attempts to prevent brute force
    if (!checkRateLimit(`login_${normalizedEmail}`, 3000)) {
      return { success: false, error: 'Too many attempts. Please wait 3 seconds.' };
    }

    const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  loginWithGoogle: async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  },

  checkEmailExists: async (email: string) => {
    const { registeredUsers, shopRequests } = get();
    const cleanEmail = email.trim().toLowerCase();

    // Check if user is in registeredUsers (already has an account)
    const isInUsers = registeredUsers.some(u => u.email.toLowerCase() === cleanEmail);
    if (isInUsers) return true;

    // Also check if they have a pending/rejected shop request
    const isInShopReqs = shopRequests.some(r => r.email.toLowerCase() === cleanEmail);
    if (isInShopReqs) return true;

    return false;
  },

  logout: async () => {
    await supabase.auth.signOut();
  },

  registerCustomer: async (payload) => {
    const normalizedEmail = payload.email.trim().toLowerCase();

    // 1. Rate limiting check
    if (!checkRateLimit(`register_${normalizedEmail}`, 5000)) {
      return { success: false, error: 'Too many registration attempts. Please wait.' };
    }

    // 2. Sanitize user inputs
    const sanitizedName = sanitizeInput(payload.name);
    const sanitizedPhone = sanitizeInput(payload.phone);
    const sanitizedAddress = sanitizeInput(payload.address || '');

    const { data: authData, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: payload.password!,
      options: {
        data: {
          name: sanitizedName,
          phone: sanitizedPhone,
          address: sanitizedAddress,
          role: 'customer'
        }
      }
    });
    if (error) return { success: false, error: error.message };

    if (authData.user) {
      try {
        await api.createUser({
          id: authData.user.id,
          email: normalizedEmail,
          name: sanitizedName,
          phone: sanitizedPhone,
          address: sanitizedAddress,
          role: 'customer',
          date: new Date().toISOString()
        });
      } catch (err) {
        console.error('Failed to sync customer to backend:', err);
      }
    }
    return { success: true };
  },

  registerShopOwner: async (request) => {
    const normalizedEmail = request.email.trim().toLowerCase();

    // 1. Rate limiting check
    if (!checkRateLimit(`register_shop_${normalizedEmail}`, 5000)) {
      return { success: false, error: 'Too many registration attempts. Please wait.' };
    }

    // 2. Sanitize user inputs
    const sanitizedName = sanitizeInput(request.name);
    const sanitizedPhone = sanitizeInput(request.phone);
    const sanitizedShopName = sanitizeInput(request.shopName);
    const sanitizedShopLocation = sanitizeInput(request.shopLocation);

    const { data: authData, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: request.password,
      options: {
        data: {
          name: sanitizedName,
          phone: sanitizedPhone,
          shopName: sanitizedShopName,
          shopLocation: sanitizedShopLocation,
          shopLocationUrl: request.shopLocationUrl,
          role: 'shopowner',
          approved: false
        }
      }
    });
    if (error) return { success: false, error: error.message };

    if (authData.user) {
      try {
        await api.createShopRequest({
          id: authData.user.id,
          name: sanitizedName,
          email: normalizedEmail,
          phone: sanitizedPhone,
          shopName: sanitizedShopName,
          shopLocation: sanitizedShopLocation,
          shopLocationUrl: request.shopLocationUrl,
          status: 'pending',
          date: new Date().toISOString()
        });
      } catch (err) {
        console.error('Failed to sync shop request to backend:', err);
      }
    }
    return { success: true };
  },

  // ─── Admin actions ───
  approveShop: async (requestId) => {
    try {
      const { newUser } = await api.approveShopRequest(requestId);
      set({
        shopRequests: get().shopRequests.map((r) =>
          r.id === requestId ? { ...r, status: 'approved' as const } : r
        ),
        registeredUsers: [...get().registeredUsers, newUser],
      });
    } catch (err) {
      console.error('Approve shop error:', err);
    }
  },

  rejectShop: async (requestId) => {
    try {
      await api.rejectShopRequest(requestId);
      set({
        shopRequests: get().shopRequests.map((r) =>
          r.id === requestId ? { ...r, status: 'rejected' as const } : r
        ),
      });
    } catch (err) {
      console.error('Reject shop error:', err);
    }
  },

  // ─── Admin: Block/Unblock User ───
  toggleBlockUser: async (userId: string, blocked: boolean) => {
    try {
      const { registeredUsers, user } = get();
      const updatedUsers = registeredUsers.map((u) =>
        u.id === userId ? normalizeUserBlock({ ...u, blocked }) : u
      );
      const userToUpdate = updatedUsers.find((u) => u.id === userId);

      set({
        registeredUsers: updatedUsers,
        ...(user && user.id === userId && userToUpdate ? { user: normalizeUserBlock({ ...user, ...userToUpdate }) } : {}),
      });

      // Update in database via API
      if (userToUpdate) {
        await api.updateUser(userId, { blocked: userToUpdate.blocked ?? false });
      }
    } catch (err) {
      console.error('Toggle block user error:', err);
    }
  },

  // ─── Cart ───
  addToCart: (product, qty = 1) => {
    if (product.stock <= 0) {
      return;
    }

    const { cart, user } = get();
    const role = user?.role;
    const existing = cart.find((i) => i.product.id === product.id);
    const currentQty = existing ? existing.quantity : 0;
    const normalizedTotal = normalizeCartQuantity(product, currentQty + qty, role);

    if (normalizedTotal <= 0 || normalizedTotal === currentQty) {
      return;
    }

    let newCart: CartItem[];
    if (existing) {
      newCart = cart.map((i) =>
        i.product.id === product.id ? { ...i, quantity: normalizedTotal } : i
      );
    } else {
      newCart = [...cart, { product, quantity: normalizedTotal }];
    }
    set({ cart: newCart });
    // Persist to Supabase
    if (user) {
      const newItem = newCart.find((i) => i.product.id === product.id);
      api.upsertCartItem(user.id, product.id, newItem?.quantity || normalizedTotal).catch(console.error);
    }
  },

  removeFromCart: (productId) => {
    const { user } = get();
    set({ cart: get().cart.filter((i) => i.product.id !== productId) });
    // Persist to Supabase
    if (user) {
      api.removeCartItem(user.id, productId).catch(console.error);
    }
  },

  updateCartQty: (productId, qty) => {
    const { cart, user } = get();
    const item = cart.find((i) => i.product.id === productId);
    if (!item) return;

    const safeQty = normalizeCartQuantity(item.product, qty, user?.role);
    if (safeQty <= 0) {
      get().removeFromCart(productId);
      return;
    }
    set({
      cart: cart.map((i) =>
        i.product.id === productId ? { ...i, quantity: safeQty } : i
      ),
    });
    // Persist to Supabase
    if (user) {
      api.upsertCartItem(user.id, productId, safeQty).catch(console.error);
    }
  },

  clearCart: () => {
    const { user } = get();
    set({ cart: [] });
    // Persist to Supabase
    if (user) {
      api.clearCartItems(user.id).catch(console.error);
    }
  },

  loadCart: async () => {
    const { user, products } = get();
    if (!user) return;
    try {
      const items = await api.getCartItems(user.id);
      // Build a product lookup from current products state
      const productMap = new Map(products.map((p) => [p.id, p]));
      const cart: CartItem[] = [];
      for (const item of items) {
        const product = productMap.get(item.product_id);
        if (product) {
          const safeQty = normalizeCartQuantity(product, item.quantity, user.role);
          if (safeQty > 0) {
            cart.push({ product, quantity: safeQty });
          }
        }
      }
      set({ cart });
    } catch (err) {
      console.error('Load cart error:', err);
    }
  },

  // ─── Wishlist ───
  toggleWishlist: (productId) => {
    const { wishlist } = get();
    if (wishlist.includes(productId)) {
      set({ wishlist: wishlist.filter((id) => id !== productId) });
    } else {
      set({ wishlist: [...wishlist, productId] });
    }
  },

  // ─── Orders ───
  placeOrder: async (paymentMethod, deliveryFee, deliveryAddress, deliveryLocationUrl, couponCode, couponDiscount, deliverySlot) => {
    const { cart, user, orders } = get();
    if (!user) {
      throw new Error('Please sign in to place an order.');
    }
    if (cart.length === 0) {
      throw new Error('Your cart is empty.');
    }
    if (!deliveryAddress?.trim()) {
      throw new Error('Delivery address is required.');
    }

    for (const item of cart) {
      const lineError = validateCartLine(item, user.role);
      if (lineError) {
        throw new Error(lineError);
      }
    }

    const subtotal = get().getCartTotal();
    // Apply coupon discount if present, then add delivery fee
    const discountedSubtotal = couponDiscount ? Math.max(0, subtotal - couponDiscount) : subtotal;
    const finalTotal = discountedSubtotal + deliveryFee;

    if (user.role === 'shopowner' && paymentMethod === 'cod') {
      throw new Error('Cash on Delivery is unavailable for wholesale orders. Please use UPI or card.');
    }
    if (paymentMethod === 'cod' && finalTotal > 10000) {
      throw new Error('Cash on Delivery is available only for orders up to Rs.10,000.');
    }

    const order: Order = {
      id: `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
      items: [...cart],
      total: finalTotal,
      deliveryFee,
      status: 'placed', // PLACED — no stock change
      date: new Date().toISOString().split('T')[0],
      paymentMethod,
      userRole: user.role,
      userName: user.name,
      userId: user.id,
      deliveryAddress: deliveryAddress || undefined,
      deliveryLocationUrl: deliveryLocationUrl || undefined,
      deliverySlot: deliverySlot || undefined,
      couponCode: couponCode || undefined,
      couponDiscount: couponDiscount || undefined,
    };
    await api.createOrder(order);
    await api.createCartItems(order.id, order.items).catch((err) => {
      console.error('Failed to save cart items:', err);
    });
    set({ orders: [order, ...orders], cart: [] });
    api.clearCartItems(user.id).catch(console.error);
  },

  // Accept order → decrease stock (with insufficiency check)
  acceptOrder: (orderId) => {
    const { orders, inventoryLedger } = get();
    const order = orders.find((o) => o.id === orderId);
    if (!order || order.status !== 'placed') return { success: false, message: 'Order cannot be accepted' };

    // Check stock sufficiency for ALL items first (atomic check)
    const productMap = new Map(get().products.map((p) => [p.id, p]));

    for (const item of order.items) {
      const prod = productMap.get(item.product.id);
      if (!prod || prod.stock < item.quantity) {
        return {
          success: false,
          message: `Insufficient stock for "${item.product.name}" (available: ${prod?.stock || 0}, needed: ${item.quantity})`,
        };
      }
    }

    // Decrease stock and log ledger entries
    const newLedgerEntries: InventoryLedger[] = [];
    const now = new Date().toISOString();
    for (const item of order.items) {
      const prod = productMap.get(item.product.id);
      if (prod) {
        const prevStock = prod.stock;
        prod.stock = Math.max(0, prod.stock - item.quantity);
        newLedgerEntries.push({
          id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          orderId,
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          action: 'reserve',
          previousStock: prevStock,
          newStock: prod.stock,
          date: now,
          reason: `Order ${orderId} accepted`,
        });
      }
    }

    set({
      orders: orders.map((o) => (o.id === orderId ? { ...o, status: 'accepted' as const } : o)),
      inventoryLedger: [...newLedgerEntries, ...inventoryLedger],
    });

    // Persist to DB
    api.updateOrder(orderId, { status: 'accepted' }).catch(console.error);
    return { success: true, message: 'Order accepted and stock updated' };
  },

  // Reject order → no stock change (order was only 'placed')
  rejectOrder: (orderId) => {
    const { orders } = get();
    const order = orders.find((o) => o.id === orderId);
    if (!order || order.status !== 'placed') return;

    set({
      orders: orders.map((o) => (o.id === orderId ? { ...o, status: 'rejected' as const } : o)),
    });
    api.updateOrder(orderId, { status: 'rejected' }).catch(console.error);
  },

  // Cancel order → restore stock if it was ACCEPTED (not shipped — shipped orders can't be cancelled)
  cancelOrder: (orderId) => {
    const { orders, inventoryLedger } = get();
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    // Only allow cancellation for placed or accepted orders
    if (order.status !== 'placed' && order.status !== 'accepted') return;

    const wasAccepted = order.status === 'accepted';
    const newLedgerEntries: InventoryLedger[] = [];

    if (wasAccepted) {
      // Restore stock safely using current products state
      const productMap = new Map(get().products.map((p) => [p.id, p]));
      const now = new Date().toISOString();

      for (const item of order.items) {
        const prod = productMap.get(item.product.id);
        if (prod) {
          const prevStock = prod.stock;
          prod.stock += item.quantity;
          newLedgerEntries.push({
            id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            orderId,
            productId: item.product.id,
            productName: item.product.name,
            quantity: item.quantity,
            action: 'release',
            previousStock: prevStock,
            newStock: prod.stock,
            date: now,
            reason: `Order ${orderId} cancelled — stock restored`,
          });
        }
      }
    }

    set({
      orders: orders.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' as const } : o)),
      inventoryLedger: [...newLedgerEntries, ...inventoryLedger],
    });
    api.updateOrder(orderId, { status: 'cancelled' }).catch(console.error);
  },

  // Set orders (for real-time sync)
  setOrders: (orders) => set({ orders }),

  // Generic status update (for ship / deliver)
  updateOrderStatus: async (orderId, status) => {
    const { orders, users } = get();
    const order = orders.find((o) => o.id === orderId);

    if (!order) return;

    // Calculate profits and savings when order is delivered
    if (status === 'delivered' && !order.adminProfit) {
      let adminProfit = 0;
      let shopProfit = 0;
      let customerSavings = 0;

      order.items.forEach((item) => {
        const product = item.product;
        const quantity = item.quantity;

        // Calculate per-item profits and savings
        const mrp = product.mrp;
        const purchasePrice = product.purchasePrice;
        const shopPrice = product.shopPrice;
        const customerPrice = product.customerPrice;

        // Admin profit: (shopPrice - purchasePrice) + (customerPrice - purchasePrice)
        const itemAdminProfit = (shopPrice - purchasePrice) + (customerPrice - purchasePrice);
        adminProfit += itemAdminProfit * quantity;

        // Shop profit: MRP - shopPrice
        const itemShopProfit = mrp - shopPrice;
        shopProfit += itemShopProfit * quantity;

        // Customer savings: MRP - customerPrice
        const itemCustomerSavings = mrp - customerPrice;
        customerSavings += itemCustomerSavings * quantity;
      });

      // Update order with calculated profits
      const updatedOrder = {
        ...order,
        status,
        adminProfit,
        shopProfit,
        customerSavings
      };

      // Update user totals
      const updatedUsers = users.map((user) => {
        if (user.id === order.userId) {
          const currentSavings = user.totalSavings || 0;
          const currentProfit = user.totalProfit || 0;

          return {
            ...user,
            totalSavings: user.role === 'customer' ? currentSavings + customerSavings : currentSavings,
            totalProfit: user.role === 'shopowner' ? currentProfit + shopProfit : currentProfit,
          };
        }
        return user;
      });

      set({
        orders: orders.map((o) => (o.id === orderId ? updatedOrder : o)),
        users: updatedUsers,
      });

      // Persist to database
      try {
        await api.updateOrder(orderId, { status, adminProfit, shopProfit, customerSavings });
        if (order.userId) {
          const updatedOrderUser = updatedUsers.find((u) => u.id === order.userId);
          if (updatedOrderUser) {
            await api.updateUser(order.userId, {
              totalSavings: updatedOrderUser.totalSavings || 0,
              totalProfit: updatedOrderUser.totalProfit || 0,
            });
          }
        }
      } catch (err) {
        console.error('Update order status error:', err);
      }
    } else {
      // Regular status update without profit calculation
      set({
        orders: orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
      });
      try {
        await api.updateOrder(orderId, { status });
      } catch (err) {
        console.error('Update order status error:', err);
      }
    }
  },

  // ─── Products (admin CRUD) ───
  loadProducts: async () => {
    try {
      const dbProducts = await api.getProducts();
      if (dbProducts && dbProducts.length > 0) {
        set({ products: dbProducts });
      }
    } catch (err) {
      console.error('Load products error:', err);
    }
  },

  addProduct: async (product) => {
    try {
      await api.createProduct(product);
      set({ products: [product, ...get().products] });
    } catch (err) {
      console.error('Add product error:', err);
      // Still update local state so the UI is responsive even if network fails
      set({ products: [product, ...get().products] });
    }
  },

  editProduct: async (id, updates) => {
    const existing = get().products.find((p) => p.id === id);
    if (!existing) return;
    const updated: Product = { ...existing, ...updates };
    set({
      products: get().products.map((p) => (p.id === id ? updated : p)),
    });
    try {
      await api.updateProduct(id, updates);
    } catch (err) {
      console.error('Edit product error:', err);
    }
  },

  deleteProductById: async (id) => {
    set({
      products: get().products.filter((p) => p.id !== id),
    });
    try {
      await api.deleteProduct(id);
    } catch (err) {
      console.error('Delete product error:', err);
    }
  },

  // ─── Product Requests ───
  requestProduct: async (productId, productName) => {
    const { user, productRequests } = get();
    if (!user) throw new Error('Must be logged in');

    // Check if already requested
    const existing = productRequests.find(
      (r) => r.productId === productId && r.userId === user.id && r.status === 'pending'
    );
    if (existing) throw new Error('Already requested');

    const request: ProductRequest = {
      id: `pr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId,
      productName,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      status: 'pending',
      requestDate: new Date().toISOString().split('T')[0],
    };
    try {
      await api.createProductRequest(request);
      set({ productRequests: [request, ...productRequests] });
    } catch (err) {
      console.error('Product request error:', err);
      throw err;
    }
  },

  loadProductRequests: async () => {
    try {
      const data = await api.getProductRequests();
      set({ productRequests: data });
    } catch (err) {
      console.error('Load product requests error:', err);
    }
  },

  updateProductRequest: async (id, status) => {
    try {
      await api.updateProductRequest(id, status);
      const request = get().productRequests.find((r) => r.id === id);
      set({
        productRequests: get().productRequests.map((r) =>
          r.id === id ? { ...r, status } : r
        ),
      });
      // If fulfilled, create a notification for the requesting user
      if (status === 'fulfilled' && request) {
        const notification: Notification = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          type: 'product_available',
          title: 'Product Now Available!',
          message: `Great news! "${request.productName}" you requested is now back in stock. Order now before it runs out!`,
          productId: request.productId,
          read: false,
          date: new Date().toISOString(),
        };
        get().addNotification(request.userId, notification);
      }
    } catch (err) {
      console.error('Update product request error:', err);
    }
  },

  // ─── Notifications (stored in Supabase kumar_notifications table) ───
  loadNotifications: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const notifs = await api.getNotifications(user.id);
      set({ notifications: notifs });
    } catch (err) {
      console.error('Load notifications error:', err);
    }
  },

  addNotification: async (userId, notification) => {
    try {
      await api.createNotification({
        id: notification.id,
        userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        productId: notification.productId,
      });
      // If the current user is the target, update state too
      if (get().user?.id === userId) {
        set({ notifications: [notification, ...get().notifications] });
      }
    } catch (err) {
      console.error('Add notification error:', err);
    }
  },

  markNotificationRead: async (id) => {
    const { notifications } = get();
    // Optimistic update
    set({ notifications: notifications.map((n) => n.id === id ? { ...n, read: true } : n) });
    try {
      await api.markNotificationRead(id);
    } catch (err) {
      console.error('Mark notification read error:', err);
    }
  },

  markAllNotificationsRead: async () => {
    const { user, notifications } = get();
    if (!user) return;
    // Optimistic update
    set({ notifications: notifications.map((n) => ({ ...n, read: true })) });
    try {
      await api.markAllNotificationsRead(user.id);
    } catch (err) {
      console.error('Mark all notifications read error:', err);
    }
  },

  clearNotifications: async () => {
    const { user } = get();
    if (!user) return;
    set({ notifications: [] });
    try {
      await api.deleteAllNotifications(user.id);
    } catch (err) {
      console.error('Clear notifications error:', err);
    }
  },

  // ─── Reviews ───
  loadReviews: async (productId) => {
    try {
      const reviews = await api.getReviews(productId);
      set({ productReviews: reviews });
    } catch (err) {
      console.error('Load reviews error:', err);
    }
  },

  addReview: async (payload) => {
    const { user } = get();
    if (!user) throw new Error('Must be logged in to review');
    
    // Rate limit reviews to prevent spam
    if (!checkRateLimit(`review_${user.id}_${payload.productId}`, 10000)) {
      throw new Error('Please wait before posting another review.');
    }

    try {
      await api.createReview({
        ...payload,
        comment: sanitizeInput(payload.comment),
        userId: user.id,
        userName: user.name,
      });
      // Refresh reviews for this product
      await get().loadReviews(payload.productId);
    } catch (err) {
      console.error('Add review error:', err);
      throw err;
    }
  },

  toggleReviewLike: async (reviewId) => {
    const { productReviews } = get();
    const review = productReviews.find(r => r.id === reviewId);
    if (!review) return;

    const newLikes = (review.likes || 0) + 1;
    // Optimistic update
    set({
      productReviews: productReviews.map(r => 
        r.id === reviewId ? { ...r, likes: newLikes } : r
      )
    });

    try {
      await api.updateReviewLikes(reviewId, newLikes);
    } catch (err) {
      console.error('Toggle review like error:', err);
      // Revert on error
      set({
        productReviews: productReviews.map(r => 
          r.id === reviewId ? { ...r, likes: review.likes } : r
        )
      });
    }
  },

  // ─── UI ───
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSelectedCategory: (c) => set({ selectedCategory: c }),

  addRecentlyViewed: (productId) => {
    const { recentlyViewed } = get();
    const filtered = recentlyViewed.filter((id) => id !== productId);
    set({ recentlyViewed: [productId, ...filtered].slice(0, 10) });
  },

  // ─── Pricing ───
  getPrice: (product) => {
    const { user } = get();
    if (user?.role === 'shopowner') return product.shopPrice;
    if (user?.role === 'customer') return product.customerPrice;
    return product.mrp; // non-logged-in or admin sees MRP
  },

  getCartTotal: () => {
    const { cart } = get();
    const getPrice = get().getPrice;
    return cart.reduce((sum, item) => sum + getPrice(item.product) * item.quantity, 0);
  },

  getRealTimeStats: () => {
    const { orders, products, users } = get();

    // Order status counts
    const placedOrders = orders.filter((o: Order) => o.status === 'placed');
    const acceptedOrders = orders.filter((o: Order) => o.status === 'accepted');
    const shippedOrders = orders.filter((o: Order) => o.status === 'shipped');
    const deliveredOrders = orders.filter((o: Order) => o.status === 'delivered');
    const cancelledOrders = orders.filter((o: Order) => o.status === 'cancelled');
    const rejectedOrders = orders.filter((o: Order) => o.status === 'rejected');

    // Revenue calculations
    const totalRevenue = deliveredOrders.reduce((sum: number, o: Order) => sum + o.total, 0);
    const pipelineValue = (placedOrders.length + acceptedOrders.length + shippedOrders.length) *
      deliveredOrders.reduce((avg: number, o: Order) => avg + o.total, 0) / Math.max(1, deliveredOrders.length);

    // Customer metrics
    const totalCustomers = new Set(orders.map((o: Order) => o.userId).filter(Boolean)).size;
    const activeCustomers = new Set(orders.filter((o: Order) => ['placed', 'accepted', 'shipped'].includes(o.status)).map((o: Order) => o.userId).filter(Boolean)).size;
    const returningCustomers = new Set(
      orders.filter((o: Order) => o.status === 'delivered' && o.userId)
        .map((o: Order) => o.userId)
        .filter((userId: string | undefined) => userId && orders.filter((ord: Order) => ord.userId === userId && ord.status === 'delivered').length > 1)
    ).size;

    // Shop owner metrics
    const shopOwners = users.filter((u: User) => u.role === 'shopowner');
    const activeShopOwners = new Set(
      orders.filter((o: Order) => o.userRole === 'shopowner' && ['placed', 'accepted', 'shipped'].includes(o.status) && o.userId)
        .map((o: Order) => o.userId)
    ).size;

    // Profit and savings metrics - split admin profit by user role
    // Use stored order values if available, otherwise calculate from product prices
    const totalAdminProfitFromCustomers = orders
      .filter((o: Order) => o.status === 'delivered' && o.userRole !== 'shopowner')
      .reduce((sum: number, o: Order) => {
        // Use stored adminProfit if available, otherwise calculate
        if (o.adminProfit !== undefined) {
          return sum + o.adminProfit;
        }
        return sum + o.items.reduce((itemSum: number, item: CartItem) => {
          const customerPrice = Number(item.product.customerPrice) || 0;
          const purchasePrice = Number(item.product.purchasePrice) || 0;
          const profit = (customerPrice - purchasePrice) * item.quantity;
          return itemSum + profit;
        }, 0);
      }, 0);

    const totalAdminProfitFromShops = orders
      .filter((o: Order) => o.status === 'delivered' && o.userRole === 'shopowner')
      .reduce((sum: number, o: Order) => {
        // Use stored adminProfit if available, otherwise calculate
        if (o.adminProfit !== undefined) {
          return sum + o.adminProfit;
        }
        return sum + o.items.reduce((itemSum: number, item: CartItem) => {
          const shopPrice = Number(item.product.shopPrice) || 0;
          const purchasePrice = Number(item.product.purchasePrice) || 0;
          const profit = (shopPrice - purchasePrice) * item.quantity;
          return itemSum + profit;
        }, 0);
      }, 0);

    const totalAdminProfit = totalAdminProfitFromCustomers + totalAdminProfitFromShops;

    const totalShopProfit = orders
      .filter((o: Order) => o.status === 'delivered' && o.userRole === 'shopowner')
      .reduce((sum: number, o: Order) => {
        // Use stored shopProfit if available, otherwise calculate
        if (o.shopProfit !== undefined) {
          return sum + o.shopProfit;
        }
        return sum + o.items.reduce((itemSum: number, item: CartItem) => {
          const mrp = Number(item.product.mrp) || 0;
          const shopPrice = Number(item.product.shopPrice) || 0;
          const profit = (mrp - shopPrice) * item.quantity;
          return itemSum + profit;
        }, 0);
      }, 0);

    const totalCustomerSavings = orders
      .filter((o: Order) => o.status === 'delivered' && o.userRole !== 'shopowner')
      .reduce((sum: number, o: Order) => {
        // Use stored customerSavings if available, otherwise calculate
        if (o.customerSavings !== undefined) {
          return sum + o.customerSavings;
        }
        return sum + o.items.reduce((itemSum: number, item: CartItem) => {
          const mrp = Number(item.product.mrp) || 0;
          const customerPrice = Number(item.product.customerPrice) || 0;
          const savings = (mrp - customerPrice) * item.quantity;
          return itemSum + savings;
        }, 0);
      }, 0);

    // Product metrics
    const lowStockProducts = products.filter((p: Product) => p.stock > 0 && p.stock <= 10);
    const outOfStockProducts = products.filter((p: Product) => p.stock === 0);
    const totalProducts = products.length;

    // Today's activity
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter((o: Order) => o.date === today);
    const todayRevenue = todayOrders.filter((o: Order) => o.status === 'delivered').reduce((sum: number, o: Order) => sum + o.total, 0);

    return {
      // Order metrics
      totalOrders: orders.length,
      placedOrders: placedOrders.length,
      acceptedOrders: acceptedOrders.length,
      shippedOrders: shippedOrders.length,
      deliveredOrders: deliveredOrders.length,
      cancelledOrders: cancelledOrders.length,
      rejectedOrders: rejectedOrders.length,

      // Revenue metrics
      totalRevenue,
      pipelineValue,
      todayRevenue,
      averageOrderValue: deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0,

      // Customer metrics
      totalCustomers,
      activeCustomers,
      returningCustomers,
      customerRetentionRate: totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0,

      // Shop metrics
      totalShopOwners: shopOwners.length,
      activeShopOwners,

      // Profit and savings metrics
      totalAdminProfit,
      totalAdminProfitFromCustomers,
      totalAdminProfitFromShops,
      totalShopProfit,
      totalCustomerSavings,

      // Product metrics
      totalProducts,
      lowStockProducts: lowStockProducts.length,
      outOfStockProducts: outOfStockProducts.length,

      // Activity metrics
      todayOrders: todayOrders.length,
      todayPlacedOrders: todayOrders.filter((o: Order) => o.status === 'placed').length,
      todayDeliveredOrders: todayOrders.filter((o: Order) => o.status === 'delivered').length,

      // Growth metrics
      monthlyGrowth: 0, // Could be calculated based on historical data
      orderCompletionRate: orders.length > 0 ? (deliveredOrders.length / orders.length) * 100 : 0,
    };
  },
}));
