import { useState, useMemo, useEffect, FormEvent } from 'react';
import { Plus, Edit, Trash2, Search, Download, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { useStore, type Product } from '../../store';
import { toast } from 'sonner';

export function AdminProducts() {
  const products = useStore((s) => s.products);
  const loadProducts = useStore((s) => s.loadProducts);
  const addProduct = useStore((s) => s.addProduct);
  const editProduct = useStore((s) => s.editProduct);
  const deleteProductById = useStore((s) => s.deleteProductById);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    brand: '',
    category: '',
    mrp: 0,
    purchasePrice: 0,
    shopPrice: 0,
    customerPrice: 0,
    minWholesaleQty: 1,
    stock: 0,
    sku: '',
    unitType: 'Piece',
    featured: false,
    rating: 0,
    reviews: 0,
    image: 'https://via.placeholder.com/400x400.png?text=Product',
  });

  useEffect(() => {
    loadProducts().catch(() => {
      // ignore — seed products are already in state
    });
  }, [loadProducts]);

  const categories = [...new Set(products.map((p) => p.category))];

  const filtered = useMemo(
    () =>
      products
        .filter((p) => categoryFilter === 'all' || p.category === categoryFilter)
        .filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchQuery.toLowerCase())
        ),
    [products, searchQuery, categoryFilter]
  );

  const handleEditProduct = (product: Product) => {
    console.log('Editing product:', product);
    setEditingProduct(product);
    setShowForm(true);
    setNewProduct({
      name: product.name,
      brand: product.brand,
      category: product.category,
      mrp: product.mrp,
      purchasePrice: product.purchasePrice,
      shopPrice: product.shopPrice,
      customerPrice: product.customerPrice,
      minWholesaleQty: product.minWholesaleQty,
      stock: product.stock,
      sku: product.sku,
      unitType: product.unitType,
      featured: product.featured,
      rating: product.rating,
      reviews: product.reviews,
      image: product.image,
      description: product.description,
    });
    console.log('Form should be visible now, showForm:', true);
  };

  const handleSaveProduct = async (e: FormEvent) => {
    e.preventDefault();
    console.log('Saving product, editingProduct:', editingProduct, 'newProduct:', newProduct);
    if (!newProduct.name || !newProduct.brand || !newProduct.category) {
      toast.error('Name, brand and category are required');
      return;
    }
    setSaving(true);
    try {
      if (editingProduct) {
        // Update existing product
        console.log('Updating existing product with ID:', editingProduct.id);
        await editProduct(editingProduct.id, newProduct);
        toast.success('Product updated');
      } else {
        // Add new product
        const id = `PROD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const product: Product = {
          id,
          name: newProduct.name!,
          brand: newProduct.brand!,
          category: newProduct.category!,
          mrp: Number(newProduct.mrp || 0),
          purchasePrice: Number(newProduct.purchasePrice || 0),
          shopPrice: Number(newProduct.shopPrice || 0),
          customerPrice: Number(newProduct.customerPrice || 0),
          minWholesaleQty: Number(newProduct.minWholesaleQty || 1),
          stock: Number(newProduct.stock || 0),
          sku: newProduct.sku || id,
          unitType: newProduct.unitType || 'Piece',
          featured: !!newProduct.featured,
          rating: newProduct.rating || 0,
          reviews: newProduct.reviews || 0,
          image: newProduct.image || 'https://via.placeholder.com/400x400.png?text=Product',
          description: (newProduct as any).description || '',
        };
        await addProduct(product);
        toast.success('Product added');
      }
      setShowForm(false);
      setEditingProduct(null);
      setNewProduct({
        name: '',
        brand: '',
        category: '',
        mrp: 0,
        purchasePrice: 0,
        shopPrice: 0,
        customerPrice: 0,
        minWholesaleQty: 1,
        stock: 0,
        sku: '',
        unitType: 'Piece',
        featured: false,
        rating: 0,
        reviews: 0,
        image: 'https://via.placeholder.com/400x400.png?text=Product',
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setShowForm(false);
    setEditingProduct(null);
    setNewProduct({
      name: '',
      brand: '',
      category: '',
      mrp: 0,
      purchasePrice: 0,
      shopPrice: 0,
      customerPrice: 0,
      minWholesaleQty: 1,
      stock: 0,
      sku: '',
      unitType: 'Piece',
      featured: false,
      rating: 0,
      reviews: 0,
      image: 'https://via.placeholder.com/400x400.png?text=Product',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <p className="text-[13px] sm:text-[14px] text-muted-foreground">{products.length} total products</p>
        </div>
        <button
          className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-primary text-white rounded-lg text-[13px] sm:text-[14px]"
          style={{ fontWeight: 600 }}
          onClick={() => setShowForm(true)}
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {showForm && (
        <div className="bg-white border rounded-xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] sm:text-[16px]" style={{ fontWeight: 600 }}>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            <button
              type="button"
              className="text-[13px] text-muted-foreground hover:underline"
              onClick={handleCancelEdit}
            >
              Cancel
            </button>
          </div>
          <form
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            onSubmit={handleSaveProduct}
          >
            <div className="space-y-1">
              <label className="text-[12px] text-muted-foreground">Name</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-[13px]"
                value={newProduct.name || ''}
                onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] text-muted-foreground">Brand</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-[13px]"
                value={newProduct.brand || ''}
                onChange={(e) => setNewProduct((p) => ({ ...p, brand: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] text-muted-foreground">Category</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-[13px]"
                value={newProduct.category || ''}
                onChange={(e) => setNewProduct((p) => ({ ...p, category: e.target.value }))}
                placeholder="e.g. biscuits, beverages"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] text-muted-foreground">SKU</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-[13px]"
                value={newProduct.sku || ''}
                onChange={(e) => setNewProduct((p) => ({ ...p, sku: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] text-muted-foreground">MRP</label>
              <input
                type="number"
                min={0}
                className="w-full border rounded-lg px-3 py-2 text-[13px]"
                value={newProduct.mrp ?? 0}
                onChange={(e) => setNewProduct((p) => ({ ...p, mrp: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] text-muted-foreground">Purchase Price</label>
              <input
                type="number"
                min={0}
                className="w-full border rounded-lg px-3 py-2 text-[13px]"
                value={newProduct.purchasePrice ?? 0}
                onChange={(e) => setNewProduct((p) => ({ ...p, purchasePrice: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] text-muted-foreground">Shop Price (B2B)</label>
              <input
                type="number"
                min={0}
                className="w-full border rounded-lg px-3 py-2 text-[13px]"
                value={newProduct.shopPrice ?? 0}
                onChange={(e) => setNewProduct((p) => ({ ...p, shopPrice: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] text-muted-foreground">Customer Price (B2C)</label>
              <input
                type="number"
                min={0}
                className="w-full border rounded-lg px-3 py-2 text-[13px]"
                value={newProduct.customerPrice ?? 0}
                onChange={(e) => setNewProduct((p) => ({ ...p, customerPrice: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] text-muted-foreground">Stock</label>
              <input
                type="number"
                min={0}
                className="w-full border rounded-lg px-3 py-2 text-[13px]"
                value={newProduct.stock ?? 0}
                onChange={(e) => setNewProduct((p) => ({ ...p, stock: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] text-muted-foreground">Min Wholesale Qty</label>
              <input
                type="number"
                min={1}
                className="w-full border rounded-lg px-3 py-2 text-[13px]"
                value={newProduct.minWholesaleQty ?? 1}
                onChange={(e) => setNewProduct((p) => ({ ...p, minWholesaleQty: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[12px] text-muted-foreground">Image URL</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-[13px]"
                value={newProduct.image || ''}
                onChange={(e) => setNewProduct((p) => ({ ...p, image: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
              <button
                type="button"
                className="px-4 py-2 border rounded-lg text-[13px]"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-primary text-white rounded-lg text-[13px]"
                style={{ fontWeight: 600, opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Saving…' : (editingProduct ? 'Update Product' : 'Save Product')}
              </button>
            </div>
          </form>
        </div>
      )}

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
                <th className="text-right px-3 py-3">MRP</th>
                <th className="text-right px-3 py-3">Purchase (P)</th>
                <th className="text-right px-3 py-3">Shop Price</th>
                <th className="text-right px-3 py-3">Cust Price</th>
                <th className="text-right px-3 py-3 text-primary">Admin Profit (Cust)</th>
                <th className="text-right px-3 py-3 text-primary">Admin Profit (Shop)</th>
                <th className="text-right px-3 py-3 text-blue-600">Shop Profit</th>
                <th className="text-right px-3 py-3 text-amber-600">Cust Savings</th>
                <th className="text-center px-3 py-3">Stock</th>
                <th className="text-center px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                return (
                  <tr key={p.id} className="border-t hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => handleEditProduct(p)}>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <img src={p.image} alt="" className="w-9 h-9 rounded-lg object-cover" loading="lazy" />
                        <div className="min-w-0">
                          <p className="truncate max-w-[160px] text-[13px]" style={{ fontWeight: 500 }}>{p.name}</p>
                          <p className="text-[11px] text-muted-foreground">{p.brand} · <span className="capitalize">{p.category.replace('-', ' ')}</span> · {p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right" style={{ fontWeight: 600 }}>Rs.{p.mrp}</td>
                    <td className="px-3 py-3 text-right text-muted-foreground" style={{ fontWeight: 500 }}>Rs.{p.purchasePrice}</td>
                    <td className="px-3 py-3 text-right text-blue-600" style={{ fontWeight: 500 }}>Rs.{p.shopPrice}</td>
                    <td className="px-3 py-3 text-right text-amber-600" style={{ fontWeight: 500 }}>Rs.{p.customerPrice}</td>
                    <td className="px-3 py-3 text-right">
                      <span className="text-[12px] text-primary bg-primary/10 px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>Rs.{p.customerPrice - p.purchasePrice}</span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="text-[12px] text-primary bg-primary/10 px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>Rs.{p.shopPrice - p.purchasePrice}</span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="text-[12px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>Rs.{p.mrp - p.shopPrice}</span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="text-[12px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>Rs.{p.mrp - p.customerPrice}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] ${p.stock > 100 ? 'bg-primary/10 text-primary'
                        : p.stock > 0 ? 'bg-amber-50 text-amber-600'
                          : 'bg-red-50 text-red-600'
                        }`} style={{ fontWeight: 500 }}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1 justify-center">
                        <button className="p-1.5 hover:bg-gray-100 rounded" onClick={() => toast.success('View product')}><Eye className="w-3.5 h-3.5 text-gray-500" /></button>
                        <button className="p-1.5 hover:bg-gray-100 rounded" onClick={() => handleEditProduct(p)}><Edit className="w-3.5 h-3.5 text-gray-500" /></button>
                        <button
                          className="p-1.5 hover:bg-gray-100 rounded"
                          onClick={async () => {
                            await deleteProductById(p.id);
                            toast.success('Product deleted');
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </button>
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
                    <button
                      className="flex-1 py-2 border rounded-lg text-[13px] flex items-center justify-center gap-1 hover:bg-gray-50"
                      onClick={() => handleEditProduct(p)}
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      className="flex-1 py-2 border border-red-200 text-red-500 rounded-lg text-[13px] flex items-center justify-center gap-1 hover:bg-red-50"
                      onClick={async () => {
                        await deleteProductById(p.id);
                        toast.success('Product deleted');
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
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
