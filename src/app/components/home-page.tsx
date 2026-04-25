import { memo, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  ArrowRight,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  Clock,
  Headphones,
  Mic,
  Shield,
  Sparkles,
  TrendingUp,
  Truck,
  Zap,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../store';
import {
  products as allProducts,
  CATEGORIES,
  BANNER_IMAGES,
  FEATURED_PRODUCTS,
  BEST_SELLERS,
  PRODUCTS_MAP,
} from '../data';
import { ProductCard } from './product-card';
import { TiltCard } from './ui/tilt-card';

const HERO_SLIDES = [
  {
    img: BANNER_IMAGES[0],
    eyebrow: '3D Retail Engine',
    title: 'Wholesale power.\nImmersive storefront.',
    sub: 'A sharper retail surface with live deals, voice search, and motion-rich merchandising that feels built, not themed.',
    cta: 'Explore Catalog',
    metric: '40%',
    metricLabel: 'margin advantage',
    signal: 'AI demand sync',
    glow: 'rgba(16, 185, 129, 0.38)',
    highlights: [
      { label: 'Dispatch', value: '6 hr avg' },
      { label: 'Conversion', value: '+28%' },
      { label: 'Smart matches', value: '92%' },
    ],
  },
  {
    img: BANNER_IMAGES[1],
    eyebrow: 'Bulk Buying Control',
    title: 'Stock faster.\nSee demand in layers.',
    sub: 'Bulk-first pricing, retailer views, and premium product storytelling brought together with cinematic depth and cleaner decision cues.',
    cta: 'View Bulk Deals',
    metric: '2.4k',
    metricLabel: 'orders this week',
    signal: 'live warehouse feed',
    glow: 'rgba(59, 130, 246, 0.34)',
    highlights: [
      { label: 'Retailers live', value: '500+' },
      { label: 'Avg reorder', value: '11 days' },
      { label: 'Fill rate', value: '96%' },
    ],
  },
  {
    img: BANNER_IMAGES[2],
    eyebrow: 'Personalized Commerce',
    title: 'Fresh inventory.\nPrecision recommendations.',
    sub: 'Customers get a tactile, next-gen shopping experience while shop owners keep pricing, fulfillment, and AI assistance front and center.',
    cta: 'See Featured Picks',
    metric: '4.9',
    metricLabel: 'customer trust score',
    signal: 'multilingual product assist',
    glow: 'rgba(245, 158, 11, 0.3)',
    highlights: [
      { label: 'Voice search', value: '8 languages' },
      { label: 'Repeat users', value: '67%' },
      { label: 'Same-day slots', value: '120+' },
    ],
  },
];

const STATS = [
  { icon: Truck, label: 'Free Delivery', sub: 'On orders above Rs.999', glow: 'rgba(16, 185, 129, 0.14)' },
  { icon: Shield, label: 'Genuine Products', sub: '100% authentic brands', glow: 'rgba(59, 130, 246, 0.14)' },
  { icon: Clock, label: 'Same Day Delivery', sub: 'Order before 2 PM', glow: 'rgba(245, 158, 11, 0.16)' },
  { icon: TrendingUp, label: 'Best Prices', sub: 'Wholesale rates available', glow: 'rgba(20, 184, 166, 0.14)' },
];

const CATEGORY_THEMES = [
  { surface: 'from-emerald-50 via-white to-teal-50', icon: 'from-emerald-500 to-teal-400', glow: 'rgba(16, 185, 129, 0.22)' },
  { surface: 'from-sky-50 via-white to-cyan-50', icon: 'from-sky-500 to-cyan-400', glow: 'rgba(59, 130, 246, 0.18)' },
  { surface: 'from-amber-50 via-white to-orange-50', icon: 'from-amber-500 to-orange-400', glow: 'rgba(245, 158, 11, 0.2)' },
  { surface: 'from-fuchsia-50 via-white to-rose-50', icon: 'from-fuchsia-500 to-rose-400', glow: 'rgba(217, 70, 239, 0.18)' },
];

const AI_FEATURES = [
  {
    icon: Mic,
    title: 'Voice Search',
    desc: 'Search products naturally with a voice-first layer that feels instant and contextual.',
    gradient: 'from-violet-500 to-fuchsia-500',
    glow: 'rgba(139, 92, 246, 0.26)',
    link: '/products',
    linkLabel: 'Try voice search',
  },
  {
    icon: Headphones,
    title: 'Multilingual Audio',
    desc: 'Localized audio descriptions help shoppers browse faster across languages and categories.',
    gradient: 'from-sky-500 to-cyan-500',
    glow: 'rgba(14, 165, 233, 0.24)',
    link: '/products',
    linkLabel: 'Explore products',
  },
  {
    icon: Sparkles,
    title: 'Smart Picks',
    desc: 'Personalized recommendations surface faster with behavior-aware ranking and premium merchandising.',
    gradient: 'from-amber-500 to-orange-500',
    glow: 'rgba(245, 158, 11, 0.24)',
    link: '/products',
    linkLabel: 'View picks',
  },
];

const TOP_BRANDS = ['Surf Excel', 'Tata Tea', 'Colgate', 'Dove', 'Nescafe', 'Maggi', 'Parle', 'Dabur', 'Himalaya'];

const HeroBanner = memo(function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const activeSlide = HERO_SLIDES[current];

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncReducedMotion = () => setPrefersReducedMotion(mediaQuery.matches);

    syncReducedMotion();
    mediaQuery.addEventListener('change', syncReducedMotion);

    return () => mediaQuery.removeEventListener('change', syncReducedMotion);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || isPaused) return;

    const timer = window.setInterval(() => {
      setCurrent((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [isPaused, prefersReducedMotion]);

  return (
    <section
      className="relative overflow-hidden rounded-[32px] border border-slate-900/10 bg-slate-950 shadow-[0_45px_140px_-60px_rgba(15,23,42,0.8)] sm:rounded-[40px]"
      onPointerEnter={() => setIsPaused(true)}
      onPointerLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsPaused(false);
        }
      }}
    >
      {HERO_SLIDES.map((slide, index) => (
        <div
          key={slide.title}
          className={`absolute inset-0 transition-opacity duration-700 ${index === current ? 'opacity-100' : 'opacity-0'}`}
        >
          <img src={slide.img} alt="" className="h-full w-full object-cover opacity-20" loading={index === 0 ? 'eager' : 'lazy'} />
          <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(2,6,23,0.96)_0%,rgba(2,6,23,0.9)_38%,rgba(2,6,23,0.68)_70%,rgba(2,6,23,0.92)_100%)]" />
          <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 18% 18%, ${slide.glow} 0%, transparent 34%)` }} />
        </div>
      ))}

      <div className="mesh-backdrop absolute inset-0 opacity-20" />
      <div className="absolute -left-20 top-8 h-64 w-64 rounded-full bg-emerald-400/12 blur-[110px]" />
      <div className="absolute right-0 top-12 h-72 w-72 rounded-full bg-cyan-400/10 blur-[120px]" />
      <div className="absolute bottom-[-9rem] left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-300/12 blur-[130px]" />

      <div className="relative grid gap-10 px-5 py-7 sm:px-8 sm:py-10 lg:grid-cols-[1.02fr_0.98fr] lg:px-10 lg:py-12">
        <motion.div
          key={`copy-${current}`}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex flex-col justify-between"
        >
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/70 backdrop-blur-xl">
              <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
              {activeSlide.eyebrow}
            </div>

            <h1 className="font-display mt-5 whitespace-pre-line text-[2.5rem] leading-[0.94] tracking-[-0.05em] text-white sm:text-[3.2rem] lg:text-[4.6rem]">
              {activeSlide.title}
            </h1>

            <p className="mt-5 max-w-xl text-[15px] leading-7 text-white/68 sm:text-[16px]">
              {activeSlide.sub}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/products"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-[14px] font-black uppercase tracking-[0.16em] text-slate-900 transition-all duration-300 hover:translate-y-[-2px] hover:bg-emerald-50"
              >
                {activeSlide.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/register?role=shopowner"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/6 px-6 py-3.5 text-[14px] font-bold uppercase tracking-[0.16em] text-white/82 backdrop-blur-xl transition-all duration-300 hover:border-white/25 hover:bg-white/10"
              >
                Become a Partner
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {activeSlide.highlights.map((item, index) => (
              <TiltCard
                key={item.label}
                className="rounded-[26px] border border-white/12 bg-white/8 backdrop-blur-xl"
                contentClassName="h-full p-4"
                maxTilt={10}
              >
                <div className="depth-layer depth-16">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">{item.label}</p>
                  <p className="font-display mt-2 text-[24px] tracking-[-0.04em] text-white sm:text-[28px]">
                    {item.value}
                  </p>
                  <div
                    className="mt-4 h-1.5 rounded-full"
                    style={{
                      width: `${72 + index * 8}%`,
                      background: 'linear-gradient(90deg, rgba(255,255,255,0.95), rgba(255,255,255,0.2))',
                    }}
                  />
                </div>
              </TiltCard>
            ))}
          </div>
        </motion.div>

        <div className="depth-stage relative h-[360px] sm:h-[470px] lg:h-[540px]">
          <motion.div
            key={`stage-${current}`}
            initial={{ opacity: 0, x: 24, rotateY: -8 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="absolute inset-0"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5.6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute left-0 top-10 z-30 hidden w-44 sm:block"
            >
              <TiltCard
                className="floating-card rounded-[28px] border border-white/12 bg-white/12 text-white backdrop-blur-xl"
                contentClassName="p-4"
                maxTilt={14}
              >
                <div className="depth-layer depth-24">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">{activeSlide.signal}</p>
                  <p className="font-display mt-2 text-[26px] tracking-[-0.05em] text-white">{activeSlide.metric}</p>
                  <p className="mt-2 text-[13px] text-white/62">{activeSlide.metricLabel}</p>
                </div>
              </TiltCard>
            </motion.div>

            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 6.4, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
              className="absolute bottom-9 right-0 z-30 hidden w-48 sm:block"
            >
              <TiltCard
                className="floating-card rounded-[28px] border border-white/12 bg-slate-950/80 text-white backdrop-blur-xl"
                contentClassName="p-4"
                maxTilt={14}
              >
                <div className="depth-layer depth-24">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">Conversion boost</p>
                    <TrendingUp className="h-4 w-4 text-emerald-300" />
                  </div>
                  <div className="mt-3 h-24 rounded-[20px] bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_100%)] p-4">
                    <div className="flex h-full items-end gap-2">
                      {[46, 68, 54, 86, 94].map((value) => (
                        <div
                          key={value}
                          className="flex-1 rounded-t-full bg-gradient-to-t from-emerald-400 to-cyan-300"
                          style={{ height: `${value}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </TiltCard>
            </motion.div>

            <TiltCard
              className="floating-card absolute inset-x-4 bottom-6 top-6 rounded-[34px] border border-white/16 bg-white/10 text-white backdrop-blur-2xl sm:inset-x-8"
              contentClassName="h-full p-5 sm:p-6"
              maxTilt={12}
            >
              <div className="absolute inset-0 rounded-[inherit] bg-[linear-gradient(180deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.02)_100%)]" />
              <div className="absolute inset-0 rounded-[inherit] opacity-70" style={{ background: `radial-gradient(circle at 72% 26%, ${activeSlide.glow} 0%, transparent 34%)` }} />
              <div className="mesh-backdrop-dark absolute inset-0 rounded-[inherit] opacity-45" />

              <div className="relative flex h-full flex-col">
                <div className="depth-layer depth-16 flex items-center justify-between rounded-full border border-white/12 bg-white/6 px-4 py-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">Experience layer</p>
                    <p className="mt-1 text-[15px] font-semibold text-white/84">Product storytelling in motion</p>
                  </div>
                  <div className="rounded-full border border-white/12 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-200">
                    {activeSlide.signal}
                  </div>
                </div>

                <div className="mt-5 grid flex-1 gap-4 sm:grid-cols-[0.94fr_1.06fr] sm:gap-5">
                  <div className="flex min-h-[220px] flex-col gap-4">
                    <div className="depth-layer depth-24 rounded-[28px] border border-white/12 bg-slate-950/46 p-5 shadow-[0_24px_80px_-36px_rgba(0,0,0,0.8)]">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">Retail intelligence</p>
                      <p className="font-display mt-3 text-[2.5rem] leading-none tracking-[-0.06em] text-white">{activeSlide.metric}</p>
                      <p className="mt-2 max-w-[16rem] text-[13px] leading-6 text-white/62">{activeSlide.metricLabel}</p>
                    </div>

                    <div className="depth-layer depth-16 rounded-[28px] border border-white/12 bg-white/10 p-5">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">Motion stack</p>
                      <div className="mt-4 space-y-3">
                        {activeSlide.highlights.map((item) => (
                          <div key={item.label} className="flex items-center justify-between text-[13px] text-white/72">
                            <span>{item.label}</span>
                            <span className="font-bold text-white">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="depth-stage relative min-h-[260px]">
                    <div className="pulse-plane absolute inset-4 rounded-[32px] border border-white/10 bg-white/8 blur-[1px]" />
                    <div className="depth-layer depth-40 absolute inset-0 rounded-[30px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.04)_100%)] p-3">
                      <div className="relative h-full overflow-hidden rounded-[24px] shadow-[0_40px_90px_-38px_rgba(0,0,0,0.8)]">
                        <img
                          src={activeSlide.img}
                          alt={activeSlide.title.replace('\n', ' ')}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.12)_0%,rgba(15,23,42,0.05)_35%,rgba(15,23,42,0.86)_100%)]" />

                        <div className="absolute inset-x-3 top-3 flex items-center justify-between">
                          <div className="rounded-full border border-white/18 bg-slate-950/55 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/80 backdrop-blur-xl">
                            Live pricing
                          </div>
                          <div className="rounded-full border border-white/18 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/72 backdrop-blur-xl">
                            3D preview
                          </div>
                        </div>

                        <div className="absolute inset-x-3 bottom-3">
                          <div className="depth-layer depth-24 rounded-[24px] border border-white/14 bg-white/92 p-4 text-slate-900 shadow-2xl shadow-slate-950/25">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Current highlight</p>
                                <p className="font-display mt-2 text-[22px] leading-tight tracking-[-0.05em]">
                                  {activeSlide.highlights[1].value}
                                </p>
                              </div>
                              <div className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                                Growth signal
                              </div>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-3 text-[12px] text-slate-500">
                              <div className="rounded-[18px] bg-slate-100 px-3 py-2">{activeSlide.highlights[0].label}</div>
                              <div className="rounded-[18px] bg-slate-100 px-3 py-2">{activeSlide.highlights[2].label}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TiltCard>
          </motion.div>
        </div>
      </div>

      <div className="absolute inset-x-4 bottom-4 z-20 flex items-center justify-between sm:inset-x-8 sm:bottom-6">
        <div className="flex items-center gap-2">
          {HERO_SLIDES.map((slide, index) => (
            <button
              type="button"
              key={slide.title}
              onClick={() => setCurrent(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === current ? 'w-12 bg-white' : 'w-2 bg-white/35 hover:bg-white/55'
              }`}
              aria-label={`Go to slide ${index + 1}`}
              aria-pressed={index === current}
            />
          ))}
        </div>

        <div className="hidden gap-2 sm:flex">
          <button
            type="button"
            onClick={() => setCurrent((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/8 text-white backdrop-blur-xl transition-all duration-300 hover:bg-white/14"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setCurrent((prev) => (prev + 1) % HERO_SLIDES.length)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/8 text-white backdrop-blur-xl transition-all duration-300 hover:bg-white/14"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
});

const StatsBanner = memo(function StatsBanner() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:mt-12 sm:grid-cols-4 sm:gap-5">
      {STATS.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08, duration: 0.45 }}
          viewport={{ once: true }}
        >
          <TiltCard
            className="group rounded-[28px] border border-white/70 bg-white/86 shadow-premium backdrop-blur-xl"
            contentClassName="h-full p-4 sm:p-5"
            maxTilt={10}
          >
            <div className="absolute inset-0 rounded-[inherit]" style={{ background: `radial-gradient(circle at 18% 22%, ${item.glow} 0%, transparent 48%)` }} />
            <div className="depth-layer depth-16">
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-slate-900 text-white shadow-[0_24px_50px_-24px_rgba(15,23,42,0.8)]">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-[15px] font-black tracking-[-0.03em] text-slate-900 sm:text-[17px]">{item.label}</h3>
              <p className="mt-1 text-[12px] leading-5 text-slate-500 sm:text-[13px]">{item.sub}</p>
            </div>
          </TiltCard>
        </motion.div>
      ))}
    </div>
  );
});

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  linkLabel,
  linkTo = '/products',
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  linkLabel?: string;
  linkTo?: string;
}) {
  return (
    <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">{eyebrow}</p>
        <h2 className="font-display mt-3 text-[2rem] tracking-[-0.06em] text-slate-900 sm:text-[2.4rem]">{title}</h2>
        <p className="mt-2 max-w-2xl text-[14px] text-slate-500 sm:text-[15px]">{subtitle}</p>
      </div>
      {linkLabel ? (
        <Link
          to={linkTo}
          className="inline-flex items-center gap-2 rounded-full border border-slate-900/8 bg-white/70 px-4 py-2 text-[12px] font-black uppercase tracking-[0.18em] text-slate-800 shadow-premium backdrop-blur-xl transition-all duration-300 hover:translate-y-[-2px]"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

function CategorySection() {
  return (
    <section>
      <SectionHeading
        eyebrow="Navigation"
        title="Shop by Category"
        subtitle="Every category gets a tactile card treatment with depth, gradient light, and cleaner hierarchy."
        linkLabel="View all"
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {CATEGORIES.map((category, index) => {
          const theme = CATEGORY_THEMES[index % CATEGORY_THEMES.length];

          return (
            <motion.div
              key={category.slug}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.04, duration: 0.42 }}
              viewport={{ once: true }}
            >
              <TiltCard
                className="group h-full rounded-[28px] border border-white/70 bg-white/86 shadow-premium"
                contentClassName="h-full"
                maxTilt={14}
              >
                <div className={`absolute inset-0 rounded-[inherit] bg-gradient-to-br ${theme.surface}`} />
                <div className="absolute inset-0 rounded-[inherit]" style={{ background: `radial-gradient(circle at 22% 22%, ${theme.glow} 0%, transparent 58%)` }} />

                <Link to={`/products?category=${category.slug}`} className="flex h-full flex-col items-start p-4 sm:p-5">
                  <div className="depth-layer depth-24">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-[20px] bg-gradient-to-br ${theme.icon} text-[30px] text-white shadow-[0_22px_50px_-22px_rgba(15,23,42,0.55)]`}>
                      {category.icon}
                    </div>
                  </div>

                  <div className="depth-layer depth-16 mt-5">
                    <p className="text-[14px] font-black leading-5 tracking-[-0.03em] text-slate-900">{category.name}</p>
                    <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Explore collection</p>
                  </div>
                </Link>
              </TiltCard>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function BrandSection() {
  return (
    <section className="rounded-[32px] border border-white/70 bg-white/76 p-5 shadow-premium backdrop-blur-xl sm:rounded-[40px] sm:p-7">
      <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
        <TiltCard
          className="rounded-[32px] border border-slate-900/10 bg-slate-950 text-white shadow-[0_35px_100px_-46px_rgba(15,23,42,0.9)]"
          contentClassName="h-full p-6 sm:p-7"
          maxTilt={10}
        >
          <div className="absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_20%_18%,rgba(16,185,129,0.2),transparent_35%)]" />
          <div className="mesh-backdrop-dark absolute inset-0 rounded-[inherit] opacity-45" />
          <div className="relative z-10">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-300">Brand network</p>
            <h2 className="font-display mt-3 text-[2rem] tracking-[-0.06em] text-white sm:text-[2.5rem]">Trusted by fast-moving local brands.</h2>
            <p className="mt-3 max-w-md text-[14px] leading-7 text-white/62">
              The storefront now feels like a premium marketplace, but the business signal still stays obvious and measurable.
            </p>

            <div className="mt-7 grid grid-cols-3 gap-3">
              {[
                { label: 'Brands', value: '500+' },
                { label: 'Cities', value: '48' },
                { label: 'Fill rate', value: '96%' },
              ].map((item) => (
                <div key={item.label} className="rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur-xl">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">{item.label}</p>
                  <p className="font-display mt-2 text-[24px] tracking-[-0.05em] text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </TiltCard>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {TOP_BRANDS.map((brand, index) => (
            <motion.div
              key={brand}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.35 }}
              viewport={{ once: true }}
            >
              <TiltCard
                className="group rounded-[26px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(248,250,252,0.85)_100%)] shadow-premium"
                contentClassName="h-full p-4"
                maxTilt={12}
              >
                <div className="depth-layer depth-16 flex h-full min-h-[118px] flex-col justify-between rounded-[22px] border border-slate-100 bg-white/80 p-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Featured brand</span>
                  <p className="font-display text-[1.2rem] leading-5 tracking-[-0.05em] text-slate-900">{brand}</p>
                  <span className="text-[11px] font-bold text-slate-400">Verified supply partner</span>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AiSection() {
  return (
    <section className="relative overflow-hidden rounded-[34px] border border-slate-900/10 bg-slate-950 text-white shadow-[0_40px_120px_-55px_rgba(15,23,42,0.9)] sm:rounded-[40px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(139,92,246,0.22),transparent_32%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_74%,rgba(14,165,233,0.18),transparent_28%)]" />
      <div className="mesh-backdrop-dark absolute inset-0 opacity-45" />

      <div className="relative grid gap-5 p-5 sm:p-8 lg:grid-cols-[0.84fr_1.16fr]">
        <TiltCard
          className="floating-card rounded-[30px] border border-white/12 bg-white/8 backdrop-blur-xl"
          contentClassName="h-full p-6"
          maxTilt={10}
        >
          <div className="depth-layer depth-16">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-[0_20px_50px_-18px_rgba(168,85,247,0.7)]">
                <BrainCircuit className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-violet-200">AI system</p>
                <h2 className="font-display mt-2 text-[2rem] tracking-[-0.06em] text-white">A storefront with a thinking layer.</h2>
              </div>
            </div>

            <p className="mt-5 max-w-md text-[14px] leading-7 text-white/62">
              Voice discovery, multilingual descriptions, and behavior-aware recommendations now sit inside a surface that feels dimensional and alive.
            </p>

            <div className="mt-7 grid grid-cols-2 gap-3">
              {[
                { label: 'Voice intents', value: 'Real-time' },
                { label: 'Languages', value: '8+' },
                { label: 'Smart picks', value: 'Behavior-aware' },
                { label: 'Assist layer', value: 'Contextual' },
              ].map((item) => (
                <div key={item.label} className="rounded-[22px] border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">{item.label}</p>
                  <p className="mt-2 text-[14px] font-semibold text-white/86">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </TiltCard>

        <div className="grid gap-4 sm:grid-cols-3">
          {AI_FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.45 }}
              viewport={{ once: true }}
            >
              <TiltCard
                className="group h-full rounded-[28px] border border-white/10 bg-white/8 backdrop-blur-xl"
                contentClassName="h-full p-5"
                maxTilt={14}
              >
                <div className="absolute inset-0 rounded-[inherit]" style={{ background: `radial-gradient(circle at 20% 20%, ${feature.glow} 0%, transparent 55%)` }} />
                <div className="depth-layer depth-24">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-[18px] bg-gradient-to-br ${feature.gradient} shadow-[0_22px_52px_-20px_rgba(15,23,42,0.65)]`}>
                    <feature.icon className="h-5 w-5 text-white" />
                  </div>
                </div>

                <div className="depth-layer depth-16 mt-5 flex h-[calc(100%-4.25rem)] flex-col">
                  <h3 className="text-[18px] font-black tracking-[-0.04em] text-white">{feature.title}</h3>
                  <p className="mt-3 flex-1 text-[13px] leading-6 text-white/58">{feature.desc}</p>
                  <Link
                    to={feature.link}
                    className="mt-5 inline-flex items-center gap-2 text-[12px] font-black uppercase tracking-[0.18em] text-white/72 transition-colors hover:text-white"
                  >
                    {feature.linkLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Default route component rendering top promotions. */
export function HomePage() {
  const userRole = useStore((state) => state.user?.role);
  const recentlyViewed = useStore((state) => state.recentlyViewed);
  const isShop = userRole === 'shopowner';

  const recentProducts = useMemo(
    () => recentlyViewed.map((id) => PRODUCTS_MAP.get(id)).filter(Boolean) as typeof allProducts,
    [recentlyViewed]
  );

  return (
    <div className="space-y-14 pb-16 pt-4 sm:space-y-20 sm:pt-6">
      <section className="space-y-8">
        <HeroBanner />
        <StatsBanner />
      </section>

      <CategorySection />

      <section>
        <SectionHeading
          eyebrow="AI curated"
          title="Smart Deals for You"
          subtitle="Best sellers now sit inside a cleaner, deeper product grid so the storefront looks premium before the shopper even clicks."
          linkLabel="See all deals"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4 xl:grid-cols-5">
          {BEST_SELLERS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow="Merchandising"
          title="Featured Collections"
          subtitle="High-value products get the same motion-rich treatment, with layered cards and stronger focus on price, imagery, and action."
          linkLabel="Browse catalog"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4 xl:grid-cols-5">
          {FEATURED_PRODUCTS.slice(0, 10).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <BrandSection />

      <section>
        <SectionHeading
          eyebrow="Catalog"
          title="Explore Our Catalog"
          subtitle="A broader shelf view with stronger visual rhythm and consistent 3D product cards across the browsing flow."
          linkLabel="Explore 1000+"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4 xl:grid-cols-5">
          {allProducts.slice(0, 10).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {isShop && (
        <section className="relative overflow-hidden rounded-[32px] border border-primary/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.95)_0%,rgba(240,253,244,0.92)_48%,rgba(236,253,245,0.98)_100%)] p-5 shadow-premium sm:rounded-[38px] sm:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(16,185,129,0.18),transparent_35%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_78%,rgba(14,165,233,0.12),transparent_28%)]" />

          <div className="relative">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-[0_24px_60px_-26px_rgba(16,185,129,0.8)]">
                  <Zap className="h-3.5 w-3.5" />
                  Shop owner exclusive
                </div>
                <h2 className="font-display mt-4 text-[2rem] tracking-[-0.06em] text-slate-900 sm:text-[2.4rem]">Wholesale Deals with a premium control surface.</h2>
                <p className="mt-3 max-w-2xl text-[14px] text-slate-500">
                  Pricing, inventory, and quick ordering are now staged like a high-end business dashboard instead of a flat list.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
              {allProducts.slice(0, 5).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      <AiSection />

      {recentProducts.length > 0 && (
        <section>
          <SectionHeading
            eyebrow="History"
            title="Recently Viewed"
            subtitle="Shoppers can jump back into products through the same upgraded visual language without losing context."
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-6 lg:grid-cols-5">
            {recentProducts.slice(0, 5).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      <section className="relative overflow-hidden rounded-[34px] border border-slate-900/10 bg-slate-950 text-white shadow-[0_40px_120px_-55px_rgba(15,23,42,0.9)] sm:rounded-[40px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(16,185,129,0.25),transparent_30%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_80%,rgba(59,130,246,0.18),transparent_26%)]" />
        <div className="mesh-backdrop-dark absolute inset-0 opacity-45" />

        <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-300">Wholesale onboarding</p>
            <h2 className="font-display mt-4 text-[2.3rem] leading-[0.95] tracking-[-0.06em] text-white sm:text-[3rem]">
              Are you a shop owner?
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-white/62">
              Join the wholesale tier to unlock bulk pricing, dedicated support, richer inventory signals, and a storefront built to feel premium at every touchpoint.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/register?role=shopowner"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-[14px] font-black uppercase tracking-[0.16em] text-slate-900 transition-all duration-300 hover:translate-y-[-2px] hover:bg-emerald-50"
              >
                Register as shop owner
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/products"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/14 bg-white/8 px-6 py-3.5 text-[14px] font-bold uppercase tracking-[0.16em] text-white/82 backdrop-blur-xl transition-all duration-300 hover:bg-white/12"
              >
                Explore products
              </Link>
            </div>
          </div>

          <div className="depth-stage relative h-[280px] sm:h-[340px]">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6.4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute left-0 top-8 w-44 sm:w-52"
            >
              <TiltCard
                className="floating-card rounded-[28px] border border-white/12 bg-white/10 backdrop-blur-xl"
                contentClassName="p-4"
                maxTilt={14}
              >
                <div className="depth-layer depth-24">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">Bulk margins</p>
                  <p className="font-display mt-2 text-[28px] tracking-[-0.05em] text-white">18%+</p>
                  <p className="mt-2 text-[13px] text-white/58">on recurring restocks</p>
                </div>
              </TiltCard>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5.8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute bottom-0 right-0 w-48 sm:w-56"
            >
              <TiltCard
                className="floating-card rounded-[30px] border border-white/12 bg-white text-slate-900"
                contentClassName="p-5"
                maxTilt={14}
              >
                <div className="depth-layer depth-24">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Partner perks</p>
                  <div className="mt-4 space-y-3 text-[13px] text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>Exclusive pricing</span>
                      <span className="font-black text-slate-900">Live</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Priority support</span>
                      <span className="font-black text-slate-900">24/7</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Business insights</span>
                      <span className="font-black text-slate-900">Enabled</span>
                    </div>
                  </div>
                </div>
              </TiltCard>
            </motion.div>

            <TiltCard
              className="floating-card absolute inset-x-10 bottom-6 top-4 rounded-[34px] border border-white/12 bg-white/10 backdrop-blur-xl"
              contentClassName="h-full p-5"
              maxTilt={10}
            >
              <div className="absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_22%_18%,rgba(16,185,129,0.22),transparent_32%)]" />
              <div className="mesh-backdrop-dark absolute inset-0 rounded-[inherit] opacity-35" />

              <div className="depth-layer depth-24 flex h-full flex-col justify-between rounded-[28px] border border-white/12 bg-slate-950/36 p-5 text-white">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">Partner cockpit</span>
                  <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">
                    Live access
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[74, 58, 88].map((value, index) => (
                    <div key={value} className="rounded-[20px] border border-white/10 bg-white/8 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">Zone {index + 1}</p>
                      <div className="mt-3 h-20 rounded-[16px] bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_100%)] p-2">
                        <div
                          className="h-full rounded-[12px] bg-gradient-to-t from-emerald-400 to-cyan-300"
                          style={{ clipPath: `polygon(0 ${100 - value}%, 100% 0, 100% 100%, 0 100%)` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TiltCard>
          </div>
        </div>
      </section>
    </div>
  );
}
