import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard, ShoppingCart, Package, Store, Tag, Users, Settings,
  Bell, Search, ChevronDown, LogOut, Menu, X, BarChart3, TrendingUp,
  Shield, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, BellRing
} from 'lucide-react';
import { useStore } from '../store';
import { Toaster } from 'sonner';
import { toast } from 'sonner';

// The admin password — change this to your own secret password
const ADMIN_PASSWORD = 'kumarstore@admin2026';

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
  const login = useStore((s) => s.login);
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
        login({
          id: 'admin-1',
          name: 'Admin',
          email: 'admin@kumarstore.com',
          phone: '9876543210',
          role: 'admin',
        });
      }
      // Refresh data from DB when admin opens panel
      loadAllData();
    }
  }, []);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (attempts >= 5) {
      setError('Too many failed attempts. Please try again later.');
      return;
    }

    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      sessionStorage.setItem('kumarstore_admin_auth', 'true');
      login({
        id: 'admin-1',
        name: 'Admin',
        email: 'admin@kumarstore.com',
        phone: '9876543210',
        role: 'admin',
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Toaster position="top-right" richColors />
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-[28px]" style={{ fontWeight: 800 }}>Admin Access</h1>
            <p className="text-muted-foreground mt-1 text-[15px]">Enter the admin password to continue</p>
          </div>

          {error && (
            <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-[14px] text-red-700">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p style={{ fontWeight: 600 }}>Access Denied</p>
                <p className="mt-0.5 text-[13px]">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="bg-white border rounded-2xl p-6 space-y-4 shadow-sm">
            <div>
              <label className="text-[13px] text-muted-foreground mb-1.5 block">Admin Password</label>
              <div className="flex items-center border rounded-lg overflow-hidden bg-gray-50 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
                <Lock className="w-4 h-4 text-muted-foreground ml-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Enter admin password"
                  className="flex-1 px-3 py-3 bg-transparent outline-none text-[14px]"
                  autoFocus
                  disabled={attempts >= 5}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="pr-3">
                  {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={attempts >= 5}
              className="w-full py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontWeight: 600 }}
            >
              <Shield className="w-4 h-4" /> Access Admin Panel
            </button>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-[13px] text-amber-800">
              <p style={{ fontWeight: 600 }}>Restricted Area</p>
              <p className="mt-0.5">This section is only for authorized administrators. Unauthorized access attempts are logged.</p>
            </div>
          </form>

          <div className="text-center mt-4">
            <button
              onClick={() => navigate('/')}
              className="text-[14px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Kumar Store
            </button>
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
        <div className="p-5 border-b border-border">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] transition-all ${
                isActive(item.path, item.exact)
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-foreground'
              }`}
              style={{ fontWeight: isActive(item.path, item.exact) ? 600 : 400 }}
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
              {item.label === 'Shop Approvals' && pendingCount > 0 && (
                <span className={`ml-auto text-[11px] px-1.5 py-0.5 rounded-full ${
                  isActive(item.path) ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
                }`}>
                  {pendingCount}
                </span>
              )}
              {item.label === 'Product Requests' && pendingProductReqs > 0 && (
                <span className={`ml-auto text-[11px] px-1.5 py-0.5 rounded-full ${
                  isActive(item.path) ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
                }`}>
                  {pendingProductReqs}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="p-4 border-t border-border space-y-1">
          <Link
            to="/"
            onClick={() => { sessionStorage.removeItem('kumarstore_admin_auth'); logout(); }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-muted-foreground hover:bg-gray-100 hover:text-foreground transition-colors"
          >
            <Store className="w-4 h-4" />
            Back to Storefront
          </Link>
          <button
            onClick={handleAdminLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-red-500 hover:bg-red-50 transition-colors w-full"
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
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] transition-all ${
                    isActive(item.path, item.exact)
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  style={{ fontWeight: isActive(item.path, item.exact) ? 600 : 400 }}
                >
                  <item.icon className="w-[18px] h-[18px]" />
                  {item.label}
                  {item.label === 'Shop Approvals' && pendingCount > 0 && (
                    <span className={`ml-auto text-[11px] px-1.5 py-0.5 rounded-full ${
                      isActive(item.path) ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {pendingCount}
                    </span>
                  )}
                  {item.label === 'Product Requests' && pendingProductReqs > 0 && (
                    <span className={`ml-auto text-[11px] px-1.5 py-0.5 rounded-full ${
                      isActive(item.path) ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {pendingProductReqs}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t space-y-1">
              <Link to="/" onClick={() => { sessionStorage.removeItem('kumarstore_admin_auth'); logout(); setSidebarOpen(false); }} className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-muted-foreground hover:bg-gray-100">
                <Store className="w-4 h-4" /> Back to Storefront
              </Link>
              <button onClick={() => { handleAdminLogout(); setSidebarOpen(false); }} className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-red-500 hover:bg-red-50 w-full">
                <LogOut className="w-4 h-4" /> Logout Admin
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white border-b border-border">
          <div className="flex items-center justify-between px-4 lg:px-6 py-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg lg:hidden">
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-[16px]" style={{ fontWeight: 600 }}>
                  {sidebarItems.find((i) => isActive(i.path, i.exact))?.label || 'Admin'}
                </h2>
                <p className="text-[12px] text-muted-foreground">
                  {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Search */}
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