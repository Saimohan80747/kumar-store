import type { Product } from './store';

export const CATEGORIES = [
  { name: 'Soaps & Detergents', icon: '🧼', slug: 'soaps-detergents' },
  { name: 'Tea & Coffee', icon: '☕', slug: 'tea-coffee' },
  { name: 'Oral Care', icon: '🪥', slug: 'oral-care' },
  { name: 'Personal Care', icon: '🧴', slug: 'personal-care' },
  { name: 'Grocery Essentials', icon: '🛒', slug: 'grocery-essentials' },
  { name: 'Snacks & Beverages', icon: '🍪', slug: 'snacks-beverages' },
  { name: 'Cleaning Supplies', icon: '🧹', slug: 'cleaning-supplies' },
  { name: 'Fresh & Organic', icon: '🥬', slug: 'fresh-organic' },
];

export const BRANDS = [
  'Surf Excel', 'Tide', 'Colgate', 'Dove', 'Tata Tea', 'Nescafe',
  'Lifebuoy', 'Dettol', 'Pepsodent', 'Pantene', 'Aashirvaad', 'Fortune',
  'Maggi', 'Parle', 'Britannia', 'Dabur', 'Himalaya', 'Patanjali',
];

const IMG = {
  soap: 'https://images.unsplash.com/photo-1771491458535-b23afd59ce79?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2FwJTIwZGV0ZXJnZW50JTIwcGVyc29uYWwlMjBjYXJlJTIwcHJvZHVjdHN8ZW58MXx8fHwxNzcyNTI2MTA5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  tea: 'https://images.unsplash.com/photo-1762708156343-26472227daeb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWElMjBjb2ZmZWUlMjBwb3dkZXIlMjBiZXZlcmFnZXN8ZW58MXx8fHwxNzcyNTI2MTA5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  oral: 'https://images.unsplash.com/photo-1759910548177-638d4e6ee0d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b290aHBhc3RlJTIwb3JhbCUyMGNhcmUlMjBoeWdpZW5lJTIwcHJvZHVjdHN8ZW58MXx8fHwxNzcyNTI2MTA5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  grocery: 'https://images.unsplash.com/photo-1583922146273-68f11083858e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncm9jZXJ5JTIwc3RvcmUlMjB3aG9sZXNhbGUlMjBwcm9kdWN0cyUyMGRpc3BsYXl8ZW58MXx8fHwxNzcyNTI2MTEwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  warehouse: 'https://images.unsplash.com/photo-1627915589334-14a3c3e3a741?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aG9sZXNhbGUlMjB3YXJlaG91c2UlMjBidWxrJTIwcHJvZHVjdHMlMjBzaGVsdmVzfGVufDF8fHx8MTc3MjUyNjExMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  fresh: 'https://images.unsplash.com/photo-1768734837714-49793b2829cc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMGZydWl0cyUyMHZlZ2V0YWJsZXMlMjBvcmdhbmljJTIwbWFya2V0fGVufDF8fHx8MTc3MjUyNjExMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  cleaning: 'https://images.unsplash.com/photo-1759846866217-e627e4478f82?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbGVhbmluZyUyMHN1cHBsaWVzJTIwaG91c2Vob2xkJTIwcHJvZHVjdHN8ZW58MXx8fHwxNzcyNTI2MTExfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  staples: 'https://images.unsplash.com/photo-1584269903637-e1b1c717a2b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncm9jZXJ5JTIwc3RhcGxlcyUyMHJpY2UlMjBmbG91ciUyMHN1Z2FyfGVufDF8fHx8MTc3MjUyNjExNHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  delivery: 'https://images.unsplash.com/photo-1612703769284-0103b1e5ef70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbmxpbmUlMjBzaG9wcGluZyUyMGRlbGl2ZXJ5JTIwZ3JvY2VyaWVzJTIwYmFubmVyfGVufDF8fHx8MTc3MjUyNjExNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  snacks: 'https://images.unsplash.com/photo-1741520149938-4f08654780ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbmFja3MlMjBjaGlwcyUyMHBhY2thZ2VkJTIwZm9vZHxlbnwxfHx8fDE3NzI1MjYxMTV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  shampoo: 'https://images.unsplash.com/photo-1689893265427-d7da200eff05?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYWlyJTIwc2hhbXBvbyUyMGJvZHklMjB3YXNoJTIwYm90dGxlc3xlbnwxfHx8fDE3NzI1MjYxMTZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
};

export const BANNER_IMAGES = [IMG.delivery, IMG.warehouse, IMG.grocery];

export const products: Product[] = [
  { id: 'p1', name: 'Surf Excel Matic Top Load', category: 'soaps-detergents', brand: 'Surf Excel', description: 'Superior stain removal for top load washing machines. Specially designed for tough stains.', image: IMG.soap, mrp: 399, purchasePrice: 245, shopPrice: 310, customerPrice: 363, minWholesaleQty: 12, stock: 500, sku: 'SE-TL-001', unitType: 'Piece', featured: true, rating: 4.5, reviews: 234 },
  { id: 'p2', name: 'Tata Gold Tea 500g', category: 'tea-coffee', brand: 'Tata Tea', description: 'Premium blend of Assam teas with a rich aroma and taste. Perfect for every occasion.', image: IMG.tea, mrp: 285, purchasePrice: 175, shopPrice: 220, customerPrice: 259, minWholesaleQty: 24, stock: 800, sku: 'TT-G-002', unitType: 'Piece', featured: true, rating: 4.7, reviews: 567 },
  { id: 'p3', name: 'Colgate MaxFresh 300g', category: 'oral-care', brand: 'Colgate', description: 'Cooling crystals for instant freshness. Fights germs and keeps breath fresh for hours.', image: IMG.oral, mrp: 199, purchasePrice: 122, shopPrice: 155, customerPrice: 181, minWholesaleQty: 36, stock: 1200, sku: 'CL-MF-003', unitType: 'Piece', featured: true, rating: 4.3, reviews: 892 },
  { id: 'p4', name: 'Dove Beauty Bar 100g (Pack of 4)', category: 'personal-care', brand: 'Dove', description: 'With 1/4 moisturizing cream. Leaves skin soft, smooth, and radiant.', image: IMG.shampoo, mrp: 249, purchasePrice: 155, shopPrice: 195, customerPrice: 227, minWholesaleQty: 24, stock: 650, sku: 'DV-BB-004', unitType: 'Box', featured: true, rating: 4.6, reviews: 1245 },
  { id: 'p5', name: 'Aashirvaad Atta 10kg', category: 'grocery-essentials', brand: 'Aashirvaad', description: 'Made from the finest quality MP wheat. Gives soft rotis every single time.', image: IMG.staples, mrp: 499, purchasePrice: 330, shopPrice: 410, customerPrice: 463, minWholesaleQty: 10, stock: 300, sku: 'AA-AT-005', unitType: 'Piece', featured: true, rating: 4.8, reviews: 2134 },
  { id: 'p6', name: 'Nescafe Classic 200g', category: 'tea-coffee', brand: 'Nescafe', description: 'Premium quality instant coffee. Rich aroma and smooth taste in every cup.', image: IMG.tea, mrp: 450, purchasePrice: 290, shopPrice: 365, customerPrice: 416, minWholesaleQty: 12, stock: 400, sku: 'NC-CL-006', unitType: 'Piece', featured: true, rating: 4.4, reviews: 678 },
  { id: 'p7', name: 'Tide Plus Double Power 2kg', category: 'soaps-detergents', brand: 'Tide', description: 'Double the cleaning power with lemon and mint. Perfect for everyday laundry.', image: IMG.cleaning, mrp: 350, purchasePrice: 218, shopPrice: 275, customerPrice: 320, minWholesaleQty: 12, stock: 550, sku: 'TD-DP-007', unitType: 'Piece', featured: false, rating: 4.2, reviews: 345 },
  { id: 'p8', name: 'Lifebuoy Total 10 Soap 125g', category: 'personal-care', brand: 'Lifebuoy', description: '99.9% germ protection. Trusted by families for generations of health.', image: IMG.soap, mrp: 45, purchasePrice: 26, shopPrice: 34, customerPrice: 41, minWholesaleQty: 72, stock: 2000, sku: 'LB-T10-008', unitType: 'Piece', featured: false, rating: 4.1, reviews: 567 },
  { id: 'p9', name: 'Dettol Antiseptic 500ml', category: 'personal-care', brand: 'Dettol', description: 'Trusted antiseptic liquid for cleaning wounds and maintaining hygiene.', image: IMG.cleaning, mrp: 260, purchasePrice: 162, shopPrice: 205, customerPrice: 238, minWholesaleQty: 24, stock: 350, sku: 'DT-AS-009', unitType: 'Piece', featured: false, rating: 4.5, reviews: 789 },
  { id: 'p10', name: 'Pepsodent Germicheck 200g', category: 'oral-care', brand: 'Pepsodent', description: 'Clinically proven to fight 99% of germs. Strong teeth for your family.', image: IMG.oral, mrp: 120, purchasePrice: 72, shopPrice: 92, customerPrice: 109, minWholesaleQty: 48, stock: 900, sku: 'PS-GC-010', unitType: 'Piece', featured: false, rating: 4.0, reviews: 234 },
  { id: 'p11', name: 'Pantene Advanced Hair Fall Solution 340ml', category: 'personal-care', brand: 'Pantene', description: 'Reduces hairfall in just 2 weeks. Pro-V formula for strong, healthy hair.', image: IMG.shampoo, mrp: 320, purchasePrice: 198, shopPrice: 250, customerPrice: 292, minWholesaleQty: 12, stock: 280, sku: 'PN-AH-011', unitType: 'Piece', featured: false, rating: 4.3, reviews: 456 },
  { id: 'p12', name: 'Fortune Soyabean Oil 5L', category: 'grocery-essentials', brand: 'Fortune', description: 'Light and healthy cooking oil. Rich in Omega-3 for a healthier heart.', image: IMG.grocery, mrp: 799, purchasePrice: 540, shopPrice: 680, customerPrice: 751, minWholesaleQty: 6, stock: 200, sku: 'FT-SO-012', unitType: 'Piece', featured: true, rating: 4.6, reviews: 1567 },
  { id: 'p13', name: 'Maggi 2-Minute Noodles (Pack of 12)', category: 'snacks-beverages', brand: 'Maggi', description: 'India\'s favorite instant noodles. Quick, tasty, and loved by all ages.', image: IMG.snacks, mrp: 168, purchasePrice: 102, shopPrice: 130, customerPrice: 153, minWholesaleQty: 24, stock: 1500, sku: 'MG-2M-013', unitType: 'Box', featured: true, rating: 4.7, reviews: 3456 },
  { id: 'p14', name: 'Parle-G Gold Biscuits 1kg', category: 'snacks-beverages', brand: 'Parle', description: 'Premium gold biscuits with extra milk and wheat. Perfect chai-time snack.', image: IMG.snacks, mrp: 120, purchasePrice: 68, shopPrice: 88, customerPrice: 107, minWholesaleQty: 36, stock: 0, sku: 'PG-GL-014', unitType: 'Piece', featured: false, rating: 4.5, reviews: 2345 },
  { id: 'p15', name: 'Britannia Good Day Butter 250g', category: 'snacks-beverages', brand: 'Britannia', description: 'Rich buttery biscuits that make every day a good day.', image: IMG.snacks, mrp: 55, purchasePrice: 32, shopPrice: 42, customerPrice: 50, minWholesaleQty: 48, stock: 2200, sku: 'BR-GD-015', unitType: 'Piece', featured: false, rating: 4.4, reviews: 1890 },
  { id: 'p16', name: 'Dabur Honey 500g', category: 'grocery-essentials', brand: 'Dabur', description: '100% pure honey. No added sugar. Trusted for purity since generations.', image: IMG.fresh, mrp: 265, purchasePrice: 168, shopPrice: 210, customerPrice: 243, minWholesaleQty: 24, stock: 450, sku: 'DB-HN-016', unitType: 'Piece', featured: false, rating: 4.6, reviews: 1234 },
  { id: 'p17', name: 'Himalaya Neem Face Wash 200ml', category: 'personal-care', brand: 'Himalaya', description: 'Purifying neem face wash for clear, problem-free skin.', image: IMG.shampoo, mrp: 210, purchasePrice: 130, shopPrice: 165, customerPrice: 192, minWholesaleQty: 18, stock: 0, sku: 'HM-NF-017', unitType: 'Piece', featured: false, rating: 4.3, reviews: 567 },
  { id: 'p18', name: 'Patanjali Cow Ghee 1L', category: 'grocery-essentials', brand: 'Patanjali', description: 'Pure desi cow ghee made from fresh cream. Rich taste and aroma.', image: IMG.staples, mrp: 550, purchasePrice: 365, shopPrice: 460, customerPrice: 514, minWholesaleQty: 12, stock: 180, sku: 'PT-CG-018', unitType: 'Piece', featured: true, rating: 4.4, reviews: 890 },
  { id: 'p19', name: 'Vim Dishwash Bar 500g', category: 'cleaning-supplies', brand: 'Vim', description: 'Powerful grease cutting formula. Makes dishes sparkling clean.', image: IMG.cleaning, mrp: 55, purchasePrice: 30, shopPrice: 40, customerPrice: 49, minWholesaleQty: 60, stock: 0, sku: 'VM-DB-019', unitType: 'Piece', featured: false, rating: 4.1, reviews: 456 },
  { id: 'p20', name: 'Harpic Power Plus 1L', category: 'cleaning-supplies', brand: 'Harpic', description: '10x better cleaning and germ kill. Thick formula clings to bowl surface.', image: IMG.cleaning, mrp: 189, purchasePrice: 115, shopPrice: 148, customerPrice: 173, minWholesaleQty: 24, stock: 600, sku: 'HP-PP-020', unitType: 'Piece', featured: false, rating: 4.2, reviews: 678 },
];

export const COUPONS = [
  { code: 'WELCOME10', discount: 10, type: 'percent' as const, minOrder: 500 },
  { code: 'SAVE50', discount: 50, type: 'flat' as const, minOrder: 1000 },
  { code: 'BULK20', discount: 20, type: 'percent' as const, minOrder: 5000 },
  { code: 'FIRST100', discount: 100, type: 'flat' as const, minOrder: 300 },
];

// ─── Precomputed indexes for O(1) lookups ───
export const PRODUCTS_MAP = new Map(products.map((p) => [p.id, p]));
export const PRODUCTS_BY_CATEGORY = products.reduce<Record<string, Product[]>>((acc, p) => {
  (acc[p.category] ??= []).push(p);
  return acc;
}, {});
export const FEATURED_PRODUCTS = products.filter((p) => p.featured);
export const BEST_SELLERS = products.filter((p) => p.reviews > 500).slice(0, 4);
