import { Home, Grid3X3, ShoppingCart, Package, User } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useStore } from '../store';

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/products', label: 'Shop', icon: Grid3X3 },
  { path: '/cart', label: 'Cart', icon: ShoppingCart, badge: true },
  { path: '/orders', label: 'Orders', icon: Package },
  { path: '/account', label: 'Account', icon: User },
];

export function BottomNav() {
  const location = useLocation();
  const cart = useStore((s) => s.cart);
  const user = useStore((s) => s.user);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  // Hide on admin pages
  if (location.pathname.startsWith('/admin')) return null;

  // Resolve account path based on user state
  const getPath = (item: typeof NAV_ITEMS[0]) => {
    if (item.path === '/account') {
      if (!user) return '/login';
      if (user.role === 'shopowner') return '/shop-dashboard';
      return '/savings';
    }
    if (item.path === '/orders' && !user) return '/login';
    return item.path;
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-2xl border-t border-border/40 z-50 safe-area-bottom shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map((item) => {
          const isActive = item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path);
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={getPath(item)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full min-w-[48px] transition-all duration-200 relative ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'drop-shadow-sm' : ''}`} strokeWidth={isActive ? 2.5 : 1.8} />
                {item.badge && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 w-4 h-4 bg-primary text-white text-[9px] rounded-full flex items-center justify-center" style={{ fontWeight: 700 }}>
                    {cartCount > 99 ? '99' : cartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px]" style={{ fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
