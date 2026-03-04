import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { CreditCard, Banknote, Smartphone, MapPin, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useStore } from '../store';
import type { Order } from '../store';
import { toast } from 'sonner';
import { Navigate } from 'react-router';
import { OrderConfirmation } from './order-confirmation';

export function CheckoutPage() {
  const cart = useStore((s) => s.cart);
  const getPrice = useStore((s) => s.getPrice);
  const getCartTotal = useStore((s) => s.getCartTotal);
  const placeOrder = useStore((s) => s.placeOrder);
  const user = useStore((s) => s.user);
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [address, setAddress] = useState(user?.address || '123 Main Street, Mumbai, Maharashtra 400001');
  const [deliverySlot, setDeliverySlot] = useState('morning');
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);
  // Capture totals before cart is cleared
  const capturedTotalRef = useRef<number | null>(null);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const subtotal = getCartTotal();
  const delivery = subtotal > 999 ? 0 : 49;
  const total = subtotal + delivery;

  const handlePlaceOrder = async () => {
    if (isPlacing) return;
    setIsPlacing(true);
    capturedTotalRef.current = subtotal;
    // Build the order object before clearing cart
    const orderItems = [...cart];
    try {
      await placeOrder(paymentMethod);
      // Reconstruct the placed order from store's latest
      const latestOrders = useStore.getState().orders;
      const justPlaced = latestOrders[0];
      if (justPlaced) {
        setPlacedOrder(justPlaced);
      }
      toast.success('Order placed successfully!');
    } catch {
      toast.error('Failed to place order. Please try again.');
      setIsPlacing(false);
    }
  };

  if (placedOrder) {
    return (
      <OrderConfirmation
        order={placedOrder}
        deliveryAddress={address}
        deliverySlot={deliverySlot}
      />
    );
  }

  if (cart.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  return (
    <div className="py-6 max-w-4xl mx-auto">
      <h1 className="text-[24px] mb-6" style={{ fontWeight: 700 }}>Checkout</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-5">
          {/* Delivery Address */}
          <div className="bg-white border rounded-xl p-5">
            <h3 className="text-[16px] flex items-center gap-2 mb-4" style={{ fontWeight: 600 }}>
              <MapPin className="w-5 h-5 text-primary" /> Delivery Address
            </h3>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border rounded-lg bg-input-background text-[14px] outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Enter delivery address"
            />
          </div>

          {/* Delivery Slot */}
          <div className="bg-white border rounded-xl p-5">
            <h3 className="text-[16px] mb-4" style={{ fontWeight: 600 }}>Delivery Slot</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'morning', label: 'Morning', time: '8 AM - 12 PM' },
                { id: 'afternoon', label: 'Afternoon', time: '12 PM - 5 PM' },
                { id: 'evening', label: 'Evening', time: '5 PM - 9 PM' },
              ].map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => setDeliverySlot(slot.id)}
                  className={`p-3 rounded-lg border text-center transition-all ${deliverySlot === slot.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'hover:bg-gray-50'}`}
                >
                  <p className="text-[14px]" style={{ fontWeight: 500 }}>{slot.label}</p>
                  <p className="text-[12px] text-muted-foreground">{slot.time}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white border rounded-xl p-5">
            <h3 className="text-[16px] flex items-center gap-2 mb-4" style={{ fontWeight: 600 }}>
              <CreditCard className="w-5 h-5 text-primary" /> Payment Method
            </h3>
            <div className="space-y-2">
              {[
                { id: 'upi', label: 'UPI Payment', desc: 'Google Pay, PhonePe, Paytm', icon: Smartphone },
                { id: 'card', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay', icon: CreditCard },
                { id: 'cod', label: 'Cash on Delivery', desc: 'Pay when you receive', icon: Banknote },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-all text-left ${paymentMethod === method.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'hover:bg-gray-50'}`}
                >
                  <div className={`p-2 rounded-lg ${paymentMethod === method.id ? 'bg-primary text-white' : 'bg-gray-100'}`}>
                    <method.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[14px]" style={{ fontWeight: 500 }}>{method.label}</p>
                    <p className="text-[12px] text-muted-foreground">{method.desc}</p>
                  </div>
                </button>
              ))}
              {user?.role === 'shopowner' && (
                <button
                  onClick={() => setPaymentMethod('credit')}
                  className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-all text-left ${paymentMethod === 'credit' ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'hover:bg-gray-50'}`}
                >
                  <div className={`p-2 rounded-lg ${paymentMethod === 'credit' ? 'bg-primary text-white' : 'bg-gray-100'}`}>
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[14px]" style={{ fontWeight: 500 }}>Credit Account</p>
                    <p className="text-[12px] text-muted-foreground">Credit Limit: Rs.{user.creditLimit?.toLocaleString() || '50,000'}</p>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="lg:w-80 shrink-0">
          <div className="bg-white border rounded-xl p-5 sticky top-40 space-y-4">
            <h3 className="text-[16px]" style={{ fontWeight: 600 }}>Order Summary</h3>

            <div className="space-y-2 max-h-52 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.product.id} className="flex items-center gap-2 text-[13px]">
                  <img src={item.product.image} alt="" className="w-10 h-10 rounded object-cover" loading="lazy" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{item.product.name}</p>
                    <p className="text-muted-foreground">x{item.quantity}</p>
                  </div>
                  <span style={{ fontWeight: 500 }}>Rs.{getPrice(item.product) * item.quantity}</span>
                </div>
              ))}
            </div>

            <hr />

            <div className="space-y-2 text-[14px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>Rs.{subtotal}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className={delivery === 0 ? 'text-primary' : ''}>{delivery === 0 ? 'FREE' : `Rs.${delivery}`}</span></div>
              <hr />
              <div className="flex justify-between text-[18px]"><span style={{ fontWeight: 700 }}>Total</span><span style={{ fontWeight: 700 }}>Rs.{total}</span></div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isPlacing}
              className="w-full py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors text-[15px] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ fontWeight: 600 }}
            >
              {isPlacing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Placing Order...
                </span>
              ) : (
                `Place Order - Rs.${total}`
              )}
            </button>

            <p className="text-[12px] text-center text-muted-foreground">By placing this order, you agree to our Terms & Conditions</p>
          </div>
        </div>
      </div>
    </div>
  );
}