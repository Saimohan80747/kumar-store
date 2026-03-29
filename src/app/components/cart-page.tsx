import { useState, useMemo } from 'react';
import { Link, useNavigate, Navigate } from 'react-router';
import { 
  Minus, Plus, Trash2, ShoppingCart, Tag, ArrowRight, 
  ShoppingBag, CheckCircle2, ChevronRight, Zap, Info,
  AlertCircle, ShieldCheck, ArrowLeft, Store
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore, FREE_DELIVERY_THRESHOLD, DELIVERY_FEE } from '../store';
import { COUPONS } from '../data';
import { toast } from 'sonner';

export function CartPage() {
  const cart = useStore((s) => s.cart);
  const updateCartQty = useStore((s) => s.updateCartQty);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const getPrice = useStore((s) => s.getPrice);
  const getCartTotal = useStore((s) => s.getCartTotal);
  const user = useStore((s) => s.user);
  const navigate = useNavigate();
  
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<typeof COUPONS[0] | null>(null);

  const subtotal = useMemo(() => getCartTotal(), [cart, getPrice, getCartTotal]);
  const deliveryFee = subtotal > FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const progressToFreeDelivery = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100);
  const remainingForFree = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);

  let couponDiscount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percent') {
      couponDiscount = Math.round(subtotal * (appliedCoupon.discount / 100));
    } else {
      couponDiscount = appliedCoupon.discount;
    }
  }

  const total = subtotal + deliveryFee - couponDiscount;

  const applyCoupon = () => {
    const found = COUPONS.find((c) => c.code === couponCode.toUpperCase());
    if (!found) {
      toast.error('Invalid coupon code');
      return;
    }
    if (subtotal < found.minOrder) {
      toast.error(`Minimum order of ₹${found.minOrder} required`);
      return;
    }
    setAppliedCoupon(found);
    toast.success(`Coupon ${found.code} applied!`);
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-32 h-32 bg-slate-50 rounded-[40px] flex items-center justify-center mb-8 relative"
        >
          <div className="absolute inset-0 bg-primary/5 rounded-[40px] animate-pulse" />
          <ShoppingBag className="w-14 h-14 text-slate-300 relative z-10" />
        </motion.div>
        <h2 className="text-[32px] tracking-tight" style={{ fontWeight: 900 }}>Your Cart is Empty</h2>
        <p className="text-slate-400 mt-4 text-[16px] max-w-sm mx-auto font-medium">
          Looks like you haven't added anything yet. Explore our premium collection today!
        </p>
        <Link 
          to="/products" 
          className="mt-10 px-10 py-4 bg-slate-900 text-white rounded-[20px] text-[15px] font-black uppercase tracking-widest flex items-center gap-3 shadow-2xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95"
        >
          Start Shopping <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-col lg:flex-row gap-10">
        
        {/* Left Side: Cart Items */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-[32px] tracking-tight" style={{ fontWeight: 900 }}>
              Shopping Bag <span className="text-slate-300 ml-2 font-medium">{cart.length}</span>
            </h1>
            <Link to="/products" className="text-[13px] font-black text-primary uppercase tracking-widest flex items-center gap-2 hover:underline">
              <ArrowLeft className="w-4 h-4" /> Continue Shopping
            </Link>
          </div>

          {/* Free Delivery Progress */}
          {deliveryFee > 0 && (
            <div className="bg-primary/5 border border-primary/10 rounded-3xl p-5 mb-8">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                  <Zap className="w-4 h-4 fill-current" /> Free Delivery Goal
                </p>
                <p className="text-[13px] font-bold text-slate-600">₹{remainingForFree} more to go</p>
              </div>
              <div className="h-2 bg-white rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressToFreeDelivery}%` }}
                  className="h-full bg-primary"
                />
              </div>
            </div>
          )}

          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {cart.map((item, i) => {
                const price = getPrice(item.product);
                return (
                  <motion.div 
                    key={item.product.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                    className="group bg-white rounded-[32px] p-5 sm:p-6 border border-slate-100 flex flex-col sm:flex-row gap-6 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 relative"
                  >
                    {/* Product Image */}
                    <div className="w-full sm:w-40 h-40 bg-slate-50 rounded-[24px] overflow-hidden relative shrink-0">
                      <img 
                        src={item.product.image} 
                        alt={item.product.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-1">{item.product.brand}</p>
                            <Link to={`/product/${item.product.id}`} className="text-[20px] font-black text-slate-900 leading-tight hover:text-primary transition-colors line-clamp-1">
                              {item.product.name}
                            </Link>
                            <p className="text-[13px] font-bold text-slate-400 mt-1 capitalize">{item.product.category.replace('-', ' ')}</p>
                          </div>
                          <button 
                            onClick={() => { removeFromCart(item.product.id); toast.success('Removed from cart'); }}
                            className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>

                        {/* Price Breakdown */}
                        <div className="mt-4 flex items-center gap-3">
                          <span className="text-[24px] font-black text-slate-900">₹{(price * item.quantity).toLocaleString('en-IN')}</span>
                          {item.product.mrp > price && (
                            <span className="text-[16px] font-bold text-slate-300 line-through">₹{(item.product.mrp * item.quantity).toLocaleString('en-IN')}</span>
                          )}
                          {item.product.mrp > price && (
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[11px] font-black uppercase tracking-tight">
                              Save ₹{((item.product.mrp - price) * item.quantity).toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="mt-6 flex items-center justify-between">
                        <div className="flex items-center bg-slate-50 p-1 rounded-2xl border border-slate-100">
                          <button 
                            onClick={() => updateCartQty(item.product.id, item.quantity - 1)}
                            className="w-10 h-10 rounded-xl hover:bg-white hover:shadow-sm flex items-center justify-center text-slate-400 hover:text-primary transition-all active:scale-90"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-12 text-center text-[15px] font-black text-slate-900">{item.quantity}</span>
                          <button 
                            onClick={() => updateCartQty(item.product.id, item.quantity + 1)}
                            className="w-10 h-10 rounded-xl hover:bg-white hover:shadow-sm flex items-center justify-center text-slate-400 hover:text-primary transition-all active:scale-90"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-[12px] font-bold text-slate-400">Unit Price: ₹{price.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Side: Order Summary */}
        <div className="lg:w-[400px]">
          <div className="sticky top-32 space-y-6">
            
            {/* Summary Card */}
            <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl -mr-10 -mt-10" />
              
              <h3 className="text-[20px] font-black tracking-tight mb-8">Order Summary</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-white/60">
                  <span className="text-[14px] font-bold">Subtotal</span>
                  <span className="text-[16px] font-black text-white">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                
                <div className="flex justify-between items-center text-white/60">
                  <span className="text-[14px] font-bold">Delivery</span>
                  <span className={`text-[14px] font-black ${deliveryFee === 0 ? 'text-emerald-400' : 'text-white'}`}>
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                  </span>
                </div>

                {couponDiscount > 0 && (
                  <div className="flex justify-between items-center text-primary">
                    <span className="text-[14px] font-bold">Coupon Savings</span>
                    <span className="text-[16px] font-black">-₹{couponDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="pt-6 border-t border-white/10 mt-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[12px] font-black text-white/40 uppercase tracking-widest mb-1">Total Amount</p>
                      <p className="text-[36px] font-black tracking-tighter leading-none">₹{total.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shop Owner Savings Badge */}
              {user?.role === 'shopowner' && (
                <div className="mt-8 p-5 bg-white/5 border border-white/10 rounded-3xl relative group overflow-hidden">
                  <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10">
                    <p className="text-[12px] font-black text-primary uppercase tracking-widest mb-1">Wholesale Power</p>
                    <p className="text-[14px] font-bold text-white/90 leading-tight">
                      You're saving <span className="text-primary">₹{cart.reduce((s, i) => s + (i.product.mrp - i.product.shopPrice) * i.quantity, 0).toLocaleString('en-IN')}</span> vs Retail!
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  const params = new URLSearchParams();
                  if (appliedCoupon && couponDiscount > 0) {
                    params.set('coupon', appliedCoupon.code);
                    params.set('discount', String(couponDiscount));
                  }
                  navigate(`/checkout${params.toString() ? `?${params.toString()}` : ''}`);
                }}
                className="w-full mt-8 py-5 bg-primary text-white rounded-[24px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95 group"
              >
                Proceed to Checkout <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Coupon Card */}
            <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Tag className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-[16px] font-black tracking-tight">Apply Coupon</h4>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Extra Savings</p>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter Code"
                  className="flex-1 px-5 py-3.5 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-[14px]"
                />
                <button 
                  onClick={applyCoupon}
                  className="px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-[12px] uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95"
                >
                  Apply
                </button>
              </div>

              <div className="mt-6 space-y-3">
                <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">Available Offers</p>
                <div className="flex flex-wrap gap-2">
                  {COUPONS.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => setCouponCode(c.code)}
                      className={`px-4 py-2 rounded-xl text-[12px] font-black border transition-all ${
                        couponCode === c.code 
                          ? 'bg-primary border-primary text-white' 
                          : 'bg-white border-slate-100 text-slate-600 hover:border-primary/50'
                      }`}
                    >
                      {c.code}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="px-4 flex items-center justify-center gap-6 opacity-40 grayscale">
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck className="w-6 h-6" />
                <span className="text-[10px] font-black uppercase tracking-widest">Secure</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Store className="w-6 h-6" />
                <span className="text-[10px] font-black uppercase tracking-widest">Genuine</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Zap className="w-6 h-6" />
                <span className="text-[10px] font-black uppercase tracking-widest">Fast</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
