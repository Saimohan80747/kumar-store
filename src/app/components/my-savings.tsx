import { useMemo } from 'react';
import { Navigate, Link } from 'react-router';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Wallet, TrendingUp, ShoppingBag, ArrowRight, IndianRupee, Calendar, Package } from 'lucide-react';
import { useStore } from '../store';

export function MySavings() {
  const user = useStore((s) => s.user);
  const orders = useStore((s) => s.orders);

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'customer') return <Navigate to="/" replace />;

  // Compute savings from real delivered order data
  const savingsData = useMemo(() => {
    // Strict matching: only orders linked to the current user's id
    const userOrders = orders.filter((o) => o.status === 'delivered' && o.userId === user.id);

    let lifetimeSavings = 0;
    let monthSavings = 0;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Monthly buckets for chart (last 6 months)
    const monthlyMap = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const key = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      monthlyMap.set(key, 0);
    }

    const tableRows: {
      orderId: string;
      date: string;
      itemsCount: number;
      retailTotal: number;
      finalPaid: number;
      savings: number;
    }[] = [];

    userOrders.forEach((order) => {
      // Per-item savings: (MRP - customerPrice) × quantity
      let itemSavings = 0;
      let retailTotal = 0;
      order.items.forEach((item) => {
        const mrp = Number(item.product?.mrp) || 0;
        const custPrice = Number(item.product?.customerPrice ?? (item.product as any)?.customer_price ?? item.price ?? mrp) || 0;
        const qty = Number(item.quantity) || 0;
        retailTotal += mrp * qty;
        itemSavings += Math.max(0, (mrp - custPrice) * qty);
      });

      // Fallback: if per-item savings is 0 but MRP total > paid total, use the difference
      const finalPaid = Number(order.total) || 0;
      const savings = itemSavings > 0 ? itemSavings : Math.max(0, retailTotal - finalPaid);

      lifetimeSavings += savings;

      const orderDate = new Date(order.date);
      if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
        monthSavings += savings;
      }

      // Monthly chart bucket
      const monthKey = orderDate.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      if (monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + savings);
      }

      tableRows.push({
        orderId: order.id,
        date: order.date,
        itemsCount: order.items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0),
        retailTotal: Math.round(retailTotal),
        finalPaid: Math.round(finalPaid),
        savings: Math.round(savings),
      });
    });

    const avgPerOrder = userOrders.length > 0 ? Math.round(lifetimeSavings / userOrders.length) : 0;

    const chartData = Array.from(monthlyMap.entries()).map(([month, savings]) => ({
      month,
      savings: Math.round(savings),
    }));

    return { lifetimeSavings: Math.round(lifetimeSavings), monthSavings: Math.round(monthSavings), avgPerOrder, chartData, tableRows, totalOrders: userOrders.length };
  }, [orders, user.id]);

  const summaryCards = [
    {
      label: 'Total Savings (Lifetime)',
      value: `Rs.${savingsData.lifetimeSavings.toLocaleString()}`,
      icon: Wallet,
      color: 'bg-primary/10 text-primary',
    },
    {
      label: 'Savings This Month',
      value: `Rs.${savingsData.monthSavings.toLocaleString()}`,
      icon: Calendar,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Avg Savings Per Order',
      value: `Rs.${savingsData.avgPerOrder.toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-amber-50 text-amber-600',
    },
  ];

  return (
    <div className="py-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-[24px]" style={{ fontWeight: 700 }}>My Savings</h1>
          <p className="text-muted-foreground text-[14px]">
            Track how much you're saving with Kumar Store discounts
          </p>
        </div>
        <Link
          to="/products"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-[14px]"
          style={{ fontWeight: 600 }}
        >
          <ShoppingBag className="w-4 h-4" /> Shop More & Save
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {summaryCards.map((s) => (
          <div key={s.label} className="bg-white border rounded-xl p-5">
            <div className={`p-2.5 rounded-lg w-fit ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-[24px] mt-3" style={{ fontWeight: 700 }}>
              {s.value}
            </p>
            <p className="text-[13px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Monthly Savings Chart */}
      <div className="bg-white border rounded-xl p-5 mb-6">
        <h3 className="text-[16px] mb-4" style={{ fontWeight: 600 }}>
          Monthly Savings (Last 6 Months)
        </h3>
        {savingsData.totalOrders > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={savingsData.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : `${v}`)}
              />
              <Tooltip
                formatter={(v: number) => [`Rs.${v.toLocaleString()}`, 'Savings']}
              />
              <Bar dataKey="savings" fill="#16a34a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="py-12 text-center">
            <IndianRupee className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-[14px] text-muted-foreground">
              No savings data yet. Place your first order to start tracking!
            </p>
          </div>
        )}
      </div>

      {/* Savings Detail Table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-[16px]" style={{ fontWeight: 600 }}>
            Savings Breakdown
          </h3>
        </div>
        {savingsData.tableRows.length > 0 ? (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-[14px]">
                <thead className="bg-gray-50 text-[13px] text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-3">Order ID</th>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-left px-4 py-3">Items</th>
                    <th className="text-right px-4 py-3">Retail Total</th>
                    <th className="text-right px-4 py-3">Final Paid</th>
                    <th className="text-right px-4 py-3">Savings</th>
                  </tr>
                </thead>
                <tbody>
                  {savingsData.tableRows.map((row) => (
                    <tr key={row.orderId} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3" style={{ fontWeight: 500 }}>
                        {row.orderId}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{row.date}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.itemsCount}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        Rs.{row.retailTotal.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right" style={{ fontWeight: 500 }}>
                        Rs.{row.finalPaid.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-primary" style={{ fontWeight: 600 }}>
                          Rs.{row.savings.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile card layout */}
            <div className="sm:hidden divide-y">
              {savingsData.tableRows.map((row) => (
                <div key={row.orderId} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px]" style={{ fontWeight: 600 }}>{row.orderId}</span>
                    <span className="text-[12px] text-muted-foreground">{row.date}</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-muted-foreground">{row.itemsCount} items</span>
                    <span className="text-muted-foreground">MRP: Rs.{row.retailTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px]">Paid: <span style={{ fontWeight: 500 }}>Rs.{row.finalPaid.toLocaleString()}</span></span>
                    <span className="text-primary text-[14px]" style={{ fontWeight: 700 }}>
                      Saved Rs.{row.savings.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="py-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-[15px]" style={{ fontWeight: 500 }}>
              No orders yet
            </p>
            <p className="text-[13px] text-muted-foreground mt-1">
              Place your first order to see savings breakdown
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 mt-4 px-5 py-2 bg-primary text-white rounded-lg text-[14px]"
              style={{ fontWeight: 600 }}
            >
              Start Shopping <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
