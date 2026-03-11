import { useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, Users, ShoppingCart, IndianRupee, Package, AlertTriangle, Wallet, Clock } from 'lucide-react';
import { useStore } from '../../store';
import { CATEGORIES } from '../../data';

const COLORS = ['#16a34a', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444', '#14b8a6', '#f97316'];

export function AdminAnalytics() {
  const orders = useStore((s) => s.orders);
  const registeredUsers = useStore((s) => s.registeredUsers);
  const products = useStore((s) => s.products);
  const loadAllData = useStore((s) => s.loadAllData);

  // Refresh data from backend every time this page mounts
  useEffect(() => { loadAllData(); }, []);

  const analytics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const today = now.toISOString().split('T')[0];

    // All non-cancelled/rejected orders are "active pipeline"
    const activeOrders = orders.filter((o) => !['cancelled', 'rejected'].includes(o.status));
    const deliveredOrders = orders.filter((o) => o.status === 'delivered');
    const pendingOrders = orders.filter((o) => ['placed', 'accepted', 'shipped'].includes(o.status));

    const totalRevenue = deliveredOrders.reduce((sum, o) => sum + o.total, 0);
    const pipelineValue = pendingOrders.reduce((sum, o) => sum + o.total, 0);
    const aov = activeOrders.length > 0 ? Math.round(activeOrders.reduce((s, o) => s + o.total, 0) / activeOrders.length) : 0;

    // Profit = total revenue - purchase cost of delivered items
    const totalProfit = deliveredOrders.reduce((sum, o) => {
      const cost = o.items.reduce((s, i) => s + (Number(i.product?.purchasePrice ?? (i.product as any)?.purchase_price ?? 0) || 0) * (Number(i.quantity) || 0), 0);
      return sum + ((Number(o.total) || 0) - cost);
    }, 0);

    // Today's stats
    const todayOrders = orders.filter((o) => o.date === today);
    const todayRevenue = todayOrders.filter((o) => o.status === 'delivered').reduce((s, o) => s + o.total, 0);
    const todayNewOrders = todayOrders.filter((o) => o.status === 'placed').length;

    // Month-over-month comparison
    const thisMonthOrders = deliveredOrders.filter((o) => {
      const d = new Date(o.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const lastMonthOrders = deliveredOrders.filter((o) => {
      const d = new Date(o.date);
      const lm = currentMonth === 0 ? 11 : currentMonth - 1;
      const ly = currentMonth === 0 ? currentYear - 1 : currentYear;
      return d.getMonth() === lm && d.getFullYear() === ly;
    });
    const thisMonthRev = thisMonthOrders.reduce((s, o) => s + o.total, 0);
    const lastMonthRev = lastMonthOrders.reduce((s, o) => s + o.total, 0);
    const revChange = lastMonthRev > 0 ? Math.round(((thisMonthRev - lastMonthRev) / lastMonthRev) * 100) : thisMonthRev > 0 ? 100 : 0;

    const userOrderCounts = new Map<string, number>();
    orders.forEach((o) => {
      userOrderCounts.set(o.userName, (userOrderCounts.get(o.userName) || 0) + 1);
    });
    const returningCustomers = Array.from(userOrderCounts.values()).filter((c) => c > 1).length;

    const statusCounts: Record<string, number> = {};
    orders.forEach((o) => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });

    // Product revenue: use actual selling price (order total distributed proportionally)
    const productRevMap = new Map<string, { name: string; revenue: number; cost: number; units: number }>();
    deliveredOrders.forEach((o) => {
      const orderMRP = o.items.reduce((s, i) => s + (Number(i.product?.mrp) || 0) * (Number(i.quantity) || 0), 0);
      o.items.forEach((item) => {
        const pid = item.product.id;
        const existing = productRevMap.get(pid) || { name: item.product.name, revenue: 0, cost: 0, units: 0 };
        const mrp = Number(item.product?.mrp) || 0;
        const qty = Number(item.quantity) || 0;
        const purchasePrice = Number(item.product?.purchasePrice ?? (item.product as any)?.purchase_price ?? 0) || 0;
        // Distribute actual order total proportionally by MRP weight
        const weight = orderMRP > 0 ? (mrp * qty) / orderMRP : 0;
        existing.revenue += (Number(o.total) || 0) * weight;
        existing.cost += purchasePrice * qty;
        existing.units += qty;
        productRevMap.set(pid, existing);
      });
    });
    const topProducts = Array.from(productRevMap.values())
      .map((p) => ({ ...p, profit: p.revenue - p.cost }))
      .sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock < 50);
    const outOfStock = products.filter((p) => p.stock === 0);

    // Monthly revenue chart — include ALL active orders for pipeline visibility
    const monthlyRevenue: { month: string; B2C: number; B2B: number; Pipeline: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const monthLabel = d.toLocaleDateString('en-IN', { month: 'short' });
      const m = d.getMonth(); const y = d.getFullYear();
      let b2c = 0, b2b = 0, pipeline = 0;
      orders.forEach((o) => {
        const od = new Date(o.date);
        if (od.getMonth() === m && od.getFullYear() === y && !['cancelled', 'rejected'].includes(o.status)) {
          if (o.status === 'delivered') {
            if (o.userRole === 'shopowner') b2b += o.total; else b2c += o.total;
          } else {
            pipeline += o.total;
          }
        }
      });
      monthlyRevenue.push({ month: monthLabel, B2C: b2c, B2B: b2b, Pipeline: pipeline });
    }

    // Daily orders — show count AND value
    const dailyOrders: { day: string; orders: number; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      const dayOrders = orders.filter((o) => o.date === dayStr);
      dailyOrders.push({
        day: d.toLocaleDateString('en-IN', { weekday: 'short' }),
        orders: dayOrders.length,
        value: dayOrders.filter((o) => !['cancelled', 'rejected'].includes(o.status)).reduce((s, o) => s + o.total, 0),
      });
    }

    // Category revenue — use actual selling price proportionally
    const categoryRevMap = new Map<string, number>();
    activeOrders.forEach((o) => {
      const orderMRP = o.items.reduce((s, i) => s + (Number(i.product?.mrp) || 0) * (Number(i.quantity) || 0), 0);
      o.items.forEach((item) => {
        const mrp = Number(item.product?.mrp) || 0;
        const qty = Number(item.quantity) || 0;
        const weight = orderMRP > 0 ? (mrp * qty) / orderMRP : 0;
        const actualRev = (Number(o.total) || 0) * weight;
        categoryRevMap.set(item.product.category, (categoryRevMap.get(item.product.category) || 0) + actualRev);
      });
    });
    const totalCatRev = Array.from(categoryRevMap.values()).reduce((s, v) => s + v, 0) || 1;
    const categoryRevenue = Array.from(categoryRevMap.entries())
      .map(([slug, revenue]) => ({ name: CATEGORIES.find((c) => c.slug === slug)?.name || slug, value: Math.round((revenue / totalCatRev) * 100), revenue: Math.round(revenue) }))
      .sort((a, b) => b.revenue - a.revenue).slice(0, 6);

    // Fulfillment rate
    const fulfillmentRate = orders.length > 0 ? Math.round((deliveredOrders.length / orders.length) * 100) : 0;

    return {
      totalOrders: orders.length, deliveredCount: deliveredOrders.length,
      totalRevenue, pipelineValue, aov, revChange, totalProfit,
      todayOrders: todayOrders.length, todayRevenue, todayNewOrders,
      returningCustomers, statusCounts, topProducts, lowStockProducts, outOfStock,
      monthlyRevenue, dailyOrders, categoryRevenue, fulfillmentRate,
    };
  }, [orders, registeredUsers, products]);

  const stats = [
    { label: 'Delivered Revenue', value: analytics.totalRevenue >= 100000 ? `Rs.${(analytics.totalRevenue / 100000).toFixed(1)}L` : `Rs.${analytics.totalRevenue.toLocaleString()}`, change: analytics.revChange !== 0 ? `${analytics.revChange > 0 ? '+' : ''}${analytics.revChange}% vs last month` : `${analytics.deliveredCount} delivered`, up: analytics.revChange >= 0, icon: IndianRupee },
    { label: 'Pipeline Value', value: analytics.pipelineValue >= 100000 ? `Rs.${(analytics.pipelineValue / 100000).toFixed(1)}L` : `Rs.${analytics.pipelineValue.toLocaleString()}`, change: `${(analytics.statusCounts['placed'] || 0) + (analytics.statusCounts['accepted'] || 0) + (analytics.statusCounts['shipped'] || 0)} active orders`, up: true, icon: Clock },
    { label: 'Net Profit', value: analytics.totalProfit >= 100000 ? `Rs.${(analytics.totalProfit / 100000).toFixed(1)}L` : `Rs.${analytics.totalProfit.toLocaleString()}`, change: analytics.totalRevenue > 0 ? `${Math.round((analytics.totalProfit / analytics.totalRevenue) * 100)}% margin` : (analytics.totalOrders > 0 ? '0% margin' : '—'), up: analytics.totalProfit >= 0, icon: Wallet },
    { label: 'Avg Order Value', value: `Rs.${analytics.aov.toLocaleString()}`, change: `${analytics.totalOrders} total orders`, up: true, icon: ShoppingCart },
    { label: 'Returning Customers', value: `${analytics.returningCustomers}`, change: `of ${new Set(orders.map((o) => o.userName)).size} unique`, up: true, icon: Users },
    { label: 'Low Stock Items', value: `${analytics.lowStockProducts.length + analytics.outOfStock.length}`, change: `${analytics.outOfStock.length} out of stock`, up: false, icon: Package },
  ];

  return (
    <div className="space-y-6">
      {/* Today's Quick Pulse */}
      {analytics.todayOrders > 0 && (
        <div className="bg-gradient-to-r from-primary/5 to-emerald-50 border border-primary/10 rounded-xl p-4 sm:p-5 flex flex-wrap items-center gap-4 sm:gap-8">
          <div><p className="text-[11px] sm:text-[12px] text-muted-foreground uppercase tracking-wide">Today</p></div>
          <div><p className="text-[18px] sm:text-[22px]" style={{ fontWeight: 700 }}>{analytics.todayOrders}</p><p className="text-[11px] text-muted-foreground">Orders</p></div>
          <div><p className="text-[18px] sm:text-[22px] text-primary" style={{ fontWeight: 700 }}>Rs.{analytics.todayRevenue.toLocaleString()}</p><p className="text-[11px] text-muted-foreground">Delivered Revenue</p></div>
          <div><p className="text-[18px] sm:text-[22px] text-amber-600" style={{ fontWeight: 700 }}>{analytics.todayNewOrders}</p><p className="text-[11px] text-muted-foreground">New (Placed)</p></div>
          <div><p className="text-[18px] sm:text-[22px]" style={{ fontWeight: 700 }}>{analytics.fulfillmentRate}%</p><p className="text-[11px] text-muted-foreground">Fulfillment Rate</p></div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-primary/10 rounded-lg"><s.icon className="w-5 h-5 text-primary" /></div>
              <span className={`text-[12px] sm:text-[13px] flex items-center gap-0.5 ${s.up ? 'text-primary' : 'text-amber-600'}`} style={{ fontWeight: 500 }}>
                {s.up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}{s.change}
              </span>
            </div>
            <p className="text-[20px] sm:text-[24px]" style={{ fontWeight: 700 }}>{s.value}</p>
            <p className="text-[12px] sm:text-[13px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Orders by Status */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
        {(['placed', 'accepted', 'shipped', 'delivered', 'cancelled', 'rejected'] as const).map((status) => (
          <div key={status} className="bg-white border rounded-xl p-3 text-center">
            <p className="text-[18px] sm:text-[22px]" style={{ fontWeight: 700 }}>{analytics.statusCounts[status] || 0}</p>
            <p className="text-[11px] sm:text-[12px] text-muted-foreground capitalize">{status}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-xl p-4 sm:p-5">
        <h3 className="text-[15px] sm:text-[16px] mb-4" style={{ fontWeight: 600 }}>Revenue: B2C vs B2B + Pipeline</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={analytics.monthlyRevenue}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : `${v}`} />
            <Tooltip formatter={(v: number) => [`Rs.${v.toLocaleString()}`, '']} />
            <Area type="monotone" dataKey="B2B" stackId="1" stroke="#16a34a" fill="#16a34a" fillOpacity={0.3} />
            <Area type="monotone" dataKey="B2C" stackId="1" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.3} />
            <Area type="monotone" dataKey="Pipeline" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} strokeDasharray="4 4" />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex gap-6 mt-3 justify-center text-[12px] sm:text-[13px]">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#16a34a]" /> B2B (Delivered)</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#0ea5e9]" /> B2C (Delivered)</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#f59e0b]" /> Pipeline</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border rounded-xl p-4 sm:p-5">
          <h3 className="text-[15px] sm:text-[16px] mb-4" style={{ fontWeight: 600 }}>Daily Orders (7 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analytics.dailyOrders}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="orders" fill="#16a34a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border rounded-xl p-4 sm:p-5">
          <h3 className="text-[15px] sm:text-[16px] mb-4" style={{ fontWeight: 600 }}>Revenue by Category</h3>
          {analytics.categoryRevenue.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={analytics.categoryRevenue} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ value }) => `${value}%`}>
                    {analytics.categoryRevenue.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number, _: string, props: any) => [`${v}% (Rs.${props.payload.revenue.toLocaleString()})`, props.payload.name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1 mt-2">
                {analytics.categoryRevenue.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-1.5 text-[11px]">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} /><span className="truncate">{c.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-[14px]">No order data yet</div>
          )}
        </div>
      </div>

      <div className="bg-white border rounded-xl p-4 sm:p-5">
        <h3 className="text-[15px] sm:text-[16px] mb-4" style={{ fontWeight: 600 }}>Top Selling Products</h3>
        {analytics.topProducts.length > 0 ? (
          <div className="space-y-3">
            {analytics.topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3 sm:gap-4">
                <span className="text-[13px] text-muted-foreground w-6" style={{ fontWeight: 600 }}>#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] sm:text-[14px] truncate" style={{ fontWeight: 500 }}>{p.name}</p>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                    <span>{p.units} units</span>
                    <span>Rs.{Math.round(p.revenue).toLocaleString()} rev</span>
                    <span className="text-primary">Rs.{Math.round(p.profit).toLocaleString()} profit</span>
                  </div>
                </div>
                <div className="w-20 sm:w-32 bg-gray-100 rounded-full h-2">
                  <div className="bg-primary rounded-full h-2" style={{ width: `${(p.revenue / (analytics.topProducts[0]?.revenue || 1)) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-[14px] text-muted-foreground py-8 text-center">No sales data yet</p>}
      </div>

      {(analytics.lowStockProducts.length > 0 || analytics.outOfStock.length > 0) && (
        <div className="bg-white border rounded-xl p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="text-[15px] sm:text-[16px]" style={{ fontWeight: 600 }}>Stock Alerts</h3>
          </div>
          <div className="space-y-2">
            {analytics.outOfStock.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div><p className="text-[13px]" style={{ fontWeight: 500 }}>{p.name}</p><p className="text-[11px] text-muted-foreground">{p.brand} · {p.sku}</p></div>
                <span className="text-[12px] text-red-600 bg-red-100 px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>Out of Stock</span>
              </div>
            ))}
            {analytics.lowStockProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <div><p className="text-[13px]" style={{ fontWeight: 500 }}>{p.name}</p><p className="text-[11px] text-muted-foreground">{p.brand} · {p.sku}</p></div>
                <span className="text-[12px] text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>{p.stock} left</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
