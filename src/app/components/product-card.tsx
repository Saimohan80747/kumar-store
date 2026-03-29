import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, ShoppingCart, Star, Package, Bell, Plus, Minus, Tag, Eye, Zap, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { useStore, type Product } from '../store';
import { toast } from 'sonner';

export const ProductCard = memo(function ProductCard({ product }: { product: Product }) {
  const user = useStore((s) => s.user);
  const cart = useStore((s) => s.cart);
  const wishlist = useStore((s) => s.wishlist);
  const addToCart = useStore((s) => s.addToCart);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const updateCartQty = useStore((s) => s.updateCartQty);
  const toggleWishlist = useStore((s) => s.toggleWishlist);
  const getPrice = useStore((s) => s.getPrice);
  const requestProduct = useStore((s) => s.requestProduct);
  const navigate = useNavigate();

  const isWished = wishlist.includes(product.id);
  const isLoggedIn = !!user;
  const price = getPrice(product);
  const isShop = user?.role === 'shopowner';
  const priceDiff = product.mrp - price;
  const discount = isLoggedIn && priceDiff > 0 ? Math.round((priceDiff / product.mrp) * 100) : 0;
  const isAvailable = product.stock > 0;
  const cartItem = cart.find((i) => i.product.id === product.id);
  const cartQty = cartItem?.quantity || 0;

  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative bg-white rounded-[32px] border border-slate-100 hover:border-primary/20 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-700 ease-out flex flex-col h-full overflow-hidden ${!isAvailable ? 'opacity-70 grayscale-[30%]' : ''}`}
    >
      {/* 1. Top Badges & Actions */}
      <div className="absolute top-4 inset-x-4 z-30 flex items-start justify-between pointer-events-none">
        <div className="flex flex-col gap-2 pointer-events-auto">
          {!isAvailable ? (
            <motion.div 
              initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5"
            >
              <Package className="w-3 h-3" /> Out of Stock
            </motion.div>
          ) : (
            <>
              {product.featured && (
                <motion.div 
                  initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                  className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 fill-current" /> Featured
                </motion.div>
              )}
              {isLoggedIn && discount > 0 && (
                <motion.div 
                  initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                  className="bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
                >
                  <Zap className="w-3 h-3 fill-current" /> {discount}% OFF
                </motion.div>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col gap-2 pointer-events-auto">
          <button
            onClick={(e) => {
              e.preventDefault();
              if (!isLoggedIn) { navigate('/login'); return; }
              toggleWishlist(product.id);
              toast.success(isWished ? 'Removed from wishlist' : 'Added to wishlist');
            }}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-xl backdrop-blur-md ${isWished ? 'bg-rose-500 text-white shadow-rose-500/20 scale-110' : 'bg-white/90 text-slate-400 hover:text-rose-500 hover:scale-110 active:scale-90'}`}
          >
            <Heart className={`w-4.5 h-4.5 ${isWished ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={() => navigate(`/product/${product.id}`)}
            className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center text-slate-400 hover:text-primary hover:scale-110 active:scale-90 transition-all duration-500 shadow-xl opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
          >
            <Eye className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* 2. Image Section */}
      <Link to={`/product/${product.id}`} className="relative block aspect-[4/5] bg-slate-50 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center p-8 sm:p-12 transition-transform duration-1000 ease-out group-hover:scale-110">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-contain mix-blend-multiply drop-shadow-2xl filter brightness-[1.02]"
            loading="lazy" 
          />
        </div>
        
        {/* Quick Add Overlay (Desktop) */}
        {isAvailable && (
          <div className="absolute inset-x-6 bottom-6 z-30 hidden sm:block">
            <AnimatePresence mode="wait">
              {cartQty > 0 ? (
                <motion.div 
                  initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
                  className="bg-white/90 backdrop-blur-xl rounded-[24px] p-1.5 shadow-2xl border border-white flex items-center"
                >
                  <button
                    onClick={(e) => { e.preventDefault(); updateCartQty(product.id, cartQty - 1); }}
                    className="w-11 h-11 flex items-center justify-center rounded-2xl hover:bg-slate-50 text-slate-900 transition-all active:scale-90"
                  >
                    <Minus className="w-4.5 h-4.5" />
                  </button>
                  <span className="flex-1 text-center font-black text-slate-900 text-[16px]">{cartQty}</span>
                  <button
                    onClick={(e) => { e.preventDefault(); updateCartQty(product.id, cartQty + 1); }}
                    className="w-11 h-11 flex items-center justify-center rounded-2xl hover:bg-slate-50 text-slate-900 transition-all active:scale-90"
                  >
                    <Plus className="w-4.5 h-4.5" />
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
                  onClick={(e) => {
                    e.preventDefault();
                    if (!isLoggedIn) { navigate('/login'); return; }
                    addToCart(product);
                    toast.success('Added to cart!');
                  }}
                  className="w-full py-4 bg-slate-900 text-white rounded-[24px] font-black uppercase tracking-widest text-[13px] flex items-center justify-center gap-3 shadow-2xl hover:bg-slate-800 transition-all active:scale-95 opacity-0 group-hover:opacity-100"
                >
                  <ShoppingCart className="w-4.5 h-4.5" /> Quick Add
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        )}
      </Link>

      {/* 3. Content Section */}
      <div className="p-6 flex-1 flex flex-col bg-white relative z-10">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{product.brand}</span>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 rounded-lg">
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span className="text-[11px] font-black text-amber-700">{product.rating}</span>
          </div>
        </div>

        <Link to={`/product/${product.id}`} className="text-[17px] font-black text-slate-900 leading-tight hover:text-primary transition-colors line-clamp-2 mb-4 group-hover:translate-x-1 transition-transform duration-500">
          {product.name}
        </Link>

        {/* 4. Price & Mobile Actions */}
        <div className="mt-auto pt-5 border-t border-slate-50 flex items-center justify-between">
          <div className="flex flex-col">
            {isLoggedIn ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-[22px] font-black text-slate-900 tracking-tight">₹{price.toLocaleString('en-IN')}</span>
                  {discount > 0 && (
                    <span className="text-[14px] font-bold text-slate-300 line-through">₹{product.mrp.toLocaleString('en-IN')}</span>
                  )}
                </div>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">
                  {isShop ? 'Business Price' : 'Member Deal'}
                </p>
              </>
            ) : (
              <button onClick={() => navigate('/login')} className="text-[11px] font-black text-primary hover:underline uppercase tracking-widest flex items-center gap-1.5">
                Login for Price <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Mobile Cart Action (Always Visible on Mobile) */}
          <div className="sm:hidden">
            {isAvailable ? (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (!isLoggedIn) { navigate('/login'); return; }
                  if (cartQty > 0) navigate('/cart');
                  else { addToCart(product); toast.success('Added to cart'); }
                }}
                className={`w-12 h-12 flex items-center justify-center rounded-[20px] transition-all active:scale-90 shadow-xl ${cartQty > 0 ? 'bg-primary text-white shadow-primary/20' : 'bg-slate-900 text-white shadow-slate-900/20'}`}
              >
                {cartQty > 0 ? <span className="text-[16px] font-black">{cartQty}</span> : <ShoppingCart className="w-5 h-5" />}
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  requestProduct(product.id, product.name);
                  toast.success('Interest noted!');
                }}
                className="w-12 h-12 flex items-center justify-center rounded-[20px] bg-slate-50 text-slate-400 border border-slate-100"
              >
                <Bell className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. Subtle Glow Effect on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
    </motion.div>
  );
});
