import { create } from 'zustand';
import * as api from './api';
import { products as allProducts } from './data';

export type UserRole = 'customer' | 'shopowner' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  password?: string;
  address?: string;
  shopName?: string;
  shopLocation?: string;
  gstNumber?: string;
  approved?: boolean;
  creditLimit?: number;
  profit?: number;
}

export interface ShopRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  shopName: string;
  shopLocation: string;
  password: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
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

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus = 'placed' | 'accepted' | 'rejected' | 'cancelled' | 'shipped' | 'delivered';

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  date: string;
  paymentMethod: string;
  userRole: UserRole;
  userName: string;
  userId?: string;
  couponCode?: string;
  couponDiscount?: number;
}

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

interface AppState {
  user: User | null;
  registeredUsers: User[];
  shopRequests: ShopRequest[];
  cart: CartItem[];
  wishlist: string[];
  orders: Order[];
  inventoryLedger: InventoryLedger[];
  productRequests: ProductRequest[];
  notifications: Notification[];
  searchQuery: string;
  selectedCategory: string;
  recentlyViewed: string[];
  dbReady: boolean;
  dbLoading: boolean;

  // Init
  initDB: () => Promise<void>;
  loadAllData: () => Promise<void>;
  restoreSession: () => void;

  // Auth
  login: (user: User) => void;
  logout: () => void;
  registerCustomer: (user: Omit<User, 'id' | 'role'>) => Promise<void>;
  registerShopOwner: (request: Omit<ShopRequest, 'id' | 'status' | 'date'>) => Promise<void>;
  authenticateUser: (email: string, password: string, role: UserRole) => Promise<{ success: boolean; message: string; user?: User }>;

  // Admin
  approveShop: (requestId: string) => Promise<void>;
  rejectShop: (requestId: string) => Promise<void>;

  // Cart
  addToCart: (product: Product, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQty: (productId: string, qty: number) => void;
  clearCart: () => void;

  // Wishlist
  toggleWishlist: (productId: string) => void;

  // Orders
  placeOrder: (paymentMethod: string, couponCode?: string, couponDiscount?: number) => Promise<void>;
  acceptOrder: (orderId: string) => { success: boolean; message: string };
  rejectOrder: (orderId: string) => void;
  cancelOrder: (orderId: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;

  // Product Requests
  requestProduct: (productId: string, productName: string) => Promise<void>;
  loadProductRequests: () => Promise<void>;
  updateProductRequest: (id: string, status: 'fulfilled' | 'dismissed') => Promise<void>;

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
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  registeredUsers: [],
  shopRequests: [],
  cart: [],
  wishlist: [],
  orders: [],
  inventoryLedger: [],
  productRequests: [],
  notifications: [],
  searchQuery: '',
  selectedCategory: '',
  recentlyViewed: [],
  dbReady: false,
  dbLoading: false,

  // ─── Initialize database & load data ───
  initDB: async () => {
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
      const [users, shopRequests, orders, productRequests] = await Promise.all([
        api.getUsers(),
        api.getShopRequests(),
        api.getOrders(),
        api.getProductRequests().catch(() => []),
      ]);
      set({ registeredUsers: users, shopRequests, orders, productRequests });
    } catch (err) {
      console.error('Error loading data:', err);
    }
  },

  restoreSession: () => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user) {
      set({ user });
      // Load notifications from DB for this user
      api.getNotifications(user.id)
        .then((notifs) => set({ notifications: notifs }))
        .catch(() => { /* ignore */ });
    }
  },

  // ─── Auth ───
  login: (user) => {
    set({ user });
    localStorage.setItem('user', JSON.stringify(user));
    // Load notifications from DB for this user on login
    api.getNotifications(user.id)
      .then((notifs) => set({ notifications: notifs }))
      .catch(() => set({ notifications: [] }));
  },
  logout: () => {
    set({ user: null, cart: [], wishlist: [], notifications: [] });
    localStorage.removeItem('user');
  },

  registerCustomer: async (userData) => {
    const newUser: User = {
      id: `cust-${Date.now()}`,
      ...userData,
      role: 'customer',
    };
    try {
      await api.createUser(newUser);
      set({ registeredUsers: [...get().registeredUsers, newUser] });
    } catch (err) {
      console.error('Register customer error:', err);
      throw err;
    }
  },

  registerShopOwner: async (request) => {
    const newRequest: ShopRequest = {
      id: `sr-${Date.now()}`,
      ...request,
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
    };
    try {
      await api.createShopRequest(newRequest);
      set({ shopRequests: [...get().shopRequests, newRequest] });
    } catch (err) {
      console.error('Register shop owner error:', err);
      throw err;
    }
  },

  authenticateUser: async (email, password, role) => {
    try {
      const result = await api.loginUser(email, password, role);
      return result;
    } catch (err) {
      console.error('Auth error:', err);
      return { success: false, message: 'Network error. Please try again.' };
    }
  },

  // ─── Admin actions ───
  approveShop: async (requestId) => {
    try {
      const { request: updated, newUser } = await api.approveShopRequest(requestId);
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

  // ─── Cart ───
  addToCart: (product, qty = 1) => {
    const { cart } = get();
    const existing = cart.find((i) => i.product.id === product.id);
    if (existing) {
      set({
        cart: cart.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + qty } : i
        ),
      });
    } else {
      set({ cart: [...cart, { product, quantity: qty }] });
    }
  },

  removeFromCart: (productId) => {
    set({ cart: get().cart.filter((i) => i.product.id !== productId) });
  },

  updateCartQty: (productId, qty) => {
    if (qty <= 0) {
      get().removeFromCart(productId);
      return;
    }
    set({
      cart: get().cart.map((i) =>
        i.product.id === productId ? { ...i, quantity: qty } : i
      ),
    });
  },

  clearCart: () => set({ cart: [] }),

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
  placeOrder: async (paymentMethod, couponCode, couponDiscount) => {
    const { cart, user, orders } = get();
    const total = get().getCartTotal();
    // Apply coupon discount if present
    const finalTotal = couponDiscount ? Math.max(0, total - couponDiscount) : total;
    const order: Order = {
      id: `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      items: [...cart],
      total: finalTotal,
      status: 'placed', // PLACED — no stock change
      date: new Date().toISOString().split('T')[0],
      paymentMethod,
      userRole: user?.role || 'customer',
      userName: user?.name || 'Guest',
      userId: user?.id,
      couponCode: couponCode || undefined,
      couponDiscount: couponDiscount || undefined,
    };
    try {
      await api.createOrder(order);
      set({ orders: [order, ...orders], cart: [] });
    } catch (err) {
      console.error('Place order error:', err);
      set({ orders: [order, ...orders], cart: [] });
    }
  },

  // Accept order → decrease stock (with insufficiency check)
  acceptOrder: (orderId) => {
    const { orders, inventoryLedger } = get();
    const order = orders.find((o) => o.id === orderId);
    if (!order || order.status !== 'placed') return { success: false, message: 'Order cannot be accepted' };

    // Check stock sufficiency for ALL items first (atomic check)
    const productMap = new Map(allProducts.map((p) => [p.id, p]));

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

  // Cancel order → restore stock if it was ACCEPTED
  cancelOrder: (orderId) => {
    const { orders, inventoryLedger } = get();
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const wasAccepted = order.status === 'accepted' || order.status === 'shipped';
    const newLedgerEntries: InventoryLedger[] = [];

    if (wasAccepted) {
      // Restore stock safely
      const productMap = new Map(allProducts.map((p) => [p.id, p]));
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

  // Generic status update (for ship / deliver)
  updateOrderStatus: async (orderId, status) => {
    const { orders } = get();
    set({
      orders: orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
    });
    try {
      await api.updateOrder(orderId, { status });
    } catch (err) {
      console.error('Update order status error:', err);
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
}));