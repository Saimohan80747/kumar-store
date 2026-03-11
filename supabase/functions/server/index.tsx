// @ts-nocheck — This file runs on Supabase Edge Functions (Deno runtime), not Node.js
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const app = new Hono();
const PREFIX = "/make-server-8a0a2a06";

// Supabase client (uses SERVICE_ROLE_KEY to bypass RLS)
const supabase = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

// ─── Helpers: Convert between DB snake_case and frontend camelCase ───

// Convert kumar_customer_users row to frontend
function customerToFrontend(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: 'customer' as const,
    password: row.password,
    address: row.address || undefined,
    profit: row.total_profit ? Number(row.total_profit) : 0,
  };
}

// Convert kumar_shop_users row to frontend
function shopUserToFrontend(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    password: row.password,
    shopName: row.shop_name || undefined,
    shopLocation: row.shop_location || undefined,
    gstNumber: row.gst_number || undefined,
    approved: row.approved || false,
    creditLimit: row.credit_limit ? Number(row.credit_limit) : undefined,
    profit: row.total_profit ? Number(row.total_profit) : 0,
  };
}

// Legacy unified converter (used by analytics merge)
function userToFrontend(row: any) {
  if (!row) return null;
  if (row.role && row.role !== 'customer') return shopUserToFrontend(row);
  return customerToFrontend(row);
}

function shopReqToFrontend(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    shopName: row.shop_name,
    shopLocation: row.shop_location,
    password: row.password,
    status: row.status,
    date: row.request_date,
  };
}

function shopReqToDB(req: any) {
  return {
    id: req.id,
    name: req.name,
    email: req.email,
    phone: req.phone,
    shop_name: req.shopName,
    shop_location: req.shopLocation,
    password: req.password,
    status: req.status,
    request_date: req.date,
  };
}

function orderToFrontend(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    items: row.items || [],
    total: Number(row.total),
    deliveryFee: row.delivery_fee != null ? Number(row.delivery_fee) : 0,
    status: row.status,
    date: row.order_date,
    paymentMethod: row.payment_method,
    userRole: row.user_role,
    userName: row.user_name,
  };
}

function orderToDB(order: any) {
  return {
    id: order.id,
    user_id: order.userId || null,
    user_name: order.userName,
    user_role: order.userRole,
    items: order.items || [],
    total: order.total,
    delivery_fee: order.deliveryFee ?? 0,
    status: order.status,
    payment_method: order.paymentMethod,
    order_date: order.date,
  };
}

function couponToFrontend(row: any) {
  if (!row) return null;
  return {
    code: row.code,
    discount: Number(row.discount),
    type: row.type,
    minOrder: Number(row.min_order),
  };
}

function couponToDB(coupon: any) {
  return {
    code: coupon.code,
    discount: coupon.discount,
    type: coupon.type,
    min_order: coupon.minOrder,
    active: true,
  };
}

app.use("*", logger(console.log));
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  })
);

// ─── Health check ───
app.get(`${PREFIX}/health`, (c) => c.json({ status: "ok" }));

// ─── Initialize / Seed ───
app.post(`${PREFIX}/init`, async (c) => {
  try {
    const db = supabase();

    // Check if users already exist (if so, already initialized)
    const { data: existingUsers, error: checkErr } = await db
      .from("kumar_customer_users")
      .select("id")
      .limit(1);

    const { data: existingShop } = await db
      .from("kumar_shop_users")
      .select("id")
      .limit(1);

    if (checkErr) {
      console.log("Error checking init status:", checkErr);
      return c.json({ error: `Init check failed: ${checkErr.message}` }, 500);
    }

    if ((existingUsers && existingUsers.length > 0) || (existingShop && existingShop.length > 0)) {
      return c.json({ status: "already_initialized" });
    }

    // Seed customer_users
    const { error: custErr } = await db.from("kumar_customer_users").upsert([
      {
        id: "cust-1", name: "Priya Sharma", email: "priya@gmail.com", phone: "9876543212",
        password: "password123", address: "123 Main Street, Mumbai 400001", total_profit: 0,
      },
    ]);
    if (custErr) console.log("Seed customer_users error:", custErr);

    // Seed shop_users
    const { error: shopUsersErr } = await db.from("kumar_shop_users").upsert([
      {
        id: "shop-1", name: "Raj Kumar", email: "raj@kirana.com", phone: "9876543211",
        role: "shopowner", password: "password123", shop_name: "Raj Kirana Store",
        shop_location: "Mumbai, Maharashtra", gst_number: "27AABCU9603R1ZM",
        approved: true, credit_limit: 50000, total_profit: 0,
      },
      {
        id: "admin-1", name: "Admin", email: "admin@kumarstore.com", phone: "9876543210",
        role: "admin", password: "admin123", total_profit: 0,
      },
    ]);
    if (shopUsersErr) console.log("Seed shop_users error:", shopUsersErr);

    // Seed shop requests
    const { error: reqsErr } = await db.from("kumar_shop_requests").upsert([
      { id: "sr-1", name: "Sanjay Patel", email: "sanjay@store.com", phone: "9876543001", shop_name: "Sanjay General Store", shop_location: "Ahmedabad, Gujarat", password: "password123", status: "pending", request_date: "2026-03-01" },
      { id: "sr-2", name: "Krishna Kumar", email: "krishna@mart.com", phone: "9876543002", shop_name: "New Krishna Mart", shop_location: "Pune, Maharashtra", password: "password123", status: "pending", request_date: "2026-03-02" },
      { id: "sr-3", name: "Ramesh Sharma", email: "ramesh@traders.com", phone: "9876543003", shop_name: "Balaji Traders", shop_location: "Delhi, NCR", password: "password123", status: "pending", request_date: "2026-03-03" },
    ]);
    if (reqsErr) console.log("Seed shop requests error:", reqsErr);

    // Seed orders
    const { error: ordersErr } = await db.from("kumar_orders").upsert([
      { id: "ORD-10041", user_id: "cust-1", user_name: "Demo User", user_role: "customer", items: [], total: 2450, status: "delivered", payment_method: "UPI", order_date: "2026-02-25" },
      { id: "ORD-10042", user_id: "shop-1", user_name: "Kirana Mart", user_role: "shopowner", items: [], total: 18500, status: "shipped", payment_method: "Credit", order_date: "2026-02-28" },
    ]);
    if (ordersErr) console.log("Seed orders error:", ordersErr);

    // Seed coupons
    const { error: couponsErr } = await db.from("kumar_coupons").upsert([
      { code: "WELCOME10", discount: 10, type: "percent", min_order: 500, active: true },
      { code: "SAVE50", discount: 50, type: "flat", min_order: 1000, active: true },
      { code: "BULK20", discount: 20, type: "percent", min_order: 5000, active: true },
      { code: "FIRST100", discount: 100, type: "flat", min_order: 300, active: true },
    ]);
    if (couponsErr) console.log("Seed coupons error:", couponsErr);

    return c.json({ status: "initialized", users: 3, shopRequests: 3, orders: 2, coupons: 4 });
  } catch (err) {
    console.log("Error during init:", err);
    return c.json({ error: `Init failed: ${err}` }, 500);
  }
});

// ─── USERS ───

// Get all registered users (from both tables)
app.get(`${PREFIX}/users`, async (c) => {
  try {
    const db = supabase();
    const [custRes, shopRes] = await Promise.all([
      db.from("kumar_customer_users").select("*"),
      db.from("kumar_shop_users").select("*"),
    ]);
    if (custRes.error) console.log("Error fetching customer_users:", custRes.error);
    if (shopRes.error) console.log("Error fetching shop_users:", shopRes.error);
    const customers = (custRes.data || []).map(customerToFrontend);
    const shopUsers = (shopRes.data || []).map(shopUserToFrontend);
    return c.json([...customers, ...shopUsers]);
  } catch (err) {
    console.log("Error fetching users:", err);
    return c.json({ error: `Failed to fetch users: ${err}` }, 500);
  }
});

// Register a new user (customer → kumar_customer_users)
app.post(`${PREFIX}/users`, async (c) => {
  try {
    const user = await c.req.json();
    const db = supabase();

    // Check if email already exists in either table
    const [custCheck, shopCheck] = await Promise.all([
      db.from("kumar_customer_users").select("id").eq("email", user.email).maybeSingle(),
      db.from("kumar_shop_users").select("id").eq("email", user.email).maybeSingle(),
    ]);

    if (custCheck.data || shopCheck.data) {
      return c.json({ error: "Email already registered" }, 409);
    }

    const { error } = await db.from("kumar_customer_users").insert({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      password: user.password,
      address: user.address || null,
      total_profit: 0,
    });
    if (error) {
      console.log("Error inserting customer:", error);
      return c.json({ error: `Registration failed: ${error.message}` }, 500);
    }
    return c.json({ success: true, user: { ...user, profit: 0 } });
  } catch (err) {
    console.log("Error registering user:", err);
    return c.json({ error: `Registration failed: ${err}` }, 500);
  }
});

// ─── AUTH ───

app.post(`${PREFIX}/auth/login`, async (c) => {
  try {
    const { email, password, role } = await c.req.json();
    const db = supabase();

    // Admin login → kumar_shop_users
    if (role === "admin") {
      const { data: admin } = await db
        .from("kumar_shop_users")
        .select("*")
        .eq("role", "admin")
        .eq("email", email)
        .maybeSingle();

      if (admin && admin.password === password) {
        return c.json({ success: true, message: "Welcome, Admin!", user: shopUserToFrontend(admin) });
      }
      return c.json({ success: false, message: "Invalid admin credentials" });
    }

    // Shop owner login → kumar_shop_users
    if (role === "shopowner") {
      // Check pending requests
      const { data: pendingReq } = await db
        .from("kumar_shop_requests")
        .select("*")
        .eq("email", email)
        .eq("status", "pending")
        .maybeSingle();

      if (pendingReq) {
        return c.json({ success: false, message: "Your shop registration is pending admin approval. Please wait for approval before logging in." });
      }

      // Check rejected requests
      const { data: rejectedReq } = await db
        .from("kumar_shop_requests")
        .select("*")
        .eq("email", email)
        .eq("status", "rejected")
        .maybeSingle();

      if (rejectedReq) {
        return c.json({ success: false, message: "Your shop registration has been rejected. Please contact support for more details." });
      }

      // Check approved shop user
      const { data: shopUser } = await db
        .from("kumar_shop_users")
        .select("*")
        .eq("role", "shopowner")
        .eq("email", email)
        .maybeSingle();

      if (shopUser && shopUser.password === password) {
        if (!shopUser.approved) {
          return c.json({ success: false, message: "Your account is not yet approved by the admin." });
        }
        return c.json({ success: true, message: `Welcome, ${shopUser.name}! Wholesale pricing activated.`, user: shopUserToFrontend(shopUser) });
      }
      return c.json({ success: false, message: "Invalid credentials or no shop owner account found with this email. Please register first." });
    }

    // Customer login → kumar_customer_users
    const { data: customer } = await db
      .from("kumar_customer_users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (customer && customer.password === password) {
      return c.json({ success: true, message: `Welcome back, ${customer.name}!`, user: customerToFrontend(customer) });
    }
    return c.json({ success: false, message: "Invalid email or password. Please check your credentials or register." });
  } catch (err) {
    console.log("Error during auth:", err);
    return c.json({ error: `Authentication failed: ${err}` }, 500);
  }
});

// ─── SHOP REQUESTS ───

app.get(`${PREFIX}/shop-requests`, async (c) => {
  try {
    const db = supabase();
    const { data, error } = await db.from("kumar_shop_requests").select("*");
    if (error) {
      console.log("Error fetching shop requests:", error);
      return c.json({ error: `Failed to fetch shop requests: ${error.message}` }, 500);
    }
    return c.json((data || []).map(shopReqToFrontend));
  } catch (err) {
    console.log("Error fetching shop requests:", err);
    return c.json({ error: `Failed to fetch shop requests: ${err}` }, 500);
  }
});

app.post(`${PREFIX}/shop-requests`, async (c) => {
  try {
    const request = await c.req.json();
    const db = supabase();

    // Check if email already exists in shop requests
    const { data: existing } = await db
      .from("kumar_shop_requests")
      .select("id")
      .eq("email", request.email)
      .maybeSingle();

    if (existing) {
      return c.json({ error: "A request with this email already exists" }, 409);
    }

    // Also check if email exists in either users table
    const [custCheck, shopUserCheck] = await Promise.all([
      db.from("kumar_customer_users").select("id").eq("email", request.email).maybeSingle(),
      db.from("kumar_shop_users").select("id").eq("email", request.email).maybeSingle(),
    ]);

    if (custCheck.data || shopUserCheck.data) {
      return c.json({ error: "An account with this email already exists" }, 409);
    }

    const { error } = await db.from("kumar_shop_requests").insert(shopReqToDB(request));
    if (error) {
      console.log("Error inserting shop request:", error);
      return c.json({ error: `Shop request failed: ${error.message}` }, 500);
    }
    return c.json({ success: true, request });
  } catch (err) {
    console.log("Error creating shop request:", err);
    return c.json({ error: `Shop request failed: ${err}` }, 500);
  }
});

app.put(`${PREFIX}/shop-requests/:id/approve`, async (c) => {
  try {
    const id = c.req.param("id");
    const db = supabase();

    // Get the request
    const { data: request, error: fetchErr } = await db
      .from("kumar_shop_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr || !request) {
      return c.json({ error: "Shop request not found" }, 404);
    }

    // Update request status to approved
    const { error: updateErr } = await db
      .from("kumar_shop_requests")
      .update({ status: "approved", reviewed_at: new Date().toISOString() })
      .eq("id", id);

    if (updateErr) {
      console.log("Error updating shop request:", updateErr);
      return c.json({ error: `Approval update failed: ${updateErr.message}` }, 500);
    }

    // Create new shop user from the request
    const newUser = {
      id: `shop-${Date.now()}`,
      name: request.name,
      email: request.email,
      phone: request.phone,
      role: "shopowner",
      password: request.password,
      shop_name: request.shop_name,
      shop_location: request.shop_location,
      approved: true,
      credit_limit: 50000,
      total_profit: 0,
    };

    const { error: insertErr } = await db.from("kumar_shop_users").insert(newUser);
    if (insertErr) {
      console.log("Error creating shop user from approved request:", insertErr);
      return c.json({ error: `User creation failed: ${insertErr.message}` }, 500);
    }

    return c.json({
      success: true,
      request: shopReqToFrontend({ ...request, status: "approved" }),
      newUser: shopUserToFrontend(newUser),
    });
  } catch (err) {
    console.log("Error approving shop:", err);
    return c.json({ error: `Approval failed: ${err}` }, 500);
  }
});

app.put(`${PREFIX}/shop-requests/:id/reject`, async (c) => {
  try {
    const id = c.req.param("id");
    const db = supabase();

    const { data: request, error: fetchErr } = await db
      .from("kumar_shop_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr || !request) {
      return c.json({ error: "Shop request not found" }, 404);
    }

    const { error: updateErr } = await db
      .from("kumar_shop_requests")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", id);

    if (updateErr) {
      console.log("Error rejecting shop request:", updateErr);
      return c.json({ error: `Rejection failed: ${updateErr.message}` }, 500);
    }

    return c.json({
      success: true,
      request: shopReqToFrontend({ ...request, status: "rejected" }),
    });
  } catch (err) {
    console.log("Error rejecting shop:", err);
    return c.json({ error: `Rejection failed: ${err}` }, 500);
  }
});

// ─── ORDERS ───

app.get(`${PREFIX}/orders`, async (c) => {
  try {
    const db = supabase();
    const { data, error } = await db
      .from("kumar_orders")
      .select("*")
      .order("order_date", { ascending: false });

    if (error) {
      console.log("Error fetching orders:", error);
      return c.json({ error: `Failed to fetch orders: ${error.message}` }, 500);
    }
    return c.json((data || []).map(orderToFrontend));
  } catch (err) {
    console.log("Error fetching orders:", err);
    return c.json({ error: `Failed to fetch orders: ${err}` }, 500);
  }
});

app.post(`${PREFIX}/orders`, async (c) => {
  try {
    const order = await c.req.json();
    const db = supabase();
    const { error } = await db.from("kumar_orders").insert(orderToDB(order));
    if (error) {
      console.log("Error creating order:", error);
      return c.json({ error: `Order creation failed: ${error.message}` }, 500);
    }
    return c.json({ success: true, order });
  } catch (err) {
    console.log("Error creating order:", err);
    return c.json({ error: `Order creation failed: ${err}` }, 500);
  }
});

app.put(`${PREFIX}/orders/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();
    const db = supabase();

    // Build update object with snake_case columns
    const dbUpdates: any = {};
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.paymentMethod) dbUpdates.payment_method = updates.paymentMethod;
    if (updates.items) dbUpdates.items = updates.items;
    if (updates.total !== undefined) dbUpdates.total = updates.total;
    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await db
      .from("kumar_orders")
      .update(dbUpdates)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      console.log("Error updating order:", error);
      return c.json({ error: `Order update failed: ${error.message}` }, 500);
    }
    if (!data) {
      return c.json({ error: "Order not found" }, 404);
    }
    return c.json({ success: true, order: orderToFrontend(data) });
  } catch (err) {
    console.log("Error updating order:", err);
    return c.json({ error: `Order update failed: ${err}` }, 500);
  }
});

// ─── COUPONS ───

app.get(`${PREFIX}/coupons`, async (c) => {
  try {
    const db = supabase();
    const { data, error } = await db.from("kumar_coupons").select("*").eq("active", true);
    if (error) {
      console.log("Error fetching coupons:", error);
      return c.json({ error: `Failed to fetch coupons: ${error.message}` }, 500);
    }
    return c.json((data || []).map(couponToFrontend));
  } catch (err) {
    console.log("Error fetching coupons:", err);
    return c.json({ error: `Failed to fetch coupons: ${err}` }, 500);
  }
});

app.post(`${PREFIX}/coupons`, async (c) => {
  try {
    const coupon = await c.req.json();
    const db = supabase();
    const { error } = await db.from("kumar_coupons").upsert(couponToDB(coupon));
    if (error) {
      console.log("Error creating coupon:", error);
      return c.json({ error: `Coupon creation failed: ${error.message}` }, 500);
    }
    return c.json({ success: true, coupon });
  } catch (err) {
    console.log("Error creating coupon:", err);
    return c.json({ error: `Coupon creation failed: ${err}` }, 500);
  }
});

app.delete(`${PREFIX}/coupons/:code`, async (c) => {
  try {
    const code = c.req.param("code");
    const db = supabase();
    const { error } = await db.from("kumar_coupons").delete().eq("code", code);
    if (error) {
      console.log("Error deleting coupon:", error);
      return c.json({ error: `Coupon deletion failed: ${error.message}` }, 500);
    }
    return c.json({ success: true });
  } catch (err) {
    console.log("Error deleting coupon:", err);
    return c.json({ error: `Coupon deletion failed: ${err}` }, 500);
  }
});

// ─── ANALYTICS (aggregate from relational tables) ───

app.get(`${PREFIX}/analytics`, async (c) => {
  try {
    const db = supabase();

    const [ordersRes, custRes, shopUsersRes, requestsRes] = await Promise.all([
      db.from("kumar_orders").select("*"),
      db.from("kumar_customer_users").select("*"),
      db.from("kumar_shop_users").select("*"),
      db.from("kumar_shop_requests").select("*"),
    ]);

    if (ordersRes.error) console.log("Analytics orders error:", ordersRes.error);
    if (custRes.error) console.log("Analytics customer_users error:", custRes.error);
    if (shopUsersRes.error) console.log("Analytics shop_users error:", shopUsersRes.error);
    if (requestsRes.error) console.log("Analytics requests error:", requestsRes.error);

    const orders = (ordersRes.data || []).map(orderToFrontend);
    const customers = (custRes.data || []).map(customerToFrontend);
    const shopUsers = (shopUsersRes.data || []).map(shopUserToFrontend);
    const users = [...customers, ...shopUsers];
    const shopRequests = requestsRes.data || [];

    const totalRevenue = orders.reduce((s: number, o: any) => s + (o.total || 0), 0);
    const totalOrders = orders.length;
    const totalCustomers = users.filter((u: any) => u.role === "customer").length;
    const totalShopOwners = users.filter((u: any) => u.role === "shopowner").length;
    const pendingApprovals = shopRequests.filter((r: any) => r.status === "pending").length;

    return c.json({
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalShopOwners,
      pendingApprovals,
      orders,
      users,
    });
  } catch (err) {
    console.log("Error fetching analytics:", err);
    return c.json({ error: `Analytics failed: ${err}` }, 500);
  }
});

// ─── PRODUCT REQUESTS ───

function productReqToFrontend(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    userRole: row.user_role,
    status: row.status,
    requestDate: row.request_date,
  };
}

function productReqToDB(req: any) {
  return {
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
}

app.get(`${PREFIX}/product-requests`, async (c) => {
  try {
    const db = supabase();
    const { data, error } = await db
      .from("kumar_product_requests")
      .select("*")
      .order("request_date", { ascending: false });

    if (error) {
      console.log("Error fetching product requests:", error);
      return c.json({ error: `Failed to fetch product requests: ${error.message}` }, 500);
    }
    return c.json((data || []).map(productReqToFrontend));
  } catch (err) {
    console.log("Error fetching product requests:", err);
    return c.json({ error: `Failed to fetch product requests: ${err}` }, 500);
  }
});

app.post(`${PREFIX}/product-requests`, async (c) => {
  try {
    const request = await c.req.json();
    const db = supabase();

    // Check for duplicate pending request
    const { data: existing } = await db
      .from("kumar_product_requests")
      .select("id")
      .eq("product_id", request.productId)
      .eq("user_id", request.userId)
      .eq("status", "pending")
      .maybeSingle();

    if (existing) {
      return c.json({ error: "You have already requested this product" }, 409);
    }

    const { error } = await db.from("kumar_product_requests").insert(productReqToDB(request));
    if (error) {
      console.log("Error creating product request:", error);
      return c.json({ error: `Product request failed: ${error.message}` }, 500);
    }
    return c.json({ success: true, request });
  } catch (err) {
    console.log("Error creating product request:", err);
    return c.json({ error: `Product request failed: ${err}` }, 500);
  }
});

app.put(`${PREFIX}/product-requests/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    const { status } = await c.req.json();
    const db = supabase();

    const { data, error } = await db
      .from("kumar_product_requests")
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      console.log("Error updating product request:", error);
      return c.json({ error: `Update failed: ${error.message}` }, 500);
    }
    if (!data) {
      return c.json({ error: "Product request not found" }, 404);
    }
    return c.json({ success: true, request: productReqToFrontend(data) });
  } catch (err) {
    console.log("Error updating product request:", err);
    return c.json({ error: `Update failed: ${err}` }, 500);
  }
});

// ─── PRODUCTS ───

function productToFrontend(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    brand: row.brand,
    description: row.description || '',
    image: row.image || '',
    mrp: Number(row.mrp),
    purchasePrice: Number(row.purchase_price),
    shopPrice: Number(row.shop_price),
    customerPrice: Number(row.customer_price),
    minWholesaleQty: row.min_wholesale_qty || 1,
    stock: row.stock || 0,
    sku: row.sku,
    unitType: row.unit_type || 'Piece',
    featured: row.featured || false,
    rating: Number(row.rating) || 0,
    reviews: row.reviews || 0,
  };
}

function productToDB(product: any) {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    brand: product.brand,
    description: product.description || '',
    image: product.image || '',
    mrp: product.mrp,
    purchase_price: product.purchasePrice,
    shop_price: product.shopPrice,
    customer_price: product.customerPrice,
    min_wholesale_qty: product.minWholesaleQty || 1,
    stock: product.stock || 0,
    sku: product.sku,
    unit_type: product.unitType || 'Piece',
    featured: product.featured || false,
    rating: product.rating || 0,
    reviews: product.reviews || 0,
    updated_at: new Date().toISOString(),
  };
}

app.get(`${PREFIX}/products`, async (c) => {
  try {
    const db = supabase();
    const { data, error } = await db
      .from("kumar_products")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.log("Error fetching products:", error);
      return c.json({ error: `Failed to fetch products: ${error.message}` }, 500);
    }
    return c.json((data || []).map(productToFrontend));
  } catch (err) {
    console.log("Error fetching products:", err);
    return c.json({ error: `Failed to fetch products: ${err}` }, 500);
  }
});

app.post(`${PREFIX}/products`, async (c) => {
  try {
    const product = await c.req.json();
    const db = supabase();
    const { error } = await db.from("kumar_products").insert(productToDB(product));
    if (error) {
      console.log("Error creating product:", error);
      return c.json({ error: `Product creation failed: ${error.message}` }, 500);
    }
    return c.json({ success: true, product });
  } catch (err) {
    console.log("Error creating product:", err);
    return c.json({ error: `Product creation failed: ${err}` }, 500);
  }
});

app.put(`${PREFIX}/products/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();
    const db = supabase();

    const dbUpdates: any = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.brand !== undefined) dbUpdates.brand = updates.brand;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.image !== undefined) dbUpdates.image = updates.image;
    if (updates.mrp !== undefined) dbUpdates.mrp = updates.mrp;
    if (updates.purchasePrice !== undefined) dbUpdates.purchase_price = updates.purchasePrice;
    if (updates.shopPrice !== undefined) dbUpdates.shop_price = updates.shopPrice;
    if (updates.customerPrice !== undefined) dbUpdates.customer_price = updates.customerPrice;
    if (updates.minWholesaleQty !== undefined) dbUpdates.min_wholesale_qty = updates.minWholesaleQty;
    if (updates.stock !== undefined) dbUpdates.stock = updates.stock;
    if (updates.sku !== undefined) dbUpdates.sku = updates.sku;
    if (updates.unitType !== undefined) dbUpdates.unit_type = updates.unitType;
    if (updates.featured !== undefined) dbUpdates.featured = updates.featured;
    if (updates.rating !== undefined) dbUpdates.rating = updates.rating;
    if (updates.reviews !== undefined) dbUpdates.reviews = updates.reviews;

    const { data, error } = await db
      .from("kumar_products")
      .update(dbUpdates)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      console.log("Error updating product:", error);
      return c.json({ error: `Product update failed: ${error.message}` }, 500);
    }
    if (!data) {
      return c.json({ error: "Product not found" }, 404);
    }
    return c.json({ success: true, product: productToFrontend(data) });
  } catch (err) {
    console.log("Error updating product:", err);
    return c.json({ error: `Product update failed: ${err}` }, 500);
  }
});

app.delete(`${PREFIX}/products/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    const db = supabase();
    const { error } = await db.from("kumar_products").delete().eq("id", id);
    if (error) {
      console.log("Error deleting product:", error);
      return c.json({ error: `Product deletion failed: ${error.message}` }, 500);
    }
    return c.json({ success: true });
  } catch (err) {
    console.log("Error deleting product:", err);
    return c.json({ error: `Product deletion failed: ${err}` }, 500);
  }
});

Deno.serve(app.fetch);
