import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router';
import {
  User, Store, Mail, Phone, MapPin, Lock, Eye, EyeOff, ArrowRight,
  CheckCircle2, Clock, Loader2, ShieldCheck, UserPlus, Sparkles, Globe, Locate
} from 'lucide-react';

/** Reverse geocode lat/lng to a human-readable address.
 *  Tries Google Maps Geocoding first; falls back to OpenStreetMap Nominatim.
 */
async function reverseGeocode(lat: number, lon: number): Promise<string> {
  // 1. Try Google Maps Geocoding API
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${apiKey}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'OK' && data.results?.length > 0) {
          return data.results[0].formatted_address;
        }
      }
    } catch { /* Google failed, try fallback */ }
  }

  // 2. Fallback: OpenStreetMap Nominatim (free, no API key, CORS-friendly)
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (res.ok) {
      const data = await res.json();
      const addr = data.address;
      if (addr && typeof addr === 'object') {
        const houseNumber = addr.house_number || addr.house_name || '';
        const road = addr.road || addr.footway || addr.pedestrian || '';
        const street = [houseNumber, road].filter(Boolean).join(' ');
        const place = addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.city || addr.municipality || '';
        const state = addr.state || addr.province || '';
        const postcode = addr.postcode || '';
        const country = addr.country || '';
        const parts = [street, place, state, postcode, country].filter(Boolean);
        if (parts.length > 0) return parts.join(', ');
      }
      if (data.display_name) return data.display_name;
    }
  } catch { /* Nominatim also failed */ }

  // 3. Last resort: return raw coordinates as readable text
  return `Lat ${lat.toFixed(6)}, Lng ${lon.toFixed(6)}`;
}
import { useStore } from '../store';
import { toast } from 'sonner';
import { supabase } from '../services/supabase';

export function RegisterPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const registerCustomer = useStore((s) => s.registerCustomer);
  const registerShopOwner = useStore((s) => s.registerShopOwner);
  const registeredUsers = useStore((s) => s.registeredUsers);
  const shopRequests = useStore((s) => s.shopRequests);
  const loginWithGoogle = useStore((s) => s.loginWithGoogle);

  const prefill = (location.state as any)?.prefill || {};
  const isGoogleAuth = (location.state as any)?.googleAuth || false;

  const [role, setRole] = useState<'customer' | 'shopowner'>(prefill.role || (searchParams.get('role') as any) || 'customer');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: prefill.email || '',
    phone: '',
    password: prefill.password || '',
    confirmPassword: prefill.password || '',
    shopName: '',
    shopLocation: '',
    shopLocationUrl: '',
    language: 'en',
  });
  const [googlePrefilled, setGooglePrefilled] = useState(false);
  const [googleUserId, setGoogleUserId] = useState<string | null>(null);

  // Handle Google Auth Trigger
  useEffect(() => {
    if (isGoogleAuth) {
      loginWithGoogle();
    }
  }, [isGoogleAuth, loginWithGoogle]);

  // Detect Google OAuth return and pre-fill form
  useEffect(() => {
    const checkGoogleReturn = async () => {
      // Check if we have hash params from OAuth redirect
      const hash = window.location.hash;
      if (!hash || !hash.includes('access_token')) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const u = session.user;
          const meta = u.user_metadata || {};
          const googleName = meta.full_name || meta.name || '';
          const googleEmail = u.email || '';

          // 1. Check if user already exists
          const existingUser = registeredUsers.find(ru => ru.email === googleEmail);
          const existingReq = shopRequests.find(sr => sr.email === googleEmail);

          if (existingUser || existingReq) {
            toast.success(`Welcome back ${googleName}!`);
            if (existingUser?.role === 'shopowner' || existingReq?.status === 'pending') {
              navigate('/shop-dashboard');
            } else {
              navigate('/');
            }
            return;
          }

          // 2. If new, pre-fill the form with Google data
          setForm(prev => ({
            ...prev,
            name: googleName,
            email: googleEmail,
          }));
          setGooglePrefilled(true);
          setGoogleUserId(u.id);

          // Clear the hash from URL without reload
          window.history.replaceState(null, '', window.location.pathname + window.location.search);

          toast.success(`Welcome ${googleName}! Please fill in the remaining details to create your account.`);
        }
      } catch (err) {
        console.error('Error checking Google session:', err);
      }
    };

    checkGoogleReturn();
  }, [registeredUsers, shopRequests, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check global block status
    const isLocalBlocked = localStorage.getItem('admin_account_blocked') === 'true';
    if (isLocalBlocked) {
      toast.error('This device has been restricted from creating new accounts due to security violations.', { duration: 5000 });
      return;
    }

    // Check if the email or phone is already blocked in the database
    const isBlockedUser = registeredUsers.some(u => 
      u.blocked && (u.email.toLowerCase() === form.email.trim().toLowerCase() || u.phone.trim() === form.phone.trim())
    );

    if (isBlockedUser) {
      toast.error('This email or phone number is permanently blocked from our platform.', { duration: 5000 });
      return;
    }

    // Validation
    if (!form.name.trim()) { toast.error('Please enter your full name'); return; }
    if (!form.email.trim()) { toast.error('Please enter your email address'); return; }
    if (!form.phone.trim()) { toast.error('Please enter your phone number'); return; }
    if (form.phone.trim().length < 10) { toast.error('Please enter a valid 10-digit phone number'); return; }
    // Password only required for non-Google users
    if (!googlePrefilled) {
      if (!form.password) { toast.error('Please create a password'); return; }
      if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
      if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    }

    // Remove manual local checks as Supabase will handle email uniqueness verification
    if (role === 'shopowner') {
      if (!form.shopName.trim()) { toast.error('Please enter your shop name'); return; }
      if (!form.shopLocation.trim()) { toast.error('Please enter your shop location'); return; }
    }

    setLoading(true);
    try {
      if (googlePrefilled && googleUserId) {
        // Google user: update their metadata with the extra fields and sync to backend
        const updateMeta: any = {
          phone: form.phone.trim(),
          role: role,
          language: form.language,
        };
        if (role === 'shopowner') {
          updateMeta.shopName = form.shopName.trim();
          updateMeta.shopLocation = form.shopLocation.trim();
          updateMeta.shopLocationUrl = form.shopLocationUrl.trim();
        }
        // Update the Supabase Auth user metadata
        await supabase.auth.updateUser({ data: updateMeta });

        // Also sync to backend tables
        if (role === 'shopowner') {
          const { createShopRequest } = await import('../api');
          await createShopRequest({
            id: googleUserId,
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            shopName: form.shopName.trim(),
            shopLocation: form.shopLocation.trim(),
            shopLocationUrl: form.shopLocationUrl.trim(),
            password: '',
          });
          toast.success('Registration submitted for admin approval!');
        } else {
          // Customer - update kumar_customer_users with phone
          try {
            const { updateUser } = await import('../api');
            await updateUser(googleUserId, { phone: form.phone.trim(), name: form.name.trim() });
          } catch { /* updateUser may not be available, try direct db */ }
          // Also try direct upsert to kumar_customer_users
          await supabase.from('kumar_customer_users').upsert({
            id: googleUserId,
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            role: 'customer',
            language: form.language,
          }, { onConflict: 'id' });
          toast.success('Account setup complete!');
          navigate('/');
          return;
        }
        setSubmitted(true);
      } else if (role === 'shopowner') {
        const res = await registerShopOwner({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          shopName: form.shopName.trim(),
          shopLocation: form.shopLocation.trim(),
          shopLocationUrl: form.shopLocationUrl.trim(),
          password: form.password,
          language: form.language,
        });
        if (!res.success) throw new Error(res.error);
        toast.success('Registration submitted for admin approval!');
        setSubmitted(true);
      } else {
        const res = await registerCustomer({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
          language: form.language,
        });
        if (!res.success) throw new Error(res.error);
        toast.success('Account created successfully!');
        setSubmitted(true);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      // Redirect back to /register after OAuth so we can pre-fill the form
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/register?role=${role}` }
      });
    } catch (err: any) {
      toast.error(err.message || 'Google signup failed');
    }
  };

  // ─── Success screen ───
  if (submitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
        <div className="text-center max-w-md">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${role === 'shopowner' ? 'bg-amber-50 border-2 border-amber-200' : 'bg-primary/10 border-2 border-primary/20'
            }`}>
            {role === 'shopowner' ? (
              <Clock className="w-10 h-10 text-amber-500" />
            ) : (
              <CheckCircle2 className="w-10 h-10 text-primary" />
            )}
          </div>

          {role === 'shopowner' ? (
            <>
              <h1 className="text-[28px]" style={{ fontWeight: 800 }}>Registration Submitted!</h1>
              <p className="text-muted-foreground mt-3 text-[15px] max-w-sm mx-auto">
                Your shop owner registration is pending admin approval. You'll be able to sign in once approved.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mt-6 text-left">
                <p className="text-[14px] text-amber-800 mb-3" style={{ fontWeight: 600 }}>Registration Details</p>
                <div className="text-[14px] text-amber-800 space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <Store className="w-4 h-4 shrink-0" />
                    <span style={{ fontWeight: 500 }}>{form.shopName}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>{form.shopLocation}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 shrink-0" />
                    <span>{form.email}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 shrink-0" />
                    <span>{form.phone}</span>
                  </div>
                </div>
                <hr className="my-3.5 border-amber-200" />
                <div className="flex items-start gap-2 text-[13px] text-amber-700">
                  <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>Typical approval time: 24-48 hours. You'll be notified once your account is approved.</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-[28px]" style={{ fontWeight: 800 }}>Welcome to Kumar Store!</h1>
              <p className="text-muted-foreground mt-3 text-[15px]">
                Your account has been created successfully. You can now sign in and start shopping!
              </p>
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 mt-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <p className="text-primary text-[15px]" style={{ fontWeight: 600 }}>Account Ready</p>
                </div>
                <p className="text-muted-foreground text-[14px]">Email: <span style={{ fontWeight: 500 }}>{form.email}</span></p>
                <p className="text-muted-foreground text-[14px]">Name: <span style={{ fontWeight: 500 }}>{form.name}</span></p>
              </div>
            </>
          )}

          <button
            onClick={() => navigate('/login')}
            className="mt-6 px-8 py-3.5 bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl text-[15px] inline-flex items-center gap-2 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-[0.99]"
            style={{ fontWeight: 600 }}
          >
            Go to Sign In <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleLanguageChange = (lang: string) => {
    update('language', lang);
    const selectField = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
    if (selectField) {
      selectField.value = lang;
      selectField.dispatchEvent(new Event('change'));
    }
  };

  const passwordStrength = form.password.length === 0 ? 0 : form.password.length < 6 ? 1 : form.password.length < 10 ? 2 : 3;
  const strengthLabels = ['', 'Weak', 'Good', 'Strong'];
  const strengthColors = ['', 'bg-red-400', 'bg-amber-400', 'bg-primary'];

  return (
    <div className="min-h-[85vh] flex items-start lg:items-center justify-center py-6 sm:py-10 px-4 relative">
      <div className="w-full max-w-lg relative z-10 pb-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/25">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-[30px]" style={{ fontWeight: 800 }}>Create Account</h1>
          <p className="text-muted-foreground mt-1 text-[15px]">Join Kumar Store — India's trusted wholesale & retail platform</p>
        </div>

        {/* Role Tabs */}
        <div className="bg-gray-100 rounded-xl p-1 grid grid-cols-2 gap-1 mb-6">
          {([
            { id: 'customer' as const, label: 'Customer', desc: 'Shop at MRP prices', icon: User },
            { id: 'shopowner' as const, label: 'Shop Owner', desc: 'Get wholesale prices', icon: Store },
          ]).map((r) => (
            <button
              key={r.id}
              onClick={() => setRole(r.id)}
              className={`relative p-3.5 rounded-lg text-center transition-all duration-200 ${role === r.id ? 'bg-white shadow-sm' : 'hover:bg-gray-50'
                }`}
            >
              <div className="flex items-center justify-center gap-2">
                <r.icon className={`w-4.5 h-4.5 ${role === r.id ? 'text-primary' : 'text-gray-400'}`} />
                <span className={`text-[14px] ${role === r.id ? 'text-foreground' : 'text-gray-500'}`} style={{ fontWeight: role === r.id ? 600 : 400 }}>
                  {r.label}
                </span>
              </div>
              <p className={`text-[11px] mt-0.5 ${role === r.id ? 'text-primary' : 'text-gray-400'}`}>{r.desc}</p>
              {role === r.id && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Shop Owner Approval Notice */}
        {role === 'shopowner' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-4 text-[13px] text-amber-800 flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p style={{ fontWeight: 600 }}>Admin Approval Required</p>
              <p className="mt-0.5">Shop owner accounts need admin approval before you can sign in. Your request will be reviewed within 24-48 hours.</p>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="bg-white border rounded-2xl p-6 space-y-4 shadow-sm">

          {/* Language Preference */}
          <div>
            <label className="text-[13px] text-muted-foreground mb-1 block" style={{ fontWeight: 500 }}>Preferred Language</label>
            <div className={`flex items-center border rounded-xl bg-gray-50 focus-within:border-primary/50`}>
              <Globe className="w-4 h-4 ml-3.5 text-primary" />
              <select
                value={form.language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="flex-1 px-3 py-2.5 bg-transparent outline-none text-[14px]"
                disabled={loading}
              >
                <option value="en">English (English)</option>
                <option value="hi">Hindi (हिन्दी)</option>
                <option value="te">Telugu (తెలుగు)</option>
                <option value="ta">Tamil (தமிழ்)</option>
                <option value="mr">Marathi (मराठी)</option>
                <option value="bn">Bengali (বাংলা)</option>
                <option value="gu">Gujarati (ગુજરાતી)</option>
                <option value="kn">Kannada (ಕನ್ನಡ)</option>
              </select>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">The interface will instantly translate to your chosen language.</p>
          </div>

          {/* Section: Personal Info */}
          <div className="flex items-center gap-2 pb-1">
            <User className="w-4 h-4 text-primary" />
            <p className="text-[13px] text-primary" style={{ fontWeight: 600 }}>Personal Information</p>
          </div>

          {/* Full Name */}
          <div>
            <label className="text-[13px] text-muted-foreground mb-1 block" style={{ fontWeight: 500 }}>Full Name *</label>
            <div className={`flex items-center border rounded-xl transition-all duration-200 ${form.name ? 'border-primary/30 bg-primary/[0.02]' : 'bg-gray-50'
              } focus-within:border-primary/50 ${googlePrefilled ? 'bg-emerald-50/50' : ''}`}>
              <User className={`w-4 h-4 ml-3.5 ${form.name ? 'text-primary' : 'text-muted-foreground'}`} />
              <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Enter your full name" className={`flex-1 px-3 py-2.5 bg-transparent outline-none text-[14px] ${googlePrefilled ? 'text-gray-700' : ''}`} disabled={loading || googlePrefilled} required />
              {googlePrefilled && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full mr-3" style={{ fontWeight: 600 }}>Google</span>}
              {!googlePrefilled && form.name.trim().length > 2 && <CheckCircle2 className="w-4 h-4 text-primary/50 mr-3" />}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-[13px] text-muted-foreground mb-1 block" style={{ fontWeight: 500 }}>Email Address *</label>
            <div className={`flex items-center border rounded-xl transition-all duration-200 ${form.email ? 'border-primary/30 bg-primary/[0.02]' : 'bg-gray-50'
              } focus-within:border-primary/50 ${googlePrefilled ? 'bg-emerald-50/50' : ''}`}>
              <Mail className={`w-4 h-4 ml-3.5 ${form.email ? 'text-primary' : 'text-muted-foreground'}`} />
              <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="your@email.com" className={`flex-1 px-3 py-2.5 bg-transparent outline-none text-[14px] ${googlePrefilled ? 'text-gray-700' : ''}`} disabled={loading || googlePrefilled} required />
              {googlePrefilled && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full mr-3" style={{ fontWeight: 600 }}>Google</span>}
              {!googlePrefilled && form.email.includes('@') && form.email.includes('.') && <CheckCircle2 className="w-4 h-4 text-primary/50 mr-3" />}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="text-[13px] text-muted-foreground mb-1 block" style={{ fontWeight: 500 }}>Phone Number *</label>
            <div className={`flex items-center border rounded-xl transition-all duration-200 ${form.phone ? 'border-primary/30 bg-primary/[0.02]' : 'bg-gray-50'
              } focus-within:border-primary/50`}>
              <Phone className={`w-4 h-4 ml-3.5 ${form.phone ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="text-[14px] text-muted-foreground pl-1">+91</span>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit number"
                className="flex-1 px-2 py-2.5 bg-transparent outline-none text-[14px]"
                maxLength={10}
                disabled={loading}
                required
              />
              {form.phone.length === 10 && <CheckCircle2 className="w-4 h-4 text-primary mr-3" />}
            </div>
            {form.phone.length > 0 && form.phone.length < 10 && (
              <p className="text-[12px] text-amber-600 mt-1">{10 - form.phone.length} more digits needed</p>
            )}
          </div>

          {/* Shop Owner Fields */}
          {role === 'shopowner' && (
            <>
              <div className="flex items-center gap-2 pt-2 pb-1">
                <Store className="w-4 h-4 text-primary" />
                <p className="text-[13px] text-primary" style={{ fontWeight: 600 }}>Shop Details</p>
              </div>

              {/* Shop Name */}
              <div>
                <label className="text-[13px] text-muted-foreground mb-1 block" style={{ fontWeight: 500 }}>Shop Name *</label>
                <div className={`flex items-center border rounded-xl transition-all duration-200 ${form.shopName ? 'border-primary/30 bg-primary/[0.02]' : 'bg-gray-50'
                  } focus-within:border-primary/50`}>
                  <Store className={`w-4 h-4 ml-3.5 ${form.shopName ? 'text-primary' : 'text-muted-foreground'}`} />
                  <input value={form.shopName} onChange={(e) => update('shopName', e.target.value)} placeholder="Your shop name" className="flex-1 px-3 py-2.5 bg-transparent outline-none text-[14px]" disabled={loading} required />
                </div>
              </div>

              {/* Shop Location */}
              <div>
                <label className="text-[13px] text-muted-foreground mb-1 block" style={{ fontWeight: 500 }}>Shop Location *</label>
                <div className="flex gap-2">
                  <div className={`flex items-center border rounded-xl flex-1 transition-all duration-200 ${form.shopLocation ? 'border-primary/30 bg-primary/[0.02]' : 'bg-gray-50'
                    } focus-within:border-primary/50`}>
                    <MapPin className={`w-4 h-4 ml-3.5 ${form.shopLocation ? 'text-primary' : 'text-muted-foreground'}`} />
                    <input value={form.shopLocation} onChange={(e) => update('shopLocation', e.target.value)} placeholder="City, State" className="flex-1 px-3 py-2.5 bg-transparent outline-none text-[14px]" disabled={loading} required />
                  </div>
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
                        const fullAddress = await reverseGeocode(latitude, longitude);
                        setForm(f => ({ ...f, shopLocation: fullAddress, shopLocationUrl: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}` }));
                        toast.success('Location detected successfully!');
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
                    className="shrink-0 flex flex-col items-center justify-center gap-1 px-3 border border-primary/30 rounded-xl bg-primary/5 text-primary hover:bg-primary/10 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Locate className="w-5 h-5" />
                    <span className="text-[10px]" style={{ fontWeight: 600 }}>{isLocating ? 'Locating...' : 'Locate'}</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Section: Security - only for non-Google users */}
          {!googlePrefilled && (
            <>
              <div className="flex items-center gap-2 pt-2 pb-1">
                <Lock className="w-4 h-4 text-primary" />
                <p className="text-[13px] text-primary" style={{ fontWeight: 600 }}>Create Password</p>
              </div>

              {/* Password */}
              <div>
                <label className="text-[13px] text-muted-foreground mb-1 block" style={{ fontWeight: 500 }}>Password *</label>
                <div className={`flex items-center border rounded-xl transition-all duration-200 ${form.password ? 'border-primary/30 bg-primary/[0.02]' : 'bg-gray-50'
                  } focus-within:border-primary/50`}>
                  <Lock className={`w-4 h-4 ml-3.5 ${form.password ? 'text-primary' : 'text-muted-foreground'}`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                    placeholder="Min. 6 characters"
                    className="flex-1 px-3 py-2.5 bg-transparent outline-none text-[14px]"
                    disabled={loading}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="pr-3.5 hover:opacity-70 transition-opacity">
                    {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </div>
                {/* Password strength */}
                {form.password.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 flex gap-1">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= passwordStrength ? strengthColors[passwordStrength] : 'bg-gray-200'}`} />
                      ))}
                    </div>
                    <span className={`text-[11px] ${passwordStrength === 1 ? 'text-red-500' : passwordStrength === 2 ? 'text-amber-500' : 'text-primary'}`} style={{ fontWeight: 500 }}>
                      {strengthLabels[passwordStrength]}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-[13px] text-muted-foreground mb-1 block" style={{ fontWeight: 500 }}>Confirm Password *</label>
                <div className={`flex items-center border rounded-xl transition-all duration-200 ${form.confirmPassword ? (form.password === form.confirmPassword ? 'border-primary/30 bg-primary/[0.02]' : 'border-red-300 bg-red-50/30') : 'bg-gray-50'
                  } focus-within:border-primary/50`}>
                  <Lock className={`w-4 h-4 ml-3.5 ${form.confirmPassword ? (form.password === form.confirmPassword ? 'text-primary' : 'text-red-400') : 'text-muted-foreground'}`} />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={(e) => update('confirmPassword', e.target.value)}
                    placeholder="Re-enter password"
                    className="flex-1 px-3 py-2.5 bg-transparent outline-none text-[14px]"
                    disabled={loading}
                    required
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="pr-3.5 hover:opacity-70 transition-opacity">
                    {showConfirm ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </div>
                {form.confirmPassword.length > 0 && form.password !== form.confirmPassword && (
                  <p className="text-[12px] text-red-600 mt-1">Passwords do not match</p>
                )}
                {form.confirmPassword.length > 0 && form.password === form.confirmPassword && (
                  <p className="text-[12px] text-primary mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Passwords match</p>
                )}
              </div>

            </>
          )}

          {/* Google auth note - shown instead of password for Google users */}
          {googlePrefilled && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] text-emerald-800" style={{ fontWeight: 600 }}>Secured with Google</p>
                <p className="text-[12px] text-emerald-700 mt-0.5">Your account is authenticated via Google. No password needed!</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl hover:from-primary/90 hover:to-primary/80 transition-all flex items-center justify-center gap-2.5 text-[15px] disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.99]"
            style={{ fontWeight: 600 }}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                {role === 'shopowner' ? 'Submit for Admin Approval' : 'Create My Account'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Google SSO Divider */}
          <div className="flex items-center gap-3 mt-4 mb-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[12px] text-muted-foreground">or continue with</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2.5 text-[14px] disabled:opacity-70 disabled:cursor-not-allowed shadow-sm active:scale-[0.99] mb-4"
            style={{ fontWeight: 500 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google
          </button>

          {/* Benefits Summary */}
          <div className="bg-gradient-to-br from-gray-50 to-white border rounded-xl p-4 text-[12px]">
            <div className="flex items-center gap-2 mb-2.5">
              <Sparkles className="w-4 h-4 text-primary" />
              <p className="text-foreground text-[13px]" style={{ fontWeight: 600 }}>
                {role === 'customer' ? 'Customer Benefits' : 'Shop Owner Benefits'}
              </p>
            </div>
            {role === 'customer' ? (
              <ul className="space-y-1.5 text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" /> Instant access after registration</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" /> Browse and shop at MRP pricing</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" /> Track orders and manage wishlist</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" /> Free delivery on orders above Rs.999</li>
              </ul>
            ) : (
              <ul className="space-y-1.5 text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" /> Access wholesale pricing (up to 30% off MRP)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" /> Bulk ordering with dedicated dashboard</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" /> Credit account facility up to Rs.50,000</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" /> Priority customer support</li>
              </ul>
            )}
          </div>
        </form>

        {/* Sign In Link */}
        <div className="text-center mt-6 space-y-3">
          <p className="text-[14px] text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline" style={{ fontWeight: 600 }}>Sign In</Link>
          </p>
          <div className="flex items-center justify-center gap-4 text-[12px] text-muted-foreground">
            <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Secure</span>
            <span>•</span>
            <span>Data Protected</span>
            <span>•</span>
            <span>No Spam</span>
          </div>
        </div>
      </div>
    </div>
  );
}
