import { useState, useMemo, memo, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { Filter, Grid3X3, List, SlidersHorizontal, X } from 'lucide-react';
import { products, CATEGORIES, BRANDS } from '../data';
import { useStore } from '../store';
import { ProductCard } from './product-card';

// ─── Extracted & memoized FilterSidebar ───
interface FilterSidebarProps {
  activeFilters: number;
  clearFilters: () => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedBrands: string[];
  toggleBrand: (brand: string) => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
}

const FilterSidebar = memo(function FilterSidebar({
  activeFilters, clearFilters, selectedCategory, setSelectedCategory,
  selectedBrands, toggleBrand, priceRange, setPriceRange,
}: FilterSidebarProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[16px]" style={{ fontWeight: 600 }}>Filters</h3>
        {activeFilters > 0 && (
          <button onClick={clearFilters} className="text-primary text-[13px] hover:underline">Clear All</button>
        )}
      </div>

      {/* Categories */}
      <div>
        <h4 className="text-[14px] mb-3" style={{ fontWeight: 600 }}>Category</h4>
        <div className="space-y-1.5">
          <button
            onClick={() => setSelectedCategory('')}
            className={`block w-full text-left px-3 py-1.5 rounded-lg text-[14px] transition-colors ${!selectedCategory ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50'}`}
            style={{ fontWeight: !selectedCategory ? 500 : 400 }}
          >
            All Categories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setSelectedCategory(cat.slug === selectedCategory ? '' : cat.slug)}
              className={`block w-full text-left px-3 py-1.5 rounded-lg text-[14px] transition-colors ${cat.slug === selectedCategory ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50'}`}
              style={{ fontWeight: cat.slug === selectedCategory ? 500 : 400 }}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div>
        <h4 className="text-[14px] mb-3" style={{ fontWeight: 600 }}>Brand</h4>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {BRANDS.map((brand) => (
            <label key={brand} className="flex items-center gap-2 px-3 py-1 cursor-pointer hover:bg-gray-50 rounded text-[14px]" style={{ fontWeight: 400 }}>
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

      {/* Price Range */}
      <div>
        <h4 className="text-[14px] mb-3" style={{ fontWeight: 600 }}>Price Range</h4>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={priceRange[0]}
            onChange={(e) => setPriceRange([+e.target.value, priceRange[1]])}
            className="w-full px-3 py-1.5 border rounded-lg text-[14px] bg-input-background"
            placeholder="Min"
          />
          <span className="text-muted-foreground">-</span>
          <input
            type="number"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], +e.target.value])}
            className="w-full px-3 py-1.5 border rounded-lg text-[14px] bg-input-background"
            placeholder="Max"
          />
        </div>
      </div>
    </div>
  );
});

export function ProductsPage() {
  const [searchParams] = useSearchParams();
  const searchQuery = useStore((s) => s.searchQuery);
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [gridView, setGridView] = useState(true);

  const filtered = useMemo(() => {
    let result = [...products];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    if (selectedCategory) {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (selectedBrands.length > 0) {
      result = result.filter((p) => selectedBrands.includes(p.brand));
    }

    result = result.filter((p) => p.mrp >= priceRange[0] && p.mrp <= priceRange[1]);

    switch (sortBy) {
      case 'price-low': result.sort((a, b) => a.mrp - b.mrp); break;
      case 'price-high': result.sort((a, b) => b.mrp - a.mrp); break;
      case 'rating': result.sort((a, b) => b.rating - a.rating); break;
      case 'popular': result.sort((a, b) => b.reviews - a.reviews); break;
      default: result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    // Always show available products first, unavailable last
    result.sort((a, b) => {
      const aAvail = a.stock > 0 ? 1 : 0;
      const bAvail = b.stock > 0 ? 1 : 0;
      return bAvail - aAvail;
    });

    return result;
  }, [searchQuery, selectedCategory, selectedBrands, priceRange, sortBy]);

  const toggleBrand = useCallback((brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedCategory('');
    setSelectedBrands([]);
    setPriceRange([0, 1000]);
    setSortBy('featured');
  }, []);

  const handleSetPriceRange = useCallback((range: [number, number]) => setPriceRange(range), []);
  const handleSetCategory = useCallback((cat: string) => setSelectedCategory(cat), []);

  const activeFilters = (selectedCategory ? 1 : 0) + selectedBrands.length + (priceRange[0] > 0 || priceRange[1] < 1000 ? 1 : 0);

  // Removed duplicate inner FilterSidebar — uses the extracted memoized version above

  return (
    <div className="py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-[24px]" style={{ fontWeight: 700 }}>
            {selectedCategory ? CATEGORIES.find(c => c.slug === selectedCategory)?.name || 'Products' : searchQuery ? `Results for "${searchQuery}"` : 'All Products'}
          </h1>
          <p className="text-muted-foreground text-[14px]">{filtered.length} products found</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(!showFilters)} className="lg:hidden flex items-center gap-1.5 px-3 py-2 border border-border/80 rounded-xl text-[14px] hover:bg-gray-50 transition-colors">
            <SlidersHorizontal className="w-4 h-4" />
            Filters {activeFilters > 0 && <span className="bg-primary text-white text-[11px] w-5 h-5 rounded-full flex items-center justify-center">{activeFilters}</span>}
          </button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-border/80 rounded-xl text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="featured">Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
            <option value="popular">Most Popular</option>
          </select>
          <div className="hidden sm:flex items-center border border-border/80 rounded-xl overflow-hidden">
            <button onClick={() => setGridView(true)} className={`p-2 transition-colors ${gridView ? 'bg-primary text-white' : 'hover:bg-gray-50'}`}><Grid3X3 className="w-4 h-4" /></button>
            <button onClick={() => setGridView(false)} className={`p-2 transition-colors ${!gridView ? 'bg-primary text-white' : 'hover:bg-gray-50'}`}><List className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilters > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedCategory && (
            <span className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-[13px]">
              {CATEGORIES.find(c => c.slug === selectedCategory)?.name}
              <button onClick={() => setSelectedCategory('')}><X className="w-3.5 h-3.5" /></button>
            </span>
          )}
          {selectedBrands.map(b => (
            <span key={b} className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-[13px]">
              {b}
              <button onClick={() => toggleBrand(b)}><X className="w-3.5 h-3.5" /></button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <div className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-40 bg-white border border-border/80 rounded-2xl p-5 shadow-sm">
            <FilterSidebar
              activeFilters={activeFilters}
              clearFilters={clearFilters}
              selectedCategory={selectedCategory}
              setSelectedCategory={handleSetCategory}
              selectedBrands={selectedBrands}
              toggleBrand={toggleBrand}
              priceRange={priceRange}
              setPriceRange={handleSetPriceRange}
            />
          </div>
        </div>

        {/* Mobile filter overlay */}
        {showFilters && (
          <>
            <div className="fixed inset-0 bg-black/40 z-50 lg:hidden" onClick={() => setShowFilters(false)} />
            <div className="fixed left-0 top-0 bottom-0 w-80 bg-white z-50 p-6 overflow-y-auto lg:hidden shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[18px]" style={{ fontWeight: 600 }}>Filters</h3>
                <button onClick={() => setShowFilters(false)}><X className="w-5 h-5" /></button>
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
              />
            </div>
          </>
        )}

        {/* Products grid */}
        <div className="flex-1">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <Filter className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-[18px]" style={{ fontWeight: 600 }}>No products found</h3>
              <p className="text-muted-foreground mt-1 text-[14px]">Try adjusting your filters or search query</p>
              <button onClick={clearFilters} className="mt-4 px-6 py-2.5 bg-primary text-white rounded-xl text-[14px] hover:shadow-md hover:shadow-primary/25 transition-all">Clear Filters</button>
            </div>
          ) : (
            <div className={gridView ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-3'}>
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
