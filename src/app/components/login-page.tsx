import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { User, Store, Lock, Mail, ArrowRight, Eye, EyeOff, AlertCircle, Clock, XCircle, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { useStore } from '../store';
import { toast } from 'sonner';

export function LoginPage() {
  const login = useStore((s) => s.login);
  const checkEmailExists = useStore((s) => s.checkEmailExists);
  const navigate = useNavigate();
  const [role, setRole] = useState<'customer' | 'shopowner'>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<'pending' | 'rejected' | 'error' | ''>('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorType('');

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
      if (!loading) setLoading(false); // Only unset if we didn't redirect
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      // For Google, we redirect to /register first to check if they exist
      // The register page already has clean logic for Google OAuth pre-fill
      await navigate('/register', { state: { googleAuth: true, role } });
    } catch (err: any) {
      toast.error(err.message || 'Google sign in failed');
    }
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
    <div className="min-h-[85vh] flex items-start lg:items-center justify-center py-6 sm:py-10 px-4 relative overflow-x-hidden">
      {/* Animated gradient orbs */}
      <div className="orb orb-primary w-96 h-96 -top-32 -right-32 animate-float-slow" />
      <div className="orb orb-emerald w-72 h-72 -bottom-24 -left-24 animate-float-slow" style={{ animationDelay: '2s' }} />
      <div className="orb orb-teal w-56 h-56 top-1/3 -right-16 animate-float-slow" style={{ animationDelay: '4s' }} />
      <div className="w-full max-w-md relative z-10 pb-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-shadow glow-primary animate-float">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-[30px]" style={{ fontWeight: 800, letterSpacing: '-0.02em' }}>Welcome Back</h1>
          <p className="text-muted-foreground mt-1.5 text-[15px]">Sign in to your Kumar Store account</p>
        </div>

        {/* Role Tabs */}
        <div className="bg-gray-100 rounded-2xl p-1.5 grid grid-cols-2 gap-1 mb-6">
          {([
            { id: 'customer' as const, label: 'Customer', icon: User, desc: 'Shop at MRP prices' },
            { id: 'shopowner' as const, label: 'Shop Owner', icon: Store, desc: 'Wholesale pricing' },
          ]).map((r) => (
            <button
              key={r.id}
              onClick={() => { setRole(r.id); setError(''); setErrorType(''); setEmail(''); setPassword(''); }}
              className={`relative p-3.5 rounded-xl text-center transition-all duration-200 ${role === r.id
                ? 'bg-white shadow-sm'
                : 'hover:bg-gray-50'
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

        {/* Error/Status Messages */}
        {error && (
          <div className={`mb-4 p-4 rounded-xl flex items-start gap-3 text-[14px] animate-in slide-in-from-top-2 duration-200 ${errorType === 'pending'
            ? 'bg-amber-50 border border-amber-200 text-amber-800'
            : errorType === 'rejected'
              ? 'bg-red-50 border border-red-200 text-red-800'
              : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
            {errorType === 'pending' ? (
              <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            ) : errorType === 'rejected' ? (
              <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            )}
            <div>
              <p style={{ fontWeight: 600 }}>
                {errorType === 'pending' ? 'Approval Pending' : errorType === 'rejected' ? 'Registration Rejected' : 'Sign In Failed'}
              </p>
              <p className="mt-0.5 text-[13px]">{error}</p>
              {errorType === 'pending' && (
                <p className="mt-2 text-[12px] opacity-80">Your registration is being reviewed. You'll receive access once approved by the admin.</p>
              )}
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="bg-white/90 backdrop-blur-xl border border-border/80 rounded-2xl p-6 space-y-5 shadow-premium-lg">
          {/* Email */}
          <div>
            <label className="text-[13px] text-muted-foreground mb-1.5 block" style={{ fontWeight: 500 }}>Email Address</label>
            <div className={`flex items-center border rounded-xl overflow-hidden transition-all duration-200 focus-glow ${email ? 'border-primary/30 bg-primary/[0.02]' : 'bg-gray-50'
              } focus-within:border-primary/50`}>
              <Mail className={`w-4 h-4 ml-3.5 ${email ? 'text-primary' : 'text-muted-foreground'}`} />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder={role === 'shopowner' ? 'your-shop@email.com' : 'your@email.com'}
                className="flex-1 px-3 py-3 bg-transparent outline-none text-[14px]"
                disabled={loading}
                required
              />
              {email && !error && (
                <ShieldCheck className="w-4 h-4 text-primary/50 mr-3" />
              )}
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[13px] text-muted-foreground" style={{ fontWeight: 500 }}>Password</label>
              <button type="button" className="text-[12px] text-primary hover:underline" style={{ fontWeight: 500 }}>Forgot password?</button>
            </div>
            <div className={`flex items-center border rounded-xl overflow-hidden transition-all duration-200 focus-glow ${password ? 'border-primary/30 bg-primary/[0.02]' : 'bg-gray-50'
              } focus-within:border-primary/50`}>
              <Lock className={`w-4 h-4 ml-3.5 ${password ? 'text-primary' : 'text-muted-foreground'}`} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="Enter your password"
                className="flex-1 px-3 py-3 bg-transparent outline-none text-[14px]"
                disabled={loading}
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="pr-3.5 hover:opacity-70 transition-opacity">
                {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center gap-2">
            <input type="checkbox" id="remember" className="accent-primary w-4 h-4 rounded" />
            <label htmlFor="remember" className="text-[13px] text-muted-foreground cursor-pointer select-none">
              Keep me signed in on this device
            </label>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-primary to-emerald-600 text-white rounded-xl hover:from-primary/90 hover:to-emerald-600/90 transition-all flex items-center justify-center gap-2.5 text-[15px] disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.99] btn-press"
            style={{ fontWeight: 600 }}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign in as {role === 'shopowner' ? 'Shop Owner' : 'Customer'}
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

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[12px] text-muted-foreground">or try a demo account</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Demo Credentials Card */}
          <div className="bg-gradient-to-br from-primary/5 to-primary/[0.02] border border-primary/15 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <p className="text-[13px] text-primary" style={{ fontWeight: 600 }}>Demo {role === 'shopowner' ? 'Shop Owner' : 'Customer'} Account</p>
            </div>
            <div className="bg-white/70 rounded-lg p-3 space-y-1.5 text-[13px]">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Email:</span>
                <code className="bg-gray-100 px-2 py-0.5 rounded text-[12px]">{demoCredentials[role].email}</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Password:</span>
                <code className="bg-gray-100 px-2 py-0.5 rounded text-[12px]">{demoCredentials[role].password}</code>
              </div>
            </div>
            <button
              type="button"
              onClick={fillDemo}
              disabled={loading}
              className="mt-3 w-full py-2 border border-primary/30 text-primary rounded-lg text-[13px] hover:bg-primary/5 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              style={{ fontWeight: 600 }}
            >
              <ArrowRight className="w-3.5 h-3.5" />
              Auto-fill & Sign In
            </button>
          </div>

          {/* Shop Owner Note */}
          {role === 'shopowner' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-[13px] text-amber-800 flex items-start gap-2.5">
              <Store className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p style={{ fontWeight: 600 }}>New Shop Owner?</p>
                <p className="mt-0.5">Register your shop first. Shop accounts require admin approval before you can sign in.</p>
              </div>
            </div>
          )}
        </form>

        {/* Sign Up Link */}
        <div className="text-center mt-6 space-y-3">
          <p className="text-[14px] text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline" style={{ fontWeight: 600 }}>
              Create Account
            </Link>
          </p>
          <div className="flex items-center justify-center gap-4 text-[12px] text-muted-foreground">
            <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Secure Login</span>
            <span>•</span>
            <span>256-bit Encryption</span>
            <span>•</span>
            <span>Privacy Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
