import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router';
import { Minus, Plus, Trash2, ShoppingCart, Tag, ArrowRight, ShoppingBag, CheckCircle2 } from 'lucide-react';
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

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const subtotal = getCartTotal();
  const deliveryFee = subtotal > FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;

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
      toast.error(`Minimum order of Rs.${found.minOrder} required`);
      return;
    }
    setAppliedCoupon(found);
    toast.success(`Coupon ${found.code} applied!`);
  };

  if (cart.length === 0) {
    return (
      <div className="py-24 text-center max-w-md mx-auto">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-[28px]" style={{ fontWeight: 800 }}>Your Cart is Empty</h2>
        <p className="text-muted-foreground mt-3 text-[16px] leading-relaxed">Looks like you haven't added anything yet. Discover our premium wholesale products today!</p>
        <Link to="/products" className="inline-flex items-center gap-2 mt-8 px-8 py-3.5 bg-gradient-to-r from-primary to-emerald-600 text-white rounded-xl text-[16px] shadow-primary/30 shadow-lg hover:shadow-primary/40 hover:-translate-y-0.5 transition-all active:scale-[0.98] group" style={{ fontWeight: 600 }}>
          Start Shopping <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    );
  }

  return (
    <div className="py-6">
      <h1 className="text-[24px] mb-6" style={{ fontWeight: 700 }}>Shopping Cart ({cart.length} items)</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Cart items */}
        <div className="flex-1 space-y-4">
          {cart.map((item, i) => {
            const price = getPrice(item.product);
            return (
              <div key={item.product.id} className="bg-white border border-border/60 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row gap-5 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 card-lift stagger-child relative overflow-hidden group" style={{ animationDelay: `${i * 0.05}s` }}>
                {/* Image Section */}
                <Link to={`/product/${item.product.id}`} className="w-full sm:w-32 h-40 sm:h-32 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden shrink-0 relative group-hover:shadow-inner">
                  <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                </Link>

                {/* Content Section */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-primary bg-primary/5 px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>{item.product.brand}</span>
                      <Link to={`/product/${item.product.id}`} className="block text-[18px] hover:text-primary mt-1.5 line-clamp-2" style={{ fontWeight: 600 }}>
                        {item.product.name}
                      </Link>
                    </div>
                    <button onClick={() => { removeFromCart(item.product.id); toast.success('Removed from cart'); }} className="p-2 text-gray-400 hover:text-white hover:bg-destructive rounded-xl transition-colors shrink-0 tooltip-trigger" data-tooltip="Remove item">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Controls & Price */}
                  <div className="mt-4 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center border-2 border-border/50 rounded-xl overflow-hidden bg-gray-50/50">
                      <button onClick={() => updateCartQty(item.product.id, item.quantity - 1)} className="p-2 hover:bg-white hover:text-primary transition-colors">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-4 text-[15px] bg-white h-full flex items-center" style={{ fontWeight: 600 }}>{item.quantity}</span>
                      <button onClick={() => updateCartQty(item.product.id, item.quantity + 1)} className="p-2 hover:bg-white hover:text-primary transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-right flex flex-col items-end">
                      <div className="flex items-center gap-2">
                        {item.product.mrp !== price && (
                          <span className="text-[13px] text-muted-foreground line-through">₹{item.product.mrp * item.quantity}</span>
                        )}
                        <span className="text-[20px] text-gradient-primary" style={{ fontWeight: 800 }}>₹{price * item.quantity}</span>
                      </div>
                      <p className="text-[12px] text-muted-foreground mt-0.5">₹{price} / each</p>
                      {item.product.mrp !== price && (
                        <p className="text-[12px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md mt-1" style={{ fontWeight: 600 }}>Saving ₹{(item.product.mrp - price) * item.quantity}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order summary */}
        <div className="lg:w-[380px] shrink-0">
          <div className="bg-white/70 backdrop-blur-xl border border-border/60 rounded-3xl p-6 sm:p-7 sticky top-32 space-y-6 shadow-premium-lg">
            <h3 className="text-[20px]" style={{ fontWeight: 700 }}>Order Summary</h3>

            {/* Coupon */}
            <div>
              <label className="text-[14px] text-muted-foreground mb-2 block" style={{ fontWeight: 500 }}>Coupon Code</label>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center border border-border/50 rounded-xl overflow-hidden bg-white focus-within:border-primary/50 transition-all">
                  <Tag className="w-4 h-4 text-muted-foreground ml-3.5" />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="flex-1 px-3 py-3 bg-transparent outline-none text-[15px] font-medium placeholder:font-normal"
                  />
                </div>
                <button onClick={applyCoupon} className="px-5 py-3 bg-gray-900 text-white hover:bg-black rounded-xl text-[14px] font-semibold transition-colors">Apply</button>
              </div>
              {appliedCoupon && (
                <div className="mt-3 bg-emerald-50 border border-emerald-100/50 rounded-lg p-3 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <p className="text-[13px] text-emerald-700" style={{ fontWeight: 500 }}>
                    {appliedCoupon.code} applied! You save ₹{couponDiscount}
                  </p>
                </div>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                {COUPONS.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => { setCouponCode(c.code); }}
                    className="text-[12px] px-3 py-1 bg-primary/5 text-primary border border-primary/20 rounded-full hover:bg-primary/10 hover:border-primary/30 transition-colors font-medium"
                  >
                    {c.code}
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-border/60" />

            <div className="space-y-3.5 text-[15px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span style={{ fontWeight: 600 }}>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className={deliveryFee === 0 ? 'text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md text-[13px]' : ''} style={{ fontWeight: 600 }}>
                  {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                </span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Coupon Discount</span>
                  <span style={{ fontWeight: 600 }}>-₹{couponDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="pt-3 border-t border-border/60">
                <div className="flex justify-between items-end">
                  <span className="text-[16px] text-muted-foreground" style={{ fontWeight: 500 }}>Total</span>
                  <span className="text-[28px] text-gray-900 leading-none" style={{ fontWeight: 800 }}>₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {user?.role === 'shopowner' && (
              <div className="bg-gradient-to-br from-primary/10 to-emerald-500/10 rounded-2xl p-4 text-[14px] border border-primary/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-primary/20 to-transparent rounded-bl-full -mr-8 -mt-8" />
                <p className="text-primary" style={{ fontWeight: 700 }}>Wholesale Savings 🎉</p>
                <p className="text-muted-foreground mt-1 leading-snug">
                  You are saving <span className="text-primary font-bold">₹{cart.reduce((s, i) => s + (i.product.mrp - i.product.shopPrice) * i.quantity, 0).toLocaleString('en-IN')}</span> today compared to Retail MRP!
                </p>
              </div>
            )}

            <button
              onClick={() => {
                if (!user) { navigate('/login'); return; }
                const params = new URLSearchParams();
                if (appliedCoupon && couponDiscount > 0) {
                  params.set('coupon', appliedCoupon.code);
                  params.set('discount', String(couponDiscount));
                }
                const qs = params.toString();
                navigate(`/checkout${qs ? `?${qs}` : ''}`);
              }}
              className="w-full py-4 bg-gradient-to-r from-primary to-emerald-600 text-white rounded-2xl hover:shadow-xl hover:shadow-primary/25 transition-all duration-300 flex items-center justify-center gap-2.5 text-[16px] active:scale-[0.98] glow-primary-hover group"
              style={{ fontWeight: 700 }}
            >
              <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" /> Checkout Now
            </button>

            <Link to="/products" className="block text-center text-muted-foreground text-[14px] hover:text-primary transition-colors pb-1" style={{ fontWeight: 500 }}>
              <ArrowRight className="w-4 h-4 inline-block -mt-0.5 mr-1" /> Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}