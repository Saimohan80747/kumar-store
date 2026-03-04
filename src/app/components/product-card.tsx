import { memo, useCallback, useMemo } from 'react';
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
    <div className={`group bg-white rounded-xl border border-border hover:shadow-lg transition-all duration-300 overflow-hidden relative flex flex-col ${!isAvailable ? 'opacity-75' : ''}`}>
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
        {!isAvailable && (
          <span className="bg-gray-600 text-white text-[11px] px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>Out of Stock</span>
        )}
        {product.featured && isAvailable && (
          <span className="bg-amber-500 text-white text-[11px] px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>Featured</span>
        )}
        {isLoggedIn && discount > 0 && isAvailable && (
          <span className="bg-primary text-white text-[11px] px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>{discount}% OFF</span>
        )}
        {product.stock > 0 && product.stock < 50 && (
          <span className="bg-red-500 text-white text-[11px] px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>Low Stock</span>
        )}
      </div>

      {/* Wishlist */}
      <button
        onClick={() => {
          if (!isLoggedIn) { navigate('/login'); return; }
          toggleWishlist(product.id); toast.success(isWished ? 'Removed from wishlist' : 'Added to wishlist');
        }}
        className="absolute top-3 right-3 z-10 p-1.5 bg-white/90 rounded-full shadow-sm hover:bg-white transition-colors"
      >
        <Heart className={`w-4 h-4 ${isWished ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
      </button>

      {/* Image */}
      <Link to={`/product/${product.id}`} className="relative overflow-hidden">
        <div className="aspect-square bg-gray-50 p-4 flex items-center justify-center">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        </div>
      </Link>

      {/* Info */}
      <div className="p-3 flex-1 flex flex-col">
        <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{product.brand}</span>
        <Link to={`/product/${product.id}`} className="text-[14px] mt-1 line-clamp-2 hover:text-primary transition-colors" style={{ fontWeight: 500 }}>
          {product.name}
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1 mt-1.5">
          <div className="flex items-center gap-0.5 bg-primary text-white px-1.5 py-0.5 rounded text-[11px]">
            <Star className="w-3 h-3 fill-white" /> {product.rating}
          </div>
          <span className="text-[12px] text-muted-foreground">({product.reviews})</span>
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
                <span className="text-[12px] text-primary bg-primary/10 px-1.5 py-0.5 rounded" style={{ fontWeight: 600 }}>You save Rs.{priceDiff} ({discount}%)</span>
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
              <div className="mt-3 flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg overflow-hidden">
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
                    updateCartQty(product.id, cartQty + 1);
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
                className="mt-3 w-full py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 text-[14px]"
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
              className="mt-3 w-full py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 text-[14px]"
            >
              <Bell className="w-4 h-4" />
              Request Product
            </button>
          )
        ) : (
          <Link
            to="/login"
            className="mt-3 w-full py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-[14px]"
          >
            <ShoppingCart className="w-4 h-4" />
            Login to Buy
          </Link>
        )}
      </div>
    </div>
  );
});