import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Globe,
  Heart,
  Loader2,
  Lock,
  Minus,
  Package,
  PackageCheck,
  Play,
  Plus,
  RotateCcw,
  Share2,
  Shield,
  ShoppingCart,
  Star,
  Tag,
  Truck,
  Volume2,
} from 'lucide-react';
import { toast } from 'sonner';
import { PRODUCTS_MAP } from '../data';
import { SarvamService } from '../services/sarvam';
import { useStore, type Product } from '../store';
import { ProductCard } from './product-card';
import { ProductReviews } from './product-reviews';
import { Badge } from './ui/badge';

const FEATURES = [
  { icon: Truck, text: 'Free Delivery' },
  { icon: RotateCcw, text: '7 Day Returns' },
  { icon: Shield, text: 'Genuine Product' },
  { icon: Package, text: 'Secure Packaging' },
];

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

function normalizeQty({
  requestedQty,
  isShop,
  minQty,
  maxQty,
}: {
  requestedQty: number;
  isShop: boolean;
  minQty: number;
  maxQty: number;
}) {
  if (maxQty <= 0) return 0;
  if (!isShop) return Math.max(1, Math.min(maxQty, Math.round(requestedQty) || 1));

  let normalized = Math.ceil(Math.max(minQty, requestedQty) / minQty) * minQty;
  if (normalized > maxQty) {
    normalized = Math.floor(maxQty / minQty) * minQty;
  }

  return normalized >= minQty ? normalized : 0;
}

export function ProductDetail() {
  const { id } = useParams();
  const products = useStore((s) => s.products);
  const product = useMemo(
    () => products.find((item) => item.id === id) ?? (id ? PRODUCTS_MAP.get(id) : undefined),
    [id, products]
  );
  const user = useStore((s) => s.user);
  const cart = useStore((s) => s.cart);
  const addToCart = useStore((s) => s.addToCart);
  const updateCartQty = useStore((s) => s.updateCartQty);
  const toggleWishlist = useStore((s) => s.toggleWishlist);
  const wishlist = useStore((s) => s.wishlist);
  const getPrice = useStore((s) => s.getPrice);
  const addRecentlyViewed = useStore((s) => s.addRecentlyViewed);
  const requestProduct = useStore((s) => s.requestProduct);
  const recentlyViewed = useStore((s) => s.recentlyViewed);
  const navigate = useNavigate();

  const [qty, setQty] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedLang, setSelectedLang] = useState('hi-IN');
  const [loadingAudio, setLoadingAudio] = useState(false);

  const isLoggedIn = !!user;

  useEffect(() => {
    if (product) addRecentlyViewed(product.id);
  }, [addRecentlyViewed, product]);

  if (!product) {
    return (
      <div className="py-20 text-center">
        <h2>Product not found</h2>
        <Link to="/products" className="mt-4 inline-block text-primary">Back to Products</Link>
      </div>
    );
  }

  const price = getPrice(product);
  const isShop = user?.role === 'shopowner';
  const isWished = wishlist.includes(product.id);
  const priceDiff = product.mrp - price;
  const discount = isLoggedIn && priceDiff > 0 ? Math.round((priceDiff / product.mrp) * 100) : 0;
  const related = products
    .filter((item) => item.category === product.category && item.id !== product.id)
    .slice(0, 4);
  const minQty = isShop ? product.minWholesaleQty : 1;
  const maxQty = Math.max(0, product.stock);
  const cartItem = cart.find((item) => item.product.id === product.id);
  const cartQty = cartItem?.quantity || 0;
  const canPurchase = product.stock > 0 && (!isShop || product.stock >= minQty);

  useEffect(() => {
    if (!product) return;
    if (!canPurchase) {
      setQty(0);
      return;
    }

    const startingQty = cartQty > 0 ? cartQty : minQty;
    setQty(normalizeQty({ requestedQty: startingQty, isShop, minQty, maxQty }));
  }, [canPurchase, cartQty, isShop, maxQty, minQty, product]);

  const aiRecommended = useMemo(() => {
    if (recentlyViewed.length <= 1) return [];

    const recentCategories = new Set(
      recentlyViewed
        .map((recentId) => PRODUCTS_MAP.get(recentId)?.category)
        .filter(Boolean)
    );

    return products
      .filter((item) => item.id !== product.id && recentCategories.has(item.category))
      .sort(() => 0.5 - Math.random())
      .slice(0, 4);
  }, [product.id, products, recentlyViewed]);

  const stockState = (() => {
    if (product.stock <= 0) {
      return {
        title: 'Out of stock',
        detail: 'This SKU is unavailable right now. You can request a restock alert.',
        tone: 'border-red-100 bg-red-50/80 text-red-700',
      };
    }
    if (isShop && product.stock < minQty) {
      return {
        title: 'Wholesale pack unavailable',
        detail: `Only ${product.stock} units remain, below the minimum wholesale step of ${minQty}.`,
        tone: 'border-amber-100 bg-amber-50/80 text-amber-700',
      };
    }
    if (product.stock <= Math.max(5, minQty * 2)) {
      return {
        title: 'Low stock',
        detail: `Only ${product.stock} units left. This SKU may sell out soon.`,
        tone: 'border-amber-100 bg-amber-50/80 text-amber-700',
      };
    }
    return {
      title: 'In stock',
      detail: `${product.stock} units available and ready for checkout.`,
      tone: 'border-emerald-100 bg-emerald-50/80 text-emerald-700',
    };
  })();

  const handleQtyChange = (nextQty: number) => {
    const normalized = normalizeQty({ requestedQty: nextQty, isShop, minQty, maxQty });
    if (normalized > 0) setQty(normalized);
  };

  const handlePlayAudio = async () => {
    setLoadingAudio(true);
    try {
      const audioContent = await SarvamService.textToSpeech(
        `${product.name}. ${product.description}`,
        selectedLang
      );
      const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      await audio.play();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to play audio';
      toast.error(message);
    } finally {
      setLoadingAudio(false);
    }
  };

  const handleShare = async () => {
    const sharePayload = {
      title: product.name,
      text: `Check out ${product.name} on Kumar Store`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(sharePayload);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Product link copied');
        return;
      }
      toast.success('Product shared');
    } catch {
      toast.error('Unable to share this product');
    }
  };

  const handleRequestRestock = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    try {
      await requestProduct(product.id, product.name);
      toast.success('Restock request submitted');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to submit request';
      toast.error(message);
    }
  };

  return (
    <div className="py-6">
      <Link to="/products" className="group mb-5 flex items-center gap-1.5 text-[14px] text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Back to Products
      </Link>

      <div className="overflow-hidden rounded-3xl border border-border/80 bg-white shadow-premium-lg">
        <div className="grid grid-cols-1 gap-0 lg:grid-cols-2">
          <div className="shine-hover relative flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100/50 p-4 sm:p-6 lg:p-10">
            <img
              src={product.image}
              alt={product.name}
              className="max-h-[300px] max-w-full rounded-2xl object-contain transition-transform duration-700 ease-out hover:scale-105 sm:max-h-[400px]"
              loading="lazy"
            />
          </div>

          <div className="p-4 sm:p-6 lg:p-10">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted-foreground" style={{ fontWeight: 600 }}>
                  <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                  {product.brand}
                </span>
                <h1 className="mt-2 text-[26px] leading-tight" style={{ fontWeight: 700 }}>{product.name}</h1>
              </div>
              <div className="flex gap-1.5 sm:gap-2">
                <button
                  onClick={() => {
                    toggleWishlist(product.id);
                    toast.success(isWished ? 'Removed from wishlist' : 'Added to wishlist');
                  }}
                  className="rounded-xl border border-border/80 p-2 transition-all hover:border-primary/20 hover:bg-gray-50 sm:p-2.5"
                >
                  <Heart className={`h-4 w-4 sm:h-5 sm:w-5 ${isWished ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                </button>
                <button
                  onClick={handleShare}
                  className="rounded-xl border border-border/80 p-2 transition-all hover:border-primary/20 hover:bg-gray-50 sm:p-2.5"
                >
                  <Share2 className="h-4 w-4 text-gray-400 sm:h-5 sm:w-5" />
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-primary to-emerald-500 px-2.5 py-1 text-[13px] text-white shadow-sm">
                <Star className="h-3.5 w-3.5 fill-white" /> {product.rating}
              </div>
              <span className="text-[14px] text-muted-foreground">{product.reviews} reviews</span>
              <span className="text-[14px] text-muted-foreground">|</span>
              <span className={`text-[14px] ${stockState.tone.includes('emerald') ? 'text-primary' : 'text-amber-600'}`} style={{ fontWeight: 500 }}>
                {stockState.title}
              </span>
            </div>

            <div className={`mt-6 rounded-2xl border p-4 ${stockState.tone}`}>
              <div className="flex items-start gap-3">
                {stockState.tone.includes('red') || stockState.tone.includes('amber') ? (
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                ) : (
                  <PackageCheck className="mt-0.5 h-5 w-5 shrink-0" />
                )}
                <div>
                  <p className="text-[15px] font-black">{stockState.title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed opacity-80">{stockState.detail}</p>
                  {isShop && (
                    <p className="mt-2 text-[12px] font-black uppercase tracking-widest opacity-80">
                      Wholesale step: {minQty} x {product.unitType}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 to-primary/10 p-6 shadow-premium">
              <div className="mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-gray-900">AI Voice Assistant</h3>
              </div>
              <p className="mb-4 text-sm italic text-gray-600">Listen to product details in your preferred Indian language.</p>

              <div className="flex flex-wrap items-center gap-4">
                <select
                  value={selectedLang}
                  onChange={(event) => setSelectedLang(event.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20"
                >
                  {INDIAN_LANGS.map((lang) => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>

                <button
                  onClick={handlePlayAudio}
                  disabled={loadingAudio || isPlaying}
                  className="btn-press flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-white shadow-glow transition-all hover:bg-primary/90 hover:shadow-glow-lg disabled:opacity-50"
                >
                  {loadingAudio ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isPlaying ? (
                    <Volume2 className="h-4 w-4 animate-pulse" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  <span>{loadingAudio ? 'Generating...' : isPlaying ? 'Playing...' : 'Listen with AI'}</span>
                </button>
              </div>
            </div>

            {isLoggedIn ? (
              <div className="mt-8 space-y-4 rounded-xl border border-primary/10 bg-gradient-to-br from-gray-50 to-primary/[0.02] p-4">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-[13px] text-muted-foreground">MRP:</span>
                  <span className={`text-[18px] ${priceDiff > 0 ? 'line-through text-muted-foreground' : 'text-foreground'}`} style={{ fontWeight: priceDiff > 0 ? 400 : 800 }}>
                    Rs.{product.mrp}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-muted-foreground">{isShop ? 'Wholesale Price:' : 'Price:'}</span>
                  <span className="text-[32px] text-foreground" style={{ fontWeight: 800 }}>Rs.{price}</span>
                </div>
                {priceDiff > 0 && (
                  <div className="mt-2 flex items-center gap-3">
                    <span className="rounded-full bg-gradient-to-r from-primary to-emerald-500 px-3.5 py-1 text-[14px] text-white shadow-sm" style={{ fontWeight: 600 }}>
                      You save Rs.{priceDiff} ({discount}% OFF)
                    </span>
                  </div>
                )}
                {isShop && (
                  <div className="mt-3 flex items-center gap-4 border-t border-gray-200 pt-2 text-[14px]">
                    <span className="text-primary" style={{ fontWeight: 600 }}>Projected margin on {Math.max(qty, minQty)} units: Rs.{Math.max(0, (product.customerPrice - product.shopPrice) * Math.max(qty, minQty))}</span>
                  </div>
                )}
                {isShop && (
                  <div className="mt-2 flex items-center gap-2 text-[13px]">
                    <Tag className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-muted-foreground">Customer price:</span>
                    <span className="text-amber-600" style={{ fontWeight: 600 }}>Rs.{product.customerPrice}</span>
                    <span className="text-muted-foreground">|</span>
                    <span className="text-primary" style={{ fontWeight: 600 }}>Your shop price: Rs.{product.shopPrice}</span>
                  </div>
                )}
                <p className="mt-2 text-[12px] text-muted-foreground">Inclusive of all taxes</p>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-border/50 bg-gradient-to-br from-gray-50 to-gray-100/30 p-5">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-[16px]" style={{ fontWeight: 600 }}>Price hidden</p>
                    <p className="text-[14px] text-muted-foreground">Please login to view pricing and make purchases</p>
                  </div>
                </div>
                <Link to="/login" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-[14px] text-white" style={{ fontWeight: 600 }}>
                  Login to See Price
                </Link>
              </div>
            )}

            {isLoggedIn && (
              <div className="mt-5">
                {canPurchase ? (
                  <>
                    <label className="mb-2 block text-[14px]" style={{ fontWeight: 500 }}>
                      Quantity {isShop && <span className="text-muted-foreground">(Min: {minQty} {product.unitType})</span>}
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center overflow-hidden rounded-xl border border-border/80">
                        <button onClick={() => handleQtyChange(qty - (isShop ? minQty : 1))} className="p-2.5 transition-colors hover:bg-primary/5">
                          <Minus className="h-4 w-4" />
                        </button>
                        <input
                          type="number"
                          min={isShop ? minQty : 1}
                          max={maxQty}
                          step={isShop ? minQty : 1}
                          value={qty}
                          onChange={(event) => handleQtyChange(Number(event.target.value))}
                          className="w-20 bg-transparent py-2 text-center text-[15px] outline-none"
                          style={{ fontWeight: 600 }}
                        />
                        <button onClick={() => handleQtyChange(qty + (isShop ? minQty : 1))} className="p-2.5 transition-colors hover:bg-primary/5">
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <span className="text-[14px] text-muted-foreground">{product.unitType}</span>
                      <span className="text-[14px]" style={{ fontWeight: 600 }}>Total: Rs.{(price * qty).toLocaleString()}</span>
                    </div>
                    <p className="mt-2 text-[12px] text-muted-foreground">
                      {isShop
                        ? `Wholesale quantities automatically snap to valid packs of ${minQty}.`
                        : `You can order up to ${maxQty} units from current stock.`}
                    </p>
                  </>
                ) : (
                  <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4">
                    <p className="text-[14px] font-black text-amber-700">Buying is paused for this SKU</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-amber-700/80">
                      {product.stock <= 0
                        ? 'The item is sold out right now.'
                        : `Current stock is below the wholesale pack size of ${minQty}, so checkout is temporarily disabled for business orders.`}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex gap-3">
              {isLoggedIn ? (
                canPurchase ? (
                  <>
                    <button
                      onClick={() => {
                        addToCart(product, qty);
                        toast.success(`Added ${qty} item(s) to cart`);
                      }}
                      className="btn-press flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-[15px] text-white transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25"
                      style={{ fontWeight: 600 }}
                    >
                      <ShoppingCart className="h-5 w-5" /> Add to Cart
                    </button>
                    <Link
                      to="/cart"
                      onClick={() => {
                        if (cartQty > 0) {
                          updateCartQty(product.id, qty);
                        } else {
                          addToCart(product, qty);
                        }
                      }}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3.5 text-[15px] text-white transition-all hover:shadow-lg hover:shadow-amber-500/25 active:scale-[0.98]"
                      style={{ fontWeight: 600 }}
                    >
                      Buy Now
                    </Link>
                  </>
                ) : (
                  <button
                    onClick={handleRequestRestock}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border/80 bg-slate-50 py-3.5 text-[15px] text-slate-700 transition-colors hover:bg-slate-100"
                    style={{ fontWeight: 600 }}
                  >
                    <Bell className="h-5 w-5" /> Notify Me When Ready
                  </button>
                )
              ) : (
                <Link
                  to="/login"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-[15px] text-white transition-colors hover:bg-primary/90"
                  style={{ fontWeight: 600 }}
                >
                  Login to Purchase
                </Link>
              )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {FEATURES.map((feature) => (
                <div key={feature.text} className="stagger-child flex items-center gap-2.5 rounded-xl bg-gray-50 p-2.5 text-[13px] text-muted-foreground transition-colors hover:bg-primary/5">
                  <div className="rounded-lg bg-primary/10 p-1.5">
                    <feature.icon className="h-4 w-4 text-primary" />
                  </div>
                  {feature.text}
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-1 border-t pt-4 text-[13px] text-muted-foreground">
              <p>SKU: {product.sku}</p>
              <p>Category: {product.category.replace('-', ' ').replace(/\b\w/g, (char) => char.toUpperCase())}</p>
              <p>Unit Type: {product.unitType}</p>
            </div>
          </div>
        </div>

        <div className="border-t p-4 sm:p-6 lg:p-10">
          <h3 className="mb-3 flex items-center gap-2 text-[18px] sm:mb-4" style={{ fontWeight: 600 }}>
            <div className="h-5 w-1 rounded-full bg-gradient-to-b from-primary to-emerald-500" />
            Product Description
          </h3>
          <p className="leading-relaxed text-[14px] text-muted-foreground">{product.description}</p>
        </div>
      </div>

      <ProductReviews productId={product.id} />

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-6 flex items-center gap-3 text-[22px]" style={{ fontWeight: 700 }}>
            <div className="h-7 w-1 rounded-full bg-gradient-to-b from-primary to-emerald-500" />
            Related Products
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}

      {aiRecommended.length > 0 && (
        <section className="mb-10 mt-16">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="flex items-center gap-3 text-[22px]" style={{ fontWeight: 700 }}>
              <div className="h-7 w-1 rounded-full bg-gradient-to-b from-purple-500 to-primary" />
              Smart Picks for You
              <Badge variant="secondary" className="animate-pulse border-purple-100 bg-purple-50 px-2 py-0 text-[10px] text-purple-600">AI</Badge>
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {aiRecommended.map((item: Product) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}

      {isLoggedIn && (
        <div className="safe-area-bottom fixed bottom-14 left-0 right-0 z-40 flex items-center gap-2 border-t border-border/50 bg-white/90 px-3 py-2.5 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] backdrop-blur-xl md:hidden">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px]" style={{ fontWeight: 600 }}>{product.name}</p>
            <p className="text-[16px] text-primary" style={{ fontWeight: 800 }}>
              Rs.{(price * Math.max(qty, canPurchase ? 1 : 0)).toLocaleString()}
            </p>
          </div>

          {canPurchase ? (
            <>
              <div className="flex shrink-0 items-center overflow-hidden rounded-lg border border-border/60 bg-white shadow-sm">
                <button onClick={() => handleQtyChange(qty - (isShop ? minQty : 1))} className="p-2 transition-colors hover:bg-primary/5">
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-8 text-center text-[14px]" style={{ fontWeight: 700 }}>{qty}</span>
                <button onClick={() => handleQtyChange(qty + (isShop ? minQty : 1))} className="p-2 transition-colors hover:bg-primary/5">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <button
                onClick={() => {
                  addToCart(product, qty);
                  toast.success(`Added ${qty} to cart`);
                }}
                className="btn-press flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-[14px] text-white shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40 active:scale-[0.97]"
                style={{ fontWeight: 700 }}
              >
                <ShoppingCart className="h-4 w-4" /> Add
              </button>
            </>
          ) : (
            <button
              onClick={handleRequestRestock}
              className="flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-slate-50 px-4 py-2.5 text-[14px] text-slate-700"
              style={{ fontWeight: 700 }}
            >
              <Bell className="h-4 w-4" /> Notify
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Code styling update 6
