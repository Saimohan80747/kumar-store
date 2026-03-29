import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams, Navigate, Link } from 'react-router';
import { 
  CreditCard, Banknote, Smartphone, MapPin, ShieldCheck, Locate, X, 
  ArrowRight, Lock, Clock, 
  CheckCircle2, Loader2, ArrowLeft, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore, FREE_DELIVERY_THRESHOLD, DELIVERY_FEE } from '../store';
import { toast } from 'sonner';

export type GeocodedAddress = { address: string; houseNumber?: string };

async function reverseGeocode(lat: number, lon: number): Promise<GeocodedAddress> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY') {
    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${apiKey}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'OK' && data.results?.length > 0) {
          const result = data.results[0];
          const comps = result.address_components || [];
          let houseNumber = '';
          const get = (types: string[]) => {
            const c = comps.find((x: any) => x.types && types.some(t => x.types!.includes(t)));
            return c ? (c.long_name || c.short_name || '') : '';
          };
          for (const c of comps) {
            const name = c.long_name || c.short_name || '';
            if (c.types?.includes('street_number') || c.types?.includes('subpremise')) {
              houseNumber = houseNumber ? houseNumber + ', ' + name : name;
            }
          }
          const route = get(['route']);
          const sublocality = get(['sublocality_level_1', 'sublocality']);
          const locality = get(['locality']);
          const state = get(['administrative_area_level_1']);
          const postcode = get(['postal_code']);
          const addressParts = [route, sublocality, locality, state, postcode].filter(Boolean);
          return { address: addressParts.join(', '), houseNumber: houseNumber || undefined };
        }
      }
    } catch { /* fallback */ }
  }

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'KumarStore/1.0' }
    });
    if (res.ok) {
      const data = await res.json();
      const addr = data.address;
      if (addr) {
        const houseNum = addr.house_number || addr.house_name || '';
        const road = addr.road || '';
        const place = addr.suburb || addr.city || '';
        const state = addr.state || '';
        const addressParts = [road, place, state].filter(Boolean);
        return { address: addressParts.join(', '), houseNumber: houseNum || undefined };
      }
    }
  } catch { /* fallback */ }

  return { address: `Lat ${lat.toFixed(6)}, Lng ${lon.toFixed(6)}` };
}

export function CheckoutPage() {
  const cart = useStore((s) => s.cart);
  const getPrice = useStore((s) => s.getPrice);
  const getCartTotal = useStore((s) => s.getCartTotal);
  const placeOrder = useStore((s) => s.placeOrder);
  const user = useStore((s) => s.user);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [houseNumber, setHouseNumber] = useState('');
  const [address, setAddress] = useState(user?.address || '');
  const [deliveryLocationUrl, setDeliveryLocationUrl] = useState<string | undefined>(undefined);
  const [deliverySlot, setDeliverySlot] = useState('morning');
  const [isPlacing, setIsPlacing] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [detectedCoords, setDetectedCoords] = useState<{ lat: number; lng: number } | null>(null);

  const couponCode = searchParams.get('coupon') || undefined;
  const couponDiscount = Number(searchParams.get('discount')) || 0;

  const subtotal = useMemo(() => getCartTotal(), [cart, getPrice, getCartTotal]);
  const discountedSubtotal = subtotal - couponDiscount;
  const delivery = discountedSubtotal > FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = discountedSubtotal + delivery;

  const handlePlaceOrder = async () => {
    if (isPlacing) return;
    if (!address.trim()) { toast.error('Please enter delivery address'); return; }

    setIsPlacing(true);
    const fullAddress = houseNumber.trim() ? `${houseNumber.trim()}, ${address}` : address;
    
    try {
      await placeOrder(paymentMethod, delivery, fullAddress, deliveryLocationUrl, couponCode, couponDiscount || undefined, deliverySlot);
      const latestOrders = useStore.getState().orders;
      const justPlaced = latestOrders[0];
      if (justPlaced) {
        toast.success('Order placed successfully!');
        navigate(`/orders/${justPlaced.id}`, { replace: true, state: { newOrder: true } });
      }
    } catch {
      toast.error('Failed to place order. Please try again.');
      setIsPlacing(false);
    }
  };

  if (!user) return <Navigate to="/login" replace />;
  if (cart.length === 0 && !isPlacing) return <Navigate to="/cart" replace />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-col lg:flex-row gap-10">
        
        {/* Left: Checkout Details */}
        <div className="flex-1 space-y-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-[32px] tracking-tight" style={{ fontWeight: 900 }}>Checkout</h1>
            <Link to="/cart" className="text-[13px] font-black text-primary uppercase tracking-widest flex items-center gap-2 hover:underline">
              <ArrowLeft className="w-4 h-4" /> Back to Cart
            </Link>
          </div>

          {/* Delivery Address Section */}
          <section className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm overflow-hidden relative">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-[18px] bg-primary/10 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-[20px] font-black tracking-tight">Delivery Address</h3>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Where should we deliver?</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">House / Flat / Building</label>
                <input
                  type="text"
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                  placeholder="e.g. Flat 402, Sai Residency"
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-[14px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">Street & Area Details</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={3}
                    placeholder="Street, locality, landmark, city, pincode"
                    className="flex-1 px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-[14px] resize-none"
                  />
                  <button
                    onClick={async () => {
                      if (!navigator.geolocation) { toast.error('GPS not supported'); return; }
                      setIsLocating(true);
                      try {
                        const pos = await new Promise<GeolocationPosition>((res, rej) => {
                          navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true });
                        });
                        const { latitude: lat, longitude: lng } = pos.coords;
                        const { address: locAddr, houseNumber: locHouse } = await reverseGeocode(lat, lng);
                        setAddress(locAddr);
                        if (locHouse) setHouseNumber(locHouse);
                        setDetectedCoords({ lat, lng });
                        setDeliveryLocationUrl(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
                        toast.success('Location detected!');
                      } catch { toast.error('Failed to get location'); } finally { setIsLocating(false); }
                    }}
                    disabled={isLocating}
                    className="sm:w-32 h-auto py-4 sm:py-0 bg-primary/5 text-primary border border-primary/10 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-primary/10 transition-all disabled:opacity-50 group"
                  >
                    {isLocating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Locate className="w-6 h-6 group-hover:scale-110 transition-transform" />}
                    <span className="text-[10px] font-black uppercase tracking-tight">{isLocating ? 'Locating...' : 'Auto-Fill'}</span>
                  </button>
                </div>
              </div>

              {/* Map Preview */}
              <AnimatePresence>
                {detectedCoords && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="relative rounded-[24px] overflow-hidden border border-slate-100 h-48 sm:h-60"
                  >
                    {import.meta.env.VITE_GOOGLE_MAPS_API_KEY && import.meta.env.VITE_GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY' ? (
                      <iframe
                        title="Map" width="100%" height="100%" style={{ border: 0 }}
                        src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=${detectedCoords.lat},${detectedCoords.lng}&zoom=16`}
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                        <MapPin className="w-10 h-10 text-primary/30 mb-2" />
                        <p className="text-[13px] font-black text-slate-400 uppercase tracking-widest">GPS Location Pinned</p>
                        <p className="text-[11px] font-bold text-slate-300 mt-1">{detectedCoords.lat.toFixed(4)}, {detectedCoords.lng.toFixed(4)}</p>
                      </div>
                    )}
                    <button 
                      onClick={() => { setDetectedCoords(null); setDeliveryLocationUrl(undefined); }}
                      className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-md rounded-xl shadow-lg hover:bg-red-50 hover:text-red-500 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Delivery Slot Section */}
          <section className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-[18px] bg-primary/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-[20px] font-black tracking-tight">Delivery Slot</h3>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">When should we arrive?</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: 'morning', label: 'Morning', time: '8 AM - 12 PM', icon: Zap },
                { id: 'afternoon', label: 'Afternoon', time: '12 PM - 5 PM', icon: Zap },
                { id: 'evening', label: 'Evening', time: '5 PM - 9 PM', icon: Zap },
              ].map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => setDeliverySlot(slot.id)}
                  className={`p-5 rounded-[24px] border-2 transition-all text-left group ${
                    deliverySlot === slot.id 
                      ? 'border-primary bg-primary/[0.02] shadow-lg shadow-primary/5' 
                      : 'border-slate-50 hover:border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <p className={`text-[15px] font-black uppercase tracking-tight ${deliverySlot === slot.id ? 'text-primary' : 'text-slate-600'}`}>{slot.label}</p>
                  <p className="text-[12px] font-bold text-slate-400 mt-1">{slot.time}</p>
                  <div className={`mt-4 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${deliverySlot === slot.id ? 'bg-primary text-white scale-110' : 'bg-white text-slate-300'}`}>
                    <CheckCircle2 className={`w-4 h-4 ${deliverySlot === slot.id ? 'opacity-100' : 'opacity-0'}`} />
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Payment Section */}
          <section className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-[18px] bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-[20px] font-black tracking-tight">Payment Method</h3>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Choose how to pay</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { id: 'upi', label: 'UPI Payment', desc: 'PhonePe, GPay, Paytm', icon: Smartphone },
                { id: 'card', label: 'Card Payment', desc: 'Credit / Debit Cards', icon: CreditCard },
                { id: 'cod', label: 'Cash on Delivery', desc: 'Pay at your doorstep', icon: Banknote },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`w-full flex items-center gap-5 p-5 rounded-[24px] border-2 transition-all text-left group ${
                    paymentMethod === method.id 
                      ? 'border-primary bg-primary/[0.02] shadow-lg shadow-primary/5' 
                      : 'border-slate-50 hover:border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${paymentMethod === method.id ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20' : 'bg-white text-slate-400'}`}>
                    <method.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className={`text-[16px] font-black tracking-tight ${paymentMethod === method.id ? 'text-slate-900' : 'text-slate-600'}`}>{method.label}</p>
                    <p className="text-[12px] font-bold text-slate-400">{method.desc}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === method.id ? 'border-primary bg-primary' : 'border-slate-200'}`}>
                    {paymentMethod === method.id && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Right: Summary & Action */}
        <div className="lg:w-[400px]">
          <div className="sticky top-32 space-y-6">
            <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl -mr-10 -mt-10" />
              
              <h3 className="text-[20px] font-black tracking-tight mb-8">Review Order</h3>

              <div className="space-y-4 max-h-60 overflow-y-auto no-scrollbar pr-2 mb-8">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/10 overflow-hidden shrink-0">
                      <img src={item.product.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold truncate">{item.product.name}</p>
                      <p className="text-[11px] font-black text-white/40 uppercase tracking-widest">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-[14px] font-black">₹{(getPrice(item.product) * item.quantity).toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-6 border-t border-white/10">
                <div className="flex justify-between items-center text-white/50">
                  <span className="text-[14px] font-bold">Subtotal</span>
                  <span className="text-[15px] font-black text-white">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between items-center text-primary">
                    <span className="text-[14px] font-bold">Discount</span>
                    <span className="text-[15px] font-black">-₹{couponDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-white/50">
                  <span className="text-[14px] font-bold">Delivery</span>
                  <span className={`text-[14px] font-black ${delivery === 0 ? 'text-emerald-400' : 'text-white'}`}>
                    {delivery === 0 ? 'FREE' : `₹${delivery}`}
                  </span>
                </div>
                
                <div className="pt-6 border-t border-white/10 mt-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[12px] font-black text-white/40 uppercase tracking-widest mb-1">Total Amount</p>
                      <p className="text-[36px] font-black tracking-tighter leading-none">₹{total.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={isPlacing}
                className="w-full mt-10 py-5 bg-primary text-white rounded-[24px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 group"
              >
                {isPlacing ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <>Place Order <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>

              <div className="mt-6 flex items-center justify-center gap-3 py-3 px-4 bg-white/5 rounded-2xl border border-white/5">
                <Lock className="w-4 h-4 text-emerald-400" />
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.15em]">Secure 256-bit Encrypted Checkout</p>
              </div>
            </div>

            {/* Trust Info Card */}
            <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[14px] font-black text-slate-900">Purchase Protection</p>
                    <p className="text-[12px] font-medium text-slate-400 leading-relaxed">Full refund if items are not as described or damaged.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[14px] font-black text-slate-900">Priority Shipping</p>
                    <p className="text-[12px] font-medium text-slate-400 leading-relaxed">Orders placed before 2 PM are shipped same day.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
