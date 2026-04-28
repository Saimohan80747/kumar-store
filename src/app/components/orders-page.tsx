import { Link, useNavigate } from 'react-router';
import { Package, Truck, CheckCircle2, Clock, RotateCcw, ArrowRight, ShoppingBag, Home, Ban, XCircle, MapPin, Phone, IndianRupee, TrendingUp, Sparkles } from 'lucide-react';
import { useStore } from '../store';
import { toast } from 'sonner';
import { Navigate } from 'react-router';
import { useEffect, useRef } from 'react';
import * as api from '../api';

/** Visual milestones representing order progression. */
/** Visual milestones representing order progression. */
/** Visual milestones representing order progression. */
const MINI_STEPS = [
  { id: 'placed', label: 'Placed', icon: ShoppingBag },
  { id: 'accepted', label: 'Accepted', icon: CheckCircle2 },
  { id: 'shipped', label: 'Shipped', icon: Truck },
  { id: 'delivered', label: 'Delivered', icon: Home },
];

function getStepIndex(status: string): number {
  switch (status) {
    case 'placed': return 0;
    case 'accepted': return 1;
    case 'shipped': return 2;
    case 'delivered': return 3;
    default: return -1; // cancelled/rejected
  }
}

export function OrdersPage() {
  const orders = useStore((s) => s.orders);
  const setOrders = useStore((s) => s.setOrders);
  const user = useStore((s) => s.user);
  const addToCart = useStore((s) => s.addToCart);
  const cancelOrder = useStore((s) => s.cancelOrder);
  const getPrice = useStore((s) => s.getPrice);
  const navigate = useNavigate();
  const prevOrdersRef = useRef(orders);

  // Poll for order updates every 5 seconds
  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      try {
        const freshOrders = await api.getOrdersByUser(user.id);
        if (freshOrders && Array.isArray(freshOrders)) {
          // Check for status changes
          const prevOrders = prevOrdersRef.current;
          freshOrders.forEach((newOrder) => {
            const oldOrder = prevOrders.find((o) => o.id === newOrder.id);
            if (oldOrder && oldOrder.status !== newOrder.status) {
              toast.info(`Order #${newOrder.id.slice(0, 8)} status updated to ${newOrder.status}`, {
                icon: <Package className="w-4 h-4" />,
              });
            }
          });
          setOrders(freshOrders);
          prevOrdersRef.current = freshOrders;
        }
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      }
    };

    fetchOrders(); // Initial fetch
    const interval = setInterval(fetchOrders, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [user, setOrders]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const statusConfig: Record<string, { icon: any; color: string; bg: string }> = {
    placed: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    accepted: { icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    shipped: { icon: Truck, color: 'text-purple-600', bg: 'bg-purple-50' },
    delivered: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    cancelled: { icon: Ban, color: 'text-red-500', bg: 'bg-red-50' },
    rejected: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  };

  const allOrders = orders.filter(order => order.userId === user.id);

  const handleReorder = (order: typeof allOrders[0]) => {
    let addedCount = 0;
    order.items.forEach((item) => {
      if (item.product && item.product.stock > 0) {
        addToCart(item.product, item.quantity);
        addedCount++;
      }
    });
    if (addedCount > 0) {
      toast.success(`${addedCount} item(s) added to cart for reorder!`);
    } else {
      toast.error('Items are currently out of stock.');
    }
  };

  const handleCancel = (orderId: string) => {
    cancelOrder(orderId);
    toast.success('Order cancelled successfully');
  };

  const isCancelledOrRejected = (status: string) => status === 'cancelled' || status === 'rejected';

  // Calculate total savings from delivered orders: savings = MRP - customerPrice per item
  const deliveredOrders = allOrders.filter(o => o.status === 'delivered');
  const totalSavings = deliveredOrders.reduce((sum, order) => {
    const orderSavings = order.items.reduce((s, item) => {
      const mrp = Number(item.product?.mrp) || 0;
      const custPrice = Number(item.product?.customerPrice ?? (item.product as any)?.customer_price ?? mrp) || 0;
      return s + (mrp - custPrice) * (Number(item.quantity) || 0);
    }, 0);
    return sum + orderSavings;
  }, 0);

  // Per-order savings map
  const orderSavingsMap = new Map<string, number>();
  allOrders.forEach(order => {
    const savings = order.items.reduce((s, item) => {
      const mrp = Number(item.product?.mrp) || 0;
      const custPrice = Number(item.product?.customerPrice ?? (item.product as any)?.customer_price ?? mrp) || 0;
      return s + (mrp - custPrice) * (Number(item.quantity) || 0);
    }, 0);
    orderSavingsMap.set(order.id, savings);
  });

  return (
    <div className="py-6 max-w-4xl mx-auto px-1">
      <h1 className="text-[20px] sm:text-[24px] mb-5" style={{ fontWeight: 700 }}>My Orders</h1>

      {/* My Savings Banner */}
      {totalSavings > 0 && (
        <div className="mb-5 rounded-2xl overflow-hidden border border-emerald-200 shadow-sm" style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 50%, #a7f3d0 100%)' }}>
          <div className="p-4 sm:p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-md" style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}>
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-emerald-700" style={{ fontWeight: 600 }}>My Savings</p>
              <p className="text-[28px] sm:text-[34px] text-emerald-800 tracking-tight" style={{ fontWeight: 800 }}>
                <IndianRupee className="w-6 h-6 sm:w-7 sm:h-7 inline align-baseline" />{Math.round(totalSavings).toLocaleString()}
              </p>
              <p className="text-[12px] sm:text-[13px] text-emerald-600 mt-0.5">
                Saved across <span style={{ fontWeight: 600 }}>{deliveredOrders.length}</span> delivered order{deliveredOrders.length !== 1 ? 's' : ''} • MRP vs Your Price
              </p>
            </div>
            <div className="hidden sm:flex flex-col items-center gap-1 shrink-0 px-3">
              <TrendingUp className="w-8 h-8 text-emerald-500" />
              <span className="text-[11px] text-emerald-600" style={{ fontWeight: 600 }}>Great deals!</span>
            </div>
          </div>
        </div>
      )}

      {allOrders.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h2 className="text-[20px]" style={{ fontWeight: 600 }}>No Orders Yet</h2>
          <p className="text-muted-foreground mt-2 text-[15px]">Start shopping to see your orders here</p>
          <Link to="/products" className="inline-flex items-center gap-2 mt-6 px-7 py-3 bg-primary text-white rounded-xl text-[15px] hover:shadow-lg hover:shadow-primary/25 transition-all active:scale-[0.98] group" style={{ fontWeight: 600 }}>
            Start Shopping <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {allOrders.map((order) => {
            const config = statusConfig[order.status] || statusConfig.placed;
            const Icon = config.icon;
            const stepIndex = getStepIndex(order.status);
            const cancelled = isCancelledOrRejected(order.status);

            return (
              <div key={order.id} className="bg-white border border-border/80 rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-50/50 border-b flex-wrap gap-2">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className="text-[13px] sm:text-[15px]" style={{ fontWeight: 600 }}>#{order.id.slice(0, 8)}</span>
                    <span className={`flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-[12px] ${config.bg} ${config.color}`} style={{ fontWeight: 500 }}>
                      <Icon className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5" /> {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    {order.status === 'delivered' && (orderSavingsMap.get(order.id) || 0) > 0 && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200" style={{ fontWeight: 600 }}>
                        <TrendingUp className="w-3 h-3" /> Saved ₹{Math.round(orderSavingsMap.get(order.id)!).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="flex items-center gap-1.5 text-[12px] sm:text-[13px] text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                      {order.deliveryLocationUrl ? (
                        <a href={order.deliveryLocationUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {order.deliveryAddress}
                        </a>
                      ) : (
                        <span>{order.deliveryAddress}</span>
                      )}
                    </p>
                    <p className="flex items-center gap-1.5 text-[12px] sm:text-[13px] text-muted-foreground"><Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" /> {user.phone}</p>
                    {order.deliverySlot && <p className="flex items-center gap-1.5 text-[12px] sm:text-[13px] text-muted-foreground"><Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" /> Slot: <span className="capitalize">{order.deliverySlot}</span></p>}
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 text-[12px] sm:text-[13px] text-muted-foreground">
                    <span>{order.date}</span>
                    <span className="hidden sm:inline">|</span>
                    <span className="hidden sm:inline">{order.paymentMethod}</span>
                  </div>
                </div>

                {/* Mini tracking stepper - only show for active orders */}
                {!cancelled && (
                  <div className="px-3 sm:px-4 pt-4 pb-2">
                    <div className="flex items-center justify-between">
                      {MINI_STEPS.map((step, idx) => {
                        const isCompleted = idx < stepIndex;
                        const isActive = idx === stepIndex;
                        const StepIcon = step.icon;

                        return (
                          <div key={step.id} className="flex items-center flex-1 last:flex-none">
                            <div className="flex flex-col items-center">
                              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 transition-all ${isCompleted ? 'bg-primary border-primary text-white'
                                : isActive ? 'bg-primary/10 border-primary text-primary'
                                  : 'bg-gray-50 border-gray-200 text-gray-300'
                                }`}>
                                {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <StepIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                              </div>
                              <span className={`text-[9px] sm:text-[10px] mt-1 ${isActive ? 'text-primary' : isCompleted ? 'text-gray-700' : 'text-gray-300'}`}
                                style={{ fontWeight: isActive ? 600 : 400 }}>{step.label}</span>
                            </div>
                            {idx < MINI_STEPS.length - 1 && (
                              <div className="flex-1 h-0.5 mx-1.5 sm:mx-2 mb-5 relative">
                                <div className="absolute inset-0 bg-gray-200 rounded-full" />
                                <div className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-500" style={{ width: isCompleted ? '100%' : '0%' }} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Cancelled/Rejected notice */}
                {cancelled && (
                  <div className={`mx-3 sm:mx-4 mt-3 p-3 rounded-lg ${order.status === 'cancelled' ? 'bg-red-50' : 'bg-red-50'}`}>
                    <p className="text-[13px] text-red-600" style={{ fontWeight: 500 }}>
                      {order.status === 'cancelled' ? 'This order was cancelled.' : 'This order was rejected by the admin.'}
                    </p>
                  </div>
                )}

                {/* Items */}
                <div className="px-3 sm:px-4 pb-3 pt-2">
                  {order.items.length > 0 && order.items[0].product ? (
                    <div className="space-y-2">
                      {order.items.slice(0, 2).map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <img src={item.product.image} alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover bg-gray-50" loading="lazy" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] sm:text-[13px] truncate" style={{ fontWeight: 500 }}>{item.product.name}</p>
                            <p className="text-[10px] sm:text-[11px] text-muted-foreground">Qty: {item.quantity} × Rs.{getPrice(item.product)}</p>
                          </div>
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <p className="text-[11px] sm:text-[12px] text-muted-foreground pl-13 sm:pl-15">
                          +{order.items.length - 2} more item{order.items.length - 2 > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[13px] text-muted-foreground">Order items</p>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-3 sm:p-4 border-t flex-wrap gap-2">
                  <span className="text-[16px] sm:text-[18px]" style={{ fontWeight: 700 }}>Rs.{order.total.toLocaleString()}</span>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    {(order.status === 'placed' || order.status === 'accepted') && (
                      <button onClick={() => handleCancel(order.id)}
                        className="flex items-center gap-1.5 px-3 sm:px-4 py-2 border border-red-200 text-red-500 rounded-xl hover:bg-red-50 text-[12px] sm:text-[13px] transition-all">
                        <Ban className="w-3.5 h-3.5" /> Cancel
                      </button>
                    )}
                    <button onClick={() => handleReorder(order)}
                      className="flex items-center gap-1.5 px-3 sm:px-4 py-2 border border-border/80 rounded-xl hover:bg-gray-50 text-[12px] sm:text-[13px] transition-all">
                      <RotateCcw className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Buy Again</span><span className="sm:hidden">Reorder</span>
                    </button>
                    <button onClick={() => navigate(`/orders/${order.id}`)}
                      className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-primary text-white rounded-xl text-[12px] sm:text-[13px] hover:bg-primary/90 hover:shadow-md hover:shadow-primary/25 transition-all"
                      style={{ fontWeight: 500 }}>
                      <Truck className="w-3.5 h-3.5" /> Track
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
