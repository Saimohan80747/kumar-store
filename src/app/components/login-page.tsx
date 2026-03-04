import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { User, Store, Lock, Mail, ArrowRight, Eye, EyeOff, AlertCircle, Clock, XCircle, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { useStore } from '../store';
import { toast } from 'sonner';

export function LoginPage() {
  const login = useStore((s) => s.login);
  const authenticateUser = useStore((s) => s.authenticateUser);
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
      const result = await authenticateUser(email.trim(), password, role);

      if (result.success && result.user) {
        login(result.user);
        toast.success(result.message);
        if (role === 'shopowner') {
          navigate('/shop-dashboard');
        } else {
          navigate('/');
        }
      } else {
        if (result.message.includes('pending')) {
          setErrorType('pending');
        } else if (result.message.includes('rejected')) {
          setErrorType('rejected');
        } else {
          setErrorType('error');
        }
        setError(result.message);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setErrorType('error');
    } finally {
      setLoading(false);
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
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/25">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-[30px]" style={{ fontWeight: 800 }}>Welcome Back</h1>
          <p className="text-muted-foreground mt-1 text-[15px]">Sign in to your Kumar Store account</p>
        </div>

        {/* Role Tabs */}
        <div className="bg-gray-100 rounded-xl p-1 grid grid-cols-2 gap-1 mb-6">
          {([
            { id: 'customer' as const, label: 'Customer', icon: User, desc: 'Shop at MRP prices' },
            { id: 'shopowner' as const, label: 'Shop Owner', icon: Store, desc: 'Wholesale pricing' },
          ]).map((r) => (
            <button
              key={r.id}
              onClick={() => { setRole(r.id); setError(''); setErrorType(''); setEmail(''); setPassword(''); }}
              className={`relative p-3.5 rounded-lg text-center transition-all duration-200 ${
                role === r.id
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
          <div className={`mb-4 p-4 rounded-xl flex items-start gap-3 text-[14px] animate-in slide-in-from-top-2 duration-200 ${
            errorType === 'pending'
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
        <form onSubmit={handleLogin} className="bg-white border rounded-2xl p-6 space-y-5 shadow-sm">
          {/* Email */}
          <div>
            <label className="text-[13px] text-muted-foreground mb-1.5 block" style={{ fontWeight: 500 }}>Email Address</label>
            <div className={`flex items-center border rounded-xl overflow-hidden transition-all duration-200 ${
              email ? 'border-primary/40 bg-primary/[0.02]' : 'bg-gray-50'
            } focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary`}>
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
            <div className={`flex items-center border rounded-xl overflow-hidden transition-all duration-200 ${
              password ? 'border-primary/40 bg-primary/[0.02]' : 'bg-gray-50'
            } focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary`}>
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
            className="w-full py-3.5 bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl hover:from-primary/90 hover:to-primary/80 transition-all flex items-center justify-center gap-2.5 text-[15px] disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.99]"
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
