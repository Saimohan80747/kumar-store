import { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  Package,
  Truck,
  MapPin,
  Home,
  ArrowLeft,
  Copy,
  Phone,
  Clock,
  RotateCcw,
  Download,
  Star,
  ShoppingBag,
} from 'lucide-react';
import { useStore } from '../store';
import { products } from '../data';
import { toast } from 'sonner';

const TRACKING_STEPS = [
  { id: 'pending', label: 'Order Placed', desc: 'Your order has been received', icon: ShoppingBag },
  { id: 'confirmed', label: 'Order Confirmed', desc: 'Seller has confirmed your order', icon: CheckCircle2 },
  { id: 'packed', label: 'Packed', desc: 'Your items have been packed', icon: Package },
  { id: 'shipped', label: 'Shipped', desc: 'Your order is on the way', icon: Truck },
  { id: 'out_for_delivery', label: 'Out for Delivery', desc: 'Order is nearby, arriving soon', icon: MapPin },
  { id: 'delivered', label: 'Delivered', desc: 'Order delivered successfully!', icon: Home },
];

function getStepIndex(status: string): number {
  switch (status) {
    case 'pending': return 0;
    case 'confirmed': return 1;
    case 'shipped': return 3;
    case 'delivered': return 5;
    default: return 0;
  }
}

export function OrderTrackingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const orders = useStore((s) => s.orders);
  const user = useStore((s) => s.user);
  const addToCart = useStore((s) => s.addToCart);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const order = orders.find((o) => o.id === id);

  if (!order) {
    return (
      <div className="py-20 text-center max-w-md mx-auto">
        <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-[20px]" style={{ fontWeight: 600 }}>Order Not Found</h2>
        <p className="text-muted-foreground mt-2 text-[15px]">
          The order ID <span className="font-mono text-primary">{id}</span> doesn't exist.
        </p>
        <button
          onClick={() => navigate('/orders')}
          className="mt-6 px-6 py-3 bg-primary text-white rounded-xl text-[15px]"
          style={{ fontWeight: 600 }}
        >
          Back to Orders
        </button>
      </div>
    );
  }

  const currentStep = getStepIndex(order.status);

  const estimatedDate = new Date(order.date);
  estimatedDate.setDate(estimatedDate.getDate() + 5);
  const estDateStr = estimatedDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const orderDate = new Date(order.date).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const paymentLabel =
    order.paymentMethod === 'upi' || order.paymentMethod === 'UPI'
      ? 'UPI Payment'
      : order.paymentMethod === 'card'
        ? 'Credit/Debit Card'
        : order.paymentMethod === 'credit' || order.paymentMethod === 'Credit'
          ? 'Credit Account'
          : order.paymentMethod === 'cod'
            ? 'Cash on Delivery'
            : order.paymentMethod;

  const copyOrderId = () => {
    navigator.clipboard.writeText(order.id);
    toast.success('Order ID copied!');
  };

  const handleReorder = () => {
    order.items.forEach((item) => {
      if (item.product) addToCart(item.product, item.quantity);
    });
    toast.success('Items added to cart!');
  };

  const statusColor =
    order.status === 'delivered'
      ? 'text-green-600 bg-green-50'
      : order.status === 'shipped'
        ? 'text-purple-600 bg-purple-50'
        : order.status === 'confirmed'
          ? 'text-blue-600 bg-blue-50'
          : 'text-amber-600 bg-amber-50';

  return (
    <div className="py-6 max-w-3xl mx-auto px-4">
      {/* Back button */}
      <button
        onClick={() => navigate('/orders')}
        className="flex items-center gap-2 text-[14px] text-muted-foreground hover:text-gray-900 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to My Orders
      </button>

      {/* Order header */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white border rounded-2xl p-6 mb-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[22px]" style={{ fontWeight: 700 }}>{order.id}</h1>
              <button onClick={copyOrderId} className="p-1 hover:bg-gray-100 rounded transition-colors">
                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
            <p className="text-[13px] text-muted-foreground mt-1">Placed on {orderDate}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] ${statusColor}`} style={{ fontWeight: 600 }}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[13px]">
          <div>
            <p className="text-muted-foreground mb-0.5">Total Amount</p>
            <p className="text-[16px] text-primary" style={{ fontWeight: 700 }}>Rs.{order.total.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-0.5">Payment</p>
            <p style={{ fontWeight: 500 }}>{paymentLabel}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-0.5">Items</p>
            <p style={{ fontWeight: 500 }}>{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-0.5">Est. Delivery</p>
            <p style={{ fontWeight: 500 }}>{order.status === 'delivered' ? 'Delivered' : estDateStr.split(',').slice(0, 2).join(',')}</p>
          </div>
        </div>
      </motion.div>

      {/* Tracking timeline */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white border rounded-2xl p-6 mb-5"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[17px]" style={{ fontWeight: 700 }}>Order Tracking</h2>
          <div className={`flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full ${
            order.status === 'delivered' ? 'bg-green-50 text-green-600' : 'bg-primary/5 text-primary'
          }`}>
            {order.status !== 'delivered' && (
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-2 h-2 bg-primary rounded-full"
              />
            )}
            <span style={{ fontWeight: 500 }}>
              {order.status === 'delivered' ? 'Completed' : 'In Progress'}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-green-400 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${(currentStep / (TRACKING_STEPS.length - 1)) * 100}%` }}
              transition={{ duration: 1, ease: 'easeInOut' }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[11px] text-muted-foreground">Ordered</span>
            <span className="text-[11px] text-muted-foreground">
              {Math.round((currentStep / (TRACKING_STEPS.length - 1)) * 100)}% complete
            </span>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-0">
          {TRACKING_STEPS.map((step, index) => {
            const isCompleted = index < currentStep;
            const isActive = index === currentStep;
            const isPending = index > currentStep;
            const Icon = step.icon;

            // Generate a timestamp for completed steps
            const stepDate = new Date(order.date);
            stepDate.setHours(stepDate.getHours() + index * 12);
            const timeStr = stepDate.toLocaleString('en-IN', {
              day: 'numeric',
              month: 'short',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            });

            return (
              <div key={step.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: isCompleted || isActive ? 1 : 0.8 }}
                    transition={{ type: 'spring' }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 border-2 transition-all duration-500 ${
                      isCompleted
                        ? 'bg-primary border-primary text-white'
                        : isActive
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-gray-50 border-gray-200 text-gray-300'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </motion.div>
                  {index < TRACKING_STEPS.length - 1 && (
                    <div className="relative w-0.5 h-12 bg-gray-200">
                      <motion.div
                        className="absolute top-0 left-0 w-full bg-primary"
                        initial={{ height: '0%' }}
                        animate={{ height: isCompleted ? '100%' : '0%' }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      />
                    </div>
                  )}
                </div>

                <div className={`pb-8 ${index === TRACKING_STEPS.length - 1 ? 'pb-0' : ''}`}>
                  <motion.div
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: isPending ? 0.4 : 1 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <p
                      className={`text-[15px] ${
                        isActive ? 'text-primary' : isCompleted ? 'text-gray-900' : 'text-gray-400'
                      }`}
                      style={{ fontWeight: isActive ? 700 : isCompleted ? 600 : 400 }}
                    >
                      {step.label}
                    </p>
                    <p className="text-[13px] text-muted-foreground mt-0.5">{step.desc}</p>
                    {(isActive || isCompleted) && (
                      <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {isCompleted ? timeStr : order.status === 'delivered' ? timeStr : 'In progress...'}
                      </p>
                    )}
                  </motion.div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Order Items */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white border rounded-2xl p-5 mb-5"
      >
        <h3 className="text-[15px] flex items-center gap-2 mb-4" style={{ fontWeight: 600 }}>
          <ShoppingBag className="w-4 h-4 text-primary" /> Order Items
        </h3>
        {order.items.length > 0 && order.items[0]?.product ? (
          <div className="divide-y">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-16 h-16 rounded-xl object-cover bg-gray-50"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] truncate" style={{ fontWeight: 500 }}>{item.product.name}</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    {item.product.brand} · Qty: {item.quantity}
                  </p>
                </div>
                <span className="text-[14px] shrink-0" style={{ fontWeight: 600 }}>
                  Rs.{(item.product.mrp * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[14px] text-muted-foreground py-4 text-center">Order item details not available for older orders</p>
        )}
      </motion.div>

      {/* Help & Actions */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-primary/5 to-green-50 border border-primary/10 rounded-2xl p-5 mb-5"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg shrink-0">
            <Phone className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[14px]" style={{ fontWeight: 600 }}>Need Help with this order?</p>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Call us at <span style={{ fontWeight: 600 }}>1800-123-4567</span> (Toll Free) or email{' '}
              <span style={{ fontWeight: 600 }}>support@kumarstore.com</span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <button
          onClick={handleReorder}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors text-[15px]"
          style={{ fontWeight: 600 }}
        >
          <RotateCcw className="w-4 h-4" /> Buy Again
        </button>
        <button
          onClick={() => toast.success('Invoice downloaded!')}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-[15px]"
          style={{ fontWeight: 600 }}
        >
          <Download className="w-4 h-4" /> Download Invoice
        </button>
      </motion.div>

      {/* Rating (only for delivered) */}
      {order.status === 'delivered' && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-5 bg-white border rounded-2xl p-5 text-center"
        >
          <div className="flex justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => toast.success('Thank you for your feedback!')}
                className="p-1 hover:scale-125 transition-transform"
              >
                <Star className="w-7 h-7 text-amber-400 fill-amber-400" />
              </button>
            ))}
          </div>
          <p className="text-[14px]" style={{ fontWeight: 600 }}>How was your experience?</p>
          <p className="text-[12px] text-muted-foreground mt-1">Rate this order to help us improve</p>
        </motion.div>
      )}
    </div>
  );
}
