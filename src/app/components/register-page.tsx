import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import {
  User, Store, Mail, Phone, MapPin, Lock, Eye, EyeOff, ArrowRight,
  CheckCircle2, Clock, Loader2, ShieldCheck, UserPlus, Sparkles
} from 'lucide-react';
import { useStore } from '../store';
import { toast } from 'sonner';

export function RegisterPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const registerCustomer = useStore((s) => s.registerCustomer);
  const registerShopOwner = useStore((s) => s.registerShopOwner);
  const registeredUsers = useStore((s) => s.registeredUsers);
  const shopRequests = useStore((s) => s.shopRequests);
  const [role, setRole] = useState<'customer' | 'shopowner'>(searchParams.get('role') as any || 'customer');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    shopName: '', shopLocation: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!form.name.trim()) { toast.error('Please enter your full name'); return; }
    if (!form.email.trim()) { toast.error('Please enter your email address'); return; }
    if (!form.phone.trim()) { toast.error('Please enter your phone number'); return; }
    if (form.phone.trim().length < 10) { toast.error('Please enter a valid 10-digit phone number'); return; }
    if (!form.password) { toast.error('Please create a password'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }

    // Check for existing accounts
    const emailExists = registeredUsers.find((u) => u.email === form.email.trim());
    const requestExists = shopRequests.find((r) => r.email === form.email.trim());
    if (emailExists || requestExists) {
      toast.error('An account with this email already exists. Please sign in instead.');
      return;
    }

    if (role === 'shopowner') {
      if (!form.shopName.trim()) { toast.error('Please enter your shop name'); return; }
      if (!form.shopLocation.trim()) { toast.error('Please enter your shop location'); return; }
    }

    setLoading(true);
    try {
      if (role === 'shopowner') {
        await registerShopOwner({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          shopName: form.shopName.trim(),
          shopLocation: form.shopLocation.trim(),
          password: form.password,
        });
        toast.success('Registration submitted for admin approval!');
      } else {
        await registerCustomer({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
        });
        toast.success('Account created successfully!');
      }
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Success screen ───
  if (submitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
        <div className="text-center max-w-md">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
            role === 'shopowner' ? 'bg-amber-50 border-2 border-amber-200' : 'bg-primary/10 border-2 border-primary/20'
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

  const passwordStrength = form.password.length === 0 ? 0 : form.password.length < 6 ? 1 : form.password.length < 10 ? 2 : 3;
  const strengthLabels = ['', 'Weak', 'Good', 'Strong'];
  const strengthColors = ['', 'bg-red-400', 'bg-amber-400', 'bg-primary'];

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-lg">
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
              className={`relative p-3.5 rounded-lg text-center transition-all duration-200 ${
                role === r.id ? 'bg-white shadow-sm' : 'hover:bg-gray-50'
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
          {/* Section: Personal Info */}
          <div className="flex items-center gap-2 pb-1">
            <User className="w-4 h-4 text-primary" />
            <p className="text-[13px] text-primary" style={{ fontWeight: 600 }}>Personal Information</p>
          </div>

          {/* Full Name */}
          <div>
            <label className="text-[13px] text-muted-foreground mb-1 block" style={{ fontWeight: 500 }}>Full Name *</label>
            <div className={`flex items-center border rounded-xl transition-all duration-200 ${
              form.name ? 'border-primary/40 bg-primary/[0.02]' : 'bg-gray-50'
            } focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary`}>
              <User className={`w-4 h-4 ml-3.5 ${form.name ? 'text-primary' : 'text-muted-foreground'}`} />
              <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Enter your full name" className="flex-1 px-3 py-2.5 bg-transparent outline-none text-[14px]" disabled={loading} required />
              {form.name.trim().length > 2 && <CheckCircle2 className="w-4 h-4 text-primary/50 mr-3" />}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-[13px] text-muted-foreground mb-1 block" style={{ fontWeight: 500 }}>Email Address *</label>
            <div className={`flex items-center border rounded-xl transition-all duration-200 ${
              form.email ? 'border-primary/40 bg-primary/[0.02]' : 'bg-gray-50'
            } focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary`}>
              <Mail className={`w-4 h-4 ml-3.5 ${form.email ? 'text-primary' : 'text-muted-foreground'}`} />
              <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="your@email.com" className="flex-1 px-3 py-2.5 bg-transparent outline-none text-[14px]" disabled={loading} required />
              {form.email.includes('@') && form.email.includes('.') && <CheckCircle2 className="w-4 h-4 text-primary/50 mr-3" />}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="text-[13px] text-muted-foreground mb-1 block" style={{ fontWeight: 500 }}>Phone Number *</label>
            <div className={`flex items-center border rounded-xl transition-all duration-200 ${
              form.phone ? 'border-primary/40 bg-primary/[0.02]' : 'bg-gray-50'
            } focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary`}>
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
                <div className={`flex items-center border rounded-xl transition-all duration-200 ${
                  form.shopName ? 'border-primary/40 bg-primary/[0.02]' : 'bg-gray-50'
                } focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary`}>
                  <Store className={`w-4 h-4 ml-3.5 ${form.shopName ? 'text-primary' : 'text-muted-foreground'}`} />
                  <input value={form.shopName} onChange={(e) => update('shopName', e.target.value)} placeholder="Your shop name" className="flex-1 px-3 py-2.5 bg-transparent outline-none text-[14px]" disabled={loading} required />
                </div>
              </div>

              {/* Shop Location */}
              <div>
                <label className="text-[13px] text-muted-foreground mb-1 block" style={{ fontWeight: 500 }}>Shop Location *</label>
                <div className={`flex items-center border rounded-xl transition-all duration-200 ${
                  form.shopLocation ? 'border-primary/40 bg-primary/[0.02]' : 'bg-gray-50'
                } focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary`}>
                  <MapPin className={`w-4 h-4 ml-3.5 ${form.shopLocation ? 'text-primary' : 'text-muted-foreground'}`} />
                  <input value={form.shopLocation} onChange={(e) => update('shopLocation', e.target.value)} placeholder="City, State" className="flex-1 px-3 py-2.5 bg-transparent outline-none text-[14px]" disabled={loading} required />
                </div>
              </div>
            </>
          )}

          {/* Section: Security */}
          <div className="flex items-center gap-2 pt-2 pb-1">
            <Lock className="w-4 h-4 text-primary" />
            <p className="text-[13px] text-primary" style={{ fontWeight: 600 }}>Create Password</p>
          </div>

          {/* Password */}
          <div>
            <label className="text-[13px] text-muted-foreground mb-1 block" style={{ fontWeight: 500 }}>Password *</label>
            <div className={`flex items-center border rounded-xl transition-all duration-200 ${
              form.password ? 'border-primary/40 bg-primary/[0.02]' : 'bg-gray-50'
            } focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary`}>
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
            <div className={`flex items-center border rounded-xl transition-all duration-200 ${
              form.confirmPassword ? (form.password === form.confirmPassword ? 'border-primary/40 bg-primary/[0.02]' : 'border-red-300 bg-red-50/30') : 'bg-gray-50'
            } focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary`}>
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
