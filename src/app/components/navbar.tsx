import { useState, memo, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Search, ShoppingCart, Heart, User, Menu, X, Package,
  ChevronDown, LogOut, Store, MapPin, Bell, CheckCheck, TrendingUp
} from 'lucide-react';
import { useStore } from '../store';
import type { Notification } from '../store';
import { CATEGORIES } from '../data';

// ─── Notification Dropdown (memoized sub-component) ───
const NotificationDropdown = memo(function NotificationDropdown({
  notifications, unreadCount, onClose
}: {
  notifications: Notification[];
  unreadCount: number;
  onClose: () => void;
}) {
  const markNotificationRead = useStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useStore((s) => s.markAllNotificationsRead);
  const navigate = useNavigate();

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-border z-50 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
          <p className="text-[14px]" style={{ fontWeight: 600 }}>Notifications</p>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllNotificationsRead()}
              className="text-[12px] text-primary hover:underline flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-[13px] text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            notifications.slice(0, 20).map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  markNotificationRead(n.id);
                  if (n.productId) {
                    navigate(`/product/${n.productId}`);
                    onClose();
                  }
                }}
                className={`w-full text-left px-4 py-3 border-b last:border-0 hover:bg-gray-50 transition-colors ${
                  !n.read ? 'bg-amber-50/50' : ''
                }`}
              >
                <div className="flex gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    n.type === 'product_available' ? 'bg-primary/10' : 'bg-amber-50'
                  }`}>
                    {n.type === 'product_available' ? (
                      <Package className="w-4 h-4 text-primary" />
                    ) : (
                      <Bell className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] line-clamp-1" style={{ fontWeight: n.read ? 400 : 600 }}>{n.title}</p>
                    <p className="text-[12px] text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {new Date(n.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5" />
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
});

// ─── User Dropdown (memoized sub-component) ───
const UserDropdown = memo(function UserDropdown({ onClose }: { onClose: () => void }) {
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);
  const navigate = useNavigate();

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-border z-50 py-1 overflow-hidden">
        {user ? (
          <>
            <div className="px-4 py-3 bg-gray-50 border-b">
              <p className="text-[14px]" style={{ fontWeight: 600 }}>{user.name}</p>
              <p className="text-[12px] text-muted-foreground">{user.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] bg-primary/10 text-primary capitalize">{user.role === 'shopowner' ? 'Shop Owner' : 'Customer'}</span>
            </div>
            {user.role === 'shopowner' && (
              <Link to="/shop-dashboard" onClick={onClose} className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-[14px]">
                <Store className="w-4 h-4" /> Shop Dashboard
              </Link>
            )}
            <Link to="/orders" onClick={onClose} className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-[14px]">
              <Package className="w-4 h-4" /> My Orders
            </Link>
            {user.role === 'customer' && (
              <Link to="/savings" onClick={onClose} className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-[14px]">
                <TrendingUp className="w-4 h-4" /> My Savings
              </Link>
            )}
            <button onClick={() => { logout(); onClose(); navigate('/'); }} className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-[14px] w-full text-destructive">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" onClick={onClose} className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 text-[14px]">
              <User className="w-4 h-4" /> Sign In / Register
            </Link>
          </>
        )}
      </div>
    </>
  );
});

// ─── Category Bar (memoized — static content) ───
const CategoryBar = memo(function CategoryBar() {
  const userRole = useStore((s) => s.user?.role);
  const [catDropdown, setCatDropdown] = useState(false);

  return (
    <div className="border-t border-border hidden md:block">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-1">
          <div className="relative">
            <button
              onClick={() => setCatDropdown(!catDropdown)}
              className="flex items-center gap-1.5 px-3 py-2.5 text-[14px] hover:text-primary transition-colors"
            >
              <Menu className="w-4 h-4" /> All Categories <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {catDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setCatDropdown(false)} />
                <div className="absolute left-0 top-full w-60 bg-white shadow-xl rounded-b-lg border z-50">
                  {CATEGORIES.map((cat) => (
                    <Link
                      key={cat.slug}
                      to={`/products?category=${cat.slug}`}
                      onClick={() => setCatDropdown(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-[14px] transition-colors"
                    >
                      <span className="text-[18px]">{cat.icon}</span>
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
          {['Featured', 'Best Sellers', 'New Arrivals', 'Wholesale Deals'].map((item) => (
            <Link
              key={item}
              to="/products"
              className="px-3 py-2.5 text-[14px] text-gray-600 hover:text-primary transition-colors"
            >
              {item}
            </Link>
          ))}
          {userRole === 'shopowner' && (
            <Link to="/products" className="px-3 py-2.5 text-[14px] text-primary flex items-center gap-1" style={{ fontWeight: 600 }}>
              <Package className="w-4 h-4" /> Bulk Orders
            </Link>
          )}
        </div>
      </div>
    </div>
  );
});

// ─── Main Navbar ───
export function Navbar() {
  // Granular selectors — each subscribes only to its own slice
  const user = useStore((s) => s.user);
  const cartLength = useStore((s) => s.cart.length);
  const wishlistLength = useStore((s) => s.wishlist.length);
  const searchQuery = useStore((s) => s.searchQuery);
  const setSearchQuery = useStore((s) => s.setSearchQuery);
  const notifications = useStore((s) => s.notifications);

  const [mobileMenu, setMobileMenu] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [notifDropdown, setNotifDropdown] = useState(false);
  const navigate = useNavigate();

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate('/products');
  }, [searchQuery, navigate]);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-border">
      {/* Top bar */}
      <div className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between text-[13px]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Deliver to all India</span>
            <span className="hidden sm:block">Free delivery on orders above Rs.999</span>
          </div>
          <div className="flex items-center gap-4">
            {user?.role === 'shopowner' && (
              <span className="bg-white/20 rounded-full px-3 py-0.5 text-[12px]">Wholesale Account</span>
            )}
            <span className="hidden sm:block">24/7 Support: 1800-123-4567</span>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="text-[20px] text-primary" style={{ fontWeight: 700 }}>Kumar Store</span>
              <span className="block text-[11px] text-muted-foreground -mt-1">Wholesale & Retail</span>
            </div>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
            <div className="flex items-center bg-gray-50 border border-border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
              <input
                type="text"
                placeholder="Search for products, brands, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-transparent outline-none text-[14px]"
              />
              <button type="submit" className="px-4 py-2.5 bg-primary text-white hover:bg-primary/90 transition-colors">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </form>

          {/* Right icons */}
          <div className="flex items-center gap-1">
            {/* Notifications */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => { setNotifDropdown(!notifDropdown); setUserDropdown(false); }}
                  className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors hidden sm:flex items-center"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-amber-500 text-white text-[11px] rounded-full flex items-center justify-center animate-pulse">{unreadCount}</span>
                  )}
                </button>
                {notifDropdown && (
                  <NotificationDropdown
                    notifications={notifications}
                    unreadCount={unreadCount}
                    onClose={() => setNotifDropdown(false)}
                  />
                )}
              </div>
            )}

            <Link to="/wishlist" className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors hidden sm:flex items-center gap-1.5">
              <Heart className="w-5 h-5 text-gray-600" />
              {wishlistLength > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-white text-[11px] rounded-full flex items-center justify-center">{wishlistLength}</span>
              )}
            </Link>

            <Link to="/cart" className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5">
              <ShoppingCart className="w-5 h-5 text-gray-600" />
              {cartLength > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-white text-[11px] rounded-full flex items-center justify-center">{cartLength}</span>
              )}
              <span className="hidden md:block text-[13px] text-gray-700">Cart</span>
            </Link>

            {/* User */}
            <div className="relative">
              <button
                onClick={() => { setUserDropdown(!userDropdown); setNotifDropdown(false); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <User className="w-5 h-5 text-gray-600" />
                <span className="hidden md:block text-[13px] text-gray-700 max-w-[100px] truncate">
                  {user ? user.name : 'Login'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-500 hidden md:block" />
              </button>
              {userDropdown && (
                <UserDropdown onClose={() => setUserDropdown(false)} />
              )}
            </div>

            <button onClick={() => setMobileMenu(!mobileMenu)} className="p-2 hover:bg-gray-100 rounded-lg md:hidden">
              {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Category bar */}
      <CategoryBar />

      {/* Mobile menu */}
      {mobileMenu && (
        <MobileMenu
          notifications={notifications}
          unreadCount={unreadCount}
          wishlistLength={wishlistLength}
          onClose={() => setMobileMenu(false)}
        />
      )}
    </header>
  );
}

// ─── Mobile Menu (extracted for cleaner main component) ───
const MobileMenu = memo(function MobileMenu({
  notifications, unreadCount, wishlistLength, onClose
}: {
  notifications: Notification[];
  unreadCount: number;
  wishlistLength: number;
  onClose: () => void;
}) {
  const user = useStore((s) => s.user);
  const markNotificationRead = useStore((s) => s.markNotificationRead);

  return (
    <div className="md:hidden border-t bg-white">
      <div className="p-4 space-y-2">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            to={`/products?category=${cat.slug}`}
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-[14px]"
          >
            <span>{cat.icon}</span> {cat.name}
          </Link>
        ))}
        <hr className="my-2" />
        {user && notifications.length > 0 && (
          <div className="px-3 py-2">
            <p className="text-[13px] flex items-center gap-2 mb-1" style={{ fontWeight: 600 }}>
              <Bell className="w-4 h-4 text-amber-500" />
              Notifications
              {unreadCount > 0 && <span className="bg-amber-500 text-white text-[11px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
            </p>
            {notifications.filter(n => !n.read).slice(0, 3).map((n) => (
              <Link
                key={n.id}
                to={n.productId ? `/product/${n.productId}` : '#'}
                onClick={() => { markNotificationRead(n.id); onClose(); }}
                className="block px-2 py-1.5 text-[12px] text-muted-foreground hover:bg-gray-50 rounded"
              >
                {n.title}
              </Link>
            ))}
          </div>
        )}
        <Link to="/wishlist" onClick={onClose} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-[14px]">
          <Heart className="w-4 h-4" /> Wishlist ({wishlistLength})
        </Link>
        <Link to="/orders" onClick={onClose} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-[14px]">
          <Package className="w-4 h-4" /> My Orders
        </Link>
      </div>
    </div>
  );
});