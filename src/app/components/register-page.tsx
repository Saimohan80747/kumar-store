import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router';
import {
  User, Store, Mail, Phone, MapPin, Lock, Eye, EyeOff, ArrowRight,
  CheckCircle2, Clock, Loader2, ShieldCheck, Sparkles, Globe, Locate,
  ArrowLeft, Heart, Zap, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

/** Reverse geocode lat/lng to a human-readable address.
 *  Tries Google Maps Geocoding first; falls back to OpenStreetMap Nominatim.
 */
async function reverseGeocode(lat: number, lon: number): Promise<string> {
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
          return data.results[0].formatted_address;
        }
      }
    } catch { /* Google failed, try fallback */ }
  }

  // 2. Fallback: OpenStreetMap Nominatim (free, no API key, CORS-friendly)
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

const BENEFITS = {
  customer: [
    { icon: Zap, title: 'Instant Access', desc: 'Shop right away after sign up' },
    { icon: Heart, title: 'Personalized', desc: 'Get smart picks for you' },
    { icon: MapPin, title: 'Easy Tracking', desc: 'Track every order step' },
  ],
  shopowner: [
    { icon: Store, title: 'Wholesale Rates', desc: 'Up to 30% off retail prices' },
    { icon: ShieldCheck, title: 'Credit Limit', desc: 'Up to Rs.50,000 credit line' },
    { icon: Zap, title: 'Bulk Tools', desc: 'Manage massive orders easily' },
  ]
};

/** Onboarding structure and validation for new user creation. */
/** Onboarding structure and validation for new user creation. */
/** Onboarding structure and validation for new user creation. */
/** Onboarding structure and validation for new user creation. */
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
    honeypot: '', // Honeypot field to catch bots
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

    // 1. Bot check (Honeypot)
    if (form.honeypot) {
      console.warn('Bot submission detected via honeypot');
      toast.error('Submission rejected due to security policy violation.');
      return;
    }

    // 2. Check global block status
    const isLocalBlocked = localStorage.getItem('admin_account_blocked') === 'true';
    if (isLocalBlocked) {
      toast.error('This device has been restricted from creating new accounts due to security violations.', { duration: 5000 });
      return;
    }

    // 3. Check if the email or phone is already blocked in the database
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
    
    // 4. Enhanced Password Validation (only required for non-Google users)
    if (!googlePrefilled) {
      if (!form.password) { toast.error('Please create a password'); return; }
      
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(form.password)) {
        toast.error('Security Upgrade: Password must be at least 8 characters, include uppercase, lowercase, number, and special character (@$!%*?&)');
        return;
      }

      if (form.password !== form.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
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
      <div className="min-h-screen flex items-center justify-center py-10 px-4 bg-slate-50 relative overflow-hidden">
        {/* Background Sparkles */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.1, duration: 1 }}
              className="absolute w-2 h-2 bg-primary rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>

        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-lg bg-white p-8 sm:p-12 rounded-[40px] shadow-premium-lg border border-slate-100 relative z-10"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12 }}
            className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 ${
              role === 'shopowner' ? 'bg-amber-50 shadow-amber-500/10' : 'bg-primary/5 shadow-primary/10'
            } shadow-2xl`}
          >
            {role === 'shopowner' ? (
              <Clock className="w-12 h-12 text-amber-500" />
            ) : (
              <CheckCircle2 className="w-12 h-12 text-primary" />
            )}
          </motion.div>

          {role === 'shopowner' ? (
            <>
              <h1 className="text-[32px] tracking-tight leading-tight" style={{ fontWeight: 900 }}>Request Submitted!</h1>
              <p className="text-slate-500 mt-4 text-[16px] max-w-sm mx-auto font-medium">
                Your shop owner registration is pending admin approval. You'll be able to sign in once approved.
              </p>
              
              <div className="bg-amber-50/50 border border-amber-200/60 rounded-3xl p-6 mt-8 text-left space-y-4">
                <p className="text-[13px] font-black text-amber-900 uppercase tracking-widest">Verification Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                      <Store className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-amber-800 uppercase">Shop Name</p>
                      <p className="text-[14px] font-black text-amber-900">{form.shopName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-amber-800 uppercase">Location</p>
                      <p className="text-[14px] font-black text-amber-900 truncate">{form.shopLocation}</p>
                    </div>
                  </div>
                </div>
                <hr className="border-amber-200/50" />
                <div className="flex items-start gap-3 p-3 bg-white/50 rounded-2xl">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-amber-800 leading-relaxed font-medium">
                    Typical approval time: <span className="font-black">24-48 hours</span>. We will notify you via email once your account is activated.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-[32px] tracking-tight leading-tight" style={{ fontWeight: 900 }}>Welcome to the Club!</h1>
              <p className="text-slate-500 mt-4 text-[16px] font-medium">
                Your account is ready. Get ready for India's finest shopping experience.
              </p>
              <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 mt-8 flex flex-col items-center">
                <Sparkles className="w-8 h-8 text-primary mb-3 animate-pulse" />
                <p className="text-primary text-[15px] font-black uppercase tracking-widest">Account Active</p>
                <div className="mt-4 space-y-1">
                  <p className="text-slate-600 text-[14px] font-bold">{form.name}</p>
                  <p className="text-slate-400 text-[13px]">{form.email}</p>
                </div>
              </div>
            </>
          )}

          <div className="mt-10 flex flex-col gap-3">
            <button
              onClick={() => navigate('/login')}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[16px] font-black uppercase tracking-widest inline-flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-[0.98]"
            >
              Go to Sign In <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-4 bg-white border-2 border-slate-100 text-slate-500 rounded-2xl text-[16px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-[0.98]"
            >
              Back to Home
            </button>
          </div>
        </motion.div>
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

  const calculatePasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[@$!%*?&]/.test(pass)) strength++;
    return strength;
  };

  const passwordStrength = calculatePasswordStrength(form.password);
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['', 'bg-red-500', 'bg-orange-500', 'bg-blue-500', 'bg-emerald-500'];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white relative overflow-hidden">
      {/* Left: Branding & Benefits (Desktop) */}
      <div className="hidden lg:flex lg:w-[40%] bg-slate-900 relative p-12 flex-col justify-between overflow-hidden">
        {/* Abstract shapes for depth */}
        <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-emerald-500 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-xl">
              <Store className="w-6 h-6 text-slate-900" />
            </div>
            <span className="text-white text-[24px]" style={{ fontWeight: 900 }}>Kumar Store</span>
          </Link>

          <div className="mt-20">
            <h2 className="text-white text-[48px] leading-[1.1] tracking-tighter" style={{ fontWeight: 950 }}>
              Join India's Most <br />
              <span className="text-primary">Trusted Marketplace</span>
            </h2>
            <p className="text-white/50 mt-6 text-[18px] max-w-sm font-bold">
              Whether you're a shopper or a business, we've got something special for you.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <AnimatePresence mode="wait">
            <motion.div 
              key={role}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {BENEFITS[role].map((b, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors">
                    <b.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-white font-black uppercase tracking-widest text-[14px]">{b.title}</p>
                    <p className="text-white/40 text-[13px] font-bold">{b.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>

          <div className="pt-8 border-t border-white/10 flex items-center gap-6">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?u=${i}`} alt="" />
                </div>
              ))}
            </div>
            <p className="text-white/40 text-[12px] font-bold uppercase tracking-widest">
              Join 10,000+ happy users
            </p>
          </div>
        </div>
      </div>

      {/* Right: Registration Form */}
      <div className="flex-1 min-h-screen flex flex-col p-6 sm:p-12 lg:p-20 overflow-y-auto">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Back Button */}
          <Link to="/" className="lg:hidden inline-flex items-center gap-2 text-slate-400 font-bold text-[13px] uppercase tracking-widest mb-8">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>

          <div className="mb-10">
            <h1 className="text-[36px] tracking-tighter" style={{ fontWeight: 950 }}>Create Account</h1>
            <p className="text-slate-400 font-bold mt-1">Indian platform for wholesale & retail</p>
          </div>

          {/* Role Selection */}
          <div className="bg-slate-50 p-1.5 rounded-[24px] grid grid-cols-2 gap-2 mb-10 ring-1 ring-slate-100">
            {(['customer', 'shopowner'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`py-3.5 rounded-[20px] transition-all duration-500 relative ${
                  role === r ? 'bg-white shadow-premium-lg' : 'hover:bg-white/50 text-slate-400'
                }`}
              >
                <div className="relative z-10 flex flex-col items-center gap-0.5">
                  <span className={`text-[14px] font-black uppercase tracking-widest ${role === r ? 'text-slate-900' : 'text-slate-400'}`}>
                    {r === 'customer' ? 'Customer' : 'Shop Owner'}
                  </span>
                  <p className="text-[10px] font-bold opacity-50">{r === 'customer' ? 'Shop at MRP' : 'Wholesale rates'}</p>
                </div>
                {role === r && (
                  <motion.div 
                    layoutId="role-bg"
                    className="absolute inset-0 bg-white rounded-[20px] shadow-sm"
                  />
                )}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Lang */}
            <div className="space-y-2">
              <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">Preferred Language</label>
              <div className="relative group">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                <select
                  value={form.language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-[14px] appearance-none"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi (हिन्दी)</option>
                  <option value="te">Telugu (తెలుగు)</option>
                  <option value="ta">Tamil (தமிழ்)</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Section: Basic Info */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-primary rounded-full" />
                <h3 className="text-[14px] font-black uppercase tracking-widest text-slate-900">Personal Details</h3>
              </div>

              {/* Name */}
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input 
                  value={form.name} 
                  onChange={(e) => update('name', e.target.value)} 
                  placeholder="Full Name" 
                  className={`w-full pl-12 pr-12 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-[14px] ${googlePrefilled ? 'bg-emerald-50/30' : ''}`}
                  disabled={loading || googlePrefilled} 
                  required 
                />
                {googlePrefilled && <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />}
              </div>

              {/* Email */}
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input 
                  type="email" 
                  value={form.email} 
                  onChange={(e) => update('email', e.target.value)} 
                  placeholder="Email Address" 
                  className={`w-full pl-12 pr-12 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-[14px] ${googlePrefilled ? 'bg-emerald-50/30' : ''}`}
                  disabled={loading || googlePrefilled} 
                  required 
                />
                {googlePrefilled && <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />}
              </div>

              {/* Phone */}
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                <span className="absolute left-12 top-1/2 -translate-y-1/2 text-[14px] font-bold text-slate-400">+91</span>
                <input 
                  type="tel" 
                  value={form.phone} 
                  onChange={(e) => update('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} 
                  placeholder="10-digit number" 
                  className="w-full pl-[74px] pr-12 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-[14px]"
                  maxLength={10}
                  disabled={loading} 
                  required 
                />
                {form.phone.length === 10 && <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />}
              </div>
            </div>

            {/* Shop Fields */}
            {role === 'shopowner' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4 pt-6"
              >
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-primary rounded-full" />
                  <h3 className="text-[14px] font-black uppercase tracking-widest text-slate-900">Shop Information</h3>
                </div>

                <div className="relative group">
                  <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <input value={form.shopName} onChange={(e) => update('shopName', e.target.value)} placeholder="Shop Name" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-[14px]" disabled={loading} required />
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1 group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input value={form.shopLocation} onChange={(e) => update('shopLocation', e.target.value)} placeholder="Shop Address" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-[14px]" disabled={loading} required />
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!navigator.geolocation) { toast.error('Location not supported'); return; }
                      setIsLocating(true);
                      try {
                        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true });
                        });
                        const fullAddress = await reverseGeocode(position.coords.latitude, position.coords.longitude);
                        setForm(f => ({ ...f, shopLocation: fullAddress }));
                        toast.success('Location detected!');
                      } catch (err) {
                        toast.error('Location failed. Enter manually.');
                      } finally { setIsLocating(false); }
                    }}
                    disabled={isLocating}
                    className="w-14 h-14 rounded-2xl bg-primary/5 text-primary flex items-center justify-center hover:bg-primary/10 transition-colors disabled:opacity-50"
                  >
                    {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Locate className="w-5 h-5" />}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Security */}
            {!googlePrefilled && (
              <div className="space-y-4 pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-primary rounded-full" />
                  <h3 className="text-[14px] font-black uppercase tracking-widest text-slate-900">Security</h3>
                </div>

                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={form.password} 
                    onChange={(e) => update('password', e.target.value)} 
                    placeholder="Create Password" 
                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-[14px]"
                    disabled={loading} 
                    required 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {form.password && (
                  <div className="space-y-2 px-1">
                    <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                      <span className="text-slate-400">Security Strength: {strengthLabels[passwordStrength]}</span>
                      <span className={passwordStrength >= 4 ? 'text-emerald-500' : 'text-slate-400'}>
                        {passwordStrength >= 4 ? 'Verified Secure' : 'Weak (Add Uppercase/Number/Symbol)'}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div 
                          key={i} 
                          className={`h-full flex-1 rounded-full transition-all duration-500 ${
                            passwordStrength >= i ? strengthColors[passwordStrength] : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <input 
                    type={showConfirm ? 'text' : 'password'} 
                    value={form.confirmPassword} 
                    onChange={(e) => update('confirmPassword', e.target.value)} 
                    placeholder="Confirm Password" 
                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-[14px]"
                    disabled={loading} 
                    required 
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showConfirm ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Action */}
            <div className="pt-8 space-y-6">
              {/* Honeypot field (Anti-bot) */}
              <div className="hidden" aria-hidden="true">
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.honeypot}
                  onChange={(e) => update('honeypot', e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    {role === 'shopowner' ? 'Request Approval' : 'Create Account'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-[12px] font-black text-slate-300 uppercase tracking-widest">or sign up with</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full py-4 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center gap-3 font-bold text-[15px] hover:bg-slate-50 transition-all active:scale-[0.98]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </button>
            </div>
          </form>

          <div className="mt-12 text-center pb-12">
            <p className="text-[14px] text-slate-400 font-bold">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
