import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { Star, Heart, ShoppingCart, Minus, Plus, Package, Truck, Shield, RotateCcw, Share2, ArrowLeft, Lock, Tag, Play, Volume2, Globe, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { SarvamService } from '../services/sarvam';
import { useStore } from '../store';
import { PRODUCTS_MAP, PRODUCTS_BY_CATEGORY } from '../data';
import { ProductCard } from './product-card';
import { ProductReviews } from './product-reviews';

// ─── Static config hoisted outside component ───
const FEATURES = [
  { icon: Truck, text: 'Free Delivery' },
  { icon: RotateCcw, text: '7 Day Returns' },
  { icon: Shield, text: 'Genuine Product' },
  { icon: Package, text: 'Secure Packaging' },
];

export function ProductDetail() {
  const { id } = useParams();
  const product = id ? PRODUCTS_MAP.get(id) : undefined;
  // Granular selectors — only re-render when relevant state changes
  const user = useStore((s) => s.user);
  const cart = useStore((s) => s.cart);
  const addToCart = useStore((s) => s.addToCart);
  const updateCartQty = useStore((s) => s.updateCartQty);
  const toggleWishlist = useStore((s) => s.toggleWishlist);
  const wishlist = useStore((s) => s.wishlist);
  const getPrice = useStore((s) => s.getPrice);
  const addRecentlyViewed = useStore((s) => s.addRecentlyViewed);
  const [qty, setQty] = useState(1);
  const isLoggedIn = !!user;
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedLang, setSelectedLang] = useState('hi-IN');
  const [loadingAudio, setLoadingAudio] = useState(false);

  const INDIAN_LANGS = [
    { code: 'hi-IN', name: 'Hindi' },
    { code: 'ta-IN', name: 'Tamil' },
    { code: 'te-IN', name: 'Telugu' },
    { code: 'kn-IN', name: 'Kannada' },
    { code: 'ml-IN', name: 'Malayalam' },
    { code: 'mr-IN', name: 'Marathi' },
    { code: 'bn-IN', name: 'Bengali' },
    { code: 'gu-IN', name: 'Gujarati' },
  ];

  const handlePlayAudio = async () => {
    if (!product) return;
    setLoadingAudio(true);
    try {
      const audioContent = await SarvamService.textToSpeech(
        `${product.name}. ${product.description} `,
        selectedLang
      );
      const audio = new Audio(`data: audio / mp3; base64, ${audioContent} `);
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      audio.play();
    } catch (err: any) {
      toast.error(err.message || 'Failed to play audio');
    } finally {
      setLoadingAudio(false);
    }
  };

  // Track recently viewed — must be in useEffect, not render body
  useEffect(() => {
    if (product) addRecentlyViewed(product.id);
  }, [product?.id]);

  if (!product) {
    return (
      <div className="py-20 text-center">
        <h2>Product not found</h2>
        <Link to="/products" className="text-primary mt-4 inline-block">Back to Products</Link>
      </div>
    );
  }

  const price = getPrice(product);
  const isShop = user?.role === 'shopowner';
  const isWished = wishlist.includes(product.id);
  const priceDiff = product.mrp - price;
  const discount = isLoggedIn && priceDiff > 0 ? Math.round((priceDiff / product.mrp) * 100) : 0;
  const related = (PRODUCTS_BY_CATEGORY[product.category] || []).filter((p) => p.id !== product.id).slice(0, 4);
  
  // AI Smart Recommendations based on browsing history
  const recentlyViewed = useStore((s) => s.recentlyViewed);
  const aiRecommended = useMemo(() => {
    if (recentlyViewed.length <= 1) return [];
    
    // Simple AI heuristic: items from categories you recently looked at, but not this item
    const recentCategories = new Set(
      recentlyViewed
        .map(rid => PRODUCTS_MAP.get(id!)?.category)
        .filter(Boolean)
    );
    
    const candidates = Array.from(PRODUCTS_MAP.values())
      .filter(p => p.id !== product.id && recentCategories.has(p.category))
      .sort(() => 0.5 - Math.random()) // Shuffle
      .slice(0, 4);
      
    return candidates;
  }, [recentlyViewed, product.id, product.category]);

  const minQty = isShop ? product.minWholesaleQty : 1;
  const maxQty = product.stock > 0 ? product.stock : 9999;
  const cartItem = cart.find((i) => i.product.id === product.id);
  const cartQty = cartItem?.quantity || 0;

  return (
    <div className="py-6">
      <Link to="/products" className="flex items-center gap-1.5 text-muted-foreground hover:text-primary mb-5 text-[14px] group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Products
      </Link>

      <div className="bg-white rounded-3xl border border-border/80 overflow-hidden shadow-premium-lg">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Image */}
          <div className="p-4 sm:p-6 lg:p-10 bg-gradient-to-br from-gray-50 to-gray-100/50 flex items-center justify-center relative shine-hover">
            <img src={product.image} alt={product.name} className="max-w-full max-h-[300px] sm:max-h-[400px] object-contain rounded-2xl hover:scale-105 transition-transform duration-700 ease-out" loading="lazy" />
          </div>

          {/* Details */}
          <div className="p-4 sm:p-6 lg:p-10">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] text-muted-foreground uppercase tracking-widest inline-flex items-center gap-1.5" style={{ fontWeight: 600 }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60"></span>
                  {product.brand}
                </span>
                <h1 className="text-[26px] mt-2 leading-tight" style={{ fontWeight: 700 }}>{product.name}</h1>
              </div>
              <div className="flex gap-1.5 sm:gap-2">
                <button onClick={() => { toggleWishlist(product.id); toast.success(isWished ? 'Removed from wishlist' : 'Added to wishlist'); }} className="p-2 sm:p-2.5 border border-border/80 rounded-xl hover:bg-gray-50 hover:border-primary/20 transition-all">
                  <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isWished ? 'fill-red-500 text-red-500' : 'text-gray-400'} `} />
                </button>
                <button className="p-2 sm:p-2.5 border border-border/80 rounded-xl hover:bg-gray-50 hover:border-primary/20 transition-all" onClick={() => toast.success('Link copied!')}>
                  <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3 mt-4">
              <div className="flex items-center gap-1 bg-gradient-to-r from-primary to-emerald-500 text-white px-2.5 py-1 rounded-lg text-[13px] shadow-sm">
                <Star className="w-3.5 h-3.5 fill-white" /> {product.rating}
              </div>
              <span className="text-[14px] text-muted-foreground">{product.reviews} reviews</span>
              <span className="text-[14px] text-muted-foreground">|</span>
              <span className={`text-[14px] ${product.stock > 50 ? 'text-primary' : 'text-destructive'}`} style={{ fontWeight: 500 }}>
                {product.stock > 50 ? 'In Stock' : `Only ${product.stock} left`}
              </span>
            </div>

            {/* Multilingual AI Assistant */}
            <div className="mt-8 p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl border border-primary/10 shadow-premium">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-gray-900">AI Voice Assistant</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4 italic">Listen to product details in your preferred Indian language.</p>

              <div className="flex flex-wrap gap-4 items-center">
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  {INDIAN_LANGS.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>

                <button
                  onClick={handlePlayAudio}
                  disabled={loadingAudio || isPlaying}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all shadow-glow hover:shadow-glow-lg disabled:opacity-50 btn-press"
                >
                  {loadingAudio ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isPlaying ? (
                    <Volume2 className="w-4 h-4 animate-pulse" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  <span>{loadingAudio ? 'Generating...' : isPlaying ? 'Playing...' : 'Listen with AI'}</span>
                </button>
              </div>
            </div>

            {/* Price */}
            {isLoggedIn ? (
              <div className="mt-8 space-y-4 p-4 bg-gradient-to-br from-gray-50 to-primary/[0.02] rounded-xl border border-primary/10">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[13px] text-muted-foreground">MRP:</span>
                  <span className={`text-[18px] ${priceDiff > 0 ? 'line-through text-muted-foreground' : 'text-foreground'}`} style={{ fontWeight: priceDiff > 0 ? 400 : 800 }}>Rs.{product.mrp}</span>
                </div>
                {priceDiff > 0 && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] text-muted-foreground">{isShop ? 'Wholesale Price:' : 'Price:'}</span>
                      <span className="text-[32px] text-foreground" style={{ fontWeight: 800 }}>Rs.{price}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[14px] text-white bg-gradient-to-r from-primary to-emerald-500 px-3.5 py-1 rounded-full shadow-sm" style={{ fontWeight: 600 }}>You save Rs.{priceDiff} ({discount}% OFF)</span>
                    </div>
                  </>
                )}
                {isShop && (
                  <div className="mt-3 flex items-center gap-4 text-[14px] pt-2 border-t border-gray-200">
                    <span className="text-primary" style={{ fontWeight: 600 }}>Total savings on {qty} units: Rs.{priceDiff * qty}</span>
                    <span className="text-muted-foreground">Margin: {discount}%</span>
                  </div>
                )}
                {isShop && (
                  <div className="mt-2 flex items-center gap-2 text-[13px]">
                    <Tag className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-muted-foreground">Customer price:</span>
                    <span className="text-amber-600" style={{ fontWeight: 600 }}>Rs.{product.customerPrice}</span>
                    <span className="text-muted-foreground">|</span>
                    <span className="text-primary" style={{ fontWeight: 600 }}>Your shop price: Rs.{product.shopPrice}</span>
                  </div>
                )}
                {/* Removed "Customer Discount Applied" text (requested) */}
                <p className="text-[12px] text-muted-foreground mt-2">Inclusive of all taxes</p>
              </div>
            ) : (
              <div className="mt-5 p-5 bg-gradient-to-br from-gray-50 to-gray-100/30 rounded-2xl border border-border/50">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-[16px]" style={{ fontWeight: 600 }}>Price hidden</p>
                    <p className="text-[14px] text-muted-foreground">Please login to view pricing and make purchases</p>
                  </div>
                </div>
                <Link to="/login" className="inline-flex items-center gap-2 mt-3 px-5 py-2 bg-primary text-white rounded-lg text-[14px]" style={{ fontWeight: 600 }}>
                  Login to See Price
                </Link>
              </div>
            )}

            {/* Quantity */}
            {isLoggedIn && (
              <div className="mt-5">
                <label className="text-[14px] mb-2 block" style={{ fontWeight: 500 }}>
                  Quantity {isShop && <span className="text-muted-foreground">(Min: {minQty} {product.unitType}s)</span>}
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-border/80 rounded-xl overflow-hidden">
                    <button onClick={() => setQty(Math.max(minQty, qty - (isShop ? minQty : 1)))} className="p-2.5 hover:bg-primary/5 transition-colors">
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      value={qty}
                      onChange={(e) => setQty(Math.max(minQty, Math.min(maxQty, +e.target.value)))}
                      className="w-16 text-center py-2 outline-none text-[15px] bg-transparent"
                      style={{ fontWeight: 600 }}
                    />
                    <button onClick={() => setQty(Math.min(maxQty, qty + (isShop ? minQty : 1)))} className="p-2.5 hover:bg-primary/5 transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-[14px] text-muted-foreground">{product.unitType}</span>
                  <span className="text-[14px]" style={{ fontWeight: 600 }}>Total: Rs.{price * qty}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              {isLoggedIn ? (
                <>
                  <button
                    onClick={() => { addToCart(product, qty); toast.success(`Added ${qty} item(s) to cart`); }}
                    className="flex-1 py-3.5 bg-primary text-white rounded-xl hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 transition-all flex items-center justify-center gap-2 text-[15px] active:scale-[0.98] btn-press"
                    style={{ fontWeight: 600 }}
                  >
                    <ShoppingCart className="w-5 h-5" /> Add to Cart
                  </button>
                  <Link
                    to="/cart"
                    onClick={() => {
                      // Set exact qty in cart (not additive) to prevent doubling
                      if (cartQty > 0) {
                        updateCartQty(product.id, qty);
                      } else {
                        addToCart(product, qty);
                      }
                    }}
                    className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition-all flex items-center justify-center gap-2 text-[15px] active:scale-[0.98]"
                    style={{ fontWeight: 600 }}
                  >
                    Buy Now
                  </Link>
                </>
              ) : (
                <Link
                  to="/login"
                  className="flex-1 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 text-[15px]"
                  style={{ fontWeight: 600 }}
                >
                  Login to Purchase
                </Link>
              )}
            </div>

            {/* Features */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              {FEATURES.map((f, _i) => (
                <div key={f.text} className="flex items-center gap-2.5 text-[13px] text-muted-foreground p-2.5 bg-gray-50 rounded-xl hover:bg-primary/5 transition-colors stagger-child">
                  <div className="p-1.5 bg-primary/10 rounded-lg">
                    <f.icon className="w-4 h-4 text-primary" />
                  </div>
                  {f.text}
                </div>
              ))}
            </div>

            {/* SKU */}
            <div className="mt-6 pt-4 border-t text-[13px] text-muted-foreground space-y-1">
              <p>SKU: {product.sku}</p>
              <p>Category: {product.category.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</p>
              <p>Unit Type: {product.unitType}</p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="border-t p-4 sm:p-6 lg:p-10">
          <h3 className="text-[18px] mb-3 sm:mb-4 flex items-center gap-2" style={{ fontWeight: 600 }}>
            <div className="w-1 h-5 bg-gradient-to-b from-primary to-emerald-500 rounded-full" />
            Product Description
          </h3>
          <p className="text-[14px] text-muted-foreground leading-relaxed">{product.description}</p>
        </div>
      </div>

      {/* Reviews (Supabase-backed) */}
      <ProductReviews productId={product.id} />

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="text-[22px] mb-6 flex items-center gap-3" style={{ fontWeight: 700 }}>
            <div className="w-1 h-7 bg-gradient-to-b from-primary to-emerald-500 rounded-full" />
            Related Products
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* AI Recommendations */}
      {aiRecommended.length > 0 && (
        <section className="mt-16 mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[22px] flex items-center gap-3" style={{ fontWeight: 700 }}>
              <div className="w-1 h-7 bg-gradient-to-b from-purple-500 to-primary rounded-full" />
              Smart Picks for You
              <Badge variant="secondary" className="bg-purple-50 text-purple-600 border-purple-100 text-[10px] py-0 px-2 animate-pulse">AI</Badge>
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
            {aiRecommended.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Mobile sticky Add to Cart bar */}
      {isLoggedIn && (
        <div className="md:hidden fixed bottom-14 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-border/50 px-3 py-2.5 z-40 flex items-center gap-2 safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <div className="flex-1 min-w-0">
            <p className="text-[12px] truncate" style={{ fontWeight: 600 }}>{product.name}</p>
            <p className="text-[16px] text-primary" style={{ fontWeight: 800 }}>Rs.{(price * qty).toLocaleString()}</p>
          </div>
          <div className="flex items-center border border-border/60 rounded-lg overflow-hidden shrink-0 bg-white shadow-sm">
            <button onClick={() => setQty(Math.max(minQty, qty - (isShop ? minQty : 1)))} className="p-2 hover:bg-primary/5 transition-colors">
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center text-[14px]" style={{ fontWeight: 700 }}>{qty}</span>
            <button onClick={() => setQty(Math.min(maxQty, qty + (isShop ? minQty : 1)))} className="p-2 hover:bg-primary/5 transition-colors">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            onClick={() => { addToCart(product, qty); toast.success(`Added ${qty} to cart`); }}
            className="px-4 py-2.5 bg-primary text-white rounded-xl text-[14px] flex items-center justify-center gap-1.5 shrink-0 min-h-[44px] shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-[0.97] btn-press"
            style={{ fontWeight: 700 }}
          >
            <ShoppingCart className="w-4 h-4" /> Add
          </button>
        </div>
      )}
    </div>
  );
}