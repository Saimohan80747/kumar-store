import { useState, useMemo } from 'react';
import { Download, ChevronDown, ChevronUp, Eye, X, MapPin } from 'lucide-react';
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
  const getPrice = useStore((s) => s.getPrice);

  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [viewingOrder, setViewingOrder] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return orders
      .filter((o) => typeFilter === 'all' || (typeFilter === 'B2B' ? o.userRole === 'shopowner' : o.userRole !== 'shopowner'))
      .filter((o) => statusFilter === 'all' || o.status === statusFilter)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders, typeFilter, statusFilter]);

  const summary = useMemo(() => {
    const b2c = filtered.filter((o) => o.userRole !== 'shopowner').length;
    const b2b = filtered.filter((o) => o.userRole === 'shopowner').length;
    const delivered = filtered.filter((o) => o.status === 'delivered');

    return {
      total: filtered.length,
      delivered: delivered.length,
      revenue: delivered.reduce((s, o) => s + o.total, 0),
      b2c: b2c,
      b2b: b2b,
    };
  }, [filtered]);

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order || order.status === newStatus) return;

    // Enforce allowed transitions:
    // placed -> accepted | rejected | cancelled
    // accepted -> shipped | cancelled
    // shipped -> delivered
    // delivered / cancelled / rejected -> final
    const from = order.status;
    const allowedNext: OrderStatus[] =
      from === 'placed'
        ? ['accepted', 'rejected', 'cancelled']
        : from === 'accepted'
          ? ['shipped', 'cancelled']
          : from === 'shipped'
            ? ['delivered']
            : from === 'delivered' || from === 'cancelled' || from === 'rejected'
              ? []
              : ['delivered'];

    if (!allowedNext.includes(newStatus)) {
      toast.error('This status change is not allowed from the current state.');
      return;
    }

    if (newStatus === 'accepted') {
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
                <th className="text-left px-4 py-3">Address</th>
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
                  <td className="px-4 py-3 text-[12px] max-w-[200px] truncate" title={o.deliveryAddress || '—'}>
                    {o.deliveryLocationUrl ? (
                      <a href={o.deliveryLocationUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                        {o.deliveryAddress} <MapPin className="w-3 h-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground">{o.deliveryAddress || '—'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3" style={{ fontWeight: 600 }}>Rs.{o.total.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] capitalize ${STATUS_STYLES[o.status] || 'bg-gray-50 text-gray-600'}`} style={{ fontWeight: 500 }}>{o.status}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-[13px]">{o.date}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewingOrder(o.id)}
                        className="p-1.5 hover:bg-gray-100 rounded text-blue-600"
                        title="View Order"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {o.status !== 'delivered' && o.status !== 'cancelled' && o.status !== 'rejected' ? (
                        <select
                          value={o.status}
                          onChange={(e) => handleStatusChange(o.id, e.target.value as OrderStatus)}
                          className={`px-2.5 py-1 rounded-lg text-[12px] border outline-none cursor-pointer capitalize ${STATUS_STYLES[o.status] || 'bg-gray-50 text-gray-600'}`}
                          style={{ fontWeight: 500 }}
                        >
                          {ALL_STATUSES.filter((s) => {
                            if (o.status === 'placed') return ['placed', 'accepted', 'rejected', 'cancelled'].includes(s);
                            if (o.status === 'accepted') return ['accepted', 'shipped', 'cancelled'].includes(s);
                            if (o.status === 'shipped') return ['shipped', 'delivered'].includes(s);
                            if (o.status === 'delivered' || o.status === 'cancelled' || o.status === 'rejected') return s === o.status;
                            return ['delivered'].includes(s);
                          }).map((s) => (
                            <option key={s} value={s} className="capitalize">
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-[12px] text-muted-foreground italic">Final</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-muted-foreground text-[14px]">No orders match your filters</td></tr>
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
                <div className="text-left min-w-0 flex-1">
                  <p className="text-[13px]" style={{ fontWeight: 500 }}>#{o.id.slice(0, 8)} · {o.userName}</p>
                  <p className="text-[11px] text-muted-foreground truncate" title={o.deliveryAddress || '—'}>{o.date}{o.deliveryAddress ? ` · ${o.deliveryAddress}` : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-[13px]" style={{ fontWeight: 600 }}>Rs.{o.total.toLocaleString()}</p>
                    <span className={`text-[11px] capitalize ${STATUS_STYLES[o.status] || 'text-gray-600'}`}>{o.status}</span>
                  </div>
                  {expandedOrder === o.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>
              {expandedOrder === o.id && (
                <div className="mt-3 pt-3 border-t space-y-2">
                  <div className="text-[12px]">
                    <span className="text-muted-foreground">Address</span>
                    {o.deliveryLocationUrl ? (
                      <a href={o.deliveryLocationUrl} target="_blank" rel="noopener noreferrer" className="mt-0.5 text-primary hover:underline flex items-center gap-1" style={{ fontWeight: 500 }}>
                        {o.deliveryAddress} <MapPin className="w-3 h-3 shrink-0" />
                      </a>
                    ) : (
                      <p className="mt-0.5" style={{ fontWeight: 500 }}>{o.deliveryAddress || '—'}</p>
                    )}
                  </div>
                  <div className="text-[12px] space-y-1">
                    {o.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-muted-foreground">
                        <span className="truncate flex-1">{item.product.name} × {item.quantity}</span>
                        <span>Rs.{(getPrice(item.product) * item.quantity).toLocaleString()}</span>
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
                        {ALL_STATUSES.filter((s) => {
                          if (o.status === 'placed') return ['placed', 'accepted', 'rejected', 'cancelled'].includes(s);
                          if (o.status === 'accepted') return ['accepted', 'shipped', 'cancelled'].includes(s);
                          if (o.status === 'shipped') return ['shipped', 'delivered'].includes(s);
                          if (o.status === 'delivered' || o.status === 'cancelled' || o.status === 'rejected') return s === o.status;
                          return ['delivered'].includes(s);
                        }).map((s) => (
                          <option key={s} value={s}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </option>
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

      {/* View Order Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
            {(() => {
              const order = orders.find((o) => o.id === viewingOrder);
              if (!order) return null;
              return (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Order Details - {order.id}</h3>
                    <button
                      onClick={() => setViewingOrder(null)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Customer</p>
                        <p className="font-medium">{order.userName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Date</p>
                        <p className="font-medium">{order.date}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Address</p>
                        {order.deliveryLocationUrl ? (
                          <a href={order.deliveryLocationUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline flex items-center gap-1">
                            {order.deliveryAddress} <MapPin className="w-4 h-4 shrink-0" />
                          </a>
                        ) : (
                          <p className="font-medium">{order.deliveryAddress || '—'}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${STATUS_STYLES[order.status]}`}>
                          {order.status}
                        </span>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total</p>
                        <p className="font-medium">Rs.{order.total.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Ordered Products</h4>
                      <div className="space-y-2">
                        {order.items && order.items.length > 0 ? (
                          order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                              <img
                                src={item.product?.image || '/placeholder.png'}
                                alt={item.product?.name || 'Product'}
                                className="w-12 h-12 rounded object-cover"
                              />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{item.product?.name || 'Unknown Product'}</p>
                                <p className="text-xs text-muted-foreground">{item.product?.brand || ''}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-sm">Rs.{(item.product?.customerPrice * item.quantity || 0).toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">Qty: {item.quantity || 0}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground italic">No items found in this order</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
