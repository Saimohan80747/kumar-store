import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  Package,
  Truck,
  MapPin,
  Home,
  PartyPopper,
  Copy,
  ShoppingBag,
  ArrowRight,
  Clock,
  Phone,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Order } from '../store';
import { useStore } from '../store';

interface OrderConfirmationProps {
  order: Order;
  deliveryAddress: string;
  deliverySlot: string;
}

const TRACKING_STEPS = [
  {
    id: 'confirmed',
    label: 'Order Confirmed',
    desc: 'Your order has been placed successfully',
    icon: CheckCircle2,
    delay: 0,
  },
  {
    id: 'packed',
    label: 'Packed',
    desc: 'Your items are being packed',
    icon: Package,
    delay: 3000,
  },
  {
    id: 'shipped',
    label: 'Shipped',
    desc: 'Your order is on the way',
    icon: Truck,
    delay: 7000,
  },
  {
    id: 'out_for_delivery',
    label: 'Out for Delivery',
    desc: 'Order is nearby, arriving soon',
    icon: MapPin,
    delay: 12000,
  },
  {
    id: 'delivered',
    label: 'Delivered',
    desc: 'Order delivered successfully!',
    icon: Home,
    delay: 18000,
  },
];

export function OrderConfirmation({ order, deliveryAddress, deliverySlot }: OrderConfirmationProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [showConfetti, setShowConfetti] = useState(true);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const getPrice = useStore((s) => s.getPrice);

  useEffect(() => {
    // Auto-advance steps with delays
    TRACKING_STEPS.forEach((step, index) => {
      if (index === 0) return; // first step is already active
      const timer = setTimeout(() => {
        setCurrentStep(index);
        if (index === TRACKING_STEPS.length - 1) {
          toast.success('🎉 Your order has been delivered!');
        }
      }, step.delay);
      timersRef.current.push(timer);
    });

    // Hide confetti after a bit
    const confettiTimer = setTimeout(() => setShowConfetti(false), 4000);
    timersRef.current.push(confettiTimer);

    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  const deliverySlotLabel =
    deliverySlot === 'morning'
      ? '8 AM - 12 PM'
      : deliverySlot === 'afternoon'
        ? '12 PM - 5 PM'
        : '5 PM - 9 PM';

  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + 3);
  const estDateStr = estimatedDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const copyOrderId = () => {
    navigator.clipboard.writeText(order.id);
    toast.success('Order ID copied!');
  };

  const paymentLabel =
    order.paymentMethod === 'upi'
      ? 'UPI Payment'
      : order.paymentMethod === 'card'
        ? 'Credit/Debit Card'
        : order.paymentMethod === 'credit'
          ? 'Credit Account'
          : 'Cash on Delivery';

  return (
    <div className="py-6 max-w-3xl mx-auto px-4 relative">
      {/* Confetti overlay */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="fixed inset-0 pointer-events-none z-50 flex items-start justify-center overflow-hidden"
          >
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  y: -20,
                  x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 800) - 400,
                  rotate: 0,
                  opacity: 1,
                }}
                animate={{
                  y: typeof window !== 'undefined' ? window.innerHeight + 50 : 900,
                  rotate: Math.random() * 720 - 360,
                  opacity: 0,
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  delay: Math.random() * 0.8,
                  ease: 'easeOut',
                }}
                className="absolute w-3 h-3 rounded-sm"
                style={{
                  backgroundColor: ['#16a34a', '#22c55e', '#fbbf24', '#f97316', '#ef4444', '#8b5cf6', '#3b82f6'][
                    i % 7
                  ],
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success header */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        className="text-center mb-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <PartyPopper className="w-10 h-10 text-primary" />
        </motion.div>
        <h1 className="text-[28px] text-gray-900" style={{ fontWeight: 800 }}>
          Order Placed Successfully!
        </h1>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="text-[15px] text-muted-foreground">Order ID:</span>
          <span className="text-[15px] text-primary" style={{ fontWeight: 600 }}>
            {order.id}
          </span>
          <button onClick={copyOrderId} className="p-1 hover:bg-gray-100 rounded transition-colors">
            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </motion.div>

      {/* Order Tracking Timeline */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white border rounded-2xl p-6 mb-5"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[17px]" style={{ fontWeight: 700 }}>
            Live Order Tracking
          </h2>
          <div className="flex items-center gap-1.5 text-[13px] text-primary bg-primary/5 px-3 py-1.5 rounded-full">
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-2 h-2 bg-primary rounded-full"
            />
            <span style={{ fontWeight: 500 }}>
              {currentStep < TRACKING_STEPS.length - 1 ? 'In Progress' : 'Completed'}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative mb-8">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-green-400 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${(currentStep / (TRACKING_STEPS.length - 1)) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[11px] text-muted-foreground">0%</span>
            <span className="text-[11px] text-muted-foreground">
              {Math.round((currentStep / (TRACKING_STEPS.length - 1)) * 100)}%
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

            return (
              <div key={step.id} className="flex gap-4">
                {/* Vertical line + circle */}
                <div className="flex flex-col items-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{
                      scale: isCompleted || isActive ? 1 : 0.8,
                    }}
                    transition={{ type: 'spring', delay: isActive ? 0.3 : 0 }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 border-2 transition-all duration-500 ${isCompleted
                        ? 'bg-primary border-primary text-white'
                        : isActive
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-gray-50 border-gray-200 text-gray-300'
                      }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
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

                {/* Content */}
                <div className={`pb-8 ${index === TRACKING_STEPS.length - 1 ? 'pb-0' : ''}`}>
                  <motion.div
                    initial={{ x: -10, opacity: 0 }}
                    animate={{
                      x: 0,
                      opacity: isPending ? 0.4 : 1,
                    }}
                    transition={{ delay: isActive ? 0.4 : 0.1 }}
                  >
                    <p
                      className={`text-[15px] ${isActive ? 'text-primary' : isCompleted ? 'text-gray-900' : 'text-gray-400'}`}
                      style={{ fontWeight: isActive ? 700 : isCompleted ? 600 : 400 }}
                    >
                      {step.label}
                    </p>
                    <p className="text-[13px] text-muted-foreground mt-0.5">{step.desc}</p>
                    {(isActive || isCompleted) && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1"
                      >
                        <Clock className="w-3 h-3" />
                        {isCompleted
                          ? 'Completed'
                          : index === TRACKING_STEPS.length - 1
                            ? `Est. ${estDateStr}`
                            : 'Processing...'}
                      </motion.p>
                    )}
                  </motion.div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Delivery & Payment info side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        {/* Delivery Info */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white border rounded-2xl p-5"
        >
          <h3 className="text-[15px] flex items-center gap-2 mb-3" style={{ fontWeight: 600 }}>
            <MapPin className="w-4 h-4 text-primary" /> Delivery Details
          </h3>
          <div className="space-y-3 text-[13px]">
            <div>
              <p className="text-muted-foreground mb-0.5">Address</p>
              {order.deliveryLocationUrl ? (
                <a href={order.deliveryLocationUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1" style={{ fontWeight: 500 }}>
                  {deliveryAddress} <MapPin className="w-3 h-3" />
                </a>
              ) : (
                <p style={{ fontWeight: 500 }}>{deliveryAddress}</p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5">Delivery Slot</p>
              <p style={{ fontWeight: 500 }}>
                {deliverySlot.charAt(0).toUpperCase() + deliverySlot.slice(1)} ({deliverySlotLabel})
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5">Estimated Delivery</p>
              <p className="text-primary" style={{ fontWeight: 600 }}>
                {estDateStr}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Payment Info */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-white border rounded-2xl p-5"
        >
          <h3 className="text-[15px] flex items-center gap-2 mb-3" style={{ fontWeight: 600 }}>
            <CheckCircle2 className="w-4 h-4 text-primary" /> Payment Summary
          </h3>
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Method</span>
              <span style={{ fontWeight: 500 }}>{paymentLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Items Total</span>
              <span>Rs.{(order.total - (order.deliveryFee || 0)).toLocaleString()}</span>
            </div>
            {order.couponDiscount && order.couponDiscount > 0 && (
              <div className="flex justify-between text-primary">
                <span>Coupon ({order.couponCode})</span>
                <span>-Rs.{order.couponDiscount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery</span>
              <span className="text-primary" style={{ fontWeight: 500 }}>
                {(order.deliveryFee || 0) === 0 ? 'FREE' : `Rs.${order.deliveryFee}`}
              </span>
            </div>
            <hr className="my-1" />
            <div className="flex justify-between text-[16px]">
              <span style={{ fontWeight: 700 }}>Total Paid</span>
              <span className="text-primary" style={{ fontWeight: 700 }}>
                Rs.{order.total.toLocaleString()}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Order Items */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="bg-white border rounded-2xl p-5 mb-5"
      >
        <h3 className="text-[15px] flex items-center gap-2 mb-4" style={{ fontWeight: 600 }}>
          <ShoppingBag className="w-4 h-4 text-primary" /> Order Items ({order.items.length}{' '}
          {order.items.length === 1 ? 'item' : 'items'})
        </h3>
        <div className="divide-y">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <img
                src={item.product.image}
                alt={item.product.name}
                className="w-16 h-16 rounded-xl object-cover bg-gray-50"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[14px] truncate" style={{ fontWeight: 500 }}>
                  {item.product.name}
                </p>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  {item.product.brand} · Qty: {item.quantity}
                </p>
              </div>
              <span className="text-[14px] shrink-0" style={{ fontWeight: 600 }}>
                Rs.{(getPrice(item.product) * item.quantity).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Help & Support */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="bg-gradient-to-r from-primary/5 to-green-50 border border-primary/10 rounded-2xl p-5 mb-5"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg shrink-0">
            <Phone className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[14px]" style={{ fontWeight: 600 }}>
              Need Help?
            </p>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Call us at <span style={{ fontWeight: 600 }}>1800-123-4567</span> (Toll Free) or email{' '}
              <span style={{ fontWeight: 600 }}>support@kumarstore.com</span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <button
          onClick={() => navigate('/orders')}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors text-[15px]"
          style={{ fontWeight: 600 }}
        >
          View My Orders
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => navigate('/')}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-[15px]"
          style={{ fontWeight: 600 }}
        >
          <ShoppingBag className="w-4 h-4" />
          Continue Shopping
        </button>
      </motion.div>

      {/* Rate prompt (appears after delivered) */}
      <AnimatePresence>
        {currentStep === TRACKING_STEPS.length - 1 && (
          <motion.div
            initial={{ y: 30, opacity: 0, height: 0 }}
            animate={{ y: 0, opacity: 1, height: 'auto' }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.5, type: 'spring' }}
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
            <p className="text-[14px]" style={{ fontWeight: 600 }}>
              How was your experience?
            </p>
            <p className="text-[12px] text-muted-foreground mt-1">
              Rate your delivery experience to help us improve
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
