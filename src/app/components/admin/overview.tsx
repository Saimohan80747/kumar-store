import { useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  Users, Store, TrendingUp, TrendingDown, IndianRupee, ShoppingCart, CheckCircle2,
  AlertCircle, XCircle, ArrowRight, Wallet
} from 'lucide-react';
import { Link } from 'react-router';
import { useStore } from '../../store';
import { CATEGORIES } from '../../data';
import { toast } from 'sonner';

const COLORS = ['#16a34a', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444'];

const STATUS_COLORS: Record<string, string> = {
  placed: 'text-amber-600', accepted: 'text-blue-600', shipped: 'text-purple-600',
  delivered: 'text-primary', cancelled: 'text-red-500', rejected: 'text-red-600',
};

export function AdminOverview() {
  const shopRequests = useStore((s) => s.shopRequests);
  const orders = useStore((s) => s.orders);
  const approveShop = useStore((s) => s.approveShop);
  const rejectShop = useStore((s) => s.rejectShop);
  const loadAllData = useStore((s) => s.loadAllData);
  const getRealTimeStats = useStore((s) => s.getRealTimeStats);

  // Refresh data from backend every time overview mounts
  useEffect(() => { loadAllData(); }, []);

  const { stats: realTimeStats, revenueTrend, categoryData, recentOrders } = useMemo(() => {
    const now = new Date();
    const cm = now.getMonth(), cy = now.getFullYear();

    // Get real-time stats
    const stats = getRealTimeStats();

    // Revenue trend last 6 months — use real-time stats
    const revenueTrend: { month: string; revenue: number; pipeline: number; orders: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(cy, cm - i, 1);
      const m = d.getMonth(); const y = d.getFullYear();
      const monthDelivered = orders.filter((o) => { const od = new Date(o.date); return od.getMonth() === m && od.getFullYear() === y && o.status === 'delivered'; });
      const monthPending = orders.filter((o) => { const od = new Date(o.date); return od.getMonth() === m && od.getFullYear() === y && ['placed', 'accepted', 'shipped'].includes(o.status); });
      revenueTrend.push({
        month: d.toLocaleDateString('en-IN', { month: 'short' }),
        revenue: monthDelivered.reduce((s, o) => s + o.total, 0),
        pipeline: monthPending.reduce((s, o) => s + o.total, 0),
        orders: monthDelivered.length + monthPending.length,
      });
    }

    // Category breakdown — use real-time delivered orders
    const catMap = new Map<string, number>();
    orders.filter(o => o.status === 'delivered').forEach((o) => {
      const orderMRP = o.items.reduce((s, i) => s + i.product.mrp * i.quantity, 0);
      o.items.forEach((item) => {
        const weight = orderMRP > 0 ? (item.product.mrp * item.quantity) / orderMRP : 0;
        catMap.set(item.product.category, (catMap.get(item.product.category) || 0) + o.total * weight);
      });
    });
    const totalCatRev = Array.from(catMap.values()).reduce((s, v) => s + v, 0) || 1;
    const categoryData = Array.from(catMap.entries())
      .map(([slug, rev]) => ({ name: CATEGORIES.find((c) => c.slug === slug)?.name || slug, value: Math.round((rev / totalCatRev) * 100) }))
      .sort((a, b) => b.value - a.value).slice(0, 5);

    // Recent 5 orders
    const recentOrders = [...orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    return { stats, recentOrders, revenueTrend, categoryData };
  }, [orders]);

  const pendingShops = shopRequests.filter((r) => r.status === 'pending');

  const statsData = [
    { label: 'Admin Profit (B2C)', value: (realTimeStats.totalAdminProfitFromCustomers || 0) >= 100000 ? `Rs.${((realTimeStats.totalAdminProfitFromCustomers || 0) / 100000).toFixed(1)}L` : `Rs.${(realTimeStats.totalAdminProfitFromCustomers || 0).toLocaleString()}`, change: 'from customers', up: (realTimeStats.totalAdminProfitFromCustomers || 0) >= 0, icon: IndianRupee, color: 'bg-primary/10 text-primary' },
    { label: 'Admin Profit (B2B)', value: (realTimeStats.totalAdminProfitFromShops || 0) >= 100000 ? `Rs.${((realTimeStats.totalAdminProfitFromShops || 0) / 100000).toFixed(1)}L` : `Rs.${(realTimeStats.totalAdminProfitFromShops || 0).toLocaleString()}`, change: 'from shops', up: (realTimeStats.totalAdminProfitFromShops || 0) >= 0, icon: Store, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Shop Profit', value: (realTimeStats.totalShopProfit || 0) >= 100000 ? `Rs.${((realTimeStats.totalShopProfit || 0) / 100000).toFixed(1)}L` : `Rs.${(realTimeStats.totalShopProfit || 0).toLocaleString()}`, change: `${realTimeStats.activeShopOwners || 0} shops`, up: (realTimeStats.totalShopProfit || 0) >= 0, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Customer Savings', value: (realTimeStats.totalCustomerSavings || 0) >= 100000 ? `Rs.${((realTimeStats.totalCustomerSavings || 0) / 100000).toFixed(1)}L` : `Rs.${(realTimeStats.totalCustomerSavings || 0).toLocaleString()}`, change: `${realTimeStats.totalCustomers || 0} customers`, up: (realTimeStats.totalCustomerSavings || 0) >= 0, icon: TrendingUp, color: 'bg-amber-50 text-amber-600' },
    { label: 'Total Revenue', value: (realTimeStats.totalRevenue || 0) >= 100000 ? `Rs.${((realTimeStats.totalRevenue || 0) / 100000).toFixed(1)}L` : `Rs.${(realTimeStats.totalRevenue || 0).toLocaleString()}`, change: (realTimeStats.orderCompletionRate || 0) > 0 ? `${Math.round(realTimeStats.orderCompletionRate || 0)}% completion` : '—', up: (realTimeStats.orderCompletionRate || 0) >= 0, icon: Wallet, color: 'bg-green-50 text-green-600' },
    { label: 'Total Orders', value: (realTimeStats.totalOrders || 0).toLocaleString(), change: `${realTimeStats.deliveredOrders || 0} delivered`, up: true, icon: ShoppingCart, color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {statsData.map((s) => (
          <div key={s.label} className="bg-white border rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className={`p-2 sm:p-2.5 rounded-lg ${s.color}`}><s.icon className="w-5 h-5" /></div>
              <span className={`text-[12px] sm:text-[13px] flex items-center gap-0.5 ${s.up ? 'text-primary' : 'text-amber-600'}`} style={{ fontWeight: 500 }}>
                {s.up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />} {s.change}
              </span>
            </div>
            <p className="text-[20px] sm:text-[24px] mt-3" style={{ fontWeight: 700 }}>{s.value}</p>
            <p className="text-[12px] sm:text-[13px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pending Approvals Alert */}
      {pendingShops.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-[13px] sm:text-[14px] text-amber-800" style={{ fontWeight: 600 }}>
                {pendingShops.length} shop registration{pendingShops.length > 1 ? 's' : ''} pending approval
              </p>
              <p className="text-[12px] sm:text-[13px] text-amber-700">Review and approve shop owner requests to activate their wholesale accounts.</p>
            </div>
          </div>
          <Link to="/admin/shop-approvals" className="px-3 sm:px-4 py-2 bg-amber-600 text-white rounded-lg text-[13px] flex items-center gap-1.5" style={{ fontWeight: 600 }}>
            Review <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white border rounded-xl p-4 sm:p-5">
          <h3 className="text-[15px] sm:text-[16px] mb-4" style={{ fontWeight: 600 }}>Revenue Trend</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : `${v}`} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(v: number, name: string) => [`Rs.${v.toLocaleString()}`, name === 'revenue' ? 'Delivered' : 'Pipeline']}
                />
                <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={3} dot={{ fill: '#16a34a', r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="revenue" />
                <Line type="monotone" dataKey="pipeline" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#f59e0b', r: 3 }} name="pipeline" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-6 mt-4 justify-center text-[12px] sm:text-[13px]">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#16a34a]" /> Delivered</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#f59e0b]" /> Pipeline</div>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4 sm:p-5">
          <h3 className="text-[15px] sm:text-[16px] mb-4" style={{ fontWeight: 600 }}>Sales by Category</h3>
          {categoryData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="h-[250px] w-full sm:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} dataKey="value" stroke="none">
                      {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 w-full sm:w-1/2">
                {categoryData.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-2.5 text-[13px]">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground truncate">{c.name}</span>
                    <span className="ml-auto font-bold">{c.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-[14px]">No order data yet</div>
          )}
        </div>
      </div>

      {/* Recent Orders + Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] sm:text-[16px]" style={{ fontWeight: 600 }}>Recent Orders</h3>
            <Link to="/admin/orders" className="text-primary text-[13px] hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] sm:text-[14px] truncate" style={{ fontWeight: 500 }}>#{o.id.slice(0, 8)}</p>
                    <p className="text-[11px] sm:text-[12px] text-muted-foreground truncate">{o.userName} - {o.userRole === 'shopowner' ? 'B2B' : 'B2C'}</p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-[13px] sm:text-[14px]" style={{ fontWeight: 600 }}>Rs.{o.total.toLocaleString()}</p>
                    <span className={`text-[11px] capitalize ${STATUS_COLORS[o.status] || 'text-gray-500'}`}>{o.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[14px] text-muted-foreground text-center py-8">No orders yet</p>
          )}
        </div>

        <div className="bg-white border rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] sm:text-[16px] flex items-center gap-2" style={{ fontWeight: 600 }}>
              Pending Shop Approvals
              {pendingShops.length > 0 && (
                <span className="bg-amber-100 text-amber-700 text-[12px] px-2 py-0.5 rounded-full">{pendingShops.length}</span>
              )}
            </h3>
            <Link to="/admin/shop-approvals" className="text-primary text-[13px] hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {pendingShops.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-2" />
              <p className="text-[14px] text-muted-foreground">All caught up! No pending approvals.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingShops.slice(0, 3).map((s) => (
                <div key={s.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-[13px] sm:text-[14px]" style={{ fontWeight: 500 }}>{s.shopName}</p>
                      <p className="text-[11px] sm:text-[12px] text-muted-foreground">{s.name} - {s.shopLocation}</p>
                    </div>
                    <span className="text-[11px] text-muted-foreground">{s.date}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={async () => { await approveShop(s.id); toast.success(`${s.shopName} approved!`); }} className="flex-1 py-1.5 bg-primary text-white rounded-lg text-[13px] flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button onClick={async () => { await rejectShop(s.id); toast.error(`${s.shopName} rejected`); }} className="flex-1 py-1.5 bg-destructive text-white rounded-lg text-[13px] flex items-center justify-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}