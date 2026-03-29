import { useState, useEffect, useMemo, memo } from 'react';
import { Link } from 'react-router';
import { ChevronLeft, ChevronRight, TrendingUp, Truck, Shield, Clock, ArrowRight, Zap, Mic, Headphones, Sparkles, BrainCircuit } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../store';
import { products as allProducts, CATEGORIES, BANNER_IMAGES, FEATURED_PRODUCTS, BEST_SELLERS, PRODUCTS_MAP } from '../data';
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

const HeroBanner = memo(function HeroBanner() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent((p) => (p + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl h-[280px] sm:h-[440px] lg:h-[520px] shadow-2xl ring-1 ring-black/5"
      >
        {/* Floating gradient orbs for depth */}
        <div className="orb orb-primary w-64 h-64 -top-20 -left-20 animate-float-slow" />
        <div className="orb orb-emerald w-48 h-48 bottom-10 right-10 animate-float-slow" style={{ animationDelay: '2s' }} />
        {HERO_SLIDES.map((s, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-700 ${i === current ? 'opacity-100' : 'opacity-0'}`}
          >
            <img src={s.img} alt="" className="w-full h-full object-cover" loading={i === 0 ? 'eager' : 'lazy'} />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            <div className="absolute inset-0 flex items-center">
              <div className="px-6 sm:px-12 max-w-xl">
                <motion.h1
                  key={`title-${i}-${current}`}
                  initial={{ x: -30, opacity: 0 }}
                  animate={i === current ? { x: 0, opacity: 1 } : {}}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-white whitespace-pre-line text-[24px] xs:text-[28px] sm:text-[40px] lg:text-[52px] drop-shadow-lg"
                  style={{ fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.025em' }}
                >
                  {s.title}
                </motion.h1>
                <motion.p
                  key={`sub-${i}-${current}`}
                  initial={{ x: -20, opacity: 0 }}
                  animate={i === current ? { x: 0, opacity: 1 } : {}}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-white/85 mt-3 sm:mt-4 text-[13px] sm:text-[17px] max-w-md leading-relaxed line-clamp-2 sm:line-clamp-none"
                >
                  {s.sub}
                </motion.p>
                <motion.div
                  key={`cta-${i}-${current}`}
                  initial={{ y: 20, opacity: 0 }}
                  animate={i === current ? { y: 0, opacity: 1 } : {}}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  <Link to="/products" className="inline-flex items-center gap-2 mt-4 sm:mt-6 px-5 sm:px-7 py-2.5 sm:py-3.5 bg-white text-gray-900 rounded-full hover:bg-white/90 shadow-lg hover:shadow-xl transition-all text-[14px] sm:text-[15px] group" style={{ fontWeight: 700 }}>
                    {s.cta} <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
        ))}

        <button onClick={() => setCurrent((p) => (p - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)} className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/25 transition-all hover:scale-110 border border-white/20 hidden sm:block">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button onClick={() => setCurrent((p) => (p + 1) % HERO_SLIDES.length)} className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/25 transition-all hover:scale-110 border border-white/20 hidden sm:block">
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2">
          {HERO_SLIDES.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} className={`h-1 sm:h-1.5 rounded-full transition-all duration-300 ${i === current ? 'bg-white w-8 sm:w-10' : 'bg-white/40 w-1 sm:w-1.5 hover:bg-white/60'}`} />
          ))}
        </div>
      </motion.div>
  );
});

const StatsBanner = memo(function StatsBanner() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mt-8 sm:mt-12">
      {STATS.map((s, i) => (
        <motion.div 
          key={i} 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          viewport={{ once: true }}
          className="bg-white p-4 sm:p-6 rounded-2xl border border-border/60 hover:border-primary/20 transition-all shadow-premium hover:shadow-premium-lg group"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
            <s.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </div>
          <h3 className="text-[14px] sm:text-[16px]" style={{ fontWeight: 700 }}>{s.label}</h3>
          <p className="text-[11px] sm:text-[13px] text-muted-foreground mt-1">{s.sub}</p>
        </motion.div>
      ))}
    </div>
  );
});

function CategorySection() {
  return (
    <section>
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 sm:h-7 bg-gradient-to-b from-primary to-emerald-500 rounded-full" />
          <h2 className="text-[18px] sm:text-[22px]" style={{ fontWeight: 700 }}>Shop by Category</h2>
        </div>
        <Link to="/products" className="text-primary text-[12px] sm:text-[13px] flex items-center gap-1.5 px-3 sm:px-4 py-1.5 bg-primary/5 hover:bg-primary/10 rounded-full transition-colors" style={{ fontWeight: 600 }}>
          View All <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2.5 sm:gap-3">
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
              className="flex flex-col items-center gap-2 p-3 sm:p-4 bg-white rounded-2xl border border-border/80 hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group shine-hover shadow-premium"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-primary/5 to-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span className="text-[24px] sm:text-[28px]">{cat.icon}</span>
              </div>
              <span className="text-[11px] sm:text-[12px] text-center text-muted-foreground group-hover:text-foreground transition-colors truncate w-full px-1" style={{ fontWeight: 600 }}>{cat.name}</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

const AI_FEATURES = [
  {
    icon: Mic,
    title: 'Voice Search',
    desc: 'Search products by speaking — just tap the mic and say what you need.',
    gradient: 'from-violet-500 to-purple-600',
    glow: 'shadow-violet-500/20',
    link: '/products',
    linkLabel: 'Try Voice Search',
  },
  {
    icon: Headphones,
    title: 'Multilingual Audio',
    desc: 'Listen to product descriptions in Hindi, Telugu, Tamil and more — powered by Sarvam AI.',
    gradient: 'from-blue-500 to-cyan-500',
    glow: 'shadow-blue-500/20',
    link: '/products',
    linkLabel: 'Explore Products',
  },
  {
    icon: Sparkles,
    title: 'Smart Picks',
    desc: 'AI-curated product recommendations based on your browsing & purchase history.',
    gradient: 'from-amber-500 to-orange-500',
    glow: 'shadow-amber-500/20',
    link: '/products',
    linkLabel: 'View Picks',
  },
];

function AiSection() {
  return (
    <section className="relative rounded-2xl sm:rounded-3xl overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(139,92,246,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(59,130,246,0.12),transparent_50%)]" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDYwIEwgNjAgMCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IGZpbGw9InVybCgjZykiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiLz48L3N2Zz4=')] opacity-50" />

      <div className="relative p-6 sm:p-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg shadow-violet-500/25">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-white text-[22px]" style={{ fontWeight: 700 }}>AI-Powered Shopping</h2>
            <p className="text-white/50 text-[13px]">Smarter, faster, and more personal</p>
          </div>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          {AI_FEATURES.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              viewport={{ once: true }}
              className={`group relative bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:bg-white/[0.1] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${feat.glow}`}
            >
              {/* Icon */}
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feat.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <feat.icon className="w-5 h-5 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-white text-[16px] mb-1.5" style={{ fontWeight: 600 }}>{feat.title}</h3>
              <p className="text-white/55 text-[13px] leading-relaxed mb-4">{feat.desc}</p>

              {/* Link */}
              <Link
                to={feat.link}
                className="inline-flex items-center gap-1.5 text-[12px] text-white/70 hover:text-white transition-colors group/link"
                style={{ fontWeight: 600 }}
              >
                {feat.linkLabel}
                <ArrowRight className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
              </Link>

              {/* Decorative glow */}
              <div className={`absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br ${feat.gradient} rounded-full opacity-0 group-hover:opacity-10 blur-2xl transition-opacity duration-500`} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomePage() {
  const userRole = useStore((s) => s.user?.role);
  const recentlyViewed = useStore((s) => s.recentlyViewed);
  const isShop = userRole === 'shopowner';

  // Only recompute when recentlyViewed changes
  const recentProducts = useMemo(
    () => recentlyViewed.map((id) => PRODUCTS_MAP.get(id)).filter(Boolean) as typeof allProducts,
    [recentlyViewed]
  );

  return (
    <div className="space-y-12 sm:space-y-20 pb-16">
      <section>
        <HeroBanner />
        <StatsBanner />
      </section>

      <CategorySection />

      {/* AI Smart Deals */}
      <section>
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-gradient-to-b from-purple-500 to-primary rounded-full" />
            <div>
              <h2 className="text-[24px] sm:text-[28px] tracking-tight" style={{ fontWeight: 800 }}>
                Smart Deals for You
              </h2>
              <p className="text-muted-foreground text-[14px]">AI-curated based on your interests</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-600 rounded-full border border-purple-100 animate-pulse">
            <Sparkles className="w-3 h-3" />
            <span className="text-[11px] font-bold uppercase tracking-wider">AI Powered</span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
          {BEST_SELLERS.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section>
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-gradient-to-b from-primary to-emerald-500 rounded-full" />
            <div>
              <h2 className="text-[24px] sm:text-[28px] tracking-tight" style={{ fontWeight: 800 }}>
                Featured Collections
              </h2>
              <p className="text-muted-foreground text-[14px]">Handpicked premium quality items</p>
            </div>
          </div>
          <Link to="/products" className="text-primary font-bold text-[14px] hover:underline flex items-center gap-1 group">
            View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
          {FEATURED_PRODUCTS.slice(0, 10).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Top Brands Grid */}
      <section className="bg-slate-50 -mx-4 px-4 py-16 sm:py-24 border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-[24px] sm:text-[32px]" style={{ fontWeight: 800 }}>Trusted by 500+ Local Brands</h2>
            <p className="text-muted-foreground mt-2">We bring you the best from names you know and trust</p>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4 sm:gap-8 opacity-60">
            {TOP_BRANDS.map(brand => (
              <div key={brand} className="flex items-center justify-center p-4 bg-white rounded-2xl border border-slate-100 grayscale hover:grayscale-0 transition-all hover:scale-110 cursor-default">
                <span className="text-[12px] font-black text-slate-400 text-center uppercase tracking-tighter">{brand}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* All Products */}
      <section>
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-1.5 h-8 bg-gradient-to-b from-slate-400 to-slate-600 rounded-full" />
          <h2 className="text-[24px] sm:text-[28px] tracking-tight" style={{ fontWeight: 800 }}>Explore Our Catalog</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
          {allProducts.slice(0, 10).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link 
            to="/products" 
            className="inline-flex items-center gap-2 px-10 py-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-95 font-bold"
          >
            Explore 1000+ Products <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Wholesale Deals - Only for shop owners */}
      {isShop && (
        <section className="bg-gradient-to-r from-primary/5 via-emerald-50/80 to-teal-50/50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-primary/10">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-gradient-to-br from-primary to-emerald-500 rounded-xl shadow-md shadow-primary/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-[22px]" style={{ fontWeight: 700 }}>Wholesale Deals</h2>
            <span className="bg-gradient-to-r from-primary to-emerald-500 text-white text-[11px] px-3 py-1 rounded-full shadow-sm" style={{ fontWeight: 600 }}>Shop Owner Exclusive</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
            {allProducts.slice(0, 5).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* AI-Powered Section */}
      <AiSection />

      {/* Recently Viewed */}
      {recentProducts.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-7 bg-gradient-to-b from-primary to-emerald-500 rounded-full" />
            <h2 className="text-[22px]" style={{ fontWeight: 700 }}>Recently Viewed</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
            {recentProducts.slice(0, 5).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="relative bg-gradient-to-br from-primary via-emerald-600 to-teal-600 rounded-[24px] sm:rounded-[32px] p-8 sm:p-12 lg:p-14 text-white text-center overflow-hidden animate-gradient">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.08),transparent_50%)]" />
        <div className="orb w-72 h-72 -top-20 -right-20 animate-float-slow" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)' }} />
        <div className="orb w-56 h-56 -bottom-16 -left-16 animate-float-slow" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)', animationDelay: '3s' }} />
        <div className="relative">
          <h2 className="text-[24px] sm:text-[32px] lg:text-[36px]" style={{ fontWeight: 800, letterSpacing: '-0.02em' }}>Are You a Shop Owner?</h2>
          <p className="mt-3 text-white/80 max-w-lg mx-auto text-[14px] sm:text-[16px] leading-relaxed">Register as a wholesale buyer and get exclusive pricing, bulk discounts, and dedicated support.</p>
          <Link to="/register?role=shopowner" className="inline-flex items-center gap-2.5 mt-6 sm:mt-8 px-6 sm:px-8 py-3 sm:py-3.5 bg-white text-gray-900 rounded-full hover:bg-white/90 shadow-lg hover:shadow-xl transition-all text-[14px] sm:text-[15px] group glow-white btn-press" style={{ fontWeight: 700 }}>
            Register as Shop Owner <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
}
