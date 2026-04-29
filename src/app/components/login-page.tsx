import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { 
  Store, Lock, Mail, ArrowRight, Eye, EyeOff, AlertCircle, 
  Clock, Loader2, ShieldCheck, Sparkles, ArrowLeft,
  Zap, Heart, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store';
import { toast } from 'sonner';

const BENEFITS = {
  customer: [
    { icon: Zap, title: 'Instant Access', desc: 'Shop right away after sign in' },
    { icon: Heart, title: 'Personalized', desc: 'Your favorite items saved' },
    { icon: Shield, title: 'Secure Pay', desc: '100% safe transactions' },
  ],
  shopowner: [
    { icon: Store, title: 'Wholesale Rates', desc: 'Unlock exclusive business pricing' },
    { icon: ShieldCheck, title: 'Credit Limit', desc: 'Manage your business credit' },
    { icon: Zap, title: 'Bulk Tools', desc: 'Fast reordering for your shop' },
  ]
};

/** Authentication entrypoint for existing users. */
/** Authentication entrypoint for existing users. */
/** Authentication entrypoint for existing users. */
/** Authentication entrypoint for existing users. */
export function LoginPage() {
  const login = useStore((s) => s.login);
  const checkEmailExists = useStore((s) => s.checkEmailExists);
  const navigate = useNavigate();
  
  const [role, setRole] = useState<'customer' | 'shopowner'>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<'pending' | 'rejected' | 'error' | ''>('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorType('');

    // Bot check (Honeypot)
    if (honeypot) {
      console.warn('Bot login detected');
      setError('Authentication failed. Please try again.');
      setErrorType('error');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email address');
      setErrorType('error');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      setErrorType('error');
      return;
    }

    setLoading(true);
    try {
      const result = await login(email.trim(), password);

      if (result.success) {
        toast.success("Signed in successfully!");
        if (role === 'shopowner') {
          navigate('/shop-dashboard');
        } else {
          navigate('/');
        }
      } else {
        // Check if user exists on failure
        const exists = await checkEmailExists(email.trim());
        if (!exists) {
          toast.info("Account not found. Redirecting to registration...");
          setTimeout(() => {
            navigate('/register', {
              state: { prefill: { email: email.trim(), password, role } }
            });
          }, 1500);
          return;
        }

        setErrorType('error');
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setErrorType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await navigate('/register', { state: { googleAuth: true, role } });
    } catch (err: any) {
      toast.error(err.message || 'Google sign in failed');
    }
  };

  const handleForgotPassword = () => {
    toast.info('Password recovery is not enabled yet. Use the demo account or contact support for help.');
  };

  const demoCredentials = {
    customer: { email: 'priya@gmail.com', password: 'password123', name: 'Priya Sharma' },
    shopowner: { email: 'raj@kirana.com', password: 'password123', name: 'Raj Kumar' },
  };

  const fillDemo = () => {
    const creds = demoCredentials[role];
    setEmail(creds.email);
    setPassword(creds.password);
    setError('');
    setErrorType('');
    toast.success(`Demo credentials filled for ${creds.name}`);
  };

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
              Welcome Back to <br />
              <span className="text-primary">Your Dashboard</span>
            </h2>
            <p className="text-white/50 mt-6 text-[18px] max-w-sm font-bold">
              Sign in to manage your orders, track deliveries, and access exclusive deals.
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
                  <img src={`https://i.pravatar.cc/100?u=${i + 10}`} alt="" />
                </div>
              ))}
            </div>
            <p className="text-white/40 text-[12px] font-bold uppercase tracking-widest">
              Trusted by 10,000+ Indians
            </p>
          </div>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex-1 min-h-screen flex flex-col p-6 sm:p-12 lg:p-20 overflow-y-auto">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Back Button */}
          <Link to="/" className="lg:hidden inline-flex items-center gap-2 text-slate-400 font-bold text-[13px] uppercase tracking-widest mb-8">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>

          <div className="mb-10">
            <h1 className="text-[36px] tracking-tighter" style={{ fontWeight: 950 }}>Welcome Back</h1>
            <p className="text-slate-400 font-bold mt-1">Sign in to continue your journey</p>
          </div>

          {/* Role Selection */}
          <div className="bg-slate-50 p-1.5 rounded-[24px] grid grid-cols-2 gap-2 mb-10 ring-1 ring-slate-100">
            {(['customer', 'shopowner'] as const).map((r) => (
              <button
                key={r}
                onClick={() => { setRole(r); setError(''); setErrorType(''); }}
                className={`py-3.5 rounded-[20px] transition-all duration-500 relative ${
                  role === r ? 'bg-white shadow-premium-lg' : 'hover:bg-white/50 text-slate-400'
                }`}
              >
                <div className="relative z-10 flex flex-col items-center gap-0.5">
                  <span className={`text-[14px] font-black uppercase tracking-widest ${role === r ? 'text-slate-900' : 'text-slate-400'}`}>
                    {r === 'customer' ? 'Customer' : 'Shop Owner'}
                  </span>
                  <p className="text-[10px] font-bold opacity-50">{r === 'customer' ? 'Personal' : 'Business'}</p>
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

          {/* Error/Status Messages */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mb-6 p-4 rounded-2xl flex items-start gap-3 border ${
                  errorType === 'pending'
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                {errorType === 'pending' ? (
                  <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                )}
                <div className="text-[14px]">
                  <p className="font-black uppercase tracking-tight">
                    {errorType === 'pending' ? 'Approval Pending' : 'Sign In Failed'}
                  </p>
                  <p className="mt-0.5 font-medium opacity-90">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => { setEmail(e.target.value); setError(''); }} 
                    placeholder="name@example.com" 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-[14px]"
                    disabled={loading} 
                    required 
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                  <button type="button" onClick={handleForgotPassword} className="text-[11px] font-black text-primary uppercase tracking-widest hover:underline">Forgot?</button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={password} 
                    onChange={(e) => { setPassword(e.target.value); setError(''); }} 
                    placeholder="••••••••" 
                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-[14px]"
                    disabled={loading} 
                    required 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 space-y-6">
              {/* Honeypot field (Anti-bot) */}
              <div className="hidden" aria-hidden="true">
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    Sign In <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-[12px] font-black text-slate-300 uppercase tracking-widest">or continue with</span>
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

          {/* Demo Account Section */}
          <div className="mt-10 p-6 bg-slate-50 rounded-[32px] border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[14px] font-black text-slate-900 uppercase tracking-tight">Try Demo Account</p>
                <p className="text-[11px] font-bold text-slate-400">One-click sign in for testing</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white p-3 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Email</p>
                <p className="text-[12px] font-bold text-slate-700 truncate">{demoCredentials[role].email}</p>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Password</p>
                <p className="text-[12px] font-bold text-slate-700">password123</p>
              </div>
            </div>

            <button
              onClick={fillDemo}
              className="w-full py-3 bg-primary/10 text-primary rounded-xl text-[13px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all flex items-center justify-center gap-2"
            >
              Fill & Sign In <Zap className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>

          <div className="mt-12 text-center pb-12">
            <p className="text-[14px] text-slate-400 font-bold">
              New to Kumar Store?{' '}
              <Link to="/register" className="text-primary hover:underline">Create Account</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
