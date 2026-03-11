import { useMemo } from 'react';
import { Link } from 'react-router';
import { Heart, ArrowRight } from 'lucide-react';
import { useStore, type Product } from '../store';
import { PRODUCTS_MAP } from '../data';
import { ProductCard } from './product-card';
import { Navigate } from 'react-router';

export function WishlistPage() {
  const wishlist = useStore((s) => s.wishlist);
  const user = useStore((s) => s.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // O(1) lookups via precomputed Map
  const wishedProducts = useMemo(
    () => wishlist.map((id) => PRODUCTS_MAP.get(id)).filter(Boolean) as Product[],
    [wishlist]
  );

  if (wishedProducts.length === 0) {
    return (
      <div className="py-20 text-center">
        <Heart className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
        <h2 className="text-[24px]" style={{ fontWeight: 700 }}>Your Wishlist is Empty</h2>
        <p className="text-muted-foreground mt-2 text-[15px]">Save items you love to buy them later</p>
        <Link to="/products" className="inline-flex items-center gap-2 mt-6 px-7 py-3 bg-primary text-white rounded-xl text-[15px] hover:shadow-lg hover:shadow-primary/25 transition-all active:scale-[0.98] group" style={{ fontWeight: 600 }}>
          Explore Products <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    );
  }

  return (
    <div className="py-6">
      <h1 className="text-[24px] mb-6" style={{ fontWeight: 700 }}>My Wishlist ({wishedProducts.length} items)</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {wishedProducts.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}