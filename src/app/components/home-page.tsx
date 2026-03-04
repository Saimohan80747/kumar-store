import { useState, useEffect, useMemo, memo } from 'react';
import { Link } from 'react-router';
import { ChevronLeft, ChevronRight, TrendingUp, Truck, Shield, Clock, ArrowRight, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../store';
import { products, CATEGORIES, BANNER_IMAGES, FEATURED_PRODUCTS, BEST_SELLERS, PRODUCTS_MAP } from '../data';
import { ProductCard } from './product-card';

// ─── Static data hoisted outside components to avoid re-creation ───
const HERO_SLIDES = [
  { img: BANNER_IMAGES[0], title: 'Wholesale Prices,\nRetail Convenience', sub: 'Save up to 40% on bulk orders. Free delivery on Rs.999+', cta: 'Shop Now' },
  { img: BANNER_IMAGES[1], title: 'Stock Up Your\nStore Today', sub: 'Best prices for retailers. Minimum order quantities available.', cta: 'Explore Wholesale' },
  { img: BANNER_IMAGES[2], title: 'Fresh Groceries\nAt Your Doorstep', sub: 'Quality products from trusted brands. Same day delivery.', cta: 'Order Now' },
];

const STATS = [
  { icon: Truck, label: 'Free Delivery', sub: 'On orders above Rs.999' },
  { icon: Shield, label: 'Genuine Products', sub: '100% authentic brands' },
  { icon: Clock, label: 'Same Day Delivery', sub: 'Order before 2 PM' },
  { icon: TrendingUp, label: 'Best Prices', sub: 'Wholesale rates available' },
];

const TOP_BRANDS = ['Surf Excel', 'Tata Tea', 'Colgate', 'Dove', 'Nescafe', 'Maggi', 'Parle', 'Dabur', 'Himalaya'];

function HeroBanner() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent((p) => (p + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl h-[300px] sm:h-[400px] lg:h-[460px]">
      {HERO_SLIDES.map((s, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-700 ${i === current ? 'opacity-100' : 'opacity-0'}`}
        >
          <img src={s.img} alt="" className="w-full h-full object-cover" loading={i === 0 ? 'eager' : 'lazy'} />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          <div className="absolute inset-0 flex items-center">
            <div className="px-8 sm:px-12 max-w-xl">
              <motion.h1
                key={`title-${i}-${current}`}
                initial={{ y: 30, opacity: 0 }}
                animate={i === current ? { y: 0, opacity: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-white whitespace-pre-line text-[28px] sm:text-[36px] lg:text-[44px]"
                style={{ fontWeight: 800, lineHeight: 1.1 }}
              >
                {s.title}
              </motion.h1>
              <motion.p
                key={`sub-${i}-${current}`}
                initial={{ y: 20, opacity: 0 }}
                animate={i === current ? { y: 0, opacity: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-white/80 mt-3 text-[14px] sm:text-[16px]"
              >
                {s.sub}
              </motion.p>
              <motion.div
                key={`cta-${i}-${current}`}
                initial={{ y: 20, opacity: 0 }}
                animate={i === current ? { y: 0, opacity: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <Link to="/products" className="inline-flex items-center gap-2 mt-5 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-[15px]" style={{ fontWeight: 600 }}>
                  {s.cta} <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      ))}

      <button onClick={() => setCurrent((p) => (p - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button onClick={() => setCurrent((p) => (p + 1) % HERO_SLIDES.length)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors">
        <ChevronRight className="w-5 h-5" />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {HERO_SLIDES.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} className={`w-2.5 h-2.5 rounded-full transition-all ${i === current ? 'bg-white w-8' : 'bg-white/50'}`} />
        ))}
      </div>
    </div>
  );
}

function StatsBanner() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {STATS.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          viewport={{ once: true }}
          className="flex items-center gap-3 p-4 bg-white rounded-xl border border-border"
        >
          <div className="p-2.5 bg-primary/10 rounded-lg shrink-0">
            <s.icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[14px]" style={{ fontWeight: 600 }}>{s.label}</p>
            <p className="text-[12px] text-muted-foreground">{s.sub}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function CategorySection() {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[22px]" style={{ fontWeight: 700 }}>Shop by Category</h2>
        <Link to="/products" className="text-primary text-[14px] flex items-center gap-1 hover:underline" style={{ fontWeight: 500 }}>
          View All <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {CATEGORIES.map((cat, i) => (
          <motion.div
            key={cat.slug}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            viewport={{ once: true }}
          >
            <Link
              to={`/products?category=${cat.slug}`}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-border hover:border-primary hover:shadow-md transition-all group"
            >
              <span className="text-[32px] group-hover:scale-110 transition-transform">{cat.icon}</span>
              <span className="text-[13px] text-center" style={{ fontWeight: 500 }}>{cat.name}</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export function HomePage() {
  const userRole = useStore((s) => s.user?.role);
  const recentlyViewed = useStore((s) => s.recentlyViewed);
  const isShop = userRole === 'shopowner';

  // Use precomputed constants from data.ts — zero runtime cost
  const featured = FEATURED_PRODUCTS;
  const bestSellers = BEST_SELLERS;

  // Only recompute when recentlyViewed changes
  const recentProducts = useMemo(
    () => recentlyViewed.map((id) => PRODUCTS_MAP.get(id)).filter(Boolean) as typeof products,
    [recentlyViewed]
  );

  return (
    <div className="space-y-10 py-6">
      <HeroBanner />
      <StatsBanner />
      <CategorySection />

      {/* Featured Products */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[22px]" style={{ fontWeight: 700 }}>Featured Products</h2>
          <Link to="/products" className="text-primary text-[14px] flex items-center gap-1 hover:underline" style={{ fontWeight: 500 }}>View All <ArrowRight className="w-4 h-4" /></Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {FEATURED_PRODUCTS.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} viewport={{ once: true }}>
              <ProductCard product={p} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Wholesale Deals - Only for shop owners */}
      {isShop && (
        <section className="bg-gradient-to-r from-primary/5 to-emerald-50 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-6 h-6 text-primary" />
            <h2 className="text-[22px]" style={{ fontWeight: 700 }}>Wholesale Deals</h2>
            <span className="bg-primary text-white text-[12px] px-3 py-1 rounded-full" style={{ fontWeight: 600 }}>Shop Owner Exclusive</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {products.slice(0, 5).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Best Sellers */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[22px]" style={{ fontWeight: 700 }}>Best Sellers</h2>
          <Link to="/products" className="text-primary text-[14px] flex items-center gap-1 hover:underline" style={{ fontWeight: 500 }}>View All <ArrowRight className="w-4 h-4" /></Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {BEST_SELLERS.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Top Brands */}
      <section className="bg-white rounded-2xl border border-border p-6">
        <h2 className="text-[22px] mb-6" style={{ fontWeight: 700 }}>Top Brands</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-9 gap-4">
          {TOP_BRANDS.map((brand) => (
            <Link
              key={brand}
              to={`/products?brand=${brand}`}
              className="flex items-center justify-center p-4 bg-gray-50 rounded-xl hover:bg-primary/5 hover:border-primary border border-transparent transition-all text-[13px] text-center"
              style={{ fontWeight: 600 }}
            >
              {brand}
            </Link>
          ))}
        </div>
      </section>

      {/* Recently Viewed */}
      {recentProducts.length > 0 && (
        <section>
          <h2 className="text-[22px] mb-6" style={{ fontWeight: 700 }}>Recently Viewed</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {recentProducts.slice(0, 5).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-gradient-to-r from-primary to-emerald-600 rounded-2xl p-8 sm:p-12 text-white text-center">
        <h2 className="text-[28px] sm:text-[34px]" style={{ fontWeight: 800 }}>Are You a Shop Owner?</h2>
        <p className="mt-2 text-white/80 max-w-lg mx-auto text-[15px]">Register as a wholesale buyer and get exclusive pricing, bulk discounts, and dedicated support.</p>
        <Link to="/register?role=shopowner" className="inline-flex items-center gap-2 mt-6 px-8 py-3 bg-white text-primary rounded-lg hover:bg-gray-100 transition-colors text-[15px]" style={{ fontWeight: 600 }}>
          Register as Shop Owner <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
