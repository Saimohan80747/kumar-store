import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard, ShoppingCart, Package, Store, Tag, Users, Settings,
  Bell, Search, LogOut, Menu, X, BarChart3,
  Shield, Lock, Eye, EyeOff, AlertCircle
} from 'lucide-react';
import { useStore } from '../store';
import { Toaster } from 'sonner';
import { toast } from 'sonner';

// The admin password — change this to your own secret password
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'kumarstore@admin2026';

const sidebarItems = [
  { path: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { path: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { path: '/admin/products', label: 'Products', icon: Package },
  { path: '/admin/shop-approvals', label: 'Shop Approvals', icon: Store },
  { path: '/admin/customers', label: 'Customers', icon: Users },
  { path: '/admin/coupons', label: 'Coupons', icon: Tag },
  { path: '/admin/product-requests', label: 'Product Requests', icon: Bell },
  { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminLayout() {
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);
  const shopRequests = useStore((s) => s.shopRequests);
  const productRequests = useStore((s) => s.productRequests);
  const loadAllData = useStore((s) => s.loadAllData);
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const pendingCount = shopRequests.filter((r) => r.status === 'pending').length;
  const pendingProductReqs = productRequests.filter((r) => r.status === 'pending').length;

  // Check if admin was previously authenticated in this session
  useEffect(() => {
    const adminAuth = sessionStorage.getItem('kumarstore_admin_auth');
    if (adminAuth === 'true') {
      setAuthenticated(true);
      if (!user || user.role !== 'admin') {
        useStore.setState({
          user: {
            id: 'admin-1',
            name: 'Admin',
            email: 'admin@kumarstore.com',
            phone: '9876543210',
            role: 'admin',
          }
        });
      }
      // Refresh data from DB when admin opens panel
      loadAllData();
    }
  }, []);

  const handleAdminLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (attempts >= 5) {
      setError('Too many failed attempts. Please try again later.');
      return;
    }

    // Get current admin password from localStorage or use default
    const currentAdminPassword = localStorage.getItem('admin_password') || ADMIN_PASSWORD;

    if (password === currentAdminPassword) {
      setAuthenticated(true);
      sessionStorage.setItem('kumarstore_admin_auth', 'true');
      useStore.setState({
        user: {
          id: 'admin-1',
          name: 'Admin',
          email: 'admin@kumarstore.com',
          phone: '9876543210',
          role: 'admin',
        }
      });
      toast.success('Welcome to Admin Panel!');
      loadAllData();
    } else {
      setAttempts((p) => p + 1);
      setError(`Invalid admin password. ${4 - attempts} attempts remaining.`);
      setPassword('');
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('kumarstore_admin_auth');
    setAuthenticated(false);
    logout();
    navigate('/');
  };

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  // Password gate — shown before any admin content
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0f172a 100%)' }}>
        <Toaster position="top-right" richColors />

        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #22c55e 0%, transparent 70%)', animation: 'pulse 4s ease-in-out infinite' }} />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)', animation: 'pulse 5s ease-in-out infinite 1s' }} />
          <div className="absolute top-1/3 right-1/4 w-48 h-48 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)', animation: 'pulse 6s ease-in-out infinite 2s' }} />
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="relative inline-flex">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-emerald-500/30"
                style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)' }}>
                <Shield className="w-10 h-10 text-white drop-shadow-md" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 border-2 border-slate-900 flex items-center justify-center">
                <Lock className="w-2.5 h-2.5 text-slate-900" />
              </div>
            </div>
            <h1 className="text-[32px] text-white tracking-tight" style={{ fontWeight: 800 }}>Admin Panel</h1>
            <p className="text-slate-400 mt-2 text-[15px]">Authenticate to access the dashboard</p>
          </div>

          {/* Error alert */}
          {error && (
            <div className="mb-5 p-4 rounded-xl flex items-start gap-3 text-[14px] border border-red-500/30" style={{ background: 'rgba(239, 68, 68, 0.1)', backdropFilter: 'blur(12px)' }}>
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-red-300" style={{ fontWeight: 600 }}>Access Denied</p>
                <p className="mt-0.5 text-[13px] text-red-400/80">{error}</p>
              </div>
            </div>
          )}

          {/* Login card */}
          <form onSubmit={handleAdminLogin} className="rounded-2xl p-7 space-y-5 border border-white/10 shadow-2xl" style={{ background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(20px)' }}>
            <div>
              <label className="text-[13px] text-slate-400 mb-2 block" style={{ fontWeight: 500 }}>Admin Password</label>
              <div className="flex items-center rounded-xl overflow-hidden transition-all duration-300 border border-white/10 focus-within:border-emerald-500/50 focus-within:shadow-lg focus-within:shadow-emerald-500/10" style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
                <Lock className="w-4 h-4 text-slate-500 ml-4" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Enter admin password"
                  className="flex-1 px-3 py-3.5 bg-transparent outline-none text-[14px] text-white placeholder:text-slate-500"
                  autoFocus
                  disabled={attempts >= 5}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="pr-4 hover:opacity-70 transition-opacity">
                  {showPassword ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-slate-500" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={attempts >= 5}
              className="w-full py-3.5 text-white rounded-xl transition-all flex items-center justify-center gap-2.5 text-[15px] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:shadow-emerald-600/30 active:scale-[0.98]"
              style={{ fontWeight: 600, background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}
            >
              <Shield className="w-4.5 h-4.5" /> Access Admin Panel
            </button>

            {/* Security notice */}
            <div className="flex items-start gap-3 rounded-xl p-4 border border-amber-500/20" style={{ background: 'rgba(245, 158, 11, 0.07)' }}>
              <AlertCircle className="w-4 h-4 text-amber-400/80 shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-300/90 text-[13px]" style={{ fontWeight: 600 }}>Restricted Area</p>
                <p className="mt-0.5 text-[12px] text-amber-400/50">Authorized administrators only. All access attempts are logged.</p>
              </div>
            </div>
          </form>

          {/* Footer security badges */}
          <div className="flex items-center justify-center gap-5 mt-6 text-[11px] text-slate-500">
            <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Encrypted</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Secure Access</span>
            <span>•</span>
            <span>Session-Based</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Toaster position="top-right" richColors />

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-border shrink-0 fixed top-0 left-0 h-screen z-40">
        {/* Logo */}
        <div className="p-5 border-b border-border bg-gradient-to-br from-primary/5 to-transparent">
          <Link to="/admin" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 glow-primary group-hover:scale-110 transition-transform duration-300">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[18px] text-primary" style={{ fontWeight: 700 }}>Kumar Store</span>
              <span className="block text-[11px] text-muted-foreground -mt-0.5">Admin Panel</span>
            </div>
          </Link>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider px-3 mb-2">Main Menu</p>
          {sidebarItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] transition-all group focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none ${isActive(item.path, item.exact)
                ? 'bg-emerald-700 text-white hover:bg-emerald-700 hover:text-white active:bg-emerald-700 active:text-white shadow-md shadow-emerald-700/20 sidebar-active'
                : 'text-gray-700 visited:text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 active:bg-emerald-100 active:text-emerald-700'
                }`}
              style={{ fontWeight: isActive(item.path, item.exact) ? 600 : 400 }}
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
              {item.label === 'Shop Approvals' && pendingCount > 0 && (
                <span className={`ml-auto text-[11px] px-1.5 py-0.5 rounded-full ${isActive(item.path) ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
                  }`}>
                  {pendingCount}
                </span>
              )}
              {item.label === 'Product Requests' && pendingProductReqs > 0 && (
                <span className={`ml-auto text-[11px] px-1.5 py-0.5 rounded-full ${isActive(item.path) ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
                  }`}>
                  {pendingProductReqs}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="p-4 border-t border-border space-y-1">
          <button
            onClick={handleAdminLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-red-500 hover:bg-red-50 transition-all w-full btn-press"
          >
            <LogOut className="w-4 h-4" />
            Logout Admin
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed top-0 left-0 h-screen w-72 bg-white shadow-2xl z-50 flex flex-col">
            <div className="p-5 border-b flex items-center justify-between">
              <Link to="/admin" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-[18px] text-primary" style={{ fontWeight: 700 }}>Kumar Store</span>
                  <span className="block text-[11px] text-muted-foreground -mt-0.5">Admin Panel</span>
                </div>
              </Link>
              <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
              {sidebarItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] transition-all focus-visible:ring-2 focus-visible:ring-emerald-700/30 focus-visible:outline-none ${isActive(item.path, item.exact)
                    ? 'bg-emerald-700 text-white hover:bg-emerald-700 hover:text-white active:bg-emerald-700 active:text-white shadow-md shadow-emerald-700/20 sidebar-active'
                    : 'text-gray-700 visited:text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 active:bg-emerald-100 active:text-emerald-700'
                    }`}
                  style={{ fontWeight: isActive(item.path, item.exact) ? 600 : 400 }}
                >
                  <item.icon className="w-[18px] h-[18px]" />
                  {item.label}
                  {item.label === 'Shop Approvals' && pendingCount > 0 && (
                    <span className={`ml-auto text-[11px] px-1.5 py-0.5 rounded-full ${isActive(item.path) ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
                      }`}>
                      {pendingCount}
                    </span>
                  )}
                  {item.label === 'Product Requests' && pendingProductReqs > 0 && (
                    <span className={`ml-auto text-[11px] px-1.5 py-0.5 rounded-full ${isActive(item.path) ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
                      }`}>
                      {pendingProductReqs}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t space-y-1">
              <button onClick={() => { handleAdminLogout(); setSidebarOpen(false); }} className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-red-500 hover:bg-red-50 w-full">
                <LogOut className="w-4 h-4" /> Logout Admin
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Top Header - Glassmorphism */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30 glass-tinted">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center border border-border/60 bg-gray-50/50 rounded-xl px-3 py-2 w-64 focus-glow transition-all">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search anything..."
                className="bg-transparent border-none outline-none px-2 text-[13px] w-full"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <h2 className="text-[15px] font-semibold text-gray-800">
                {sidebarItems.find((i) => isActive(i.path, i.exact))?.label || 'Admin'}
              </h2>
              <p className="text-[11px] text-muted-foreground -mt-0.5">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center bg-gray-50 border rounded-lg px-3 py-2 w-64">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input placeholder="Search..." className="flex-1 px-2 bg-transparent outline-none text-[13px]" />
              </div>

              {/* Notifications */}
              <button className="relative p-2 hover:bg-gray-100 rounded-lg">
                <Bell className="w-5 h-5 text-gray-600" />
                {pendingCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-amber-500 text-white text-[10px] rounded-full flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </button>

              {/* Admin profile */}
              <div className="flex items-center gap-2 pl-2 border-l ml-1">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-[13px]" style={{ fontWeight: 600 }}>A</span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-[13px]" style={{ fontWeight: 500 }}>Admin</p>
                  <p className="text-[11px] text-muted-foreground">Super Admin</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t border-border px-6 py-3 text-[12px] text-muted-foreground flex items-center justify-between">
          <span>Kumar Store Admin Panel v1.0</span>
          <span>Powered by Kumar Store</span>
        </footer>
      </div>
    </div>
  );
}
