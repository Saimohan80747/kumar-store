import { Outlet, Navigate, Link } from 'react-router';
import { Navbar } from './navbar';
import { Footer } from './footer';
import { BottomNav } from './bottom-nav';
import { Toaster } from 'sonner';
import { useStore } from '../store';
import { ShieldAlert, Lock, Home, PhoneCall } from 'lucide-react';

export function Layout() {
  const user = useStore((s) => s.user);
  const isLocalBlocked = localStorage.getItem('admin_account_blocked') === 'true';

  // Redirect admin users away from storefront
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  // Global block for both DB-blocked users and locally-blocked admins
  if (user?.blocked || isLocalBlocked) {
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

            <button 
              onClick={() => window.location.href = 'mailto:support@kumarstore.com'}
              className="w-full mt-8 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
            >
              Contact Support
            </button>
            
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full mt-2 py-3 text-slate-500 font-medium hover:text-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" /> Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 via-white to-gray-50/50">
      <Toaster position="top-right" richColors closeButton />
      <Navbar />
      <main className="flex-1 pb-16 md:pb-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <Outlet />
        </div>
      </main>
      <div className="hidden md:block">
        <Footer />
      </div>
      <BottomNav />
    </div>
  );
}
