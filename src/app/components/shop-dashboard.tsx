import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  IndianRupee, ShoppingCart, TrendingUp, Package, CreditCard, Download,
  RotateCcw, Percent, ArrowRight
} from 'lucide-react';
import { Link, Navigate } from 'react-router';
import { useStore } from '../store';
import { FEATURED_PRODUCTS } from '../data';
import { ProductCard } from './product-card';
import { toast } from 'sonner';

const STATUS_COLORS: Record<string, string> = {
  placed: 'text-amber-600', accepted: 'text-blue-600', shipped: 'text-purple-600',
  delivered: 'text-primary', cancelled: 'text-red-500', rejected: 'text-red-600',
};

export function ShopDashboard() {
  const user = useStore((s) => s.user);
  const orders = useStore((s) => s.orders);
  const addToCart = useStore((s) => s.addToCart);

  if (!user || user.role !== 'shopowner') {
    return <Navigate to="/login" replace />;
  }

  const shopAnalytics = useMemo(() => {
    const myOrders = orders.filter((o) => o.userId === user?.id || o.userName === user?.name);
    const now = new Date();
    const cm = now.getMonth(), cy = now.getFullYear();

    const totalSpent = myOrders.reduce((s, o) => s + o.total, 0);
    const totalMRP = myOrders.reduce((s, o) => s + o.items.reduce((is, i) => is + i.product.mrp * i.quantity, 0), 0);
    const totalSavings = totalMRP - totalSpent;

    // Monthly spend for last 6 months
    const monthlyData: { month: string; amount: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(cy, cm - i, 1);
      const m = d.getMonth(); const y = d.getFullYear();
      const monthOrders = myOrders.filter((o) => { const od = new Date(o.date); return od.getMonth() === m && od.getFullYear() === y; });
      monthlyData.push({ month: d.toLocaleDateString('en-IN', { month: 'short' }), amount: monthOrders.reduce((s, o) => s + o.total, 0) });
    }

    const recentOrders = [...myOrders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    return { myOrders, totalSpent, totalSavings, monthlyData, recentOrders };
  }, [orders, user]);

  const stats = [
    { label: 'Total Orders', value: shopAnalytics.myOrders.length.toString(), change: '', icon: ShoppingCart, color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Spent', value: shopAnalytics.totalSpent >= 100000 ? `Rs.${(shopAnalytics.totalSpent / 100000).toFixed(1)}L` : `Rs.${shopAnalytics.totalSpent.toLocaleString()}`, change: '', icon: IndianRupee, color: 'bg-primary/10 text-primary' },
    { label: 'Total Savings', value: `Rs.${shopAnalytics.totalSavings.toLocaleString()}`, change: '', icon: TrendingUp, color: 'bg-amber-50 text-amber-600' },
    { label: 'Credit Limit', value: `Rs.${(user?.creditLimit || 50000).toLocaleString()}`, change: 'Available', icon: CreditCard, color: 'bg-purple-50 text-purple-600' },
  ];

  const topProducts = FEATURED_PRODUCTS.slice(0, 4);

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-[20px] sm:text-[24px]" style={{ fontWeight: 700 }}>Shop Dashboard</h1>
          <p className="text-muted-foreground text-[13px] sm:text-[14px]">Welcome, {user?.shopName || 'Shop Owner'}. Manage your wholesale orders.</p>
        </div>
        <Link to="/products" className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary text-white rounded-lg text-[13px] sm:text-[14px]" style={{ fontWeight: 600 }}>
          <Package className="w-4 h-4" /> Place Bulk Order
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className={`p-2 sm:p-2.5 rounded-lg ${s.color}`}><s.icon className="w-5 h-5" /></div>
              {s.change && <span className="text-primary text-[12px] sm:text-[13px]" style={{ fontWeight: 500 }}>{s.change}</span>}
            </div>
            <p className="text-[20px] sm:text-[24px] mt-3" style={{ fontWeight: 700 }}>{s.value}</p>
            <p className="text-[12px] sm:text-[13px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Order chart */}
        <div className="lg:col-span-2 bg-white border rounded-xl p-4 sm:p-5">
          <h3 className="text-[15px] sm:text-[16px] mb-4" style={{ fontWeight: 600 }}>Monthly Orders Value</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={shopAnalytics.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : `${v}`} />
              <Tooltip formatter={(v: number) => [`Rs.${v.toLocaleString()}`, 'Amount']} />
              <Bar dataKey="amount" fill="#16a34a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick info */}
        <div className="bg-white border rounded-xl p-4 sm:p-5 space-y-4">
          <h3 className="text-[15px] sm:text-[16px]" style={{ fontWeight: 600 }}>Account Info</h3>
          <div className="space-y-3 text-[13px] sm:text-[14px]">
            <div className="flex justify-between"><span className="text-muted-foreground">Shop Name</span><span style={{ fontWeight: 500 }}>{user?.shopName || '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span style={{ fontWeight: 500 }}>{user?.shopLocation || '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">GST</span><span style={{ fontWeight: 500 }}>{user?.gstNumber || '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="text-primary" style={{ fontWeight: 500 }}>Verified</span></div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white border rounded-xl p-4 sm:p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] sm:text-[16px]" style={{ fontWeight: 600 }}>Recent Orders</h3>
          <Link to="/orders" className="text-primary text-[13px] sm:text-[14px] hover:underline flex items-center gap-1">View All <ArrowRight className="w-4 h-4" /></Link>
        </div>
        {shopAnalytics.recentOrders.length > 0 ? (
          <div className="space-y-3">
            {shopAnalytics.recentOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="p-2 bg-primary/10 rounded-lg shrink-0"><Package className="w-5 h-5 text-primary" /></div>
                  <div className="min-w-0">
                    <p className="text-[13px] sm:text-[14px] truncate" style={{ fontWeight: 500 }}>#{o.id.slice(0, 8)}</p>
                    <p className="text-[11px] sm:text-[12px] text-muted-foreground">{o.items.reduce((s, i) => s + i.quantity, 0)} items · {o.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-[13px] sm:text-[14px]" style={{ fontWeight: 600 }}>Rs.{o.total.toLocaleString()}</p>
                    <span className={`text-[11px] capitalize ${STATUS_COLORS[o.status] || 'text-gray-500'}`}>{o.status}</span>
                  </div>
                  <button onClick={() => toast.success('Invoice downloaded!')} className="p-2 border rounded-lg hover:bg-gray-100 hidden sm:block" title="Download Invoice">
                    <Download className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[14px] text-muted-foreground text-center py-8">No orders yet. Start by placing a bulk order!</p>
        )}
      </div>

      {/* Margin calculator highlight */}
      <div className="bg-gradient-to-r from-primary/5 to-emerald-50 rounded-2xl p-4 sm:p-6 mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Percent className="w-5 h-5 text-primary" />
          <h3 className="text-[15px] sm:text-[16px]" style={{ fontWeight: 600 }}>Your Margin Advantage</h3>
        </div>
        <p className="text-[13px] sm:text-[14px] text-muted-foreground mb-4">Wholesale prices give you competitive margins on every product</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {topProducts.map((p) => (
            <div key={p.id} className="bg-white rounded-lg p-3 text-center">
              <p className="text-[12px] sm:text-[13px] truncate" style={{ fontWeight: 500 }}>{p.name}</p>
              <p className="text-[18px] sm:text-[20px] text-primary mt-1" style={{ fontWeight: 700 }}>
                {Math.round(((p.mrp - p.shopPrice) / p.mrp) * 100)}%
              </p>
              <p className="text-[11px] sm:text-[12px] text-muted-foreground">margin</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended for restock */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] sm:text-[18px]" style={{ fontWeight: 600 }}>Recommended for Restock</h3>
          <Link to="/products" className="text-primary text-[13px] sm:text-[14px] hover:underline flex items-center gap-1">Browse All <ArrowRight className="w-4 h-4" /></Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {topProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}