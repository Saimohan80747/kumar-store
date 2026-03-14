import { Navigate, Link } from 'react-router';
import { User as UserIcon, TrendingUp, Package, LogOut, Store, Shield } from 'lucide-react';
import { useStore } from '../store';

export function AccountPage() {
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);

  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'shopowner') return <Navigate to="/shop-dashboard" replace />;

  return (
    <div className="py-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-[24px]" style={{ fontWeight: 700 }}>Account</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Manage your profile and view savings</p>
        </div>
        <button
          onClick={() => logout()}
          className="px-4 py-2 rounded-xl border border-border/80 hover:bg-red-50 text-destructive text-[13px] flex items-center gap-2 transition-colors"
          style={{ fontWeight: 600 }}
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Profile */}
        <div className="bg-white border border-border/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[14px]" style={{ fontWeight: 700 }}>Profile</p>
              <p className="text-[12px] text-muted-foreground">Your account details</p>
            </div>
          </div>

          <div className="space-y-3 text-[14px]">
            <div className="flex items-start justify-between gap-3">
              <span className="text-muted-foreground">Name</span>
              <span className="text-right" style={{ fontWeight: 600 }}>{user.name}</span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-muted-foreground">Email</span>
              <span className="text-right break-all" style={{ fontWeight: 600 }}>{user.email}</span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-muted-foreground">Phone</span>
              <span className="text-right" style={{ fontWeight: 600 }}>{user.phone || '—'}</span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-muted-foreground">Address</span>
              <span className="text-right" style={{ fontWeight: 600 }}>{user.address || '—'}</span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/orders"
              className="px-3.5 py-2 rounded-xl border border-border/80 hover:bg-gray-50 text-[13px] flex items-center gap-2 transition-colors"
              style={{ fontWeight: 600 }}
            >
              <Package className="w-4 h-4 text-muted-foreground" /> My Orders
            </Link>
            <Link
              to="/savings"
              className="px-3.5 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 text-[13px] flex items-center gap-2 transition-colors"
              style={{ fontWeight: 700 }}
            >
              <TrendingUp className="w-4 h-4" /> My Savings
            </Link>
          </div>
        </div>

        {/* Savings + trust */}
        <div className="bg-white border border-border/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[14px]" style={{ fontWeight: 700 }}>My Savings</p>
              <p className="text-[12px] text-muted-foreground">Visible only to your account</p>
            </div>
          </div>

          <div className="space-y-3 text-[13px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Savings are calculated only from orders linked to your user ID.
            </div>
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-primary" />
              Wholesale savings are available for shop owners in the dashboard.
            </div>
          </div>

          <Link
            to="/savings"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-[14px]"
            style={{ fontWeight: 800 }}
          >
            View savings details <TrendingUp className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

