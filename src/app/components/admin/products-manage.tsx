import { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, Search, Download, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { products } from '../../data';
import { toast } from 'sonner';

export function AdminProducts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  const categories = [...new Set(products.map((p) => p.category))];

  const filtered = useMemo(() => products
    .filter((p) => categoryFilter === 'all' || p.category === categoryFilter)
    .filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    ), [searchQuery, categoryFilter]);

  const totals = useMemo(() => {
    let totalAdminProfit = 0, totalShopProfit = 0, totalCustProfit = 0;
    filtered.forEach((p) => {
      totalAdminProfit += (p.shopPrice - p.purchasePrice) + (p.customerPrice - p.purchasePrice);
      totalShopProfit += p.mrp - p.shopPrice;
      totalCustProfit += p.mrp - p.customerPrice;
    });
    return { totalAdminProfit, totalShopProfit, totalCustProfit };
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <p className="text-[13px] sm:text-[14px] text-muted-foreground">{products.length} total products</p>
        </div>
        <button className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-primary text-white rounded-lg text-[13px] sm:text-[14px]" style={{ fontWeight: 600 }} onClick={() => toast.success('Product form would open')}>
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Profit Summary Cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white border rounded-xl p-3 sm:p-4">
          <p className="text-[11px] sm:text-[13px] text-muted-foreground">Total Admin Profit</p>
          <p className="text-[18px] sm:text-[22px] text-primary" style={{ fontWeight: 700 }}>Rs.{totals.totalAdminProfit.toLocaleString()}</p>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground">per unit across all</p>
        </div>
        <div className="bg-white border rounded-xl p-3 sm:p-4">
          <p className="text-[11px] sm:text-[13px] text-muted-foreground">Total Shop Profit</p>
          <p className="text-[18px] sm:text-[22px] text-blue-600" style={{ fontWeight: 700 }}>Rs.{totals.totalShopProfit.toLocaleString()}</p>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground">MRP − Shop Price</p>
        </div>
        <div className="bg-white border rounded-xl p-3 sm:p-4">
          <p className="text-[11px] sm:text-[13px] text-muted-foreground">Total Customer Savings</p>
          <p className="text-[18px] sm:text-[22px] text-amber-600" style={{ fontWeight: 700 }}>Rs.{totals.totalCustProfit.toLocaleString()}</p>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground">MRP − Cust Price</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center bg-white border rounded-lg px-3 py-2 flex-1 sm:max-w-sm">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Search by name, brand, SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-2 bg-transparent outline-none text-[13px]"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-[13px] bg-white outline-none capitalize"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c.replace('-', ' ')}</option>
          ))}
        </select>
        <button className="flex items-center gap-1.5 px-3 py-2 border rounded-lg text-[13px] hover:bg-gray-50" onClick={() => toast.success('Exported!')}>
          <Download className="w-3.5 h-3.5" /> Export
        </button>
      </div>

      {/* Desktop Table */}
      <div className="bg-white border rounded-xl overflow-hidden hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-gray-50 text-[12px] text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-3">Product</th>
                <th className="text-left px-3 py-3">SKU</th>
                <th className="text-right px-3 py-3">MRP</th>
                <th className="text-right px-3 py-3">Purchase (P)</th>
                <th className="text-right px-3 py-3">Shop Price</th>
                <th className="text-right px-3 py-3">Cust Price</th>
                <th className="text-right px-3 py-3 text-primary">Admin Profit</th>
                <th className="text-right px-3 py-3 text-blue-600">Shop Profit</th>
                <th className="text-right px-3 py-3 text-amber-600">Cust Savings</th>
                <th className="text-center px-3 py-3">Stock</th>
                <th className="text-center px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const adminProfit = (p.shopPrice - p.purchasePrice) + (p.customerPrice - p.purchasePrice);
                const shopProfit = p.mrp - p.shopPrice;
                const custSavings = p.mrp - p.customerPrice;
                return (
                  <tr key={p.id} className="border-t hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <img src={p.image} alt="" className="w-9 h-9 rounded-lg object-cover" loading="lazy" />
                        <div className="min-w-0">
                          <p className="truncate max-w-[160px] text-[13px]" style={{ fontWeight: 500 }}>{p.name}</p>
                          <p className="text-[11px] text-muted-foreground">{p.brand} · <span className="capitalize">{p.category.replace('-', ' ')}</span></p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground text-[12px]">{p.sku}</td>
                    <td className="px-3 py-3 text-right" style={{ fontWeight: 600 }}>Rs.{p.mrp}</td>
                    <td className="px-3 py-3 text-right text-muted-foreground" style={{ fontWeight: 500 }}>Rs.{p.purchasePrice}</td>
                    <td className="px-3 py-3 text-right text-blue-600" style={{ fontWeight: 500 }}>Rs.{p.shopPrice}</td>
                    <td className="px-3 py-3 text-right text-amber-600" style={{ fontWeight: 500 }}>Rs.{p.customerPrice}</td>
                    <td className="px-3 py-3 text-right">
                      <span className="text-[12px] text-primary bg-primary/10 px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>Rs.{adminProfit}</span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="text-[12px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>Rs.{shopProfit}</span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="text-[12px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>Rs.{custSavings}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                        p.stock > 100 ? 'bg-primary/10 text-primary'
                        : p.stock > 0 ? 'bg-amber-50 text-amber-600'
                        : 'bg-red-50 text-red-600'
                      }`} style={{ fontWeight: 500 }}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1 justify-center">
                        <button className="p-1.5 hover:bg-gray-100 rounded" onClick={() => toast.success('View product')}><Eye className="w-3.5 h-3.5 text-gray-500" /></button>
                        <button className="p-1.5 hover:bg-gray-100 rounded" onClick={() => toast.success('Edit product')}><Edit className="w-3.5 h-3.5 text-gray-500" /></button>
                        <button className="p-1.5 hover:bg-gray-100 rounded" onClick={() => toast.error('Product deleted')}><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={11} className="text-center py-10 text-muted-foreground text-[14px]">No products match your search</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t text-[13px] text-muted-foreground flex items-center justify-between">
          <span>Showing {filtered.length} of {products.length} products</span>
        </div>
      </div>

      {/* Mobile/Tablet Cards */}
      <div className="lg:hidden space-y-3">
        {filtered.length === 0 && <p className="text-center py-10 text-muted-foreground text-[14px]">No products match your search</p>}
        {filtered.map((p) => {
          const adminProfit = (p.shopPrice - p.purchasePrice) + (p.customerPrice - p.purchasePrice);
          const shopProfit = p.mrp - p.shopPrice;
          const custSavings = p.mrp - p.customerPrice;
          const isExpanded = expandedProduct === p.id;

          return (
            <div key={p.id} className="bg-white border rounded-xl overflow-hidden">
              <button className="w-full p-3 flex items-center gap-3" onClick={() => setExpandedProduct(isExpanded ? null : p.id)}>
                <img src={p.image} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" loading="lazy" />
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[13px] truncate" style={{ fontWeight: 500 }}>{p.name}</p>
                  <p className="text-[11px] text-muted-foreground">{p.brand} · {p.sku}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[14px]" style={{ fontWeight: 700 }}>Rs.{p.mrp}</p>
                  <span className={`text-[11px] ${p.stock > 0 ? 'text-primary' : 'text-red-500'}`}>{p.stock > 0 ? `${p.stock} units` : 'Out of stock'}</span>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
              </button>

              {isExpanded && (
                <div className="border-t px-3 pb-3 pt-2 space-y-3">
                  {/* 4 Price Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <p className="text-[10px] text-muted-foreground">MRP</p>
                      <p className="text-[15px]" style={{ fontWeight: 700 }}>Rs.{p.mrp}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <p className="text-[10px] text-muted-foreground">Purchase Price (P)</p>
                      <p className="text-[15px] text-gray-600" style={{ fontWeight: 700 }}>Rs.{p.purchasePrice}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-2.5">
                      <p className="text-[10px] text-blue-600">Shop Price</p>
                      <p className="text-[15px] text-blue-600" style={{ fontWeight: 700 }}>Rs.{p.shopPrice}</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-2.5">
                      <p className="text-[10px] text-amber-600">Customer Price</p>
                      <p className="text-[15px] text-amber-600" style={{ fontWeight: 700 }}>Rs.{p.customerPrice}</p>
                    </div>
                  </div>

                  {/* 3 Profit Row */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-primary/5 rounded-lg p-2.5 text-center">
                      <p className="text-[10px] text-primary">Admin Profit</p>
                      <p className="text-[14px] text-primary" style={{ fontWeight: 700 }}>Rs.{adminProfit}</p>
                      <p className="text-[9px] text-muted-foreground">(Shop-P)+(Cust-P)</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-2.5 text-center">
                      <p className="text-[10px] text-blue-600">Shop Profit</p>
                      <p className="text-[14px] text-blue-600" style={{ fontWeight: 700 }}>Rs.{shopProfit}</p>
                      <p className="text-[9px] text-muted-foreground">MRP−Shop</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-2.5 text-center">
                      <p className="text-[10px] text-amber-600">Cust Savings</p>
                      <p className="text-[14px] text-amber-600" style={{ fontWeight: 700 }}>Rs.{custSavings}</p>
                      <p className="text-[9px] text-muted-foreground">MRP−Cust</p>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-[12px] text-muted-foreground pt-1">
                    <span className="capitalize">{p.category.replace('-', ' ')}</span>
                    <span>{p.rating} ★ ({p.reviews})</span>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 py-2 border rounded-lg text-[13px] flex items-center justify-center gap-1 hover:bg-gray-50" onClick={() => toast.success('Edit product')}><Edit className="w-3.5 h-3.5" /> Edit</button>
                    <button className="flex-1 py-2 border border-red-200 text-red-500 rounded-lg text-[13px] flex items-center justify-center gap-1 hover:bg-red-50" onClick={() => toast.error('Product deleted')}><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div className="text-[13px] text-muted-foreground text-center py-2">
          Showing {filtered.length} of {products.length} products
        </div>
      </div>
    </div>
  );
}
