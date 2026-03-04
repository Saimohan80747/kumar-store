import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { Star, Heart, ShoppingCart, Minus, Plus, Package, Truck, Shield, RotateCcw, Share2, ArrowLeft, Lock, Tag } from 'lucide-react';
import { useStore } from '../store';
import { PRODUCTS_MAP, PRODUCTS_BY_CATEGORY } from '../data';
import { ProductCard } from './product-card';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

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
  const addToCart = useStore((s) => s.addToCart);
  const toggleWishlist = useStore((s) => s.toggleWishlist);
  const wishlist = useStore((s) => s.wishlist);
  const getPrice = useStore((s) => s.getPrice);
  const addRecentlyViewed = useStore((s) => s.addRecentlyViewed);
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const isLoggedIn = !!user;

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
  const minQty = isShop ? product.minWholesaleQty : 1;

  return (
    <div className="py-6">
      <Link to="/products" className="flex items-center gap-1 text-muted-foreground hover:text-primary mb-4 text-[14px]">
        <ArrowLeft className="w-4 h-4" /> Back to Products
      </Link>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Image */}
          <div className="p-6 lg:p-10 bg-gray-50 flex items-center justify-center">
            <img src={product.image} alt={product.name} className="max-w-full max-h-[400px] object-contain rounded-xl" loading="lazy" />
          </div>

          {/* Details */}
          <div className="p-6 lg:p-10">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[12px] text-muted-foreground uppercase tracking-wider">{product.brand}</span>
                <h1 className="text-[24px] mt-1" style={{ fontWeight: 700 }}>{product.name}</h1>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { toggleWishlist(product.id); toast.success(isWished ? 'Removed from wishlist' : 'Added to wishlist'); }} className="p-2 border rounded-lg hover:bg-gray-50">
                  <Heart className={`w-5 h-5 ${isWished ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                </button>
                <button className="p-2 border rounded-lg hover:bg-gray-50" onClick={() => toast.success('Link copied!')}>
                  <Share2 className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1 bg-primary text-white px-2 py-1 rounded text-[13px]">
                <Star className="w-3.5 h-3.5 fill-white" /> {product.rating}
              </div>
              <span className="text-[14px] text-muted-foreground">{product.reviews} reviews</span>
              <span className="text-[14px] text-muted-foreground">|</span>
              <span className={`text-[14px] ${product.stock > 50 ? 'text-primary' : 'text-destructive'}`} style={{ fontWeight: 500 }}>
                {product.stock > 50 ? 'In Stock' : `Only ${product.stock} left`}
              </span>
            </div>

            {/* Price */}
            {isLoggedIn ? (
              <div className="mt-5 p-4 bg-gray-50 rounded-xl">
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
                      <span className="text-[14px] text-white bg-primary px-3 py-1 rounded-full" style={{ fontWeight: 600 }}>You save Rs.{priceDiff} ({discount}% OFF)</span>
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
                {!isShop && user?.role === 'customer' && priceDiff > 0 && (
                  <div className="mt-2 flex items-center gap-2 text-[13px]">
                    <Tag className="w-3.5 h-3.5 text-primary" />
                    <span className="text-primary" style={{ fontWeight: 600 }}>Customer Discount Applied</span>
                    <span className="text-muted-foreground">You're getting a special discount!</span>
                  </div>
                )}
                <p className="text-[12px] text-muted-foreground mt-2">Inclusive of all taxes</p>
              </div>
            ) : (
              <div className="mt-5 p-4 bg-gray-50 rounded-xl">
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
                <div className="flex items-center border rounded-lg overflow-hidden">
                  <button onClick={() => setQty(Math.max(minQty, qty - (isShop ? minQty : 1)))} className="p-2.5 hover:bg-gray-50">
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={qty}
                    onChange={(e) => setQty(Math.max(minQty, +e.target.value))}
                    className="w-16 text-center py-2 outline-none text-[15px]"
                    style={{ fontWeight: 600 }}
                  />
                  <button onClick={() => setQty(qty + (isShop ? minQty : 1))} className="p-2.5 hover:bg-gray-50">
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
                    className="flex-1 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 text-[15px]"
                    style={{ fontWeight: 600 }}
                  >
                    <ShoppingCart className="w-5 h-5" /> Add to Cart
                  </button>
                  <Link
                    to="/cart"
                    onClick={() => addToCart(product, qty)}
                    className="flex-1 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 text-[15px]"
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
              {FEATURES.map((f) => (
                <div key={f.text} className="flex items-center gap-2 text-[13px] text-muted-foreground">
                  <f.icon className="w-4 h-4 text-primary" /> {f.text}
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
        <div className="border-t p-6 lg:p-10">
          <h3 className="text-[18px] mb-3" style={{ fontWeight: 600 }}>Product Description</h3>
          <p className="text-[14px] text-muted-foreground leading-relaxed">{product.description}</p>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="text-[22px] mb-6" style={{ fontWeight: 700 }}>Related Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Mobile sticky Add to Cart bar */}
      {isLoggedIn && (
        <div className="md:hidden fixed bottom-14 left-0 right-0 bg-white border-t px-3 py-2.5 z-40 flex items-center gap-2 safe-area-bottom">
          <div className="flex-1 min-w-0">
            <p className="text-[13px] truncate" style={{ fontWeight: 600 }}>{product.name}</p>
            <p className="text-[15px] text-primary" style={{ fontWeight: 700 }}>Rs.{(price * qty).toLocaleString()}</p>
          </div>
          <div className="flex items-center border rounded-lg overflow-hidden shrink-0">
            <button onClick={() => setQty(Math.max(minQty, qty - (isShop ? minQty : 1)))} className="p-2 hover:bg-gray-50">
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center text-[14px]" style={{ fontWeight: 600 }}>{qty}</span>
            <button onClick={() => setQty(qty + (isShop ? minQty : 1))} className="p-2 hover:bg-gray-50">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            onClick={() => { addToCart(product, qty); toast.success(`Added ${qty} to cart`); }}
            className="px-4 py-2.5 bg-primary text-white rounded-xl text-[14px] flex items-center gap-1.5 shrink-0 min-h-[44px]"
            style={{ fontWeight: 600 }}
          >
            <ShoppingCart className="w-4 h-4" /> Add
          </button>
        </div>
      )}
    </div>
  );
}