import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  Minus,
  PackagePlus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Tag,
  Trash2,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import { COUPONS } from '../data';
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD, useStore } from '../store';

type Coupon = (typeof COUPONS)[number];

function getStepQty(minWholesaleQty: number, role?: string) {
  return role === 'shopowner' ? Math.max(1, minWholesaleQty || 1) : 1;
}

export function CartPage() {
  const cart = useStore((s) => s.cart);
  const updateCartQty = useStore((s) => s.updateCartQty);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const addToCart = useStore((s) => s.addToCart);
  const getPrice = useStore((s) => s.getPrice);
  const getCartTotal = useStore((s) => s.getCartTotal);
  const products = useStore((s) => s.products);
  const user = useStore((s) => s.user);
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  const subtotal = useMemo(() => getCartTotal(), [cart, getCartTotal]);
  const deliveryFee = subtotal > FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const totalBeforeCoupon = subtotal + deliveryFee;
  const progressToFreeDelivery = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100);
  const remainingForFree = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const totalSavings = useMemo(
    () => cart.reduce((sum, item) => sum + Math.max(0, item.product.mrp - getPrice(item.product)) * item.quantity, 0),
    [cart, getPrice]
  );
  const wholesaleMargin = useMemo(
    () => user?.role === 'shopowner'
      ? cart.reduce((sum, item) => sum + Math.max(0, item.product.customerPrice - item.product.shopPrice) * item.quantity, 0)
      : 0,
    [cart, user?.role]
  );

  const couponValue = (coupon: Coupon, amount: number) =>
    coupon.type === 'percent' ? Math.round(amount * (coupon.discount / 100)) : coupon.discount;

  const bestCoupon = useMemo(() => {
    return COUPONS
      .filter((coupon) => subtotal >= coupon.minOrder)
      .map((coupon) => ({ coupon, savings: couponValue(coupon, subtotal) }))
      .sort((a, b) => b.savings - a.savings)[0] ?? null;
  }, [subtotal]);

  const nudgeProducts = useMemo(() => {
    if (remainingForFree <= 0) return [];

    const cartIds = new Set(cart.map((item) => item.product.id));

    return products
      .filter((product) => product.stock > 0 && !cartIds.has(product.id))
      .sort((a, b) => Math.abs(getPrice(a) - remainingForFree) - Math.abs(getPrice(b) - remainingForFree))
      .slice(0, 2);
  }, [cart, getPrice, products, remainingForFree]);

  const couponDiscount = appliedCoupon ? couponValue(appliedCoupon, subtotal) : 0;
  const total = totalBeforeCoupon - couponDiscount;
  const freeDeliveryUnlocked = deliveryFee === 0;

  const applyCoupon = (nextCode = couponCode) => {
    const found = COUPONS.find((coupon) => coupon.code === nextCode.trim().toUpperCase());
    if (!found) {
      toast.error('Invalid coupon code');
      return;
    }
    if (subtotal < found.minOrder) {
      toast.error(`Minimum order of Rs.${found.minOrder} required`);
      return;
    }
    setCouponCode(found.code);
    setAppliedCoupon(found);
    toast.success(`Coupon ${found.code} applied`);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.success('Coupon removed');
  };

  const applySuggestedCoupon = () => {
    if (!bestCoupon) return;
    setCouponCode(bestCoupon.coupon.code);
    setAppliedCoupon(bestCoupon.coupon);
    toast.success(`Best offer ${bestCoupon.coupon.code} applied`);
  };

  const handleCheckout = () => {
    const params = new URLSearchParams();
    if (appliedCoupon && couponDiscount > 0) {
      params.set('coupon', appliedCoupon.code);
      params.set('discount', String(couponDiscount));
    }
    navigate(`/checkout${params.toString() ? `?${params.toString()}` : ''}`);
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
          className="relative mb-8 flex h-32 w-32 items-center justify-center rounded-[40px] bg-slate-50"
        >
          <div className="absolute inset-0 animate-pulse rounded-[40px] bg-primary/5" />
          <ShoppingBag className="relative z-10 h-14 w-14 text-slate-300" />
        </motion.div>
        <h2 className="text-[32px] tracking-tight" style={{ fontWeight: 900 }}>Your Cart is Empty</h2>
        <p className="mt-4 max-w-sm text-[16px] font-medium text-slate-400">
          Looks like you have not added anything yet. Explore the catalog and build a stronger order.
        </p>
        <Link
          to="/products"
          className="mt-10 flex items-center gap-3 rounded-[20px] bg-slate-900 px-10 py-4 text-[15px] font-black uppercase tracking-widest text-white shadow-2xl shadow-slate-900/20 transition-all hover:bg-slate-800 active:scale-95"
        >
          Start Shopping <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-10 lg:flex-row">
        <div className="flex-1">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-[32px] tracking-tight" style={{ fontWeight: 900 }}>
              Shopping Bag <span className="ml-2 font-medium text-slate-300">{cart.length}</span>
            </h1>
            <Link to="/products" className="flex items-center gap-2 text-[13px] font-black uppercase tracking-widest text-primary hover:underline">
              <ArrowLeft className="h-4 w-4" /> Continue Shopping
            </Link>
          </div>

          <div className={`mb-8 overflow-hidden rounded-[32px] border p-6 ${freeDeliveryUnlocked ? 'border-emerald-100 bg-emerald-50/80' : 'border-primary/10 bg-primary/5'}`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className={`flex items-center gap-2 text-[13px] font-black uppercase tracking-widest ${freeDeliveryUnlocked ? 'text-emerald-700' : 'text-primary'}`}>
                  {freeDeliveryUnlocked ? <CheckCircle2 className="h-4 w-4" /> : <Zap className="h-4 w-4 fill-current" />}
                  {freeDeliveryUnlocked ? 'Free Delivery Unlocked' : 'Free Delivery Goal'}
                </p>
                <p className="mt-2 text-[18px] font-black tracking-tight text-slate-900">
                  {freeDeliveryUnlocked ? 'Your order now ships free.' : `Add Rs.${remainingForFree.toLocaleString('en-IN')} more to remove delivery charges.`}
                </p>
                <p className="mt-1 text-[13px] font-medium text-slate-500">
                  {freeDeliveryUnlocked ? 'Coupon savings will stack on top of this win.' : `Current delivery charge: Rs.${DELIVERY_FEE}`}
                </p>
              </div>
              <div className="min-w-[140px] rounded-[24px] bg-white/80 px-5 py-4 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Order Progress</p>
                <p className="mt-1 text-[28px] font-black tracking-tighter text-slate-900">{Math.round(progressToFreeDelivery)}%</p>
              </div>
            </div>

            <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressToFreeDelivery}%` }}
                className={`h-full ${freeDeliveryUnlocked ? 'bg-emerald-500' : 'bg-primary'}`}
              />
            </div>

            {!freeDeliveryUnlocked && nudgeProducts.length > 0 && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {nudgeProducts.map((product) => {
                  const stepQty = getStepQty(product.minWholesaleQty, user.role);
                  const unitPrice = getPrice(product);
                  return (
                    <button
                      key={product.id}
                      onClick={() => {
                        addToCart(product, stepQty);
                        toast.success(`${product.name} added to help unlock free delivery`);
                      }}
                      className="flex items-center gap-4 rounded-[24px] border border-white/80 bg-white/80 p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[20px] bg-slate-50">
                        <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-[14px] font-black tracking-tight text-slate-900">{product.name}</p>
                        <p className="mt-1 text-[12px] font-bold text-slate-400">
                          Start with {stepQty} x {product.unitType} • Rs.{unitPrice.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <PackagePlus className="h-5 w-5 text-primary" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {cart.map((item, index) => {
                const price = getPrice(item.product);
                const stepQty = getStepQty(item.product.minWholesaleQty, user.role);
                const retailSavings = Math.max(0, item.product.mrp - price) * item.quantity;
                const businessMargin = Math.max(0, item.product.customerPrice - item.product.shopPrice) * item.quantity;

                return (
                  <motion.div
                    key={item.product.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative flex flex-col gap-6 rounded-[32px] border border-slate-100 bg-white p-5 transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/50 sm:flex-row sm:p-6"
                  >
                    <div className="h-40 w-full shrink-0 overflow-hidden rounded-[24px] bg-slate-50 sm:w-40">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    </div>

                    <div className="flex flex-1 flex-col justify-between py-1">
                      <div>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="mb-1 text-[11px] font-black uppercase tracking-[0.2em] text-primary">{item.product.brand}</p>
                            <Link to={`/product/${item.product.id}`} className="line-clamp-1 text-[20px] font-black leading-tight text-slate-900 transition-colors hover:text-primary">
                              {item.product.name}
                            </Link>
                            <p className="mt-1 text-[13px] font-bold capitalize text-slate-400">{item.product.category.replace('-', ' ')}</p>
                          </div>
                          <button
                            onClick={() => {
                              removeFromCart(item.product.id);
                              toast.success('Removed from cart');
                            }}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-all hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <span className="text-[24px] font-black text-slate-900">Rs.{(price * item.quantity).toLocaleString('en-IN')}</span>
                          {item.product.mrp > price && (
                            <span className="text-[16px] font-bold text-slate-300 line-through">Rs.{(item.product.mrp * item.quantity).toLocaleString('en-IN')}</span>
                          )}
                          {retailSavings > 0 && (
                            <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-tight text-emerald-600">
                              Save Rs.{retailSavings.toLocaleString('en-IN')}
                            </span>
                          )}
                          {user.role === 'shopowner' && businessMargin > 0 && (
                            <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-tight text-amber-600">
                              Margin Rs.{businessMargin.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div>
                          <div className="flex items-center rounded-2xl border border-slate-100 bg-slate-50 p-1">
                            <button
                              onClick={() => updateCartQty(item.product.id, item.quantity - stepQty)}
                              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-white hover:text-primary hover:shadow-sm active:scale-90"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-16 text-center text-[15px] font-black text-slate-900">{item.quantity}</span>
                            <button
                              onClick={() => updateCartQty(item.product.id, item.quantity + stepQty)}
                              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-white hover:text-primary hover:shadow-sm active:scale-90"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-3 text-[12px] font-bold text-slate-400">
                            <span>Unit price: Rs.{price.toLocaleString('en-IN')}</span>
                            <span>Stock: {item.product.stock}</span>
                            {user.role === 'shopowner' && (
                              <span>Wholesale step: {stepQty} x {item.product.unitType}</span>
                            )}
                          </div>
                        </div>

                        {user.role === 'shopowner' && (
                          <div className="rounded-[20px] bg-slate-50 px-4 py-3">
                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Business Snapshot</p>
                            <p className="mt-1 text-[14px] font-black text-slate-900">
                              Sell-through margin: Rs.{businessMargin.toLocaleString('en-IN')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        <div className="lg:w-[400px]">
          <div className="sticky top-32 space-y-6">
            <div className="relative overflow-hidden rounded-[40px] bg-slate-900 p-8 text-white shadow-2xl shadow-slate-900/20">
              <div className="absolute right-0 top-0 -mr-10 -mt-10 h-32 w-32 bg-primary/20 blur-3xl" />

              <h3 className="mb-8 text-[20px] font-black tracking-tight">Order Summary</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-white/60">
                  <span className="text-[14px] font-bold">Subtotal</span>
                  <span className="text-[16px] font-black text-white">Rs.{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-white/60">
                  <span className="text-[14px] font-bold">Product savings</span>
                  <span className="text-[16px] font-black text-emerald-400">Rs.{totalSavings.toLocaleString('en-IN')}</span>
                </div>
                {user.role === 'shopowner' && wholesaleMargin > 0 && (
                  <div className="flex items-center justify-between text-white/60">
                    <span className="text-[14px] font-bold">Business margin</span>
                    <span className="text-[16px] font-black text-amber-400">Rs.{wholesaleMargin.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-white/60">
                  <span className="text-[14px] font-bold">Delivery</span>
                  <span className={`text-[14px] font-black ${deliveryFee === 0 ? 'text-emerald-400' : 'text-white'}`}>
                    {deliveryFee === 0 ? 'FREE' : `Rs.${deliveryFee}`}
                  </span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex items-center justify-between text-primary">
                    <span className="text-[14px] font-bold">Coupon savings</span>
                    <span className="text-[16px] font-black">-Rs.{couponDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="mt-6 border-t border-white/10 pt-6">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="mb-1 text-[12px] font-black uppercase tracking-widest text-white/40">Total Amount</p>
                      <p className="text-[36px] font-black leading-none tracking-tighter">Rs.{total.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {user.role === 'shopowner' && wholesaleMargin > 0 && (
                <div className="relative mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="absolute inset-0 bg-primary/10 opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative z-10">
                    <p className="mb-1 text-[12px] font-black uppercase tracking-widest text-primary">Wholesale Power</p>
                    <p className="text-[14px] font-bold leading-tight text-white/90">
                      This cart carries Rs.{wholesaleMargin.toLocaleString('en-IN')} in projected sell-through margin.
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={handleCheckout}
                className="group mt-8 flex w-full items-center justify-center gap-3 rounded-[24px] bg-primary py-5 text-white shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                <span className="text-[12px] font-black uppercase tracking-widest">Proceed to Checkout</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            <div className="rounded-[40px] border border-slate-100 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                  <Tag className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-[16px] font-black tracking-tight">Apply Coupon</h4>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Extra Savings</p>
                </div>
              </div>

              {bestCoupon && appliedCoupon?.code !== bestCoupon.coupon.code && (
                <div className="mb-5 rounded-[24px] border border-emerald-100 bg-emerald-50/80 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-emerald-700">
                        <Sparkles className="h-3.5 w-3.5" /> Best Offer Right Now
                      </p>
                      <p className="mt-2 text-[16px] font-black tracking-tight text-slate-900">{bestCoupon.coupon.code}</p>
                      <p className="mt-1 text-[13px] font-medium text-slate-500">
                        Save up to Rs.{bestCoupon.savings.toLocaleString('en-IN')} on this cart.
                      </p>
                    </div>
                    <button
                      onClick={applySuggestedCoupon}
                      className="rounded-2xl bg-slate-900 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white transition-colors hover:bg-slate-800"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                  placeholder="Enter Code"
                  className="flex-1 rounded-2xl border-none bg-slate-50 px-5 py-3.5 text-[14px] font-bold outline-none transition-all focus:ring-2 focus:ring-primary/20"
                />
                <button
                  onClick={() => applyCoupon()}
                  className="rounded-2xl bg-slate-900 px-6 py-3.5 text-[12px] font-black uppercase tracking-widest text-white transition-all hover:bg-slate-800 active:scale-95"
                >
                  Apply
                </button>
              </div>

              {appliedCoupon && (
                <div className="mt-4 flex items-center justify-between rounded-[20px] bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-[12px] font-black uppercase tracking-widest text-slate-400">Applied</p>
                    <p className="text-[14px] font-black text-slate-900">
                      {appliedCoupon.code} • Save Rs.{couponDiscount.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <button onClick={removeCoupon} className="text-[12px] font-black uppercase tracking-widest text-primary hover:underline">
                    Remove
                  </button>
                </div>
              )}

              <div className="mt-6 space-y-3">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">Available Offers</p>
                <div className="flex flex-wrap gap-2">
                  {COUPONS.map((coupon) => {
                    const unlocked = subtotal >= coupon.minOrder;
                    const active = couponCode === coupon.code || appliedCoupon?.code === coupon.code;

                    return (
                      <button
                        key={coupon.code}
                        onClick={() => setCouponCode(coupon.code)}
                        className={`rounded-xl border px-4 py-2 text-left transition-all ${active ? 'border-primary bg-primary text-white' : 'border-slate-100 bg-white text-slate-600 hover:border-primary/50'}`}
                      >
                        <p className="text-[12px] font-black">{coupon.code}</p>
                        <p className={`mt-1 text-[10px] font-bold ${active ? 'text-white/80' : unlocked ? 'text-emerald-500' : 'text-slate-300'}`}>
                          {unlocked ? `Ready • Save Rs.${couponValue(coupon, subtotal).toLocaleString('en-IN')}` : `Unlock at Rs.${coupon.minOrder}`}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-[40px] border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-[14px] font-black text-slate-900">Cart Intelligence</p>
                  <p className="mt-1 text-[12px] font-medium leading-relaxed text-slate-400">
                    {user.role === 'shopowner'
                      ? 'Wholesale pack sizing is enforced automatically, so the quantity controls now move in valid business increments.'
                      : 'Your cart now recommends the strongest coupon and fastest path to free delivery before checkout.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-6 px-4 opacity-40 grayscale">
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck className="h-6 w-6" />
                <span className="text-[10px] font-black uppercase tracking-widest">Secure</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Store className="h-6 w-6" />
                <span className="text-[10px] font-black uppercase tracking-widest">Genuine</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Zap className="h-6 w-6" />
                <span className="text-[10px] font-black uppercase tracking-widest">Fast</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
