import { BRANDS, CATEGORIES } from '../data';
import type { Product } from '../store';

export type SearchTargetKind = 'product' | 'category' | 'brand';

export interface SearchTarget {
  label: string;
  kind: SearchTargetKind;
  normalized: string;
  url: string;
  value: string;
}

export function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getCategoryName(slug: string) {
  return CATEGORIES.find((category) => category.slug === slug)?.name ?? slug.replace(/-/g, ' ');
}

export function getSearchDestination(query: string, products: Product[]) {
  const trimmed = query.trim();
  const normalized = normalizeSearchText(trimmed);
  if (!normalized) return '/products';

  const exactProduct = products.find((product) => normalizeSearchText(product.name) === normalized);
  if (exactProduct) {
    return `/product/${exactProduct.id}`;
  }

  const exactCategory = CATEGORIES.find((category) => (
    normalizeSearchText(category.name) === normalized ||
    normalizeSearchText(category.slug) === normalized
  ));
  if (exactCategory) {
    return `/products?category=${encodeURIComponent(exactCategory.slug)}`;
  }

  const exactBrand = BRANDS.find((brand) => normalizeSearchText(brand) === normalized);
  if (exactBrand) {
    return `/products?brands=${encodeURIComponent(exactBrand)}`;
  }

  return `/products?search=${encodeURIComponent(trimmed)}`;
}

export function buildSearchTargets(products: Product[]): SearchTarget[] {
  const targets: SearchTarget[] = [];
  const seen = new Set<string>();

  for (const product of products) {
    const key = `product:${product.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    targets.push({
      label: product.name,
      kind: 'product',
      normalized: normalizeSearchText(`${product.name} ${product.brand} ${getCategoryName(product.category)}`),
      url: `/product/${product.id}`,
      value: product.name,
    });
  }

  for (const category of CATEGORIES) {
    const key = `category:${category.slug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    targets.push({
      label: category.name,
      kind: 'category',
      normalized: normalizeSearchText(`${category.name} ${category.slug}`),
      url: `/products?category=${encodeURIComponent(category.slug)}`,
      value: category.name,
    });
  }

  for (const brand of BRANDS) {
    const key = `brand:${brand}`;
    if (seen.has(key)) continue;
    seen.add(key);
    targets.push({
      label: brand,
      kind: 'brand',
      normalized: normalizeSearchText(brand),
      url: `/products?brands=${encodeURIComponent(brand)}`,
      value: brand,
    });
  }

  return targets;
}

// Code styling update 4

// Client-side search and filtering logic
