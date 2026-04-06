import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Filter, Grid3X3, List, PackageCheck, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { BRANDS, CATEGORIES } from '../data';
import { useStore } from '../store';
import { getCategoryName, normalizeSearchText } from '../utils/search';
import { ProductCard } from './product-card';

interface FilterSidebarProps {
  activeFilters: number;
  clearFilters: () => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedBrands: string[];
  toggleBrand: (brand: string) => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  maxPrice: number;
  stockOnly: boolean;
  toggleStockOnly: () => void;
}

const FilterSidebar = memo(function FilterSidebar({
  activeFilters,
  clearFilters,
  selectedCategory,
  setSelectedCategory,
  selectedBrands,
  toggleBrand,
  priceRange,
  setPriceRange,
  maxPrice,
  stockOnly,
  toggleStockOnly,
}: FilterSidebarProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[16px]" style={{ fontWeight: 600 }}>Filters</h3>
        {activeFilters > 0 && (
          <button onClick={clearFilters} className="text-[13px] text-primary hover:underline">Clear All</button>
        )}
      </div>

      <div>
        <h4 className="mb-3 text-[14px]" style={{ fontWeight: 600 }}>Category</h4>
        <div className="space-y-1.5">
          <button
            onClick={() => setSelectedCategory('')}
            className={`block w-full rounded-lg px-3 py-1.5 text-left text-[14px] transition-colors ${!selectedCategory ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50'}`}
            style={{ fontWeight: !selectedCategory ? 500 : 400 }}
          >
            All Categories
          </button>
          {CATEGORIES.map((category) => (
            <button
              key={category.slug}
              onClick={() => setSelectedCategory(category.slug === selectedCategory ? '' : category.slug)}
              className={`block w-full rounded-lg px-3 py-1.5 text-left text-[14px] transition-colors ${category.slug === selectedCategory ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50'}`}
              style={{ fontWeight: category.slug === selectedCategory ? 500 : 400 }}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-[14px]" style={{ fontWeight: 600 }}>Brand</h4>
        <div className="max-h-48 space-y-1.5 overflow-y-auto">
          {BRANDS.map((brand) => (
            <label key={brand} className="flex cursor-pointer items-center gap-2 rounded px-3 py-1 text-[14px] hover:bg-gray-50" style={{ fontWeight: 400 }}>
              <input
                type="checkbox"
                checked={selectedBrands.includes(brand)}
                onChange={() => toggleBrand(brand)}
                className="rounded border-border accent-primary"
              />
              {brand}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-[14px]" style={{ fontWeight: 600 }}>Price Range</h4>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={priceRange[1]}
            value={priceRange[0]}
            onChange={(event) => setPriceRange([Number(event.target.value), priceRange[1]])}
            className="w-full rounded-lg border bg-input-background px-3 py-1.5 text-[14px]"
            placeholder="Min"
          />
          <span className="text-muted-foreground">-</span>
          <input
            type="number"
            min={priceRange[0]}
            max={maxPrice}
            value={priceRange[1]}
            onChange={(event) => setPriceRange([priceRange[0], Number(event.target.value)])}
            className="w-full rounded-lg border bg-input-background px-3 py-1.5 text-[14px]"
            placeholder="Max"
          />
        </div>
        <p className="mt-2 text-[12px] text-muted-foreground">Visible price range: Rs.0 to Rs.{maxPrice.toLocaleString('en-IN')}</p>
      </div>

      <div>
        <h4 className="mb-3 text-[14px]" style={{ fontWeight: 600 }}>Availability</h4>
        <button
          onClick={toggleStockOnly}
          className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${stockOnly ? 'border-primary bg-primary/10 text-primary' : 'border-border/70 hover:bg-gray-50'}`}
        >
          <span className="text-[14px]" style={{ fontWeight: 500 }}>In-stock only</span>
          <span className={`h-2.5 w-2.5 rounded-full ${stockOnly ? 'bg-primary' : 'bg-slate-300'}`} />
        </button>
      </div>
    </div>
  );
});

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const products = useStore((s) => s.products);
  const setSearchQuery = useStore((s) => s.setSearchQuery);
  const getPrice = useStore((s) => s.getPrice);
  const urlSearch = searchParams.get('search') || '';

  const maxPrice = useMemo(() => {
    const highest = products.reduce((max, product) => Math.max(max, getPrice(product)), 0);
    return Math.max(1000, highest);
  }, [getPrice, products]);

  const searchIndex = useMemo(() => {
    return products.map((product) => ({
      product,
      price: getPrice(product),
      haystack: normalizeSearchText([
        product.name,
        product.brand,
        product.category,
        getCategoryName(product.category),
        product.description,
        product.sku,
      ].join(' ')),
    }));
  }, [getPrice, products]);

  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRangeState] = useState<[number, number]>([0, maxPrice]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockOnly, setStockOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [gridView, setGridView] = useState(true);

  useEffect(() => {
    const nextCategory = searchParams.get('category') || '';
    const nextBrands = (searchParams.get('brands') || '').split(',').filter(Boolean);
    const nextSort = searchParams.get('sort') || 'featured';
    const nextMin = Number(searchParams.get('min') || 0);
    const maxParam = Number(searchParams.get('max') || maxPrice);
    const nextMax = Number.isFinite(maxParam) && maxParam > 0 ? maxParam : maxPrice;
    const nextStockOnly = searchParams.get('stock') === '1';
    const nextGridView = searchParams.get('view') !== 'list';

    if (useStore.getState().searchQuery !== urlSearch) {
      setSearchQuery(urlSearch);
    }
    setSelectedCategory((prev) => (prev === nextCategory ? prev : nextCategory));
    setSelectedBrands((prev) => (prev.join(',') === nextBrands.join(',') ? prev : nextBrands));
    setSortBy((prev) => (prev === nextSort ? prev : nextSort));
    setStockOnly((prev) => (prev === nextStockOnly ? prev : nextStockOnly));
    setGridView((prev) => (prev === nextGridView ? prev : nextGridView));
    setPriceRangeState((prev) => (
      prev[0] === nextMin && prev[1] === nextMax ? prev : [nextMin, Math.max(nextMin, Math.min(nextMax, maxPrice))]
    ));
  }, [maxPrice, searchParams, setSearchQuery, urlSearch]);

  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (urlSearch.trim()) nextParams.set('search', urlSearch.trim());
    if (selectedCategory) nextParams.set('category', selectedCategory);
    if (selectedBrands.length > 0) nextParams.set('brands', selectedBrands.join(','));
    if (priceRange[0] > 0) nextParams.set('min', String(priceRange[0]));
    if (priceRange[1] < maxPrice) nextParams.set('max', String(priceRange[1]));
    if (sortBy !== 'featured') nextParams.set('sort', sortBy);
    if (stockOnly) nextParams.set('stock', '1');
    if (!gridView) nextParams.set('view', 'list');

    const nextQuery = nextParams.toString();
    if (nextQuery !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [gridView, maxPrice, priceRange, searchParams, selectedBrands, selectedCategory, setSearchParams, sortBy, stockOnly, urlSearch]);

  const filtered = useMemo(() => {
    const normalizedQuery = normalizeSearchText(urlSearch);
    let result = [...searchIndex];

    if (normalizedQuery) {
      result = result.filter(({ haystack }) => haystack.includes(normalizedQuery));
    }

    if (selectedCategory) {
      result = result.filter(({ product }) => product.category === selectedCategory);
    }

    if (selectedBrands.length > 0) {
      result = result.filter(({ product }) => selectedBrands.includes(product.brand));
    }

    if (stockOnly) {
      result = result.filter(({ product }) => product.stock > 0);
    }

    result = result.filter(({ price }) => {
      return price >= priceRange[0] && price <= priceRange[1];
    });

    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.product.rating - a.product.rating);
        break;
      case 'popular':
        result.sort((a, b) => b.product.reviews - a.product.reviews);
        break;
      default:
        result.sort((a, b) => Number(b.product.featured) - Number(a.product.featured));
        break;
    }

    result.sort((a, b) => Number(b.product.stock > 0) - Number(a.product.stock > 0));
    return result.map((entry) => entry.product);
  }, [priceRange, searchIndex, selectedBrands, selectedCategory, sortBy, stockOnly, urlSearch]);

  const inStockCount = filtered.filter((product) => product.stock > 0).length;
  const featuredCount = filtered.filter((product) => product.featured).length;

  const toggleBrand = useCallback((brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((item) => item !== brand) : [...prev, brand]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedBrands([]);
    setPriceRangeState([0, maxPrice]);
    setSortBy('featured');
    setStockOnly(false);
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [maxPrice, setSearchParams, setSearchQuery]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('search');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams, setSearchQuery]);

  const handleSetPriceRange = useCallback((range: [number, number]) => {
    const nextMin = Number.isFinite(range[0]) ? Math.max(0, range[0]) : 0;
    const nextMaxRaw = Number.isFinite(range[1]) ? range[1] : maxPrice;
    const nextMax = Math.max(nextMin, Math.min(nextMaxRaw, maxPrice));
    setPriceRangeState([nextMin, nextMax]);
  }, [maxPrice]);

  const handleSetCategory = useCallback((category: string) => setSelectedCategory(category), []);
  const toggleStockOnly = useCallback(() => setStockOnly((prev) => !prev), []);

  const activeFilters =
    (urlSearch ? 1 : 0) +
    (selectedCategory ? 1 : 0) +
    selectedBrands.length +
    (priceRange[0] > 0 || priceRange[1] < maxPrice ? 1 : 0) +
    (stockOnly ? 1 : 0);

  return (
    <div className="py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[24px]" style={{ fontWeight: 700 }}>
            {selectedCategory
              ? CATEGORIES.find((category) => category.slug === selectedCategory)?.name || 'Products'
              : urlSearch
                ? `Results for "${urlSearch}"`
                : 'All Products'}
          </h1>
          <p className="text-[14px] text-muted-foreground">
            {filtered.length} products found • {inStockCount} ready to ship
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 rounded-xl border border-border/80 px-3 py-2 text-[14px] transition-colors hover:bg-gray-50 lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilters > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] text-white">
                {activeFilters}
              </span>
            )}
          </button>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="rounded-xl border border-border/80 bg-white px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="featured">Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
            <option value="popular">Most Popular</option>
          </select>
          <div className="hidden items-center overflow-hidden rounded-xl border border-border/80 sm:flex">
            <button onClick={() => setGridView(true)} className={`p-2 transition-colors ${gridView ? 'bg-primary text-white' : 'hover:bg-gray-50'}`}>
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button onClick={() => setGridView(false)} className={`p-2 transition-colors ${!gridView ? 'bg-primary text-white' : 'hover:bg-gray-50'}`}>
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/70 bg-white px-4 py-4 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Live catalog</p>
          <p className="mt-2 text-[22px] font-black text-slate-900">{products.length}</p>
          <p className="text-[13px] text-slate-500">Using active store inventory instead of static seed data.</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-white px-4 py-4 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Ready to ship</p>
          <p className="mt-2 text-[22px] font-black text-slate-900">{inStockCount}</p>
          <p className="text-[13px] text-slate-500">Enable stock-only mode to hide unavailable SKUs.</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-white px-4 py-4 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Featured picks</p>
          <p className="mt-2 text-[22px] font-black text-slate-900">{featuredCount}</p>
          <p className="text-[13px] text-slate-500">Search and filter state now stays in the URL for sharing.</p>
        </div>
      </div>

      {activeFilters > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {urlSearch && (
            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[13px] text-primary">
              <Sparkles className="h-3.5 w-3.5" /> {urlSearch}
              <button onClick={clearSearch}><X className="h-3.5 w-3.5" /></button>
            </span>
          )}
          {selectedCategory && (
            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[13px] text-primary">
              {CATEGORIES.find((category) => category.slug === selectedCategory)?.name}
              <button onClick={() => setSelectedCategory('')}><X className="h-3.5 w-3.5" /></button>
            </span>
          )}
          {selectedBrands.map((brand) => (
            <span key={brand} className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[13px] text-primary">
              {brand}
              <button onClick={() => toggleBrand(brand)}><X className="h-3.5 w-3.5" /></button>
            </span>
          ))}
          {(priceRange[0] > 0 || priceRange[1] < maxPrice) && (
            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[13px] text-primary">
              Rs.{priceRange[0]} - Rs.{priceRange[1]}
              <button onClick={() => handleSetPriceRange([0, maxPrice])}><X className="h-3.5 w-3.5" /></button>
            </span>
          )}
          {stockOnly && (
            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[13px] text-primary">
              In-stock only
              <button onClick={toggleStockOnly}><X className="h-3.5 w-3.5" /></button>
            </span>
          )}
        </div>
      )}

      <div className="flex gap-6">
        <div className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-40 rounded-2xl border border-border/80 bg-white p-5 shadow-sm">
            <FilterSidebar
              activeFilters={activeFilters}
              clearFilters={clearFilters}
              selectedCategory={selectedCategory}
              setSelectedCategory={handleSetCategory}
              selectedBrands={selectedBrands}
              toggleBrand={toggleBrand}
              priceRange={priceRange}
              setPriceRange={handleSetPriceRange}
              maxPrice={maxPrice}
              stockOnly={stockOnly}
              toggleStockOnly={toggleStockOnly}
            />
          </div>
        </div>

        {showFilters && (
          <>
            <div className="fixed inset-0 z-50 bg-black/40 lg:hidden" onClick={() => setShowFilters(false)} />
            <div className="fixed left-0 top-0 bottom-0 z-50 w-80 overflow-y-auto bg-white p-6 shadow-2xl lg:hidden">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[18px]" style={{ fontWeight: 600 }}>Filters</h3>
                <button onClick={() => setShowFilters(false)}><X className="h-5 w-5" /></button>
              </div>
              <FilterSidebar
                activeFilters={activeFilters}
                clearFilters={clearFilters}
                selectedCategory={selectedCategory}
                setSelectedCategory={handleSetCategory}
                selectedBrands={selectedBrands}
                toggleBrand={toggleBrand}
                priceRange={priceRange}
                setPriceRange={handleSetPriceRange}
                maxPrice={maxPrice}
                stockOnly={stockOnly}
                toggleStockOnly={toggleStockOnly}
              />
            </div>
          </>
        )}

        <div className="flex-1">
          {filtered.length === 0 ? (
            <div className="py-20 text-center">
              <Filter className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="text-[18px]" style={{ fontWeight: 600 }}>No products found</h3>
              <p className="mt-1 text-[14px] text-muted-foreground">Try adjusting your filters, stock mode, or search query.</p>
              <button
                onClick={clearFilters}
                className="mt-4 rounded-xl bg-primary px-6 py-2.5 text-[14px] text-white transition-all hover:shadow-md hover:shadow-primary/25"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className={gridView ? 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4' : 'grid grid-cols-1 gap-4'}>
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {filtered.length > 0 && !stockOnly && inStockCount < filtered.length && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-4">
              <PackageCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="text-[14px] font-black text-amber-700">Availability note</p>
                <p className="mt-1 text-[13px] text-amber-700/80">
                  {filtered.length - inStockCount} items in this result set are currently unavailable. Enable the in-stock filter to keep the list fulfillment-safe.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
