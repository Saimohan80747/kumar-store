import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router';
import { Minus, Plus, Trash2, ShoppingCart, Tag, ArrowRight, ShoppingBag } from 'lucide-react';
import { useStore } from '../store';
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
  const deliveryFee = subtotal > 999 ? 0 : 49;

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
      <div className="py-20 text-center">
        <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-[24px]" style={{ fontWeight: 700 }}>Your Cart is Empty</h2>
        <p className="text-muted-foreground mt-2 text-[15px]">Looks like you haven't added anything yet</p>
        <Link to="/products" className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-primary text-white rounded-lg text-[15px]" style={{ fontWeight: 600 }}>
          Start Shopping <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="py-6">
      <h1 className="text-[24px] mb-6" style={{ fontWeight: 700 }}>Shopping Cart ({cart.length} items)</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Cart items */}
        <div className="flex-1 space-y-3">
          {cart.map((item) => {
            const price = getPrice(item.product);
            return (
              <div key={item.product.id} className="bg-white border rounded-xl p-4 flex gap-4">
                <Link to={`/product/${item.product.id}`} className="w-24 h-24 bg-gray-50 rounded-lg overflow-hidden shrink-0">
                  <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" loading="lazy" />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[12px] text-muted-foreground">{item.product.brand}</span>
                      <Link to={`/product/${item.product.id}`} className="block text-[15px] hover:text-primary truncate" style={{ fontWeight: 500 }}>
                        {item.product.name}
                      </Link>
                    </div>
                    <button onClick={() => { removeFromCart(item.product.id); toast.success('Removed from cart'); }} className="p-1.5 text-gray-400 hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center border rounded-lg overflow-hidden">
                      <button onClick={() => updateCartQty(item.product.id, item.quantity - 1)} className="p-1.5 hover:bg-gray-50">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-[14px]" style={{ fontWeight: 600 }}>{item.quantity}</span>
                      <button onClick={() => updateCartQty(item.product.id, item.quantity + 1)} className="p-1.5 hover:bg-gray-50">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-[16px]" style={{ fontWeight: 700 }}>Rs.{price * item.quantity}</p>
                      {item.product.mrp !== price && (
                        <p className="text-[12px] text-muted-foreground line-through">MRP: Rs.{item.product.mrp * item.quantity}</p>
                      )}
                      <p className="text-[12px] text-muted-foreground">Rs.{price} x {item.quantity}</p>
                      {item.product.mrp !== price && (
                        <p className="text-[11px] text-primary" style={{ fontWeight: 600 }}>Save Rs.{(item.product.mrp - price) * item.quantity}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order summary */}
        <div className="lg:w-80 shrink-0">
          <div className="bg-white border rounded-xl p-5 sticky top-40 space-y-4">
            <h3 className="text-[16px]" style={{ fontWeight: 600 }}>Order Summary</h3>

            {/* Coupon */}
            <div>
              <label className="text-[13px] text-muted-foreground mb-1.5 block">Apply Coupon</label>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center border rounded-lg overflow-hidden bg-input-background">
                  <Tag className="w-4 h-4 text-muted-foreground ml-3" />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="flex-1 px-2 py-2 bg-transparent outline-none text-[14px]"
                  />
                </div>
                <button onClick={applyCoupon} className="px-3 py-2 bg-primary text-white rounded-lg text-[14px]">Apply</button>
              </div>
              {appliedCoupon && (
                <p className="text-[12px] text-primary mt-1" style={{ fontWeight: 500 }}>
                  {appliedCoupon.code} applied - Save Rs.{couponDiscount}
                </p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {COUPONS.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => { setCouponCode(c.code); }}
                    className="text-[11px] px-2 py-0.5 bg-primary/5 text-primary border border-primary/20 rounded-full hover:bg-primary/10"
                  >
                    {c.code}
                  </button>
                ))}
              </div>
            </div>

            <hr />

            <div className="space-y-2 text-[14px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span style={{ fontWeight: 500 }}>Rs.{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className={deliveryFee === 0 ? 'text-primary' : ''} style={{ fontWeight: 500 }}>
                  {deliveryFee === 0 ? 'FREE' : `Rs.${deliveryFee}`}
                </span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-primary">
                  <span>Coupon Discount</span>
                  <span style={{ fontWeight: 500 }}>-Rs.{couponDiscount}</span>
                </div>
              )}
              <hr />
              <div className="flex justify-between text-[18px]">
                <span style={{ fontWeight: 700 }}>Total</span>
                <span style={{ fontWeight: 700 }}>Rs.{total}</span>
              </div>
            </div>

            {user?.role === 'shopowner' && (
              <div className="bg-primary/5 rounded-lg p-3 text-[13px]">
                <p className="text-primary" style={{ fontWeight: 600 }}>Wholesale Savings</p>
                <p className="text-muted-foreground mt-0.5">
                  You're saving Rs.{cart.reduce((s, i) => s + (i.product.mrp - i.product.shopPrice) * i.quantity, 0)} compared to MRP!
                </p>
              </div>
            )}

            <button
              onClick={() => navigate(user ? '/checkout' : '/login')}
              className="w-full py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 text-[15px]"
              style={{ fontWeight: 600 }}
            >
              <ShoppingCart className="w-5 h-5" /> Proceed to Checkout
            </button>

            <Link to="/products" className="block text-center text-primary text-[14px] hover:underline">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}