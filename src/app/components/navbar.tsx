import { useState, memo, useMemo, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Search, ShoppingCart, Heart, User, Menu, X, Package,
  ChevronDown, LogOut, Store, MapPin, Bell, CheckCheck, TrendingUp,
  Mic, Sparkles, History, ChevronRight,
  Zap, Star, LayoutGrid, ZapIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store';
import { SarvamService } from '../services/sarvam';
import type { Notification } from '../store';
import { CATEGORIES } from '../data';
import { toast } from 'sonner';
import stringSimilarity from 'string-similarity';

// ─── AI Smart Search Dropdown ───
const SmartSearchSuggestions = memo(function SmartSearchSuggestions({
  query,
  onSelect
}: {
  query: string;
  onSelect: (q: string) => void;
}) {
  const products = useStore((s) => s.products);
  
  const suggestions = useMemo(() => {
    if (query.length < 2) return [];
    
    const targets = Array.from(new Set([
      ...products.map(p => p.name),
      ...products.map(p => p.category.replace('-', ' ')),
      ...products.map(p => p.brand)
    ])).filter(Boolean);

    const matches = stringSimilarity.findBestMatch(query.toLowerCase(), targets.map(t => t.toLowerCase()));
    
    return matches.ratings
      .filter(r => r.rating > 0.15)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6)
      .map(r => r.target);
  }, [query, products]);

  if (suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute top-full left-0 right-0 mt-3 bg-white/90 backdrop-blur-2xl rounded-[28px] shadow-[0_20px_70px_rgba(0,0,0,0.15)] border border-white/20 overflow-hidden z-50 ring-1 ring-black/5"
    >
      <div className="p-3">
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" /> Smart Suggestions
          </div>
          <span className="text-[10px] font-bold text-slate-300">AI Powered</span>
        </div>
        <div className="space-y-1 mt-1">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onSelect(s)}
              className="w-full text-left px-4 py-3.5 hover:bg-slate-50 rounded-[20px] transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all">
                  <Search className="w-4 h-4 text-slate-400 group-hover:text-primary" />
                </div>
                <span className="text-[14px] text-slate-700 font-bold capitalize tracking-tight group-hover:text-slate-900 transition-colors">{s}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
});

// ─── Notification Dropdown ───
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
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute right-0 top-full mt-3 w-85 bg-white/90 backdrop-blur-2xl rounded-[32px] shadow-[0_25px_80px_rgba(0,0,0,0.18)] border border-white/20 z-50 overflow-hidden ring-1 ring-black/5"
    >
      <div className="px-6 py-5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-[16px] font-black tracking-tight">Inbox</h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{unreadCount} New Messages</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllNotificationsRead()}
            className="text-[12px] font-black text-primary hover:text-primary/80 transition-colors uppercase tracking-widest flex items-center gap-1.5"
          >
            <CheckCheck className="w-4 h-4" /> Clear All
          </button>
        )}
      </div>
      <div className="max-h-96 overflow-y-auto custom-scrollbar">
        {notifications.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-[14px] font-bold text-slate-400">All caught up!</p>
          </div>
        ) : (
          notifications.slice(0, 15).map((n) => (
            <button
              key={n.id}
              onClick={() => {
                markNotificationRead(n.id);
                if (n.productId) {
                  navigate(`/product/${n.productId}`);
                  onClose();
                }
              }}
              className={`w-full text-left px-6 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-all group ${!n.read ? 'bg-primary/[0.02]' : ''}`}
            >
              <div className="flex gap-4">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${n.type === 'product_available' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  {n.type === 'product_available' ? <Package className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[14px] tracking-tight line-clamp-1 ${n.read ? 'font-bold text-slate-600' : 'font-black text-slate-900'}`}>{n.title}</p>
                  <p className="text-[12px] font-medium text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">{n.message}</p>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-2">{new Date(n.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • {new Date(n.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                {!n.read && <div className="w-2.5 h-2.5 bg-primary rounded-full shrink-0 mt-1.5 shadow-sm shadow-primary/40" />}
              </div>
            </button>
          ))
        )}
      </div>
      {notifications.length > 0 && (
        <button className="w-full py-4 text-[12px] font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest bg-slate-50/50">
          View all notifications
        </button>
      )}
    </motion.div>
  );
});

// ─── User Dropdown ───
const UserDropdown = memo(function UserDropdown({ onClose }: { onClose: () => void }) {
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);
  const navigate = useNavigate();

  const menuItems = [
    ...(user?.role === 'shopowner' ? [{ icon: Store, label: 'Shop Dashboard', path: '/shop-dashboard', color: 'text-amber-600 bg-amber-50' }] : []),
    { icon: Package, label: 'My Orders', path: '/orders', color: 'text-blue-600 bg-blue-50' },
    { icon: User, label: 'Profile Settings', path: '/account', color: 'text-indigo-600 bg-indigo-50' },
    { icon: TrendingUp, label: 'My Savings', path: '/savings', color: 'text-emerald-600 bg-emerald-50' },
    { icon: Heart, label: 'Wishlist', path: '/wishlist', color: 'text-rose-600 bg-rose-50' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute right-0 top-full mt-3 w-72 bg-white/90 backdrop-blur-2xl rounded-[32px] shadow-[0_25px_80px_rgba(0,0,0,0.18)] border border-white/20 z-50 overflow-hidden ring-1 ring-black/5"
    >
      {user ? (
        <div className="p-2">
          <div className="px-5 py-5 bg-slate-900 rounded-[24px] mb-2 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10">
              <p className="text-[16px] font-black tracking-tight">{user.name}</p>
              <p className="text-[12px] font-medium text-white/50 truncate">{user.email}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="px-3 py-1 rounded-full text-[10px] font-black bg-white/10 text-white border border-white/10 uppercase tracking-widest">
                  {user.role}
                </span>
                {user.role === 'shopowner' && <ZapIcon className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
              </div>
            </div>
          </div>
          
          <div className="space-y-1">
            {menuItems.map((item, i) => (
              <button
                key={i}
                onClick={() => { navigate(item.path); onClose(); }}
                className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-50 rounded-[18px] transition-all group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${item.color}`}>
                  <item.icon className="w-4.5 h-4.5" />
                </div>
                <span className="text-[14px] font-bold text-slate-700 group-hover:text-slate-900">{item.label}</span>
                <ChevronRight className="w-4 h-4 ml-auto text-slate-300 group-hover:translate-x-1 transition-transform" />
              </button>
            ))}
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100">
            <button 
              onClick={() => { logout(); onClose(); navigate('/'); }} 
              className="w-full flex items-center gap-4 px-4 py-3 hover:bg-red-50 text-red-600 rounded-[18px] transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center group-hover:rotate-12 transition-transform">
                <LogOut className="w-4.5 h-4.5" />
              </div>
              <span className="text-[14px] font-black uppercase tracking-widest">Sign Out</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4">
          <Link to="/login" onClick={onClose} className="flex items-center justify-center gap-3 w-full py-4 bg-slate-900 text-white rounded-[20px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95">
            <User className="w-5 h-5" /> Sign In
          </Link>
          <div className="mt-4 text-center">
            <p className="text-[12px] font-bold text-slate-400">New to Kumar Store?</p>
            <Link to="/register" onClick={onClose} className="text-[13px] font-black text-primary hover:underline mt-1 inline-block uppercase tracking-widest">Create Account</Link>
          </div>
        </div>
      )}
    </motion.div>
  );
});

// ─── Category Bar ───
const CategoryBar = memo(function CategoryBar() {
  const [catDropdown, setCatDropdown] = useState(false);

  return (
    <div className="bg-white border-b border-slate-100 hidden md:block">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setCatDropdown(!catDropdown)}
              className={`flex items-center gap-2.5 px-5 py-3.5 text-[13px] font-black uppercase tracking-widest transition-all rounded-t-2xl ${catDropdown ? 'bg-slate-50 text-primary' : 'hover:text-primary'}`}
            >
              <LayoutGrid className="w-4.5 h-4.5" /> Shop Categories <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${catDropdown ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {catDropdown && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40 bg-black/5 backdrop-blur-[2px]" 
                    onClick={() => setCatDropdown(false)} 
                  />
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 top-full w-80 bg-white shadow-[0_30px_90px_rgba(0,0,0,0.15)] rounded-b-[32px] border border-slate-100 z-50 p-3 overflow-hidden"
                  >
                    <div className="grid grid-cols-1 gap-1">
                      {CATEGORIES.map((cat) => (
                        <Link
                          key={cat.slug}
                          to={`/products?category=${cat.slug}`}
                          onClick={() => setCatDropdown(false)}
                          className="flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50 rounded-2xl transition-all group"
                        >
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all text-[20px]">
                            {cat.icon}
                          </div>
                          <div>
                            <p className="text-[14px] font-bold text-slate-700 group-hover:text-primary transition-colors">{cat.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Explore Collection</p>
                          </div>
                          <ChevronRight className="w-4 h-4 ml-auto text-slate-200 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          
          <div className="h-6 w-px bg-slate-100 mx-2" />
          
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {['Best Sellers', 'New Arrivals', 'Bulk Deals', 'Offers'].map((item) => (
              <Link
                key={item}
                to="/products"
                className="px-4 py-3.5 text-[13px] font-bold text-slate-500 hover:text-primary transition-all relative group"
              >
                {item}
                <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-full" />
              </Link>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-6">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-full border border-amber-100">
               <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
               <span className="text-[11px] font-black text-amber-700 uppercase tracking-widest">Flash Sale Live</span>
             </div>
             <div className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
               <History className="w-4 h-4" />
               <span className="text-[12px] font-bold">Track Order</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// ─── Main Navbar ───
export function Navbar() {
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
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
        toast.loading('AI Processing voice...', { id: 'voice-search' });
        try {
          const result = await SarvamService.speechToText(audioBlob);
          let finalQuery = result.transcript.trim();

          if (finalQuery) {
            const cleanQuery = finalQuery.toLowerCase().replace(/[^\w\s]/g, '').trim();
            if (cleanQuery) {
              const targets = Array.from(new Set([
                ...products.map(p => p.name),
                ...products.map(p => p.category.replace('-', ' ')),
                ...products.map(p => p.brand)
              ])).filter(Boolean);

              const match = stringSimilarity.findBestMatch(cleanQuery, targets.map(t => t.toLowerCase()));
              if (match.bestMatch.rating > 0.4) {
                finalQuery = targets[match.bestMatchIndex];
              }
            }
          }

          setSearchQuery(finalQuery);
          toast.dismiss('voice-search');

          if (finalQuery) {
            toast.success(`Found: "${finalQuery}"`);
            navigate('/products');
          } else {
            toast.error("Couldn't hear clearly. Try again?");
          }
        } catch (err: any) {
          toast.dismiss('voice-search');
          toast.error('Voice processing failed');
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
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
    <header className={`sticky top-0 z-50 transition-all duration-500 ${scrolled ? 'py-2' : 'py-0'}`}>
      <div className={`mx-auto max-w-[1440px] px-0 sm:px-4 transition-all duration-500`}>
        <div className={`bg-white/80 backdrop-blur-2xl border-slate-200/60 shadow-sm transition-all duration-500 ${scrolled ? 'rounded-[32px] border mx-2 sm:mx-0 shadow-xl shadow-black/5' : 'border-b'}`}>
          
          {/* Top Bar (Compact) */}
          {!scrolled && (
            <div className="hidden sm:block bg-slate-900 text-white/70 overflow-hidden">
              <div className="max-w-7xl mx-auto px-6 py-1.5 flex items-center justify-between text-[11px] font-black uppercase tracking-[0.15em]">
                <div className="flex items-center gap-6">
                  <span className="flex items-center gap-2 text-primary"><MapPin className="w-3.5 h-3.5" /> India-Wide Delivery</span>
                  <span className="h-3 w-px bg-white/10" />
                  <span>Free Shipping on Orders over ₹999</span>
                </div>
                <div className="flex items-center gap-6">
                  {user?.role === 'shopowner' && (
                    <span className="text-amber-400 flex items-center gap-1.5"><Star className="w-3 h-3 fill-current" /> Premium Partner</span>
                  )}
                  <span className="hover:text-white transition-colors cursor-pointer">Support</span>
                </div>
              </div>
            </div>
          )}

          {/* Main Navigation */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
            <div className="flex items-center gap-4 lg:gap-8">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-3 shrink-0 group">
                <div className="w-11 h-11 bg-slate-900 rounded-[18px] flex items-center justify-center shadow-2xl shadow-slate-900/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <Store className="w-5.5 h-5.5 text-white relative z-10" />
                </div>
                <div className="hidden xs:block">
                  <span className="text-[20px] font-black tracking-tighter text-slate-900 block leading-none">Kumar Store</span>
                  <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mt-1 block">Premium Mall</span>
                </div>
              </Link>

              {/* AI Search Engine */}
              <div className="flex-1 max-w-2xl relative hidden sm:block">
                <form onSubmit={handleSearch} className="relative">
                  <div className={`flex items-center bg-slate-50 border border-slate-100 rounded-[22px] transition-all duration-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-primary/5 focus-within:border-primary/20 group ${scrolled ? 'py-0.5' : ''}`}>
                    <div className="pl-5 text-slate-400 group-focus-within:text-primary transition-colors">
                      <Search className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      placeholder="Ask our AI assistant to find anything..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 px-4 py-3.5 bg-transparent outline-none text-[14px] font-bold text-slate-700 placeholder:text-slate-400"
                    />
                    <div className="flex items-center gap-2 pr-2">
                      <button
                        type="button"
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-50 text-red-500 animate-pulse' : 'text-slate-400 hover:bg-slate-100 hover:text-primary'}`}
                      >
                        <Mic className="w-5 h-5" />
                      </button>
                      <button 
                        type="submit" 
                        className="bg-slate-900 text-white px-6 py-2.5 rounded-[16px] font-black text-[12px] uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/10 flex items-center gap-2"
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
                      onSelect={(q) => {
                        setSearchQuery(q);
                        navigate(`/products?search=${encodeURIComponent(q)}`);
                      }}
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* Action Icons */}
              <div className="flex items-center gap-1 sm:gap-2">
                <button className="p-2.5 hover:bg-slate-50 rounded-2xl transition-all sm:hidden text-slate-600">
                  <Search className="w-5.5 h-5.5" />
                </button>

                {/* Wishlist */}
                <Link to="/wishlist" className="relative p-2.5 hover:bg-rose-50 rounded-2xl transition-all group hidden xs:flex">
                  <Heart className="w-5.5 h-5.5 text-slate-600 group-hover:text-rose-500 group-hover:fill-rose-500 transition-all" />
                  {wishlistLength > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                    >
                      {wishlistLength}
                    </motion.span>
                  )}
                </Link>

                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => { setNotifDropdown(!notifDropdown); setUserDropdown(false); }}
                    className={`relative p-2.5 hover:bg-slate-50 rounded-2xl transition-all group ${notifDropdown ? 'bg-slate-100' : ''}`}
                  >
                    <Bell className="w-5.5 h-5.5 text-slate-600 group-hover:text-primary transition-all" />
                    {unreadCount > 0 && (
                      <motion.span 
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                      >
                        {unreadCount}
                      </motion.span>
                    )}
                  </button>
                  <AnimatePresence>
                    {notifDropdown && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setNotifDropdown(false)} />
                        <NotificationDropdown notifications={notifications} unreadCount={unreadCount} onClose={() => setNotifDropdown(false)} />
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Cart */}
                <Link to="/cart" className="relative p-2.5 hover:bg-primary/5 rounded-2xl transition-all group">
                  <ShoppingCart className="w-5.5 h-5.5 text-slate-600 group-hover:text-primary transition-all" />
                  {cartLength > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                    >
                      {cartLength}
                    </motion.span>
                  )}
                </Link>

                {/* User Profile */}
                <div className="relative ml-1">
                  <button
                    onClick={() => { setUserDropdown(!userDropdown); setNotifDropdown(false); }}
                    className={`flex items-center gap-3 p-1.5 pl-1.5 pr-3 sm:pr-4 rounded-[20px] transition-all ${userDropdown ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
                  >
                    <div className="w-9 h-9 bg-slate-900 rounded-full flex items-center justify-center text-white text-[14px] font-black overflow-hidden shadow-lg shadow-slate-900/10">
                      {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                    </div>
                    <div className="hidden lg:block text-left">
                      <p className="text-[12px] font-black text-slate-900 leading-none">{user ? user.name.split(' ')[0] : 'Sign In'}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">My Account</p>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 hidden lg:block transition-transform duration-300 ${userDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {userDropdown && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setUserDropdown(false)} />
                        <UserDropdown onClose={() => setUserDropdown(false)} />
                      </>
                    )}
                  </AnimatePresence>
                </div>

                <button onClick={() => setMobileMenu(!mobileMenu)} className="p-2.5 hover:bg-slate-50 rounded-2xl md:hidden transition-colors">
                  {mobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>

          {/* Category Bar (Desktop) */}
          <CategoryBar />

        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenu && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-slate-100 overflow-hidden"
          >
             <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Categories</p>
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORIES.map(cat => (
                      <Link key={cat.slug} to={`/products?category=${cat.slug}`} onClick={() => setMobileMenu(false)} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl text-[14px] font-bold">
                        <span>{cat.icon}</span> {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <Link to="/orders" onClick={() => setMobileMenu(false)} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl text-[14px] font-black uppercase tracking-widest">
                    <div className="flex items-center gap-3"><Package className="w-5 h-5 text-primary" /> My Orders</div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </Link>
                  <Link to="/wishlist" onClick={() => setMobileMenu(false)} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl text-[14px] font-black uppercase tracking-widest">
                    <div className="flex items-center gap-3"><Heart className="w-5 h-5 text-rose-500" /> My Wishlist</div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </Link>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
