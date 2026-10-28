import React, { useEffect, useState } from 'react';
import { X, Search, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { Product, Category, Brand } from '../types';
import { ProductCard } from '../components/ProductCard';
import { apiFetch } from '../lib/staticApiFallback';

interface ShopPageProps {
  initialCategory?: string;
  initialSearch?: string;
  initialOnSale?: boolean;
  initialFeatured?: boolean;
  initialBestSeller?: boolean;
  onSelectProduct: (product: Product) => void;
}

export const ShopPage: React.FC<ShopPageProps> = ({
  initialCategory,
  initialSearch,
  initialOnSale,
  initialFeatured,
  initialBestSeller,
  onSelectProduct
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(initialSearch || '');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'all');
  const [selectedType, setSelectedType] = useState<'all' | 'variable' | 'simple'>('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedSize, setSelectedSize] = useState('all');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(initialOnSale || false);
  const [sortBy, setSortBy] = useState('newest');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const SIZES = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];

  useEffect(() => {
    Promise.all([
      apiFetch('/api/categories').then((r) => r.json()),
      apiFetch('/api/brands').then((r) => r.json())
    ]).then(([cats, brs]) => {
      if (Array.isArray(cats)) setCategories(cats);
      if (Array.isArray(brs)) setBrands(brs);
    });
  }, []);

  useEffect(() => {
    setSelectedCategory(initialCategory || 'all');
    setSearch(initialSearch || '');
    setOnSaleOnly(Boolean(initialOnSale));
  }, [initialCategory, initialSearch, initialOnSale]);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedBrand, selectedGender, selectedSize, inStockOnly, onSaleOnly, sortBy, search, initialFeatured, initialBestSeller]);

  const fetchProducts = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.append('search', search.trim());
    if (selectedCategory !== 'all') params.append('category', selectedCategory);
    if (selectedBrand !== 'all') params.append('brand', selectedBrand);
    if (selectedGender !== 'all') params.append('gender', selectedGender);
    if (selectedSize !== 'all') params.append('size', selectedSize);
    if (inStockOnly) params.append('inStock', 'true');
    if (onSaleOnly) params.append('onSale', 'true');
    if (initialFeatured) params.append('featured', 'true');
    if (initialBestSeller) params.append('bestSeller', 'true');
    params.append('sort', sortBy);
    params.append('limit', '50');

    try {
      const res = await apiFetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      if (data?.products) {
        setProducts(data.products);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const displayedProducts = products.filter((p) => {
    if (selectedType === 'all') return true;
    return p.productType === selectedType;
  });

  const clearAllFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSelectedType('all');
    setSelectedBrand('all');
    setSelectedGender('all');
    setSelectedSize('all');
    setInStockOnly(false);
    setOnSaleOnly(false);
    setSortBy('newest');
  };

  const hasActiveFilters =
    search ||
    selectedCategory !== 'all' ||
    selectedType !== 'all' ||
    selectedBrand !== 'all' ||
    selectedGender !== 'all' ||
    selectedSize !== 'all' ||
    inStockOnly ||
    onSaleOnly;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between pb-7 border-b border-[#e5e2da] gap-4">
        <div>
          <p className="text-xs font-medium text-zinc-500">
            Dhaka Atelier Archive <span aria-hidden="true">·</span> Ready-to-Wear
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#111113] font-display tracking-tight mt-1">
            All Footwear
          </h1>
          <p className="text-xs text-zinc-600 mt-1.5">
            {displayedProducts.length} silhouette{displayedProducts.length === 1 ? '' : 's'} available <span aria-hidden="true">·</span> Priced in Bangladeshi Taka (৳) <span aria-hidden="true">·</span> Cash on Delivery nationwide
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="md:hidden flex items-center gap-2 px-3.5 py-2 bg-white border border-[#dedad0] hover:border-[#111113] text-[#111113] rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap shrink-0"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter</span>
          </button>

          <div className="flex items-center gap-2 bg-white border border-[#dedad0] rounded-lg px-3.5 py-2 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-[#111113] font-medium focus:outline-none cursor-pointer"
            >
              <option value="newest">Latest Releases</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Client Rating</option>
              <option value="popular">Most Requested</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sidebar + Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pt-8">
        <aside className="hidden md:block space-y-6 pr-2">
          {hasActiveFilters && (
            <div className="flex items-center justify-between pb-4 border-b border-[#e5e2da]">
              <span className="text-xs font-semibold text-[#111113] font-display">Active Selection</span>
              <button
                onClick={clearAllFilters}
                className="text-xs text-zinc-600 hover:text-[#111113] font-medium underline underline-offset-4 cursor-pointer"
              >
                Reset
              </button>
            </div>
          )}

          {/* Keyword */}
          <div>
            <label className="block text-xs font-semibold font-display text-[#111113] mb-2">
              Search Archive
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Loafer, calfskin, SKU..."
                className="w-full pl-8 pr-7 py-2 text-xs bg-white border border-[#dedad0] rounded-lg focus:outline-none focus:border-[#111113]"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-[#111113] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="block text-xs font-semibold font-display text-[#111113] mb-2">
              Department
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#efede7] rounded-lg">
              {[
                { id: 'all', label: 'All' },
                { id: 'men', label: 'Men' },
                { id: 'women', label: 'Women' },
                { id: 'unisex', label: 'Unisex' }
              ].map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGender(g.id)}
                  className={`px-2.5 py-1.5 text-xs rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    selectedGender === g.id
                      ? 'bg-white text-[#111113] font-semibold shadow-2xs'
                      : 'text-zinc-600 hover:text-[#111113]'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-xs font-semibold font-display text-[#111113] mb-2">
              Silhouette
            </label>
            <div className="space-y-1 text-xs">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`block w-full text-left py-1 transition-colors cursor-pointer ${
                  selectedCategory === 'all' ? 'font-semibold text-[#111113] underline underline-offset-4' : 'text-zinc-600 hover:text-[#111113]'
                }`}
              >
                All Silhouettes
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.slug)}
                  className={`block w-full text-left py-1 transition-colors cursor-pointer ${
                    selectedCategory === c.slug ? 'font-semibold text-[#111113] underline underline-offset-4' : 'text-zinc-600 hover:text-[#111113]'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div>
            <label className="block text-xs font-semibold font-display text-[#111113] mb-2">
              Size (EU Last)
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              <button
                onClick={() => setSelectedSize('all')}
                className={`py-1.5 text-xs font-mono rounded-md border text-center cursor-pointer transition-colors ${
                  selectedSize === 'all'
                    ? 'border-[#111113] bg-[#111113] text-white font-medium'
                    : 'border-[#dedad0] text-zinc-700 hover:border-[#111113] bg-white'
                }`}
              >
                All
              </button>
              {SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSize(s)}
                  className={`py-1.5 text-xs font-mono tabular-nums rounded-md border text-center cursor-pointer transition-colors ${
                    selectedSize === s
                      ? 'border-[#111113] bg-[#111113] text-white font-medium'
                      : 'border-[#dedad0] text-zinc-700 hover:border-[#111113] bg-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Product Configuration */}
          <div>
            <label className="block text-xs font-semibold font-display text-[#111113] mb-2">
              Edition Format
            </label>
            <div className="flex flex-col gap-1 text-xs">
              {[
                { id: 'all', label: 'All Editions' },
                { id: 'variable', label: 'Multi-Size & Leather Finish' },
                { id: 'simple', label: 'Care Kits & Single Format' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedType(t.id as any)}
                  className={`text-left py-1 transition-colors cursor-pointer ${
                    selectedType === t.id
                      ? 'font-semibold text-[#111113] underline underline-offset-4'
                      : 'text-zinc-600 hover:text-[#111113]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Brands */}
          {brands.length > 0 && (
            <div>
              <label className="block text-xs font-semibold font-display text-[#111113] mb-2">
                Line
              </label>
              <div className="space-y-1 text-xs">
                <button
                  onClick={() => setSelectedBrand('all')}
                  className={`block w-full text-left py-1 transition-colors cursor-pointer ${
                    selectedBrand === 'all' ? 'font-semibold text-[#111113] underline underline-offset-4' : 'text-zinc-600 hover:text-[#111113]'
                  }`}
                >
                  All Atelier Lines
                </button>
                {brands.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBrand(b.name)}
                    className={`block w-full text-left py-1 transition-colors cursor-pointer ${
                      selectedBrand === b.name ? 'font-semibold text-[#111113] underline underline-offset-4' : 'text-zinc-600 hover:text-[#111113]'
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Toggles */}
          <div className="space-y-2.5 pt-3 border-t border-[#e5e2da]">
            <label className="flex items-center gap-2 text-xs text-zinc-700 cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded border-zinc-300 accent-[#111113]"
              />
              <span>Ready for immediate dispatch</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-zinc-700 cursor-pointer">
              <input
                type="checkbox"
                checked={onSaleOnly}
                onChange={(e) => setOnSaleOnly(e.target.checked)}
                className="rounded border-zinc-300 accent-[#111113]"
              />
              <span>Archive & seasonal pricing</span>
            </label>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="md:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-[#ece9e2] aspect-4/3 rounded-xl" />
              ))}
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="py-20 text-center space-y-4 bg-white rounded-xl border border-[#e5e2da] p-8">
              <Search className="w-10 h-10 text-zinc-300 mx-auto stroke-[1.5]" />
              <h3 className="text-base font-semibold font-display text-[#111113]">No silhouettes match this selection</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                Try resetting your EU size or category filter to view our full Dhaka atelier archive.
              </p>
              <button
                onClick={clearAllFilters}
                className="px-5 py-2.5 bg-[#111113] text-white rounded-lg text-xs font-medium hover:bg-zinc-800 cursor-pointer"
              >
                Reset Selection
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
              {displayedProducts.map((p) => (
                <ProductCard key={p.id} product={p} onSelect={onSelectProduct} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 md:hidden overflow-hidden">
          <div
            onClick={() => setIsMobileFilterOpen(false)}
            className="fixed inset-0 bg-[#0e0e10]/60 backdrop-blur-xs"
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xs bg-[#f7f6f2] p-6 flex flex-col justify-between overflow-y-auto border-l border-[#e5e2da]">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#e5e2da]">
                  <h3 className="text-base font-semibold text-[#111113] font-display">Filter Collection</h3>
                  <button onClick={() => setIsMobileFilterOpen(false)} aria-label="Close filters">
                    <X className="w-5 h-5 text-zinc-500" />
                  </button>
                </div>

                <div>
                  <h4 className="text-xs font-semibold font-display text-[#111113] mb-2">Department</h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['all', 'men', 'women', 'unisex'].map((g) => (
                      <button
                        key={g}
                        onClick={() => setSelectedGender(g)}
                        className={`py-1.5 text-xs rounded-md border capitalize ${
                          selectedGender === g ? 'bg-[#111113] text-white border-[#111113]' : 'bg-white border-[#dedad0] text-zinc-700'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold font-display text-[#111113] mb-2">Silhouette</h4>
                  <div className="space-y-1 text-xs">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`block py-1 ${selectedCategory === 'all' ? 'font-semibold text-[#111113] underline' : 'text-zinc-600'}`}
                    >
                      All Silhouettes
                    </button>
                    {categories.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCategory(c.slug)}
                        className={`block py-1 ${selectedCategory === c.slug ? 'font-semibold text-[#111113] underline' : 'text-zinc-600'}`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold font-display text-[#111113] mb-2">Size (EU)</h4>
                  <div className="grid grid-cols-4 gap-1.5">
                    {SIZES.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedSize(s === selectedSize ? 'all' : s)}
                        className={`py-1.5 text-xs font-mono rounded-md border ${
                          selectedSize === s ? 'bg-[#111113] text-white border-[#111113]' : 'bg-white border-[#dedad0]'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-[#e5e2da]">
                  <label className="flex items-center gap-2 text-xs text-zinc-700">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="accent-[#111113]"
                    />
                    <span>Ready for immediate dispatch</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-zinc-700">
                    <input
                      type="checkbox"
                      checked={onSaleOnly}
                      onChange={(e) => setOnSaleOnly(e.target.checked)}
                      className="accent-[#111113]"
                    />
                    <span>Archive & seasonal pricing</span>
                  </label>
                </div>
              </div>

              <div className="pt-6 border-t border-[#e5e2da] space-y-2">
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="w-full py-2.5 bg-[#111113] text-white text-xs font-medium rounded-lg"
                >
                  View {displayedProducts.length} Silhouettes
                </button>
                <button
                  onClick={clearAllFilters}
                  className="w-full py-2 text-zinc-600 text-xs font-medium"
                >
                  Reset Selection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
