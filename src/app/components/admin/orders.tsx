import { useState, useMemo } from 'react';
import { Download, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { useStore, type OrderStatus } from '../../store';

const ALL_STATUSES: OrderStatus[] = ['placed', 'accepted', 'shipped', 'delivered', 'cancelled', 'rejected'];

const STATUS_STYLES: Record<string, string> = {
  placed: 'bg-amber-50 text-amber-600', accepted: 'bg-blue-50 text-blue-600',
  shipped: 'bg-purple-50 text-purple-600', delivered: 'bg-primary/10 text-primary',
  cancelled: 'bg-red-50 text-red-500', rejected: 'bg-red-50 text-red-600',
};

export function AdminOrders() {
  const orders = useStore((s) => s.orders);
  const acceptOrder = useStore((s) => s.acceptOrder);
  const rejectOrder = useStore((s) => s.rejectOrder);
  const cancelOrder = useStore((s) => s.cancelOrder);
  const updateOrderStatus = useStore((s) => s.updateOrderStatus);

  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return orders
      .filter((o) => typeFilter === 'all' || (typeFilter === 'B2B' ? o.userRole === 'shopowner' : o.userRole !== 'shopowner'))
      .filter((o) => statusFilter === 'all' || o.status === statusFilter)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders, typeFilter, statusFilter]);

  const summary = useMemo(() => {
    const delivered = filtered.filter((o) => o.status === 'delivered');
    return {
      total: filtered.length,
      delivered: delivered.length,
      revenue: delivered.reduce((s, o) => s + o.total, 0),
      b2c: orders.filter((o) => o.userRole !== 'shopowner').length,
      b2b: orders.filter((o) => o.userRole === 'shopowner').length,
    };
  }, [filtered, orders]);

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order || order.status === newStatus) return;

    if (newStatus === 'accepted' && order.status === 'placed') {
      const result = acceptOrder(orderId);
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    } else if (newStatus === 'rejected') {
      rejectOrder(orderId);
      toast.success('Order rejected');
    } else if (newStatus === 'cancelled') {
      cancelOrder(orderId);
      toast.success('Order cancelled, stock restored');
    } else {
      updateOrderStatus(orderId, newStatus);
      toast.success(`Order status changed to ${newStatus}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Orders', value: summary.total },
          { label: 'Total Revenue', value: summary.revenue, isCurrency: true, color: 'text-primary' },
          { label: 'B2C Orders', value: summary.b2c },
          { label: 'B2B Orders', value: summary.b2b },
        ].map((s) => (
          <div key={s.label} className="bg-white border rounded-xl p-3 sm:p-4">
            <p className="text-[12px] sm:text-[13px] text-muted-foreground">{s.label}</p>
            <p className={`text-[20px] sm:text-[24px] ${s.color || ''}`} style={{ fontWeight: 700 }}>
              {s.isCurrency ? `Rs.${s.value.toLocaleString()}` : s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="p-3 sm:p-4 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex gap-2 flex-wrap">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {['all', 'B2C', 'B2B'].map((f) => (
                <button key={f} onClick={() => setTypeFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-[13px] transition-colors ${typeFilter === f ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  style={{ fontWeight: typeFilter === f ? 500 : 400 }}>
                  {f === 'all' ? 'All' : f}
                </button>
              ))}
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border rounded-lg text-[13px] bg-white outline-none">
              <option value="all">All Status</option>
              {(['placed', 'accepted', 'shipped', 'delivered', 'cancelled', 'rejected'] as const).map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-[13px]" onClick={() => toast.success('Report exported!')}>
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead className="bg-gray-50 text-[13px] text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Order ID</th>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Items</th>
                <th className="text-left px-4 py-3">Total</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-t hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-[13px]" style={{ fontWeight: 500 }}>#{o.id.slice(0, 8)}</td>
                  <td className="px-4 py-3">{o.userName}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] ${o.userRole === 'shopowner' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`} style={{ fontWeight: 500 }}>
                      {o.userRole === 'shopowner' ? 'B2B' : 'B2C'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                  <td className="px-4 py-3" style={{ fontWeight: 600 }}>Rs.{o.total.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] capitalize ${STATUS_STYLES[o.status] || 'bg-gray-50 text-gray-600'}`} style={{ fontWeight: 500 }}>{o.status}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-[13px]">{o.date}</td>
                  <td className="px-4 py-3">
                    {o.status !== 'delivered' && o.status !== 'cancelled' && o.status !== 'rejected' ? (
                      <select
                        value={o.status}
                        onChange={(e) => handleStatusChange(o.id, e.target.value as OrderStatus)}
                        className={`px-2.5 py-1 rounded-lg text-[12px] border outline-none cursor-pointer capitalize ${STATUS_STYLES[o.status] || 'bg-gray-50 text-gray-600'}`}
                        style={{ fontWeight: 500 }}
                      >
                        {ALL_STATUSES.map((s) => (
                          <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-[12px] text-muted-foreground italic">Final</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-muted-foreground text-[14px]">No orders match your filters</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y">
          {filtered.length === 0 && <p className="text-center py-10 text-muted-foreground text-[14px]">No orders match your filters</p>}
          {filtered.map((o) => (
            <div key={o.id} className="p-3">
              <button className="w-full flex items-center justify-between" onClick={() => setExpandedOrder(expandedOrder === o.id ? null : o.id)}>
                <div className="text-left">
                  <p className="text-[13px]" style={{ fontWeight: 500 }}>#{o.id.slice(0, 8)} · {o.userName}</p>
                  <p className="text-[11px] text-muted-foreground">{o.date} · {o.items.reduce((s, i) => s + i.quantity, 0)} items</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-[13px]" style={{ fontWeight: 600 }}>Rs.{o.total.toLocaleString()}</p>
                    <span className={`text-[11px] capitalize ${STATUS_STYLES[o.status]?.split(' ')[1] || 'text-gray-600'}`}>{o.status}</span>
                  </div>
                  {expandedOrder === o.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>
              {expandedOrder === o.id && (
                <div className="mt-3 pt-3 border-t space-y-2">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-muted-foreground">Type</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] ${o.userRole === 'shopowner' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>{o.userRole === 'shopowner' ? 'B2B' : 'B2C'}</span>
                  </div>
                  <div className="text-[12px] space-y-1">
                    {o.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-muted-foreground">
                        <span className="truncate flex-1">{item.product.name} × {item.quantity}</span>
                        <span>Rs.{(item.product.mrp * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  {o.status !== 'delivered' && o.status !== 'cancelled' && o.status !== 'rejected' ? (
                    <div className="pt-2">
                      <p className="text-[11px] text-muted-foreground mb-1">Change Status</p>
                      <select
                        value={o.status}
                        onChange={(e) => handleStatusChange(o.id, e.target.value as OrderStatus)}
                        className={`w-full px-3 py-2 rounded-lg text-[13px] border outline-none cursor-pointer capitalize ${STATUS_STYLES[o.status] || 'bg-gray-50 text-gray-600'}`}
                        style={{ fontWeight: 500 }}
                      >
                        {ALL_STATUSES.map((s) => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <p className="pt-2 text-[12px] text-muted-foreground italic">Status is final</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
