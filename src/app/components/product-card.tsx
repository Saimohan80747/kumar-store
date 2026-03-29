import { memo } from 'react';
import { motion } from 'motion/react';
import { Heart, ShoppingCart, Star, Package, Bell, Plus, Minus, Tag } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { useStore, type Product } from '../store';
import { toast } from 'sonner';

export const ProductCard = memo(function ProductCard({ product }: { product: Product }) {
  // Granular selectors — only re-render when relevant state changes
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      className={`group bg-white rounded-[24px] border border-slate-200/60 hover:border-primary/20 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] transition-all duration-500 overflow-hidden relative flex flex-col shadow-premium ${!isAvailable ? 'opacity-60 grayscale-[30%]' : ''}`}
    >
      {/* Quick View Overlay (Mobile Friendly) */}
      <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Badges */}
      <div className="absolute top-4 left-4 z-30 flex flex-col gap-1.5">
        {!isAvailable && (
          <motion.span 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-slate-900/90 backdrop-blur-md text-white text-[10px] px-3 py-1 rounded-lg font-bold uppercase tracking-wider shadow-lg"
          >
            Sold Out
          </motion.span>
        )}
        {product.featured && isAvailable && (
          <motion.span 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] px-3 py-1 rounded-lg font-bold uppercase tracking-wider shadow-lg shadow-orange-500/20"
          >
            Featured
          </motion.span>
        )}
        {isLoggedIn && discount > 0 && isAvailable && (
          <motion.span 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[10px] px-3 py-1 rounded-lg font-bold uppercase tracking-wider shadow-lg shadow-emerald-500/20"
          >
            Save {discount}%
          </motion.span>
        )}
      </div>

      {/* Actions (Floating on Hover) */}
      <div className="absolute top-4 right-4 z-30 flex flex-col gap-2 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 ease-out">
        <button
          onClick={(e) => {
            e.preventDefault();
            if (!isLoggedIn) { navigate('/login'); return; }
            toggleWishlist(product.id);
            toast.success(isWished ? 'Removed from wishlist' : 'Added to wishlist');
          }}
          className={`p-2.5 rounded-2xl shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-90 ${isWished ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-white/90 text-slate-400 hover:text-red-500'}`}
        >
          <Heart className={`w-4.5 h-4.5 ${isWished ? 'fill-current' : ''}`} />
        </button>
        <button
          onClick={() => navigate(`/product/${product.id}`)}
          className="p-2.5 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl text-slate-400 hover:text-primary hover:scale-110 active:scale-90 transition-all duration-300"
        >
          <Tag className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Image Container */}
      <Link to={`/product/${product.id}`} className="relative block overflow-hidden bg-slate-50">
        <div className="aspect-[4/5] flex items-center justify-center p-6 sm:p-8 overflow-hidden">
          <motion.img 
            src={product.image} 
            alt={product.name} 
            whileHover={{ scale: 1.15 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full object-contain mix-blend-multiply drop-shadow-2xl"
            loading="lazy" 
          />
        </div>
        
        {/* Quick Add (Desktop) */}
        {isAvailable && (
          <div className="absolute inset-x-4 bottom-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-30 hidden sm:block">
            {cartQty > 0 ? (
              <div className="flex items-center bg-white/90 backdrop-blur-md rounded-2xl p-1 shadow-2xl border border-white">
                <button
                  onClick={(e) => { e.preventDefault(); updateCartQty(product.id, cartQty - 1); }}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="flex-1 text-center font-bold text-slate-900">{cartQty}</span>
                <button
                  onClick={(e) => { e.preventDefault(); updateCartQty(product.id, cartQty + 1); }}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (!isLoggedIn) { navigate('/login'); return; }
                  addToCart(product);
                  toast.success(`Added ${product.name} to cart`);
                }}
                className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-[14px] flex items-center justify-center gap-2 shadow-2xl hover:bg-slate-800 transition-all active:scale-95"
              >
                <ShoppingCart className="w-4 h-4" /> Quick Add
              </button>
            )}
          </div>
        )}
      </Link>

      {/* Content Container */}
      <div className="p-5 flex-1 flex flex-col bg-white">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-[0.15em] font-black">{product.brand}</span>
          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
            <Star className="w-3 h-3 fill-current" />
            <span>{product.rating}</span>
          </div>
        </div>

        <Link to={`/product/${product.id}`} className="text-[15px] text-slate-800 line-clamp-2 hover:text-primary transition-colors leading-tight font-bold mb-3">
          {product.name}
        </Link>

        {/* Pricing & Cart (Mobile optimized) */}
        <div className="mt-auto pt-4 border-t border-slate-50 flex items-end justify-between gap-4">
          <div className="flex flex-col">
            {isLoggedIn ? (
              <>
                {priceDiff > 0 && (
                  <span className="text-[12px] text-slate-400 line-through">Rs.{product.mrp}</span>
                )}
                <span className="text-[19px] text-slate-900 font-black leading-none">Rs.{price}</span>
              </>
            ) : (
              <button 
                onClick={() => navigate('/login')}
                className="text-[11px] font-bold text-primary hover:underline uppercase tracking-wider"
              >
                Login for Price
              </button>
            )}
          </div>

          {/* Mobile Cart Action */}
          <div className="sm:hidden">
            {isAvailable ? (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (!isLoggedIn) { navigate('/login'); return; }
                  if (cartQty > 0) navigate('/cart');
                  else {
                    addToCart(product);
                    toast.success('Added to cart');
                  }
                }}
                className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all active:scale-90 ${cartQty > 0 ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}
              >
                {cartQty > 0 ? <span className="text-[14px] font-black">{cartQty}</span> : <ShoppingCart className="w-5 h-5" />}
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  requestProduct(product.id, product.name);
                  toast.success('Interest noted! We will notify you.');
                }}
                className="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400"
              >
                <Bell className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});