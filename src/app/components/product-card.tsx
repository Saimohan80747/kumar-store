import { memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, ShoppingCart, Star, Package, Bell, Plus, Minus, Eye, Zap, Sparkles, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { useStore, type Product } from '../store';
import { toast } from 'sonner';
import { TiltCard } from './ui/tilt-card';

export const ProductCard = memo(function ProductCard({ product }: { product: Product }) {
  const user = useStore((s) => s.user);
  const cart = useStore((s) => s.cart);
  const wishlist = useStore((s) => s.wishlist);
  const addToCart = useStore((s) => s.addToCart);
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
  const cartItem = cart.find((item) => item.product.id === product.id);
  const cartQty = cartItem?.quantity || 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="h-full">
      <TiltCard
        className={`group relative flex h-full flex-col overflow-hidden rounded-[32px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.92)_44%,rgba(248,250,252,0.98)_100%)] shadow-premium transition-all duration-700 hover:border-primary/20 hover:shadow-[0_35px_70px_-24px_rgba(15,23,42,0.18)] ${!isAvailable ? 'opacity-70 grayscale-[20%]' : ''}`}
        contentClassName="flex h-full flex-col"
        maxTilt={10}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(16,185,129,0.08),transparent_34%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.4)_0%,transparent_24%,rgba(255,255,255,0.5)_100%)]" />

        <div className="absolute inset-x-4 top-4 z-30 flex items-start justify-between pointer-events-none">
          <div className="flex flex-col gap-2 pointer-events-auto">
            {!isAvailable ? (
              <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg">
                <Package className="h-3 w-3" /> Out of Stock
              </motion.div>
            ) : (
              <>
                {product.featured && (
                  <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-amber-500/20">
                    <Sparkles className="h-3 w-3 fill-current" /> Featured
                  </motion.div>
                )}
                {isLoggedIn && discount > 0 && (
                  <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-500/20">
                    <Zap className="h-3 w-3 fill-current" /> {discount}% OFF
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
              className={`flex h-10 w-10 items-center justify-center rounded-2xl shadow-xl backdrop-blur-md transition-all duration-500 ${isWished ? 'bg-rose-500 text-white shadow-rose-500/20 scale-110' : 'bg-white/90 text-slate-400 hover:text-rose-500 hover:scale-110 active:scale-90'}`}
            >
              <Heart className={`h-4.5 w-4.5 ${isWished ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={() => navigate(`/product/${product.id}`)}
              className="flex h-10 w-10 translate-x-4 items-center justify-center rounded-2xl bg-white/90 text-slate-400 opacity-0 shadow-xl backdrop-blur-md transition-all duration-500 hover:scale-110 hover:text-primary active:scale-90 group-hover:translate-x-0 group-hover:opacity-100"
            >
              <Eye className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        <Link to={`/product/${product.id}`} className="relative block aspect-[4/5] overflow-hidden bg-[radial-gradient(circle_at_50%_8%,rgba(255,255,255,0.95),rgba(241,245,249,0.9)_48%,rgba(226,232,240,0.95)_100%)]">
          <div className="absolute inset-x-8 top-8 h-24 rounded-full bg-white/70 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.08),transparent_42%)]" />
          <div className="depth-layer depth-40 absolute inset-0 flex items-center justify-center p-8 sm:p-10 transition-transform duration-1000 ease-out group-hover:scale-110">
            <img src={product.image} alt={product.name} className="h-full w-full object-contain mix-blend-multiply drop-shadow-[0_30px_45px_rgba(15,23,42,0.24)] brightness-[1.03]" loading="lazy" />
          </div>

          {isAvailable && (
            <div className="absolute inset-x-6 bottom-6 z-30 hidden sm:block">
              <div className="depth-layer depth-24">
                <AnimatePresence mode="wait">
                  {cartQty > 0 ? (
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="flex items-center rounded-[24px] border border-white bg-white/92 p-1.5 shadow-2xl backdrop-blur-xl">
                      <button onClick={(e) => { e.preventDefault(); updateCartQty(product.id, cartQty - 1); }} className="flex h-11 w-11 items-center justify-center rounded-2xl text-slate-900 transition-all hover:bg-slate-50 active:scale-90">
                        <Minus className="h-4.5 w-4.5" />
                      </button>
                      <span className="flex-1 text-center text-[16px] font-black text-slate-900">{cartQty}</span>
                      <button onClick={(e) => { e.preventDefault(); updateCartQty(product.id, cartQty + 1); }} className="flex h-11 w-11 items-center justify-center rounded-2xl text-slate-900 transition-all hover:bg-slate-50 active:scale-90">
                        <Plus className="h-4.5 w-4.5" />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.button
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 20, opacity: 0 }}
                      onClick={(e) => {
                        e.preventDefault();
                        if (!isLoggedIn) { navigate('/login'); return; }
                        addToCart(product);
                        toast.success('Added to cart!');
                      }}
                      className="flex w-full items-center justify-center gap-3 rounded-[24px] bg-slate-900 py-4 text-[13px] font-black uppercase tracking-widest text-white opacity-0 shadow-2xl transition-all hover:bg-slate-800 active:scale-95 group-hover:opacity-100"
                    >
                      <ShoppingCart className="h-4.5 w-4.5" /> Quick Add
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </Link>

        <div className="relative z-10 flex flex-1 flex-col bg-white/88 p-6 backdrop-blur-sm">
          <div className="depth-layer depth-16 flex h-full flex-col">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{product.brand}</span>
              <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2 py-1">
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                <span className="text-[11px] font-black text-amber-700">{product.rating}</span>
              </div>
            </div>

            <Link to={`/product/${product.id}`} className="mb-4 line-clamp-2 text-[17px] font-black leading-tight text-slate-900 transition-all duration-500 hover:text-primary group-hover:translate-x-1">
              {product.name}
            </Link>

            <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-5">
              <div className="flex flex-col">
                {isLoggedIn ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-[22px] font-black tracking-tight text-slate-900">Rs.{price.toLocaleString('en-IN')}</span>
                      {discount > 0 && <span className="text-[14px] font-bold text-slate-300 line-through">Rs.{product.mrp.toLocaleString('en-IN')}</span>}
                    </div>
                    <p className="mt-0.5 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                      {isShop ? 'Business Price' : 'Member Deal'}
                    </p>
                  </>
                ) : (
                  <button onClick={() => navigate('/login')} className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-primary hover:underline">
                    Login for Price <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="sm:hidden">
                {isAvailable ? (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (!isLoggedIn) { navigate('/login'); return; }
                      if (cartQty > 0) navigate('/cart');
                      else { addToCart(product); toast.success('Added to cart'); }
                    }}
                    className={`flex h-12 w-12 items-center justify-center rounded-[20px] shadow-xl transition-all active:scale-90 ${cartQty > 0 ? 'bg-primary text-white shadow-primary/20' : 'bg-slate-900 text-white shadow-slate-900/20'}`}
                  >
                    {cartQty > 0 ? <span className="text-[16px] font-black">{cartQty}</span> : <ShoppingCart className="h-5 w-5" />}
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      requestProduct(product.id, product.name);
                      toast.success('Interest noted!');
                    }}
                    className="flex h-12 w-12 items-center justify-center rounded-[20px] border border-slate-100 bg-slate-50 text-slate-400"
                  >
                    <Bell className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
      </TiltCard>
    </motion.div>
  );
});
