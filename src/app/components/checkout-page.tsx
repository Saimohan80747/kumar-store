import { useState, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { CreditCard, Banknote, Smartphone, MapPin, ShieldCheck, Tag, Locate, X } from 'lucide-react';
import { useStore, FREE_DELIVERY_THRESHOLD, DELIVERY_FEE } from '../store';
import type { Order } from '../store';
import { toast } from 'sonner';
import { Navigate } from 'react-router';
import { OrderConfirmation } from './order-confirmation';

export type GeocodedAddress = { address: string; houseNumber?: string };

/** Reverse geocode lat/lng to a human-readable address and optional house number. */
async function reverseGeocode(lat: number, lon: number): Promise<GeocodedAddress> {
  // 1. Try Google Maps Geocoding API
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY') {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${apiKey}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'OK' && data.results?.length > 0) {
          const result = data.results[0];
          const comps = result.address_components || [];
          let houseNumber = '';
          const get = (types: string[]) => {
            const c = comps.find((x: { types?: string[] }) => x.types && types.some(t => x.types!.includes(t)));
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
          const country = get(['country']);
          const addressParts = [route, sublocality, locality, state, postcode, country].filter(Boolean);
          const address = addressParts.length > 0 ? addressParts.join(', ') : (result.formatted_address || '');
          return { address, houseNumber: houseNumber || undefined };
        }
      }
    } catch (err) {
      console.error('Google Geocoding failed:', err);
    }
  }

  // 2. Fallback: OpenStreetMap Nominatim (More reliable for free usage)
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'KumarStore/1.0'
        }
      }
    );
    if (res.ok) {
      const data = await res.json();
      const addr = data.address;
      if (addr && typeof addr === 'object') {
        const houseNum = addr.house_number || addr.house_name || '';
        const road = addr.road || addr.footway || addr.pedestrian || '';
        const place = addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.city || addr.municipality || '';
        const state = addr.state || addr.province || '';
        const postcode = addr.postcode || '';
        const country = addr.country || '';
        const addressParts = [road, place, state, postcode, country].filter(Boolean);
        if (addressParts.length > 0) {
          return { address: addressParts.join(', '), houseNumber: houseNum || undefined };
        }
      }
      if (data.display_name) return { address: data.display_name };
    }
  } catch (err) {
    console.error('Nominatim Geocoding failed:', err);
  }

  return { address: `Lat ${lat.toFixed(6)}, Lng ${lon.toFixed(6)}` };
}

export function CheckoutPage() {
  const cart = useStore((s) => s.cart);
  const getPrice = useStore((s) => s.getPrice);
  const getCartTotal = useStore((s) => s.getCartTotal);
  const placeOrder = useStore((s) => s.placeOrder);
  const user = useStore((s) => s.user);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [houseNumber, setHouseNumber] = useState('');
  const [address, setAddress] = useState(user?.address || '123 Main Street, Mumbai, Maharashtra 400001');
  const [deliveryLocationUrl, setDeliveryLocationUrl] = useState<string | undefined>(undefined);
  const [deliverySlot, setDeliverySlot] = useState('morning');
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [detectedCoords, setDetectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  // Capture totals before cart is cleared
  const capturedTotalRef = useRef<number | null>(null);
  // Read coupon info from URL search params (passed from cart page)
  const [searchParams] = useSearchParams();
  const couponCode = searchParams.get('coupon') || undefined;
  const couponDiscount = searchParams.get('discount') ? Number(searchParams.get('discount')) : 0;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const subtotal = getCartTotal();
  const discountedSubtotal = couponDiscount ? Math.max(0, subtotal - couponDiscount) : subtotal;
  const delivery = discountedSubtotal > FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = discountedSubtotal + delivery;

  const handlePlaceOrder = async () => {
    if (isPlacing) return;
    setIsPlacing(true);
    capturedTotalRef.current = subtotal;
    // Build the order object before clearing cart
    const fullAddress = houseNumber.trim() ? `${houseNumber.trim()}, ${address}` : address;
    try {
      await placeOrder(paymentMethod, delivery, fullAddress, deliveryLocationUrl, couponCode, couponDiscount || undefined, deliverySlot);
      // Reconstruct the placed order from store's latest
      const latestOrders = useStore.getState().orders;
      const justPlaced = latestOrders[0];
      if (justPlaced) {
        toast.success('Order placed successfully!');
        navigate(`/orders/${justPlaced.id}`, { 
          replace: true,
          state: { newOrder: true } 
        });
      }
    } catch {
      toast.error('Failed to place order. Please try again.');
      setIsPlacing(false);
    }
  };

  if (cart.length === 0 && !isPlacing) {
    return <Navigate to="/cart" replace />;
  }

  return (
    <div className="py-6 max-w-4xl mx-auto">
      <h1 className="text-[24px] mb-6" style={{ fontWeight: 700 }}>Checkout</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-5">
          {/* Delivery Address */}
          <div className="bg-white border border-border/80 rounded-2xl p-5 shadow-sm">
            <h3 className="text-[16px] flex items-center gap-2 mb-4" style={{ fontWeight: 600 }}>
              <MapPin className="w-5 h-5 text-primary" /> Delivery Address
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-[12px] text-muted-foreground block mb-1">House / Flat / Building no.</label>
                <input
                  type="text"
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-lg bg-input-background text-[14px] outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. 42, Flat 3A, Tower B"
                />
              </div>
              <div className="flex gap-2">
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className="flex-1 px-4 py-3 border rounded-lg bg-input-background text-[14px] outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Street, area, city, state, pincode"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!navigator.geolocation) {
                      toast.error('Location is not supported by your browser');
                      return;
                    }
                    setIsLocating(true);
                    try {
                      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                          enableHighAccuracy: true,
                          timeout: 10000,
                          maximumAge: 60000,
                        });
                      });
                      const { latitude, longitude } = position.coords;
                      const { address: locAddress, houseNumber: locHouse } = await reverseGeocode(latitude, longitude);
                      setAddress(locAddress);
                      setHouseNumber(locHouse || '');
                      setDetectedCoords({ lat: latitude, lng: longitude });
                      setDeliveryLocationUrl(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`);
                      toast.success(locHouse ? 'Address with house no. filled.' : 'Location filled. Add house/flat no. if needed.');
                    } catch (err) {
                      const msg = err instanceof Error ? err.message : 'Unknown error';
                      if (msg.includes('denied') || msg.includes('Permission')) {
                        toast.error('Location permission denied. Allow location access or enter address manually.');
                      } else if (msg.includes('unavailable') || msg.includes('timeout')) {
                        toast.error('Location unavailable. Check GPS or enter address manually.');
                      } else {
                        toast.error('Could not get address from Google Maps. Enter manually.');
                      }
                    } finally {
                      setIsLocating(false);
                    }
                  }}
                  disabled={isLocating}
                  className="shrink-0 flex flex-col items-center justify-center gap-1 px-3 py-2 border border-primary/30 rounded-lg bg-primary/5 text-primary hover:bg-primary/10 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  title="Use current location (Google Maps / device GPS)"
                >
                  <Locate className="w-5 h-5" />
                  <span className="text-[11px]" style={{ fontWeight: 600 }}>{isLocating ? 'Getting…' : 'Current location'}</span>
                </button>
              </div>

              {/* Embedded Google Map preview */}
              {detectedCoords && (
                <div className="mt-3 relative rounded-xl overflow-hidden border border-border/60 shadow-sm">
                  <div className="w-full h-[220px] bg-slate-50 relative">
                    {import.meta.env.VITE_GOOGLE_MAPS_API_KEY && import.meta.env.VITE_GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY' ? (
                      <iframe
                        title="Delivery location"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=${detectedCoords.lat},${detectedCoords.lng}&zoom=16`}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                          <MapPin className="w-6 h-6 text-primary" />
                        </div>
                        <p className="text-[13px] font-semibold text-slate-700">Location Pinned</p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Latitude: {detectedCoords.lat.toFixed(4)}, Longitude: {detectedCoords.lng.toFixed(4)}
                        </p>
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${detectedCoords.lat},${detectedCoords.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 text-[12px] text-primary hover:underline font-medium"
                        >
                          View on Google Maps
                        </a>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => { setDetectedCoords(null); setDeliveryLocationUrl(undefined); }}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-red-50 transition-colors group z-10"
                      title="Remove pin"
                    >
                      <X className="w-3.5 h-3.5 text-gray-500 group-hover:text-red-500" />
                    </button>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent p-3 pointer-events-none">
                    <p className="text-white text-[11px] flex items-center gap-1" style={{ fontWeight: 500 }}>
                      <MapPin className="w-3 h-3" /> Location pinned
                    </p>
                  </div>
                </div>
              )}

              <p className="text-[12px] text-muted-foreground mt-2">Allow location access when prompted. Add house/flat no. above if it wasn’t detected.</p>
            </div>
          </div>

          {/* Delivery Slot */}
          <div className="bg-white border border-border/80 rounded-2xl p-5 shadow-sm">
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
                  className={`p-3 rounded-xl border transition-all ${deliverySlot === slot.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'hover:bg-gray-50'}`}
                >
                  <p className="text-[14px]" style={{ fontWeight: 500 }}>{slot.label}</p>
                  <p className="text-[12px] text-muted-foreground">{slot.time}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white border border-border/80 rounded-2xl p-5 shadow-sm">
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
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${paymentMethod === method.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'hover:bg-gray-50'}`}
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
          <div className="bg-white border border-border/80 rounded-2xl p-5 sticky top-40 space-y-4 shadow-sm">
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
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>Rs.{subtotal.toLocaleString()}</span></div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-primary">
                  <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> Coupon ({couponCode})</span>
                  <span>-Rs.{couponDiscount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className={delivery === 0 ? 'text-primary' : ''}>{delivery === 0 ? 'FREE' : `Rs.${delivery}`}</span></div>
              <hr />
              <div className="flex justify-between text-[18px]"><span style={{ fontWeight: 700 }}>Total</span><span style={{ fontWeight: 700 }}>Rs.{total.toLocaleString()}</span></div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isPlacing}
              className="w-full py-3.5 bg-primary text-white rounded-xl hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 transition-all text-[15px] disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
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