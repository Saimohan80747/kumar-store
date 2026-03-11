import { memo } from 'react';
import { Heart, ShoppingCart, Star, Package, Bell, Plus, Minus, Tag } from 'lucide-react';
import { Link } from 'react-router';
import { useStore, type Product } from '../store';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

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
    <div className={`group bg-white rounded-2xl border border-border/80 hover:border-primary/15 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 overflow-hidden relative flex flex-col card-lift shadow-premium ${!isAvailable ? 'opacity-60 grayscale-[30%]' : ''}`}>
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
        {!isAvailable && (
          <span className="bg-gray-700/90 backdrop-blur-sm text-white text-[10px] px-2.5 py-0.5 rounded-full" style={{ fontWeight: 600 }}>Out of Stock</span>
        )}
        {product.featured && isAvailable && (
          <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] px-2.5 py-0.5 rounded-full shadow-sm" style={{ fontWeight: 600 }}>Featured</span>
        )}
        {isLoggedIn && discount > 0 && isAvailable && (
          <span className="bg-gradient-to-r from-primary to-emerald-500 text-white text-[10px] px-2.5 py-0.5 rounded-full shadow-sm" style={{ fontWeight: 600 }}>{discount}% OFF</span>
        )}
        {product.stock > 0 && product.stock < 50 && (
          <span className="bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] px-2.5 py-0.5 rounded-full shadow-sm animate-pulse" style={{ fontWeight: 600 }}>Low Stock</span>
        )}
      </div>

      {/* Wishlist */}
      <button
        onClick={() => {
          if (!isLoggedIn) { navigate('/login'); return; }
          toggleWishlist(product.id); toast.success(isWished ? 'Removed from wishlist' : 'Added to wishlist');
        }}
        className="absolute top-3 right-3 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white hover:shadow-md hover:scale-110 transition-all duration-200"
      >
        <Heart className={`w-4 h-4 ${isWished ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
      </button>

      {/* Image */}
      <Link to={`/product/${product.id}`} className="relative overflow-hidden">
        <div className="aspect-square bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100/80 p-3 flex items-center justify-center overflow-hidden shine-hover">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-xl group-hover:scale-110 transition-transform duration-700 ease-out" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </Link>

      {/* Info */}
      <div className="p-3.5 flex-1 flex flex-col">
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest" style={{ fontWeight: 600 }}>{product.brand}</span>
        <Link to={`/product/${product.id}`} className="text-[14px] mt-1 line-clamp-2 hover:text-primary transition-colors leading-snug" style={{ fontWeight: 500 }}>
          {product.name}
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mt-2">
          <div className="flex items-center gap-0.5 bg-gradient-to-r from-primary to-emerald-500 text-white px-1.5 py-0.5 rounded-md text-[11px] shadow-sm">
            <Star className="w-3 h-3 fill-white" /> {product.rating}
          </div>
          <span className="text-[11px] text-muted-foreground">({product.reviews.toLocaleString()})</span>
        </div>

        {/* Price */}
        {isLoggedIn ? (
          <div className="mt-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">MRP:</span>
              <span className={`text-[13px] ${priceDiff > 0 ? 'line-through text-muted-foreground' : 'text-foreground'}`} style={{ fontWeight: priceDiff > 0 ? 400 : 700 }}>Rs.{product.mrp}</span>
            </div>
            {priceDiff > 0 && (
              <div className="flex items-end gap-2 mt-0.5">
                <span className="text-[18px] text-foreground" style={{ fontWeight: 700 }}>Rs.{price}</span>
              </div>
            )}
            {priceDiff > 0 && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[11px] text-primary bg-primary/8 px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>Save Rs.{priceDiff}</span>
              </div>
            )}
            {/* Show shopowner vs customer pricing comparison */}
            {isLoggedIn && isShop && (
              <div className="mt-1.5 flex items-center gap-1 text-[11px]">
                <Tag className="w-3 h-3 text-amber-500" />
                <span className="text-muted-foreground">Customer price:</span>
                <span className="text-amber-600" style={{ fontWeight: 600 }}>Rs.{product.customerPrice}</span>
              </div>
            )}
            {isLoggedIn && !isShop && user?.role === 'customer' && (
              <div className="mt-1.5 flex items-center gap-1 text-[11px]">
                <Tag className="w-3 h-3 text-primary" />
                <span className="text-primary" style={{ fontWeight: 500 }}>Customer Discount Applied</span>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-2">
            <Link to="/login" className="text-[14px] text-primary hover:underline" style={{ fontWeight: 600 }}>
              Login to see price
            </Link>
          </div>
        )}

        {isLoggedIn && isShop && (
          <div className="mt-1 flex items-center gap-2 text-[12px]">
            <span className="text-primary" style={{ fontWeight: 600 }}>Save Rs.{product.mrp - product.shopPrice}/unit</span>
            <span className="text-muted-foreground">| Margin {Math.round(((product.mrp - product.shopPrice) / product.mrp) * 100)}%</span>
          </div>
        )}

        {isLoggedIn && isShop && (
          <div className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground">
            <Package className="w-3 h-3" /> Min. order: {product.minWholesaleQty} {product.unitType}s
          </div>
        )}

        {/* Add to cart / Request */}
        {isLoggedIn ? (
          isAvailable ? (
            cartQty > 0 ? (
              /* Increment / Decrement controls */
              <div className="mt-3 flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl overflow-hidden">
                <button
                  onClick={() => {
                    if (cartQty <= 1) {
                      removeFromCart(product.id);
                      toast.success('Removed from cart');
                    } else {
                      updateCartQty(product.id, cartQty - 1);
                    }
                  }}
                  className="px-3 py-2 hover:bg-primary/10 transition-colors"
                >
                  <Minus className="w-4 h-4 text-primary" />
                </button>
                <span className="text-[15px] text-primary min-w-[40px] text-center" style={{ fontWeight: 700 }}>
                  {cartQty}
                </span>
                <button
                  onClick={() => {
                    if (cartQty < product.stock) {
                      updateCartQty(product.id, cartQty + 1);
                    } else {
                      toast.error(`Only ${product.stock} in stock`);
                    }
                  }}
                  className="px-3 py-2 hover:bg-primary/10 transition-colors"
                >
                  <Plus className="w-4 h-4 text-primary" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  const qty = isShop ? product.minWholesaleQty : 1;
                  addToCart(product, qty);
                  toast.success(`Added ${qty} ${product.unitType}(s) to cart`);
                }}
                className="mt-3 w-full py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 hover:shadow-md hover:shadow-primary/25 transition-all flex items-center justify-center gap-2 text-[13px] active:scale-[0.97] btn-press"
                style={{ fontWeight: 600 }}
              >
                <ShoppingCart className="w-4 h-4" />
                {isShop ? `Add ${product.minWholesaleQty} to Cart` : 'Add to Cart'}
              </button>
            )
          ) : (
            /* Unavailable — Request Product button */
            <button
              onClick={async () => {
                try {
                  await requestProduct(product.id, product.name);
                  toast.success('Product request sent! We\'ll notify you when it\'s available.');
                } catch {
                  toast.error('Request already submitted or failed.');
                }
              }}
              className="mt-3 w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:shadow-md hover:shadow-amber-500/20 transition-all flex items-center justify-center gap-2 text-[13px] active:scale-[0.97]"
            >
              <Bell className="w-4 h-4" />
              Request Product
            </button>
          )
        ) : (
          <Link
            to="/login"
            className="mt-3 w-full py-2.5 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 border border-border/60 transition-all flex items-center justify-center gap-2 text-[13px] group/login"
          >
            <ShoppingCart className="w-4 h-4 group-hover/login:text-primary transition-colors" />
            Login to Buy
          </Link>
        )}
      </div>
    </div>
  );
});