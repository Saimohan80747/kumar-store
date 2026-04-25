import { Outlet, Navigate, Link, useLocation, useNavigate } from 'react-router';
import { Navbar } from './navbar';
import { Footer } from './footer';
import { BottomNav } from './bottom-nav';
import { Toaster } from 'sonner';
import { useStore } from '../store';
import { ShieldAlert, Lock, Home, PhoneCall, LogOut } from 'lucide-react';
import { AiAssistant } from './ai-assistant';
import { isDeviceBlocked } from '../utils/security';

/** Primary screen layout wrapping all standard views. */
export function Layout() {
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);
  const location = useLocation();
  const navigate = useNavigate();
  const isLocalBlocked = isDeviceBlocked();
  const isForceAllowedUser = user?.email?.trim().toLowerCase() === 'mohansai152006@gmail.com';

  // Redirect admin users away from storefront
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  // Global block for both DB-blocked users and locally-blocked admins
  // We allow the home page ('/') to be visible so the "Return to Home" button works,
  // but block all other storefront routes.
  if (!isForceAllowedUser && (user?.blocked || isLocalBlocked) && location.pathname !== '/') {
    const handleLogout = async () => {
      await logout();
      navigate('/');
    };

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-red-100 overflow-hidden">
          <div className="bg-red-600 p-8 flex justify-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm animate-pulse">
              <ShieldAlert className="w-10 h-10 text-white" />
            </div>
          </div>
          <div className="p-8 text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Restricted</h1>
            <p className="text-slate-600 mb-8">
              {isLocalBlocked 
                ? "This device has been restricted due to multiple failed administrative login attempts."
                : "Your account has been suspended for violating our terms of service or security policies."}
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl text-left border border-slate-100">
                <Lock className="w-5 h-5 text-slate-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-700">Security Protocol</p>
                  <p className="text-xs text-slate-500">Your IP and access attempts have been logged.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl text-left border border-slate-100">
                <PhoneCall className="w-5 h-5 text-slate-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-700">Need Help?</p>
                  <p className="text-xs text-slate-500">Contact support@kumarstore.com to appeal.</p>
                </div>
              </div>
            </div>

            <a
              href="mailto:support@kumarstore.com"
              className="w-full mt-8 inline-flex items-center justify-center py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
            >
              Contact Support
            </a>
            
            {user ? (
              <button 
                onClick={handleLogout}
                className="w-full mt-2 py-3 text-slate-500 font-medium hover:text-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Sign Out & Exit
              </button>
            ) : (
              <Link 
                to="/"
                className="w-full mt-2 py-3 text-slate-500 font-medium hover:text-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" /> Return to Home
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const isCartPage = location.pathname === '/cart';

  return (
    <div className="relative isolate min-h-screen flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-900 focus:shadow-lg"
      >
        Skip to main content
      </a>
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#f8fbf7_0%,#ffffff_40%,#f5faf7_100%)]" />
        <div className="absolute left-[-12rem] top-[-10rem] h-[28rem] w-[28rem] rounded-full bg-emerald-400/12 blur-[110px]" />
        <div className="absolute right-[-10rem] top-[6rem] h-[24rem] w-[24rem] rounded-full bg-cyan-400/12 blur-[120px]" />
        <div className="absolute bottom-[-14rem] left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-lime-300/10 blur-[130px]" />
        <div className="mesh-backdrop absolute inset-0 opacity-40" />
      </div>
      <Toaster position="top-right" richColors closeButton />
      <Navbar />
      <main id="main-content" className="flex-1 pb-16 md:pb-0" tabIndex={-1}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <Outlet />
        </div>
      </main>
      {!isCartPage && (
        <div className="hidden md:block">
          <Footer />
        </div>
      )}
      {!isCartPage && <BottomNav />}
      <AiAssistant />
    </div>
  );
}
