import { useState, memo, useMemo, useCallback, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Search, ShoppingCart, Heart, User, Menu, X, Package,
  ChevronDown, LogOut, Store, MapPin, Bell, CheckCheck, TrendingUp,
  Mic, Sparkles, BrainCircuit, History, ArrowRight, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store';
import { SarvamService } from '../services/sarvam';
import type { Notification } from '../store';
import { CATEGORIES } from '../data';
import { toast } from 'sonner';
import stringSimilarity from 'string-similarity';

// ─── AI Smart Search Dropdown (new sub-component) ───
const SmartSearchSuggestions = memo(function SmartSearchSuggestions({
  query,
  onClose,
  onSelect
}: {
  query: string;
  onClose: () => void;
  onSelect: (q: string) => void;
}) {
  const products = useStore((s) => s.products);
  
  const suggestions = useMemo(() => {
    if (query.length < 2) return [];
    
    // Fuzzy search for products, categories, and brands
    const targets = Array.from(new Set([
      ...products.map(p => p.name),
      ...products.map(p => p.category.replace('-', ' ')),
      ...products.map(p => p.brand)
    ])).filter(Boolean);

    const matches = stringSimilarity.findBestMatch(query.toLowerCase(), targets.map(t => t.toLowerCase()));
    
    return matches.ratings
      .filter(r => r.rating > 0.2)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5)
      .map(r => r.target);
  }, [query, products]);

  if (suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-border/60 overflow-hidden z-50"
    >
      <div className="p-2">
        <div className="px-3 py-2 flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <Sparkles className="w-3 h-3 text-amber-400" /> AI Suggestions
        </div>
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onSelect(s)}
            className="w-full text-left px-4 py-3 hover:bg-slate-50 rounded-xl transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
              <span className="text-[14px] text-slate-700 font-medium capitalize">{s}</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </button>
        ))}
      </div>
    </motion.div>
  );
});

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
      <div className="absolute right-0 top-full mt-2.5 w-80 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.12)] border border-border/60 z-50 overflow-hidden">
        <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-50/50 border-b border-border/60 flex items-center justify-between">
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
                className={`w-full text-left px-4 py-3 border-b last:border-0 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-amber-50/50' : ''
                  }`}
              >
                <div className="flex gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${n.type === 'product_available' ? 'bg-primary/10' : 'bg-amber-50'
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
      <div className="absolute right-0 top-full mt-2.5 w-60 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.12)] border border-border/60 z-50 py-1 overflow-hidden">
        {user ? (
          <>
            <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-50/50 border-b border-border/60">
              <p className="text-[14px]" style={{ fontWeight: 600 }}>{user.name}</p>
              <p className="text-[12px] text-muted-foreground">{user.email}</p>
              <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] bg-gradient-to-r from-primary/10 to-emerald-500/10 text-primary border border-primary/15 capitalize" style={{ fontWeight: 600 }}>
                {user.role === 'shopowner' ? 'Shop Owner' : user.role === 'admin' ? 'Admin' : 'Customer'}
              </span>
            </div>
            {user.role === 'shopowner' && (
              <Link to="/shop-dashboard" onClick={onClose} className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-primary/5 text-[14px] transition-colors">
                <Store className="w-4 h-4 text-muted-foreground" /> Shop Dashboard
              </Link>
            )}
            <Link to="/orders" onClick={onClose} className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-primary/5 text-[14px] transition-colors">
              <Package className="w-4 h-4 text-muted-foreground" /> My Orders
            </Link>
            {user.role === 'customer' && (
              <Link to="/account" onClick={onClose} className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-primary/5 text-[14px] transition-colors">
                <User className="w-4 h-4 text-muted-foreground" /> Profile
              </Link>
            )}
            {user.role === 'customer' && (
              <Link to="/savings" onClick={onClose} className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-primary/5 text-[14px] transition-colors">
                <TrendingUp className="w-4 h-4 text-muted-foreground" /> My Savings
              </Link>
            )}
            <div className="mx-3 my-1 h-px bg-border/60" />
            <button onClick={() => { logout(); onClose(); navigate('/'); }} className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-red-50 text-[14px] w-full text-destructive transition-colors">
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
                <div className="absolute left-0 top-full w-64 bg-white/95 backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.12)] rounded-b-2xl rounded-t-none border border-border/60 z-50 py-1 overflow-hidden">
                  {CATEGORIES.map((cat) => (
                    <Link
                      key={cat.slug}
                      to={`/products?category=${cat.slug}`}
                      onClick={() => setCatDropdown(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary/5 text-[14px] transition-colors group/cat"
                    >
                      <span className="text-[18px] group-hover/cat:scale-110 transition-transform">{cat.icon}</span>
                      <span className="group-hover/cat:text-primary transition-colors">{cat.name}</span>
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
              className="relative px-3 py-2.5 text-[14px] text-gray-600 hover:text-primary transition-colors after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-primary after:rounded-full after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-left"
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

  const products = useStore((s) => s.products);

  const [mobileMenu, setMobileMenu] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [notifDropdown, setNotifDropdown] = useState(false);
  const navigate = useNavigate();

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        setIsRecording(false);
        toast.info('Processing voice...');
        try {
          const result = await SarvamService.speechToText(audioBlob);
          let finalQuery = result.transcript.trim();

          // Improved algorithm for string matching
          if (finalQuery) {
            const cleanQuery = finalQuery.toLowerCase().replace(/[^\w\s]/g, '').trim();
            if (cleanQuery) {
              const targets = Array.from(new Set([
                ...products.map(p => p.name),
                ...products.map(p => p.category.replace('-', ' ')),
                ...products.map(p => p.brand)
              ])).filter(Boolean);

              const lowerTargets = targets.map(t => t.toLowerCase().replace(/[^\w\s]/g, '').trim());

              let bestMatch = '';
              let highestScore = 0;

              for (let i = 0; i < lowerTargets.length; i++) {
                const t = lowerTargets[i];
                if (!t) continue;

                // Exact match
                if (t === cleanQuery) {
                  bestMatch = targets[i];
                  highestScore = 1;
                  break;
                }

                // Word boundary check (e.g. 'Apple' in 'buy an apple phone')
                try {
                  const regex = new RegExp(`\\b${t}\\b`, 'i');
                  if (regex.test(cleanQuery)) {
                    const score = 0.8 + (t.length / 100);
                    if (score > highestScore) {
                      highestScore = score;
                      bestMatch = targets[i];
                    }
                  } else if (t.includes(cleanQuery) && cleanQuery.length > 2) {
                    // Target contains query (e.g. 'apple' matches 'apple iphone')
                    const score = 0.7 + (cleanQuery.length / t.length) * 0.1;
                    if (score > highestScore) {
                      highestScore = score;
                      bestMatch = targets[i];
                    }
                  }
                } catch {
                  // Ignore regex compilation errors for weird strings
                }
              }

              // Fallback to fuzzy matching for typos
              if (highestScore < 0.8) {
                const match = stringSimilarity.findBestMatch(cleanQuery, lowerTargets);
                const threshold = cleanQuery.length <= 4 ? 0.3 : 0.4;
                if (match.bestMatch.rating >= threshold && match.bestMatch.rating > highestScore) {
                  bestMatch = targets[match.bestMatchIndex];
                }
              }

              finalQuery = bestMatch || cleanQuery;
            }
          }

          setSearchQuery(finalQuery);

          if (finalQuery) {
            toast.success(`Search set to: "${finalQuery}"`);
            navigate('/products');
          } else {
            toast.error("Didn't catch that. Please try again.");
          }
        } catch (err: any) {
          toast.error(err.message || 'STT failed');
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      toast.info('Listening... Speak now.');
    } catch (err) {
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(t => t.stop());
      setMediaRecorder(null);
    }
  };

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate('/products');
  }, [searchQuery, navigate]);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl shadow-sm border-b border-border/60 glass-tinted">
      {/* Top bar */}
      <div className="hidden sm:block bg-gradient-to-r from-primary via-primary to-emerald-600 text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between text-[12px]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Deliver to all India</span>
            <span className="hidden sm:block">Free delivery on orders above Rs.999</span>
          </div>
          <div className="flex items-center gap-4">
            {user?.role === 'shopowner' && (
              <span className="bg-white/20 rounded-full px-3 py-0.5 text-[11px]" style={{ fontWeight: 500 }}>✦ Wholesale Account</span>
            )}
            <span className="hidden sm:block">24/7 Support: 1800-123-4567</span>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-2.5 shrink-0 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-primary/20 group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-300 glow-primary shine-hover group-hover:scale-105">
              <Store className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="hidden xs:block">
              <span className="text-[16px] sm:text-[20px] text-gradient-primary leading-none" style={{ fontWeight: 800 }}>Kumar Store</span>
              <span className="hidden sm:block text-[10px] text-muted-foreground -mt-1 tracking-wider uppercase" style={{ fontWeight: 500 }}>Wholesale & Retail</span>
            </div>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-2xl relative">
            <form onSubmit={handleSearch} className="relative group">
              <div className="flex items-center bg-slate-50/50 backdrop-blur-md border border-slate-200 rounded-2xl overflow-hidden focus-within:border-primary/40 transition-all duration-300 shadow-sm focus-within:shadow-lg focus-within:shadow-primary/5 focus-within:bg-white">
                <div className="pl-4 text-slate-400 group-focus-within:text-primary transition-colors">
                  <Search className="w-4.5 h-4.5" />
                </div>
                <input
                  type="text"
                  placeholder="Ask AI to find products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setNotifDropdown(false)} // Close other dropdowns
                  className="flex-1 px-3 py-3 bg-transparent outline-none text-[14px] min-w-0 font-medium placeholder:text-slate-400"
                />
                <div className="flex items-center gap-1 pr-2">
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`p-2 rounded-xl transition-all ${isRecording ? 'bg-primary/10 text-primary animate-pulse' : 'text-slate-400 hover:text-primary hover:bg-slate-100'}`}
                    title="Voice Search"
                  >
                    <Mic className="w-4.5 h-4.5" />
                  </button>
                  <button 
                    type="submit" 
                    className="hidden sm:flex items-center gap-2 px-5 py-2 bg-slate-900 text-white hover:bg-slate-800 transition-all rounded-xl font-bold text-[13px] shadow-md hover:shadow-lg active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Search
                  </button>
                </div>
              </div>
            </form>

            <AnimatePresence>
              {searchQuery.length >= 2 && (
                <SmartSearchSuggestions 
                  query={searchQuery} 
                  onClose={() => setSearchQuery('')}
                  onSelect={(q) => {
                    setSearchQuery(q);
                    navigate('/products');
                  }}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            {/* Notifications */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => { setNotifDropdown(!notifDropdown); setUserDropdown(false); }}
                  className="relative p-2 sm:p-2.5 hover:bg-primary/5 rounded-xl transition-colors hidden xs:flex items-center"
                >
                  <Bell className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-gray-600 group-hover:text-primary transition-colors" />
                  {unreadCount > 0 && (
                    <span key={unreadCount} className="absolute top-0 right-0 sm:-top-0.5 sm:-right-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-amber-500 text-white text-[9px] sm:text-[11px] rounded-full flex items-center justify-center badge-bounce shadow-sm">{unreadCount}</span>
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

            <Link to="/wishlist" className="relative p-2 sm:p-2.5 hover:bg-primary/5 rounded-xl transition-colors hidden xs:flex items-center gap-1.5 group btn-press">
              <Heart className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-gray-600 group-hover:text-primary transition-colors" />
              {wishlistLength > 0 && (
                <span key={wishlistLength} className="absolute top-0 right-0 sm:-top-0.5 sm:-right-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-primary text-white text-[9px] sm:text-[11px] rounded-full flex items-center justify-center badge-bounce shadow-sm">{wishlistLength}</span>
              )}
            </Link>

            <Link to="/cart" className="relative p-2 sm:p-2.5 hover:bg-primary/5 rounded-xl transition-colors flex items-center gap-1.5 group btn-press">
              <ShoppingCart className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-gray-600 group-hover:text-primary transition-colors" />
              {cartLength > 0 && (
                <span key={cartLength} className="absolute top-0 right-0 sm:-top-0.5 sm:-right-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-primary text-white text-[9px] sm:text-[11px] rounded-full flex items-center justify-center badge-bounce shadow-sm">{cartLength}</span>
              )}
              <span className="hidden lg:block text-[13px] text-gray-700 group-hover:text-primary transition-colors">Cart</span>
            </Link>

            {/* User */}
            <div className="relative">
              <button
                onClick={() => { setUserDropdown(!userDropdown); setNotifDropdown(false); }}
                className="p-2 sm:p-2.5 hover:bg-primary/5 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <User className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-gray-600" />
                <span className="hidden md:block text-[13px] text-gray-700 max-w-[100px] truncate">
                  {user ? user.name : 'Login'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-500 hidden md:block" />
              </button>
              {userDropdown && (
                <UserDropdown onClose={() => setUserDropdown(false)} />
              )}
            </div>

            <button onClick={() => setMobileMenu(!mobileMenu)} className="p-2 sm:p-2.5 hover:bg-primary/5 rounded-xl md:hidden transition-colors">
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
