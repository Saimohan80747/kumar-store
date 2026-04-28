import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  Locate,
  Lock,
  MapPin,
  ShieldCheck,
  Smartphone,
  X,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD, useStore } from '../store';

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
            const component = comps.find((item: any) => item.types && types.some((type) => item.types.includes(type)));
            return component ? (component.long_name || component.short_name || '') : '';
          };
          for (const component of comps) {
            const name = component.long_name || component.short_name || '';
            if (component.types?.includes('street_number') || component.types?.includes('subpremise')) {
              houseNumber = houseNumber ? `${houseNumber}, ${name}` : name;
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
    } catch {
      // Fall through to the open data fallback.
    }
  }

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'KumarStore/1.0' },
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
  } catch {
    // Fall through to coordinates.
  }

  return { address: `Lat ${lat.toFixed(6)}, Lng ${lon.toFixed(6)}` };
}

const DELIVERY_SLOTS = [
  { id: 'morning', label: 'Morning', time: '8 AM - 12 PM', cutoffHour: 9.5 },
  { id: 'afternoon', label: 'Afternoon', time: '12 PM - 5 PM', cutoffHour: 14.5 },
  { id: 'evening', label: 'Evening', time: '5 PM - 9 PM', cutoffHour: 18.5 },
];

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

  const subtotal = useMemo(() => getCartTotal(), [cart, getCartTotal]);
  const discountedSubtotal = Math.max(0, subtotal - couponDiscount);
  const delivery = discountedSubtotal > FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = discountedSubtotal + delivery;
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

  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const nextDayOnly = DELIVERY_SLOTS.every((slot) => currentHour >= slot.cutoffHour);
  const slotOptions = DELIVERY_SLOTS.map((slot) => ({
    ...slot,
    disabled: nextDayOnly ? false : currentHour >= slot.cutoffHour,
    dayLabel: nextDayOnly ? 'Tomorrow' : 'Today',
  }));
  const firstAvailableSlot = slotOptions.find((slot) => !slot.disabled)?.id ?? slotOptions[0].id;
  const selectedSlot = slotOptions.find((slot) => slot.id === deliverySlot) ?? slotOptions[0];
  const sameDayDispatch = now.getHours() < 14;
  const codBlockedReason = user?.role === 'shopowner'
    ? 'Cash on delivery is disabled for wholesale accounts.'
    : total > 10000
      ? 'Cash on delivery is unavailable for orders above Rs.10000.'
      : '';
  const canPlaceOrder = address.trim().length > 0 && !isPlacing && !(paymentMethod === 'cod' && codBlockedReason);
  const addressSignals = [
    houseNumber.trim() ? 'Door / flat added' : null,
    address.trim() ? 'Area details added' : null,
    deliveryLocationUrl ? 'Map pin attached' : null,
  ].filter(Boolean);

  useEffect(() => {
    if (!slotOptions.some((slot) => slot.id === deliverySlot && !slot.disabled)) {
      setDeliverySlot(firstAvailableSlot);
    }
  }, [deliverySlot, firstAvailableSlot, slotOptions]);

  useEffect(() => {
    if (paymentMethod === 'cod' && codBlockedReason) {
      setPaymentMethod('upi');
    }
  }, [codBlockedReason, paymentMethod]);

  const handlePlaceOrder = async () => {
    if (!canPlaceOrder) return;

    setIsPlacing(true);
    const fullAddress = houseNumber.trim() ? `${houseNumber.trim()}, ${address.trim()}` : address.trim();

    try {
      await placeOrder(
        paymentMethod,
        delivery,
        fullAddress,
        deliveryLocationUrl,
        couponCode,
        couponDiscount || undefined,
        deliverySlot
      );
      const latestOrders = useStore.getState().orders;
      const justPlaced = latestOrders[0];
      if (justPlaced) {
        toast.success('Order placed successfully');
        navigate(`/orders/${justPlaced.id}`, { replace: true, state: { newOrder: true } });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to place order. Please try again.';
      toast.error(message);
    } finally {
      setIsPlacing(false);
    }
  };

  if (!user) return <Navigate to="/login" replace />;
  if (cart.length === 0 && !isPlacing) return <Navigate to="/cart" replace />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-10 lg:flex-row">
        <div className="flex-1 space-y-8">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-[32px] tracking-tight" style={{ fontWeight: 900 }}>Checkout</h1>
            <Link to="/cart" className="flex items-center gap-2 text-[13px] font-black uppercase tracking-widest text-primary hover:underline">
              <ArrowLeft className="h-4 w-4" /> Back to Cart
            </Link>
          </div>

          <section className="relative overflow-hidden rounded-[40px] border border-slate-100 bg-white p-8 shadow-sm">
            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-primary/10">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-[20px] font-black tracking-tight">Delivery Address</h3>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Where should we deliver?</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="ml-1 text-[12px] font-black uppercase tracking-widest text-slate-400">House / Flat / Building</label>
                <input
                  type="text"
                  value={houseNumber}
                  onChange={(event) => setHouseNumber(event.target.value)}
                  placeholder="e.g. Flat 402, Sai Residency"
                  className="w-full rounded-2xl border-none bg-slate-50 px-5 py-4 text-[14px] font-bold outline-none transition-all focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <label className="ml-1 text-[12px] font-black uppercase tracking-widest text-slate-400">Street & Area Details</label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <textarea
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    rows={3}
                    placeholder="Street, locality, landmark, city, pincode"
                    className="flex-1 resize-none rounded-2xl border-none bg-slate-50 px-5 py-4 text-[14px] font-bold outline-none transition-all focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    onClick={async () => {
                      if (!navigator.geolocation) {
                        toast.error('GPS not supported');
                        return;
                      }
                      setIsLocating(true);
                      try {
                        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true });
                        });
                        const { latitude: lat, longitude: lng } = position.coords;
                        const { address: locAddr, houseNumber: locHouse } = await reverseGeocode(lat, lng);
                        setAddress(locAddr);
                        if (locHouse) setHouseNumber(locHouse);
                        setDetectedCoords({ lat, lng });
                        setDeliveryLocationUrl(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
                        toast.success('Location detected');
                      } catch {
                        toast.error('Failed to get location');
                      } finally {
                        setIsLocating(false);
                      }
                    }}
                    disabled={isLocating}
                    className="group flex h-auto flex-col items-center justify-center gap-2 rounded-2xl border border-primary/10 bg-primary/5 py-4 text-primary transition-all hover:bg-primary/10 disabled:opacity-50 sm:w-32 sm:py-0"
                  >
                    {isLocating ? <Loader2 className="h-6 w-6 animate-spin" /> : <Locate className="h-6 w-6 transition-transform group-hover:scale-110" />}
                    <span className="text-[10px] font-black uppercase tracking-tight">{isLocating ? 'Locating...' : 'Auto-Fill'}</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {addressSignals.length > 0 ? (
                  addressSignals.map((signal) => (
                    <span key={signal} className="rounded-full bg-slate-50 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-slate-500">
                      {signal}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-amber-700">
                    Add enough detail for a smooth delivery handoff
                  </span>
                )}
              </div>

              <AnimatePresence>
                {detectedCoords && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="relative h-48 overflow-hidden rounded-[24px] border border-slate-100 sm:h-60"
                  >
                    {import.meta.env.VITE_GOOGLE_MAPS_API_KEY && import.meta.env.VITE_GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY' ? (
                      <iframe
                        title="Map"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=${detectedCoords.lat},${detectedCoords.lng}&zoom=16`}
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center bg-slate-50 p-6 text-center">
                        <MapPin className="mb-2 h-10 w-10 text-primary/30" />
                        <p className="text-[13px] font-black uppercase tracking-widest text-slate-400">GPS Location Pinned</p>
                        <p className="mt-1 text-[11px] font-bold text-slate-300">
                          {detectedCoords.lat.toFixed(4)}, {detectedCoords.lng.toFixed(4)}
                        </p>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setDetectedCoords(null);
                        setDeliveryLocationUrl(undefined);
                      }}
                      className="absolute right-4 top-4 rounded-xl bg-white/90 p-2 shadow-lg backdrop-blur-md transition-all hover:bg-red-50 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          <section className="rounded-[40px] border border-slate-100 bg-white p-8 shadow-sm">
            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-primary/10">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-[20px] font-black tracking-tight">Delivery Slot</h3>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  {nextDayOnly ? 'Today is full, these are tomorrow slots' : 'Past windows are disabled automatically'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {slotOptions.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => !slot.disabled && setDeliverySlot(slot.id)}
                  disabled={slot.disabled}
                  className={`group rounded-[24px] border-2 p-5 text-left transition-all ${
                    slot.disabled
                      ? 'cursor-not-allowed border-slate-100 bg-slate-50 opacity-50'
                      : deliverySlot === slot.id
                        ? 'border-primary bg-primary/[0.02] shadow-lg shadow-primary/5'
                        : 'border-slate-50 bg-slate-50/50 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={`text-[15px] font-black uppercase tracking-tight ${deliverySlot === slot.id && !slot.disabled ? 'text-primary' : 'text-slate-600'}`}>
                        {slot.label}
                      </p>
                      <p className="mt-1 text-[12px] font-bold text-slate-400">{slot.time}</p>
                      <p className="mt-3 text-[11px] font-black uppercase tracking-widest text-slate-300">{slot.dayLabel}</p>
                    </div>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${deliverySlot === slot.id && !slot.disabled ? 'scale-110 bg-primary text-white' : 'bg-white text-slate-300'}`}>
                      <CheckCircle2 className={`h-4 w-4 ${deliverySlot === slot.id && !slot.disabled ? 'opacity-100' : 'opacity-0'}`} />
                    </div>
                  </div>
                  {slot.disabled && (
                    <p className="mt-4 text-[11px] font-black uppercase tracking-widest text-slate-300">
                      Cutoff passed
                    </p>
                  )}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[40px] border border-slate-100 bg-white p-8 shadow-sm">
            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-primary/10">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-[20px] font-black tracking-tight">Payment Method</h3>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Choose how to pay</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { id: 'upi', label: 'UPI Payment', desc: 'PhonePe, GPay, Paytm', icon: Smartphone },
                { id: 'card', label: 'Card Payment', desc: 'Credit / Debit Cards', icon: CreditCard },
                { id: 'cod', label: 'Cash on Delivery', desc: 'Pay at your doorstep', icon: Banknote, disabled: Boolean(codBlockedReason) },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => !method.disabled && setPaymentMethod(method.id)}
                  disabled={method.disabled}
                  className={`group flex w-full items-center gap-5 rounded-[24px] border-2 p-5 text-left transition-all ${
                    method.disabled
                      ? 'cursor-not-allowed border-slate-100 bg-slate-50 opacity-50'
                      : paymentMethod === method.id
                        ? 'border-primary bg-primary/[0.02] shadow-lg shadow-primary/5'
                        : 'border-slate-50 bg-slate-50/50 hover:border-slate-200'
                  }`}
                >
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-all ${paymentMethod === method.id && !method.disabled ? 'scale-110 bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white text-slate-400'}`}>
                    <method.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className={`text-[16px] font-black tracking-tight ${paymentMethod === method.id && !method.disabled ? 'text-slate-900' : 'text-slate-600'}`}>{method.label}</p>
                    <p className="text-[12px] font-bold text-slate-400">
                      {method.id === 'cod' && method.disabled ? codBlockedReason : method.desc}
                    </p>
                  </div>
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${paymentMethod === method.id && !method.disabled ? 'border-primary bg-primary' : 'border-slate-200'}`}>
                    {paymentMethod === method.id && !method.disabled && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                </button>
              ))}
            </div>

            {codBlockedReason && (
              <div className="mt-5 flex items-start gap-3 rounded-[24px] border border-amber-100 bg-amber-50/80 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-[13px] font-black text-amber-700">COD restriction applied</p>
                  <p className="mt-1 text-[12px] font-medium leading-relaxed text-amber-700/80">{codBlockedReason}</p>
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="lg:w-[400px]">
          <div className="sticky top-32 space-y-6">
            <div className="relative overflow-hidden rounded-[40px] bg-slate-900 p-8 text-white shadow-2xl shadow-slate-900/20">
              <div className="absolute right-0 top-0 -mr-10 -mt-10 h-32 w-32 bg-primary/20 blur-3xl" />

              <h3 className="mb-8 text-[20px] font-black tracking-tight">Review Order</h3>

              <div className="mb-8 max-h-60 space-y-4 overflow-y-auto pr-2 no-scrollbar">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-4">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white/10">
                      <img src={item.product.image} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold">{item.product.name}</p>
                      <p className="text-[11px] font-black uppercase tracking-widest text-white/40">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-[14px] font-black">Rs.{(getPrice(item.product) * item.quantity).toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4 border-t border-white/10 pt-6">
                <div className="flex items-center justify-between text-white/50">
                  <span className="text-[14px] font-bold">Subtotal</span>
                  <span className="text-[15px] font-black text-white">Rs.{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-white/50">
                  <span className="text-[14px] font-bold">Product savings</span>
                  <span className="text-[15px] font-black text-emerald-400">Rs.{totalSavings.toLocaleString('en-IN')}</span>
                </div>
                {wholesaleMargin > 0 && (
                  <div className="flex items-center justify-between text-white/50">
                    <span className="text-[14px] font-bold">Business margin</span>
                    <span className="text-[15px] font-black text-amber-400">Rs.{wholesaleMargin.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div className="flex items-center justify-between text-primary">
                    <span className="text-[14px] font-bold">Discount</span>
                    <span className="text-[15px] font-black">-Rs.{couponDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-white/50">
                  <span className="text-[14px] font-bold">Delivery</span>
                  <span className={`text-[14px] font-black ${delivery === 0 ? 'text-emerald-400' : 'text-white'}`}>
                    {delivery === 0 ? 'FREE' : `Rs.${delivery}`}
                  </span>
                </div>

                <div className="mt-6 border-t border-white/10 pt-6">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="mb-1 text-[12px] font-black uppercase tracking-widest text-white/40">Total Amount</p>
                      <p className="text-[36px] font-black leading-none tracking-tighter">Rs.{total.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3 rounded-[28px] border border-white/10 bg-white/5 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-white/40">Scheduled Window</p>
                    <p className="mt-1 text-[16px] font-black text-white">{selectedSlot.dayLabel} • {selectedSlot.label}</p>
                    <p className="mt-1 text-[12px] font-medium text-white/60">{selectedSlot.time}</p>
                  </div>
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div className="flex items-start gap-3 rounded-[20px] bg-white/5 px-4 py-3">
                  <Zap className="mt-0.5 h-4.5 w-4.5 shrink-0 text-amber-400" />
                  <p className="text-[12px] font-medium leading-relaxed text-white/70">
                    {sameDayDispatch && !nextDayOnly
                      ? 'Orders confirmed before 2 PM are prioritized for same-day dispatch.'
                      : 'This order will move into the next dispatch cycle with the selected delivery window.'}
                  </p>
                </div>
                {couponCode && couponDiscount > 0 && (
                  <div className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-primary">
                    Coupon {couponCode}
                  </div>
                )}
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={!canPlaceOrder}
                className="group mt-10 flex w-full items-center justify-center gap-3 rounded-[24px] bg-primary py-5 text-white shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:scale-100 disabled:opacity-50"
              >
                {isPlacing ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                  <>
                    <span className="text-[12px] font-black uppercase tracking-widest">Place Order</span>
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>

              <div className="mt-6 flex items-center justify-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
                <Lock className="h-4 w-4 text-emerald-400" />
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/40">Secure 256-bit Encrypted Checkout</p>
              </div>
            </div>

            <div className="rounded-[40px] border border-slate-100 bg-white p-8 shadow-sm">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[14px] font-black text-slate-900">Purchase Protection</p>
                    <p className="text-[12px] font-medium leading-relaxed text-slate-400">
                      Full refund if items are not as described or damaged.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[14px] font-black text-slate-900">Business-Ready Checkout</p>
                    <p className="text-[12px] font-medium leading-relaxed text-slate-400">
                      Quantity, stock, and payment rules are validated before your order is sent, reducing failed fulfillment.
                    </p>
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

// Code styling update 9
