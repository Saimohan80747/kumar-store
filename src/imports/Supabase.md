# Kumar Store - Supabase Database & Backend Reference

> Complete step-by-step guide for the Supabase integration powering Kumar Store's
> wholesale + retail e-commerce platform.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Database Schema (KV Store Virtual Tables)](#2-database-schema-kv-store-virtual-tables)
3. [KV Key Patterns & Data Structures](#3-kv-key-patterns--data-structures)
4. [Backend API Endpoints](#4-backend-api-endpoints)
5. [Frontend API Client](#5-frontend-api-client)
6. [Zustand Store Integration](#6-zustand-store-integration)
7. [Authentication Flow](#7-authentication-flow)
8. [Seed / Demo Data](#8-seed--demo-data)
9. [Step-by-Step Setup Guide](#9-step-by-step-setup-guide)
10. [SQL Table Schemas (For Supabase Dashboard Migration)](#10-sql-table-schemas-for-supabase-dashboard-migration)
11. [Seed Data INSERT Statements (Copy-Paste into SQL Editor)](#11-seed-data-insert-statements-copy-paste-into-sql-editor)
12. [Execution Order (Step-by-Step Checklist)](#12-execution-order-step-by-step-checklist)

---

## 1. Architecture Overview

```
Frontend (React + Zustand)
    |
    | fetch() with Bearer token
    v
Supabase Edge Function (Hono web server)
    |
    | kv_store.tsx helper functions
    v
Supabase Postgres Database (kv_store_8a0a2a06 table)
```

**Key files:**

| File | Purpose |
|------|---------|
| `/src/app/api.ts` | Frontend API client (all fetch calls) |
| `/src/app/store.ts` | Zustand state management (async actions) |
| `/supabase/functions/server/index.tsx` | Hono REST API server (14 endpoints) |
| `/supabase/functions/server/kv_store.tsx` | KV store utility (get, set, del, mget, mset, mdel, getByPrefix) |
| `/utils/supabase/info.tsx` | Supabase projectId & publicAnonKey |

---

## 2. Database Schema (KV Store Virtual Tables)

The platform uses a single Postgres table `kv_store_8a0a2a06` as a key-value store.
Each "virtual table" is implemented via key prefixes:

| Virtual Table | Key Prefix | Description |
|--------------|------------|-------------|
| **Users** | `ks:user:{id}` | All registered users (customers, shop owners, admin) |
| **Shop Requests** | `ks:shop-request:{id}` | Shop owner registration requests (pending/approved/rejected) |
| **Orders** | `ks:order:{id}` | All placed orders with items, totals, status |
| **Coupons** | `ks:coupon:{code}` | Discount coupons with rules |
| **Metadata** | `ks:meta:{key}` | System flags (e.g., `initialized`) |

---

## 3. KV Key Patterns & Data Structures

### 3.1 Users (`ks:user:{id}`)

```typescript
interface User {
  id: string;           // "cust-1", "shop-1", "admin-1", "cust-{timestamp}"
  name: string;         // "Priya Sharma"
  email: string;        // "priya@gmail.com"
  phone: string;        // "9876543212"
  role: 'customer' | 'shopowner' | 'admin';
  password: string;     // Plain text (demo only - use hashing in production)
  address?: string;     // "123 Main Street, Mumbai 400001"
  // Shop owner specific fields:
  shopName?: string;    // "Raj Kirana Store"
  shopLocation?: string; // "Mumbai, Maharashtra"
  gstNumber?: string;   // "27AABCU9603R1ZM"
  approved?: boolean;   // true (only for shop owners)
  creditLimit?: number; // 50000
}
```

**Example keys:**
- `ks:user:cust-1` -> Customer: Priya Sharma
- `ks:user:shop-1` -> Shop Owner: Raj Kumar
- `ks:user:admin-1` -> Admin
- `ks:user:cust-1741234567890` -> Dynamically registered customer

### 3.2 Shop Requests (`ks:shop-request:{id}`)

```typescript
interface ShopRequest {
  id: string;            // "sr-1", "sr-{timestamp}"
  name: string;          // "Sanjay Patel"
  email: string;         // "sanjay@store.com"
  phone: string;         // "9876543001"
  shopName: string;      // "Sanjay General Store"
  shopLocation: string;  // "Ahmedabad, Gujarat"
  password: string;      // Password chosen during registration
  status: 'pending' | 'approved' | 'rejected';
  date: string;          // "2026-03-01" (ISO date)
}
```

**Example keys:**
- `ks:shop-request:sr-1` -> Pending request from Sanjay Patel
- `ks:shop-request:sr-2` -> Pending request from Krishna Kumar

### 3.3 Orders (`ks:order:{id}`)

```typescript
interface Order {
  id: string;              // "ORD-10041"
  items: CartItem[];       // Array of { product: Product, quantity: number }
  total: number;           // 2450 (in rupees)
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  date: string;            // "2026-02-25"
  paymentMethod: string;   // "upi", "cod", "credit", "card"
  userRole: 'customer' | 'shopowner' | 'admin';
  userName: string;        // "Priya Sharma"
}
```

**Example keys:**
- `ks:order:ORD-10041` -> Delivered order, Rs.2450
- `ks:order:ORD-10042` -> Shipped wholesale order, Rs.18500

### 3.4 Coupons (`ks:coupon:{code}`)

```typescript
interface Coupon {
  code: string;       // "WELCOME10"
  discount: number;   // 10
  type: 'percent' | 'flat';  // "percent" = 10% off, "flat" = Rs.50 off
  minOrder: number;   // 500 (minimum order value to apply)
}
```

**Example keys:**
- `ks:coupon:WELCOME10` -> 10% off, min order Rs.500
- `ks:coupon:SAVE50` -> Rs.50 flat off, min order Rs.1000
- `ks:coupon:BULK20` -> 20% off, min order Rs.5000
- `ks:coupon:FIRST100` -> Rs.100 flat off, min order Rs.300

### 3.5 Metadata (`ks:meta:{key}`)

```typescript
// ks:meta:initialized -> boolean (true after first seed)
```

---

## 4. Backend API Endpoints

Server: `/supabase/functions/server/index.tsx`
Base URL: `https://{projectId}.supabase.co/functions/v1/make-server-8a0a2a06`

### 4.1 Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Returns `{ status: "ok" }` |

### 4.2 Initialization

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/init` | Seeds demo data (idempotent - runs only once) |

**Response:**
```json
{
  "status": "initialized",
  "users": 3,
  "shopRequests": 3,
  "orders": 2,
  "coupons": 4
}
```
Or if already seeded:
```json
{ "status": "already_initialized" }
```

### 4.3 Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | Get all registered users |
| POST | `/users` | Register a new customer |

**POST /users body:**
```json
{
  "id": "cust-1741234567890",
  "name": "New User",
  "email": "new@email.com",
  "phone": "9876543000",
  "role": "customer",
  "password": "mypassword"
}
```

### 4.4 Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Authenticate user by email, password, role |

**POST /auth/login body:**
```json
{
  "email": "priya@gmail.com",
  "password": "password123",
  "role": "customer"
}
```

**Success response:**
```json
{
  "success": true,
  "message": "Welcome back, Priya Sharma!",
  "user": { ... }
}
```

**Failure responses:**
```json
{ "success": false, "message": "Invalid email or password..." }
{ "success": false, "message": "Your shop registration is pending admin approval..." }
{ "success": false, "message": "Your shop registration has been rejected..." }
```

### 4.5 Shop Requests

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/shop-requests` | Get all shop owner registration requests |
| POST | `/shop-requests` | Submit a new shop owner registration |
| PUT | `/shop-requests/:id/approve` | Admin approves a shop request (creates user) |
| PUT | `/shop-requests/:id/reject` | Admin rejects a shop request |

**Approval flow:**
1. Shop owner registers -> creates `ks:shop-request:{id}` with status `pending`
2. Admin approves -> updates status to `approved` + creates `ks:user:shop-{timestamp}` with `approved: true`
3. Shop owner can now log in with wholesale pricing

### 4.6 Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/orders` | Get all orders (sorted by date descending) |
| POST | `/orders` | Create a new order |
| PUT | `/orders/:id` | Update an order (status, etc.) |

### 4.7 Coupons

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/coupons` | Get all coupons |
| POST | `/coupons` | Create a new coupon |
| DELETE | `/coupons/:code` | Delete a coupon |

### 4.8 Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics` | Aggregated stats (revenue, orders, users) |

**Response:**
```json
{
  "totalRevenue": 20950,
  "totalOrders": 2,
  "totalCustomers": 1,
  "totalShopOwners": 1,
  "pendingApprovals": 3,
  "orders": [...],
  "users": [...]
}
```

---

## 5. Frontend API Client

File: `/src/app/api.ts`

```typescript
import { projectId, publicAnonKey } from '/utils/supabase/info';

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-8a0a2a06`;

// All requests include:
// - Content-Type: application/json
// - Authorization: Bearer {publicAnonKey}

// Available functions:
export const initDatabase = () => request('/init', { method: 'POST' });
export const getUsers = () => request('/users');
export const createUser = (user) => request('/users', { method: 'POST', body: JSON.stringify(user) });
export const loginUser = (email, password, role) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password, role }) });
export const getShopRequests = () => request('/shop-requests');
export const createShopRequest = (req) => request('/shop-requests', { method: 'POST', body: JSON.stringify(req) });
export const approveShopRequest = (id) => request(`/shop-requests/${id}/approve`, { method: 'PUT' });
export const rejectShopRequest = (id) => request(`/shop-requests/${id}/reject`, { method: 'PUT' });
export const getOrders = () => request('/orders');
export const createOrder = (order) => request('/orders', { method: 'POST', body: JSON.stringify(order) });
export const updateOrder = (id, updates) => request(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
export const getCoupons = () => request('/coupons');
export const createCoupon = (coupon) => request('/coupons', { method: 'POST', body: JSON.stringify(coupon) });
export const deleteCoupon = (code) => request(`/coupons/${code}`, { method: 'DELETE' });
export const getAnalytics = () => request('/analytics');
```

---

## 6. Zustand Store Integration

File: `/src/app/store.ts`

### Async Actions (hit the backend):
- `initDB()` - Seeds database on first load
- `loadAllData()` - Fetches users, shopRequests, orders from API
- `restoreSession()` - Restores logged-in user from localStorage
- `login(user)` - Sets user + saves to localStorage
- `logout()` - Clears user + localStorage + cart + wishlist
- `registerCustomer(data)` - POST /users
- `registerShopOwner(data)` - POST /shop-requests
- `authenticateUser(email, password, role)` - POST /auth/login
- `approveShop(requestId)` - PUT /shop-requests/:id/approve
- `rejectShop(requestId)` - PUT /shop-requests/:id/reject
- `placeOrder(paymentMethod)` - POST /orders

### Client-Side Only (no persistence):
- `addToCart()`, `removeFromCart()`, `updateCartQty()`, `clearCart()`
- `toggleWishlist()`
- `setSearchQuery()`, `setSelectedCategory()`
- `addRecentlyViewed()`
- `getPrice()`, `getCartTotal()`

---

## 7. Authentication Flow

### 7.1 Customer Sign In
```
1. User enters email + password + selects "Customer" tab
2. Frontend calls: POST /auth/login { email, password, role: "customer" }
3. Backend searches ks:user:* for matching customer
4. On success: returns user object
5. Frontend: Zustand login(user) -> saves to localStorage
6. User stays signed in across page refreshes
```

### 7.2 Shop Owner Sign In
```
1. User enters email + password + selects "Shop Owner" tab
2. Frontend calls: POST /auth/login { email, password, role: "shopowner" }
3. Backend checks:
   a. Is there a pending shop request? -> "Approval pending" error
   b. Is there a rejected shop request? -> "Rejected" error
   c. Is there an approved shop owner user? -> Check password
4. On success: returns user object with wholesale pricing
5. Frontend: Zustand login(user) -> saves to localStorage
6. Shop owner redirected to /shop-dashboard
```

### 7.3 Customer Registration
```
1. User fills form: name, email, phone, password
2. Frontend validates fields + checks for existing email
3. Calls: POST /users (creates ks:user:cust-{timestamp})
4. Success screen shown -> user can sign in immediately
```

### 7.4 Shop Owner Registration
```
1. User fills form: name, email, phone, shopName, shopLocation, password
2. Frontend validates + checks existing email
3. Calls: POST /shop-requests (creates ks:shop-request:sr-{timestamp})
4. Status = "pending" -> must wait for admin approval
5. Admin at /admin -> Shop Approvals page -> Approve/Reject
6. On approve: POST creates ks:user:shop-{timestamp} with approved=true
7. Shop owner can now sign in
```

### 7.5 Admin Authentication
```
1. Navigate to /admin
2. Password gate: "saimohan" (5-attempt lockout)
3. On success: login({ id: 'admin-1', role: 'admin', ... })
4. Admin has NO link from main storefront navbar
```

### 7.6 Session Persistence
```
- On login: localStorage.setItem('user', JSON.stringify(user))
- On app load: restoreSession() reads localStorage
- On logout: localStorage.removeItem('user') + clear cart/wishlist
```

---

## 8. Seed / Demo Data

The `/init` endpoint seeds the following demo data on first call:

### Demo Users
| ID | Name | Email | Role | Password |
|----|------|-------|------|----------|
| cust-1 | Priya Sharma | priya@gmail.com | customer | password123 |
| shop-1 | Raj Kumar | raj@kirana.com | shopowner | password123 |
| admin-1 | Admin | admin@kumarstore.com | admin | admin123 |

### Demo Shop Requests (all pending)
| ID | Name | Shop Name | Location | Status |
|----|------|-----------|----------|--------|
| sr-1 | Sanjay Patel | Sanjay General Store | Ahmedabad, Gujarat | pending |
| sr-2 | Krishna Kumar | New Krishna Mart | Pune, Maharashtra | pending |
| sr-3 | Ramesh Sharma | Balaji Traders | Delhi, NCR | pending |

### Demo Orders
| ID | Total | Status | Payment | User Role |
|----|-------|--------|---------|-----------|
| ORD-10041 | Rs.2,450 | delivered | UPI | customer |
| ORD-10042 | Rs.18,500 | shipped | Credit | shopowner |

### Demo Coupons
| Code | Discount | Type | Min Order |
|------|----------|------|-----------|
| WELCOME10 | 10% | percent | Rs.500 |
| SAVE50 | Rs.50 | flat | Rs.1,000 |
| BULK20 | 20% | percent | Rs.5,000 |
| FIRST100 | Rs.100 | flat | Rs.300 |

---

## 9. Step-by-Step Setup Guide

### Step 1: Environment Variables
The following Supabase secrets are already configured:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Public anonymous key (used in frontend Authorization header)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only, never exposed to frontend)
- `SUPABASE_DB_URL` - Direct database connection URL

### Step 2: KV Store Table
The `kv_store_8a0a2a06` table is pre-created automatically. No SQL setup needed.
It stores all data as JSON values with string keys.

### Step 3: Edge Function Deployment
The Hono server at `/supabase/functions/server/index.tsx` deploys automatically.
It serves 14 REST endpoints prefixed with `/make-server-8a0a2a06`.

### Step 4: First Load (Seeding)
When the app loads for the first time:
1. `App.tsx` calls `restoreSession()` (checks localStorage)
2. `App.tsx` calls `initDB()` which POSTs to `/init`
3. `/init` checks `ks:meta:initialized` flag
4. If not initialized: seeds 3 users + 3 shop requests + 2 orders + 4 coupons
5. Sets `ks:meta:initialized = true` (idempotent - won't re-seed)
6. Calls `loadAllData()` to fetch everything into Zustand

### Step 5: Verify Everything Works
- Visit `/login` -> use demo credentials to sign in
- Customer: `priya@gmail.com` / `password123`
- Shop Owner: `raj@kirana.com` / `password123`
- Admin: Navigate to `/admin` -> password: `saimohan`
- Place an order -> refresh page -> order persists
- Register new user -> refresh -> user persists
- Admin approve shop owner -> shop owner can now sign in

---

## 10. SQL Table Schemas (For Supabase Dashboard Migration)

> **IMPORTANT:** These SQL statements CANNOT be run from the Figma Make environment.
> They are provided as a reference if you want to migrate from the KV store to
> dedicated relational tables via the Supabase Dashboard SQL Editor.
> The current KV store approach works perfectly for prototyping.

### 10.1a Customer Users Table

```sql
CREATE TABLE IF NOT EXISTS kumar_customer_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  password TEXT NOT NULL,
  address TEXT,
  total_profit NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for login queries
CREATE INDEX idx_kumar_customer_users_email ON kumar_customer_users(email);
```

### 10.1b Shop Users Table

```sql
CREATE TABLE IF NOT EXISTS kumar_shop_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('shopowner', 'admin')),
  password TEXT NOT NULL,
  shop_name TEXT,
  shop_location TEXT,
  gst_number TEXT,
  approved BOOLEAN DEFAULT FALSE,
  credit_limit NUMERIC DEFAULT 0,
  total_profit NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for login queries
CREATE INDEX idx_kumar_shop_users_email_role ON kumar_shop_users(email, role);
```

### 10.2 Shop Requests Table

```sql
CREATE TABLE IF NOT EXISTS kumar_shop_requests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  shop_name TEXT NOT NULL,
  shop_location TEXT NOT NULL,
  password TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  request_date DATE DEFAULT CURRENT_DATE,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for filtering by status
CREATE INDEX idx_kumar_shop_requests_status ON kumar_shop_requests(status);
```

### 10.3 Orders Table

```sql
CREATE TABLE IF NOT EXISTS kumar_orders (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL CHECK (user_role IN ('customer', 'shopowner', 'admin')),
  items JSONB NOT NULL DEFAULT '[]',
  total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'placed' CHECK (status IN ('placed', 'accepted', 'rejected', 'shipped', 'delivered', 'cancelled')),
  payment_method TEXT NOT NULL,
  order_date DATE DEFAULT CURRENT_DATE,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_kumar_orders_user ON kumar_orders(user_id);
CREATE INDEX idx_kumar_orders_status ON kumar_orders(status);
CREATE INDEX idx_kumar_orders_date ON kumar_orders(order_date DESC);
```

### 10.4 Products Table

```sql
CREATE TABLE IF NOT EXISTS kumar_products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  mrp NUMERIC NOT NULL,
  purchase_price NUMERIC NOT NULL,
  shop_price NUMERIC NOT NULL,
  customer_price NUMERIC NOT NULL,
  min_wholesale_qty INTEGER DEFAULT 1,
  stock INTEGER DEFAULT 0,
  sku TEXT UNIQUE NOT NULL,
  unit_type TEXT DEFAULT 'Piece' CHECK (unit_type IN ('Piece', 'Box', 'Carton')),
  featured BOOLEAN DEFAULT FALSE,
  rating NUMERIC DEFAULT 0,
  reviews INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_kumar_products_category ON kumar_products(category);
CREATE INDEX idx_kumar_products_brand ON kumar_products(brand);
CREATE INDEX idx_kumar_products_featured ON kumar_products(featured) WHERE featured = TRUE;
```

### 10.5 Coupons Table

```sql
CREATE TABLE IF NOT EXISTS kumar_coupons (
  code TEXT PRIMARY KEY,
  discount NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('percent', 'flat')),
  min_order NUMERIC DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 10.6 Categories Table

```sql
CREATE TABLE IF NOT EXISTS kumar_categories (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE
);

-- Seed categories
INSERT INTO kumar_categories (slug, name, icon, sort_order) VALUES
  ('soaps-detergents', 'Soaps & Detergents', 'soap', 1),
  ('tea-coffee', 'Tea & Coffee', 'coffee', 2),
  ('oral-care', 'Oral Care', 'tooth', 3),
  ('personal-care', 'Personal Care', 'heart', 4),
  ('grocery-essentials', 'Grocery Essentials', 'cart', 5),
  ('snacks-beverages', 'Snacks & Beverages', 'cookie', 6),
  ('cleaning-supplies', 'Cleaning Supplies', 'spray', 7),
  ('fresh-organic', 'Fresh & Organic', 'leaf', 8);
```

### 10.7 Cart Table (Optional - currently client-side)

```sql
CREATE TABLE IF NOT EXISTS kumar_cart (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_id TEXT REFERENCES kumar_products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);
```

### 10.8 Wishlist Table (Optional - currently client-side)

```sql
CREATE TABLE IF NOT EXISTS kumar_wishlist (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_id TEXT REFERENCES kumar_products(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);
```

### 10.9 Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE kumar_customer_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE kumar_shop_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE kumar_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE kumar_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE kumar_coupons ENABLE ROW LEVEL SECURITY;

-- Public read access for products
CREATE POLICY "Products are viewable by everyone"
  ON kumar_products FOR SELECT USING (active = TRUE);

-- Users can only see their own orders
CREATE POLICY "Users can view own orders"
  ON kumar_orders FOR SELECT USING (user_id = auth.uid()::TEXT);

-- Admin can see all orders
CREATE POLICY "Admins can view all orders"
  ON kumar_orders FOR SELECT USING (
    EXISTS (SELECT 1 FROM kumar_shop_users WHERE id = auth.uid()::TEXT AND role = 'admin')
  );
```

---

## 11. Seed Data INSERT Statements (Copy-Paste into SQL Editor)

> **Run these AFTER creating all tables from Section 10.**
> Copy each block one at a time into the Supabase SQL Editor and click "Run".

### 11.1 Seed Customer Users

```sql
INSERT INTO kumar_customer_users (id, name, email, phone, password, address, total_profit) VALUES
  ('cust-1', 'Priya Sharma', 'priya@gmail.com', '9876543212', 'password123', '123 Main Street, Mumbai 400001', 0);
```

### 11.1b Seed Shop Users

```sql
INSERT INTO kumar_shop_users (id, name, email, phone, role, password, shop_name, shop_location, gst_number, approved, credit_limit, total_profit) VALUES
  ('shop-1', 'Raj Kumar', 'raj@kirana.com', '9876543211', 'shopowner', 'password123', 'Raj Kirana Store', 'Mumbai, Maharashtra', '27AABCU9603R1ZM', TRUE, 50000, 0),
  ('admin-1', 'Admin', 'admin@kumarstore.com', '9876543210', 'admin', 'admin123', NULL, NULL, NULL, FALSE, 0, 0);
```

### 11.2 Seed Shop Requests

```sql
INSERT INTO kumar_shop_requests (id, name, email, phone, shop_name, shop_location, password, status, request_date) VALUES
  ('sr-1', 'Sanjay Patel', 'sanjay@store.com', '9876543001', 'Sanjay General Store', 'Ahmedabad, Gujarat', 'password123', 'pending', '2026-03-01'),
  ('sr-2', 'Krishna Kumar', 'krishna@mart.com', '9876543002', 'New Krishna Mart', 'Pune, Maharashtra', 'password123', 'pending', '2026-03-02'),
  ('sr-3', 'Ramesh Sharma', 'ramesh@traders.com', '9876543003', 'Balaji Traders', 'Delhi, NCR', 'password123', 'pending', '2026-03-03');
```

### 11.3 Seed Orders

```sql
INSERT INTO kumar_orders (id, user_id, user_name, user_role, items, total, status, payment_method, order_date) VALUES
  ('ORD-10041', 'cust-1', 'Demo User', 'customer', '[]'::jsonb, 2450, 'delivered', 'UPI', '2026-02-25'),
  ('ORD-10042', 'shop-1', 'Kirana Mart', 'shopowner', '[]'::jsonb, 18500, 'shipped', 'Credit', '2026-02-28');
```

### 11.4 Seed Products (All 20 Products)

```sql
INSERT INTO kumar_products (id, name, category, brand, description, image_url, mrp, purchase_price, shop_price, customer_price, min_wholesale_qty, stock, sku, unit_type, featured, rating, reviews) VALUES
  ('p1', 'Surf Excel Matic Top Load', 'soaps-detergents', 'Surf Excel', 'Superior stain removal for top load washing machines. Specially designed for tough stains.', 'https://images.unsplash.com/photo-1771491458535-b23afd59ce79?w=1080', 399, 245, 310, 363, 12, 500, 'SE-TL-001', 'Piece', TRUE, 4.5, 234),
  ('p2', 'Tata Gold Tea 500g', 'tea-coffee', 'Tata Tea', 'Premium blend of Assam teas with a rich aroma and taste. Perfect for every occasion.', 'https://images.unsplash.com/photo-1762708156343-26472227daeb?w=1080', 285, 175, 220, 259, 24, 800, 'TT-G-002', 'Piece', TRUE, 4.7, 567),
  ('p3', 'Colgate MaxFresh 300g', 'oral-care', 'Colgate', 'Cooling crystals for instant freshness. Fights germs and keeps breath fresh for hours.', 'https://images.unsplash.com/photo-1759910548177-638d4e6ee0d5?w=1080', 199, 122, 155, 181, 36, 1200, 'CL-MF-003', 'Piece', TRUE, 4.3, 892),
  ('p4', 'Dove Beauty Bar 100g (Pack of 4)', 'personal-care', 'Dove', 'With 1/4 moisturizing cream. Leaves skin soft, smooth, and radiant.', 'https://images.unsplash.com/photo-1689893265427-d7da200eff05?w=1080', 249, 155, 195, 227, 24, 650, 'DV-BB-004', 'Box', TRUE, 4.6, 1245),
  ('p5', 'Aashirvaad Atta 10kg', 'grocery-essentials', 'Aashirvaad', 'Made from the finest quality MP wheat. Gives soft rotis every single time.', 'https://images.unsplash.com/photo-1584269903637-e1b1c717a2b4?w=1080', 499, 330, 410, 463, 10, 300, 'AA-AT-005', 'Piece', TRUE, 4.8, 2134),
  ('p6', 'Nescafe Classic 200g', 'tea-coffee', 'Nescafe', 'Premium quality instant coffee. Rich aroma and smooth taste in every cup.', 'https://images.unsplash.com/photo-1762708156343-26472227daeb?w=1080', 450, 290, 365, 416, 12, 400, 'NC-CL-006', 'Piece', TRUE, 4.4, 678),
  ('p7', 'Tide Plus Double Power 2kg', 'soaps-detergents', 'Tide', 'Double the cleaning power with lemon and mint. Perfect for everyday laundry.', 'https://images.unsplash.com/photo-1759846866217-e627e4478f82?w=1080', 350, 218, 275, 320, 12, 550, 'TD-DP-007', 'Piece', FALSE, 4.2, 345),
  ('p8', 'Lifebuoy Total 10 Soap 125g', 'personal-care', 'Lifebuoy', '99.9% germ protection. Trusted by families for generations of health.', 'https://images.unsplash.com/photo-1771491458535-b23afd59ce79?w=1080', 45, 26, 34, 41, 72, 2000, 'LB-T10-008', 'Piece', FALSE, 4.1, 567),
  ('p9', 'Dettol Antiseptic 500ml', 'personal-care', 'Dettol', 'Trusted antiseptic liquid for cleaning wounds and maintaining hygiene.', 'https://images.unsplash.com/photo-1759846866217-e627e4478f82?w=1080', 260, 162, 205, 238, 24, 350, 'DT-AS-009', 'Piece', FALSE, 4.5, 789),
  ('p10', 'Pepsodent Germicheck 200g', 'oral-care', 'Pepsodent', 'Clinically proven to fight 99% of germs. Strong teeth for your family.', 'https://images.unsplash.com/photo-1759910548177-638d4e6ee0d5?w=1080', 120, 72, 92, 109, 48, 900, 'PS-GC-010', 'Piece', FALSE, 4.0, 234),
  ('p11', 'Pantene Advanced Hair Fall Solution 340ml', 'personal-care', 'Pantene', 'Reduces hairfall in just 2 weeks. Pro-V formula for strong, healthy hair.', 'https://images.unsplash.com/photo-1689893265427-d7da200eff05?w=1080', 320, 198, 250, 292, 12, 280, 'PN-AH-011', 'Piece', FALSE, 4.3, 456),
  ('p12', 'Fortune Soyabean Oil 5L', 'grocery-essentials', 'Fortune', 'Light and healthy cooking oil. Rich in Omega-3 for a healthier heart.', 'https://images.unsplash.com/photo-1583922146273-68f11083858e?w=1080', 799, 540, 680, 751, 6, 200, 'FT-SO-012', 'Piece', TRUE, 4.6, 1567),
  ('p13', 'Maggi 2-Minute Noodles (Pack of 12)', 'snacks-beverages', 'Maggi', 'India''s favorite instant noodles. Quick, tasty, and loved by all ages.', 'https://images.unsplash.com/photo-1741520149938-4f08654780ef?w=1080', 168, 102, 130, 153, 24, 1500, 'MG-2M-013', 'Box', TRUE, 4.7, 3456),
  ('p14', 'Parle-G Gold Biscuits 1kg', 'snacks-beverages', 'Parle', 'Premium gold biscuits with extra milk and wheat. Perfect chai-time snack.', 'https://images.unsplash.com/photo-1741520149938-4f08654780ef?w=1080', 120, 68, 88, 107, 36, 1800, 'PG-GL-014', 'Piece', FALSE, 4.5, 2345),
  ('p15', 'Britannia Good Day Butter 250g', 'snacks-beverages', 'Britannia', 'Rich buttery biscuits that make every day a good day.', 'https://images.unsplash.com/photo-1741520149938-4f08654780ef?w=1080', 55, 32, 42, 50, 48, 2200, 'BR-GD-015', 'Piece', FALSE, 4.4, 1890),
  ('p16', 'Dabur Honey 500g', 'grocery-essentials', 'Dabur', '100% pure honey. No added sugar. Trusted for purity since generations.', 'https://images.unsplash.com/photo-1768734837714-49793b2829cc?w=1080', 265, 168, 210, 243, 24, 450, 'DB-HN-016', 'Piece', FALSE, 4.6, 1234),
  ('p17', 'Himalaya Neem Face Wash 200ml', 'personal-care', 'Himalaya', 'Purifying neem face wash for clear, problem-free skin.', 'https://images.unsplash.com/photo-1689893265427-d7da200eff05?w=1080', 210, 130, 165, 192, 18, 320, 'HM-NF-017', 'Piece', FALSE, 4.3, 567),
  ('p18', 'Patanjali Cow Ghee 1L', 'grocery-essentials', 'Patanjali', 'Pure desi cow ghee made from fresh cream. Rich taste and aroma.', 'https://images.unsplash.com/photo-1584269903637-e1b1c717a2b4?w=1080', 550, 365, 460, 514, 12, 180, 'PT-CG-018', 'Piece', TRUE, 4.4, 890),
  ('p19', 'Vim Dishwash Bar 500g', 'cleaning-supplies', 'Vim', 'Powerful grease cutting formula. Makes dishes sparkling clean.', 'https://images.unsplash.com/photo-1759846866217-e627e4478f82?w=1080', 55, 30, 40, 49, 60, 3000, 'VM-DB-019', 'Piece', FALSE, 4.1, 456),
  ('p20', 'Harpic Power Plus 1L', 'cleaning-supplies', 'Harpic', '10x better cleaning and germ kill. Thick formula clings to bowl surface.', 'https://images.unsplash.com/photo-1759846866217-e627e4478f82?w=1080', 189, 115, 148, 173, 24, 600, 'HP-PP-020', 'Piece', FALSE, 4.2, 678);
```

### 11.5 Seed Coupons

```sql
INSERT INTO kumar_coupons (code, discount, type, min_order, active) VALUES
  ('WELCOME10', 10, 'percent', 500, TRUE),
  ('SAVE50', 50, 'flat', 1000, TRUE),
  ('BULK20', 20, 'percent', 5000, TRUE),
  ('FIRST100', 100, 'flat', 300, TRUE);
```

### 11.6 Seed Categories (already included in 10.6, repeated here for convenience)

```sql
INSERT INTO kumar_categories (slug, name, icon, sort_order) VALUES
  ('soaps-detergents', 'Soaps & Detergents', 'soap', 1),
  ('tea-coffee', 'Tea & Coffee', 'coffee', 2),
  ('oral-care', 'Oral Care', 'tooth', 3),
  ('personal-care', 'Personal Care', 'heart', 4),
  ('grocery-essentials', 'Grocery Essentials', 'cart', 5),
  ('snacks-beverages', 'Snacks & Beverages', 'cookie', 6),
  ('cleaning-supplies', 'Cleaning Supplies', 'spray', 7),
  ('fresh-organic', 'Fresh & Organic', 'leaf', 8)
ON CONFLICT (slug) DO NOTHING;
```

---

## 12. Execution Order (Step-by-Step Checklist)

> Follow this exact order in the Supabase SQL Editor:

| Step | Section | What to Run | Status |
|------|---------|-------------|--------|
| 1 | 10.1a | `CREATE TABLE kumar_customer_users` | Run first |
| 2 | 10.1b | `CREATE TABLE kumar_shop_users` | Run second |
| 3 | 10.2 | `CREATE TABLE kumar_shop_requests` | Run third |
| 4 | 10.4 | `CREATE TABLE kumar_products` | Run fourth |
| 5 | 10.3 | `CREATE TABLE kumar_orders` | Run fifth |
| 6 | 10.5 | `CREATE TABLE kumar_coupons` | Run sixth |
| 7 | 10.6 | `CREATE TABLE kumar_categories` | Run seventh |
| 8 | 10.7 | `CREATE TABLE kumar_cart` (optional) | Run eighth |
| 9 | 10.8 | `CREATE TABLE kumar_wishlist` (optional) | Run ninth |
| 10 | 10.9 | RLS policies | Run tenth |
| 11 | 11.1 | `INSERT INTO kumar_customer_users` (1 demo customer) | Run eleventh |
| 12 | 11.1b | `INSERT INTO kumar_shop_users` (1 shop + 1 admin) | Run twelfth |
| 13 | 11.2 | `INSERT INTO kumar_shop_requests` (3 pending) | Run thirteenth |
| 14 | 11.3 | `INSERT INTO kumar_orders` (2 demo orders) | Run fourteenth |
| 15 | 11.4 | `INSERT INTO kumar_products` (20 products) | Run fifteenth |
| 16 | 11.5 | `INSERT INTO kumar_coupons` (4 coupons) | Run sixteenth |
| 17 | 11.6 | `INSERT INTO kumar_categories` (8 categories) | Run last |

> **Note:** The app currently reads/writes via the KV store (`kv_store_8a0a2a06` table),
> NOT these new relational tables. To actually use these tables, the backend server
> (`/supabase/functions/server/index.tsx`) would need to be rewritten to query
> `kumar_users`, `kumar_orders`, etc. directly instead of using `kv.get()` / `kv.set()`.
> The KV store continues to work independently alongside these tables.

---

## Quick Reference Card

| What | Where | How |
|------|-------|-----|
| Frontend API calls | `/src/app/api.ts` | `import * as api from './api'` |
| State management | `/src/app/store.ts` | `import { useStore } from './store'` |
| Backend server | `/supabase/functions/server/index.tsx` | Hono REST API |
| KV helper | `/supabase/functions/server/kv_store.tsx` | `import * as kv from './kv_store.tsx'` |
| Supabase config | `/utils/supabase/info.tsx` | `import { projectId, publicAnonKey }` |
| Routes | `/src/app/routes.ts` | React Router with Layout + AdminLayout |
| Admin password | `/src/app/components/admin-layout.tsx` | `saimohan` |
| Customer demo | Login page | `priya@gmail.com` / `password123` |
| Shop owner demo | Login page | `raj@kirana.com` / `password123` |
| Session storage | Browser localStorage | Key: `user` (JSON) |

---

*Last updated: March 3, 2026*
*Platform: Kumar Store - Wholesale & Retail E-Commerce*