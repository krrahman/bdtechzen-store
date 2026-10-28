import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Copy,
  Download,
  Upload,
  X,
  Star,
  Image as ImageIcon,
  Layers,
  Tag,
  Sliders,
  Check,
  Sparkles,
  ArrowUp
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Product, ProductVariant, Category, Brand } from '../../types';
import { apiFetch } from '../../lib/staticApiFallback';

const STUDIO_PRESET_IMAGES = [
  { label: 'BDTechZen Flagship Sneaker', url: '/src/assets/images/hero_bdtechzen_flagship_1792768997575.jpg' },
  { label: 'Mayfair Cap-Toe Oxford', url: '/src/assets/images/product_oxford_dress_shoe_1792775360783.jpg' },
  { label: 'Skyline High-Top Sneaker', url: '/src/assets/images/product_high_top_sneaker_1792775362853.jpg' },
  { label: 'Florence Cognac Penny Loafer', url: '/src/assets/images/product_penny_loafer_tan_1792775363081.jpg' },
  { label: 'Celeste Horsebit Mule', url: '/src/assets/images/product_womens_leather_mule_1792775364104.jpg' },
  { label: 'Marathon Elite Racer', url: '/src/assets/images/product_trail_marathon_shoe_1792775363886.jpg' },
  { label: 'Court Leather Sneaker', url: '/src/assets/images/product_court_sneaker_1792769000669.jpg' },
  { label: 'Italian Calfskin Loafer', url: '/src/assets/images/product_leather_loafer_1792768998636.jpg' },
  { label: 'Artisanal Leather Sandal', url: '/src/assets/images/product_leather_sandal_1792769000370.jpg' },
  { label: 'Nitrogen Urban Runner', url: '/src/assets/images/product_urban_runner_1792739007692.jpg' },
  { label: 'Heritage Chelsea Boot', url: '/src/assets/images/product_chelsea_boots_1792739008903.jpg' },
  { label: 'Executive Men Footwear', url: '/src/assets/images/category_men_shoes_1792739006791.jpg' },
  { label: 'Women Studio Sneaker', url: '/src/assets/images/category_women_sneakers_1792739007245.jpg' },
  { label: 'Performance Runway Banner', url: '/src/assets/images/hero_footwear_banner_1792739005918.jpg' }
];

const RIBBON_PRESETS = [
  'New Arrival',
  'Best Seller',
  'Limited Drop',
  '100% Genuine Leather',
  '-15% Off',
  'Monsoon Ready',
  'Editor’s Pick'
];

const EU_SIZES = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];

const COLOR_PRESETS = [
  { name: 'Obsidian Black', hex: '#18181b' },
  { name: 'Royal Violet', hex: '#7c3aed' },
  { name: 'Cognac Tan', hex: '#92400e' },
  { name: 'Cloud White', hex: '#f4f4f5' },
  { name: 'Espresso Brown', hex: '#451a03' },
  { name: 'Slate Grey', hex: '#475569' }
];

export const AdminProducts: React.FC = () => {
  const { adminToken } = useAdminAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modal Editor State (WooCommerce-grade Simple + Variable Product Editor)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeEditorTab, setActiveEditorTab] = useState<'general' | 'gallery' | 'variations' | 'specs'>('general');

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [productType, setProductType] = useState<'simple' | 'variable'>('variable');
  const [ribbonText, setRibbonText] = useState('');
  const [brand, setBrand] = useState('BDTechZen Studio');
  const [category, setCategory] = useState('sneakers');
  const [gender, setGender] = useState<'men' | 'women' | 'unisex' | 'kids'>('unisex');
  const [description, setDescription] = useState('');
  const [regularPriceBDT, setRegularPriceBDT] = useState<string>('3490');
  const [salePriceBDT, setSalePriceBDT] = useState<string>('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isPublished, setIsPublished] = useState(true);

  // Gallery State
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [uploadingImg, setUploadingImg] = useState(false);

  // Simple Product Stock (synced into single variant if simple)
  const [simpleStock, setSimpleStock] = useState<number>(25);
  const [simpleColor, setSimpleColor] = useState<string>('Obsidian Black');
  const [simpleSize, setSimpleSize] = useState<string>('Free / Standard');

  // Variable Product Matrix State
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [bulkSizes, setBulkSizes] = useState<string[]>(['40', '41', '42', '43']);
  const [bulkColors, setBulkColors] = useState<Array<{ name: string; hex: string }>>([
    { name: 'Obsidian Black', hex: '#18181b' }
  ]);
  const [bulkDefaultStock, setBulkDefaultStock] = useState<number>(12);

  // Specifications State
  const [specRows, setSpecRows] = useState<Array<{ key: string; value: string }>>([]);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  const notify = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 3500);
  };

  const loadData = async () => {
    if (!adminToken) return;
    setLoading(true);
    try {
      const [prodRes, catRes, brandRes] = await Promise.all([
        apiFetch('/api/admin/products', { headers: { Authorization: `Bearer ${adminToken}` } }),
        apiFetch('/api/categories'),
        apiFetch('/api/brands')
      ]);
      const [prods, cats, brs] = await Promise.all([prodRes.json(), catRes.json(), brandRes.json()]);
      if (Array.isArray(prods)) setProducts(prods);
      if (Array.isArray(cats)) setCategories(cats);
      if (Array.isArray(brs)) setBrands(brs);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [adminToken]);

  const openCreateModal = () => {
    setEditingId(null);
    setActiveEditorTab('general');
    const randCode = Math.floor(100 + Math.random() * 900);
    setName('');
    setSku(`BDTZ-${randCode}`);
    setProductType('variable');
    setRibbonText('New Arrival');
    setBrand(brands[0]?.name || 'BDTechZen Studio');
    setCategory(categories[0]?.slug || 'sneakers');
    setGender('unisex');
    setDescription('');
    setRegularPriceBDT('3490');
    setSalePriceBDT('');
    setIsFeatured(true);
    setIsBestSeller(false);
    setIsPublished(true);
    setImages(['/src/assets/images/hero_bdtechzen_flagship_1792768997575.jpg']);
    setSimpleStock(25);
    setSimpleColor('Obsidian Black');
    setSimpleSize('42');
    setVariants([
      { id: `v_${Date.now()}_1`, size: '40', color: 'Obsidian Black', colorHex: '#18181b', stock: 12, skuVariant: `BDTZ-${randCode}-40-BLK` },
      { id: `v_${Date.now()}_2`, size: '41', color: 'Obsidian Black', colorHex: '#18181b', stock: 15, skuVariant: `BDTZ-${randCode}-41-BLK` },
      { id: `v_${Date.now()}_3`, size: '42', color: 'Obsidian Black', colorHex: '#18181b', stock: 15, skuVariant: `BDTZ-${randCode}-42-BLK` },
      { id: `v_${Date.now()}_4`, size: '43', color: 'Obsidian Black', colorHex: '#18181b', stock: 10, skuVariant: `BDTZ-${randCode}-43-BLK` }
    ]);
    setSpecRows([
      { key: 'Upper Material', value: 'Full-Grain Leather / Engineered Mesh' },
      { key: 'Outsole', value: 'High-Traction Anti-Slip Rubber' },
      { key: 'Insole', value: 'Ortholite Dual-Density Cushion' },
      { key: 'Warranty', value: '7-Day Easy Size Exchange' }
    ]);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingId(p.id);
    setActiveEditorTab('general');
    setName(p.name);
    setSku(p.sku);
    setProductType(p.productType || (p.variants.length <= 1 ? 'simple' : 'variable'));
    setRibbonText(p.ribbonText || '');
    setBrand(p.brand);
    setCategory(p.category);
    setGender(p.gender);
    setDescription(p.description);
    setRegularPriceBDT(String(p.regularPriceBDT));
    setSalePriceBDT(p.salePriceBDT ? String(p.salePriceBDT) : '');
    setIsFeatured(p.isFeatured);
    setIsBestSeller(p.isBestSeller);
    setIsPublished(p.isPublished);
    setImages([...p.images]);
    setVariants(p.variants.map((v) => ({ ...v })));
    if (p.variants[0]) {
      setSimpleStock(p.variants[0].stock);
      setSimpleColor(p.variants[0].color);
      setSimpleSize(p.variants[0].size);
    }
    setSpecRows(
      Object.entries(p.specifications || {}).map(([key, value]) => ({ key, value }))
    );
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !adminToken) return;
    setUploadingImg(true);

    for (const file of Array.from(files)) {
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const res = await apiFetch('/api/admin/upload-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`
          },
          body: JSON.stringify({ dataUrl })
        });
        const data = await res.json();
        if (res.ok && data.url) {
          setImages((prev) => [...prev, data.url]);
        }
      } catch {}
    }

    setUploadingImg(false);
    e.target.value = '';
  };

  const addImageByUrl = () => {
    if (!newImageUrl.trim()) return;
    setImages((prev) => [...prev, newImageUrl.trim()]);
    setNewImageUrl('');
  };

  const setPrimaryImage = (idx: number) => {
    if (idx === 0) return;
    setImages((prev) => {
      const next = [...prev];
      const [chosen] = next.splice(idx, 1);
      next.unshift(chosen);
      return next;
    });
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  // Bulk Variation Matrix Generator
  const toggleBulkSize = (sz: string) => {
    setBulkSizes((prev) => (prev.includes(sz) ? prev.filter((s) => s !== sz) : [...prev, sz]));
  };

  const toggleBulkColor = (c: { name: string; hex: string }) => {
    setBulkColors((prev) =>
      prev.some((x) => x.name === c.name)
        ? prev.filter((x) => x.name !== c.name)
        : [...prev, c]
    );
  };

  const generateBulkVariations = () => {
    if (bulkSizes.length === 0 || bulkColors.length === 0) return;
    const nextVariants: ProductVariant[] = [...variants];
    const baseSku = (sku || 'BDTZ').trim().toUpperCase();

    bulkColors.forEach((col) => {
      bulkSizes.forEach((sz) => {
        const exists = nextVariants.some(
          (v) => v.size === sz && v.color.toLowerCase() === col.name.toLowerCase()
        );
        if (!exists) {
          const colCode = col.name
            .split(' ')
            .map((w) => w[0])
            .join('')
            .toUpperCase();
          nextVariants.push({
            id: `v_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            size: sz,
            color: col.name,
            colorHex: col.hex,
            stock: bulkDefaultStock,
            skuVariant: `${baseSku}-${sz}-${colCode}`
          });
        }
      });
    });

    setVariants(nextVariants);
  };

  const addSingleVariantRow = () => {
    setVariants((prev) => [
      ...prev,
      {
        id: `v_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        size: '42',
        color: 'Obsidian Black',
        colorHex: '#18181b',
        stock: 10,
        skuVariant: `${(sku || 'BDTZ').toUpperCase()}-42-VAR`
      }
    ]);
  };

  const updateVariantField = (idx: number, field: keyof ProductVariant, value: any) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v))
    );
  };

  const removeVariantRow = (idx: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;
    setSaving(true);

    const finalSpecs: Record<string, string> = {};
    specRows.forEach((r) => {
      if (r.key.trim() && r.value.trim()) {
        finalSpecs[r.key.trim()] = r.value.trim();
      }
    });

    const finalVariants: ProductVariant[] =
      productType === 'simple'
        ? [
            {
              id: variants[0]?.id || `v_${Date.now()}`,
              size: simpleSize || 'Standard',
              color: simpleColor || 'Standard',
              colorHex: '#18181b',
              stock: Number(simpleStock) || 0,
              skuVariant: `${sku.trim().toUpperCase()}-STD`
            }
          ]
        : variants.map((v) => ({
            ...v,
            stock: Number(v.stock) || 0,
            priceOverrideBDT: v.priceOverrideBDT ? Number(v.priceOverrideBDT) : undefined
          }));

    const payload = {
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      productType,
      ribbonText: ribbonText.trim(),
      brand,
      category,
      gender,
      description,
      images: images.length > 0 ? images : [STUDIO_PRESET_IMAGES[0].url],
      regularPriceBDT: Number(regularPriceBDT) || 0,
      salePriceBDT: salePriceBDT.trim() ? Number(salePriceBDT) : null,
      isFeatured,
      isBestSeller,
      isPublished,
      variants: finalVariants,
      specifications: finalSpecs
    };

    try {
      const url = editingId ? `/api/admin/products/${editingId}` : '/api/admin/products';
      const method = editingId ? 'PUT' : 'POST';
      const res = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        await loadData();
        notify(editingId ? 'Product updated successfully!' : 'New product published!');
      } else {
        notify(data.error || 'Could not save product');
      }
    } catch {
      notify('Network error while saving product');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (product: Product) => {
    if (!adminToken) return;
    const res = await apiFetch(`/api/admin/products/${product.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ isPublished: !product.isPublished })
    });
    if (res.ok) {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isPublished: !p.isPublished } : p))
      );
      notify(`"${product.name}" set to ${!product.isPublished ? 'Published' : 'Draft'}`);
    }
  };

  const handleDuplicate = async (p: Product) => {
    if (!adminToken) return;
    const rand = Math.floor(100 + Math.random() * 900);
    const res = await apiFetch('/api/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        ...p,
        name: `${p.name} (Copy)`,
        sku: `${p.sku}-${rand}`,
        isPublished: false
      })
    });
    if (res.ok) {
      await loadData();
      notify(`Duplicated "${p.name}" as Draft`);
    }
  };

  const handleDelete = async (p: Product) => {
    if (!adminToken) return;
    const res = await apiFetch(`/api/admin/products/${p.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (res.ok) {
      setProducts((prev) => prev.filter((item) => item.id !== p.id));
      notify(`Deleted "${p.name}"`);
    }
  };

  const handleExportCsv = () => {
    const header = ['SKU', 'Name', 'Type', 'Category', 'Brand', 'RegularBDT', 'SaleBDT', 'Ribbon', 'TotalStock', 'Published'];
    const rows = products.map((p) => {
      const stock = p.variants.reduce((s, v) => s + v.stock, 0);
      return [
        p.sku,
        `"${p.name.replace(/"/g, '""')}"`,
        p.productType || 'variable',
        p.category,
        `"${p.brand}"`,
        p.regularPriceBDT,
        p.salePriceBDT || '',
        `"${p.ribbonText || ''}"`,
        stock,
        p.isPublished ? 'YES' : 'NO'
      ].join(',');
    });
    const blob = new Blob([[header.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bdtechzen-products-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;
    const pType = p.productType || (p.variants.length <= 1 ? 'simple' : 'variable');
    const matchesType = typeFilter === 'all' || pType === typeFilter;
    return matchesSearch && matchesCat && matchesType;
  });

  const fmt = (n: number) => `৳${(n || 0).toLocaleString('en-BD')}`;

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <div className="bg-zinc-950 text-white px-4 py-3 rounded-xl border border-violet-500/40 text-sm font-medium flex items-center gap-2 shadow-lg">
          <Check className="w-4 h-4 text-violet-400" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Top Action Header */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-zinc-950">
            WooCommerce Product & Variation Manager ({products.length})
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Create Simple or Variable products, generate EU size × color matrices, upload multi-angle galleries, and customize ribbons.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add New Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-4 grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product title, SKU, or brand..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-300 focus:border-violet-600 outline-none text-sm"
          />
        </div>
        <div className="sm:col-span-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-sm bg-white"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-sm bg-white"
          >
            <option value="all">All Product Types</option>
            <option value="variable">Variable Products</option>
            <option value="simple">Simple Products</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-10 text-center text-sm text-zinc-500">Loading product catalog...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm text-zinc-500">No products match your filter criteria.</p>
            <button
              type="button"
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold"
            >
              + Create First Product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500 border-b border-zinc-200">
                <tr>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Type & Ribbon</th>
                  <th className="py-3.5 px-4">Price (BDT)</th>
                  <th className="py-3.5 px-4">Variants & Stock</th>
                  <th className="py-3.5 px-4">Visibility</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredProducts.map((p) => {
                  const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
                  const pType = p.productType || (p.variants.length <= 1 ? 'simple' : 'variable');
                  return (
                    <tr key={p.id} className="hover:bg-zinc-50/70">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3.5">
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            className="w-13 h-13 rounded-xl object-cover bg-zinc-100 border border-zinc-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-zinc-950 truncate max-w-xs">{p.name}</p>
                            <p className="text-xs text-zinc-500 font-mono">
                              SKU: {p.sku} · {p.images.length} img(s)
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                              pType === 'variable'
                                ? 'bg-violet-50 text-violet-700 border border-violet-200'
                                : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                            }`}
                          >
                            {pType}
                          </span>
                          {p.ribbonText && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-900 text-white">
                              Ribbon: {p.ribbonText}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        {p.salePriceBDT ? (
                          <div>
                            <span className="font-bold text-violet-700 block">{fmt(p.salePriceBDT)}</span>
                            <span className="text-xs text-zinc-400 line-through">{fmt(p.regularPriceBDT)}</span>
                          </div>
                        ) : (
                          <span className="font-bold text-zinc-950">{fmt(p.regularPriceBDT)}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`font-mono font-bold text-xs ${
                            totalStock === 0
                              ? 'text-red-600'
                              : totalStock < 12
                              ? 'text-amber-600'
                              : 'text-emerald-700'
                          }`}
                        >
                          {totalStock} pairs
                        </span>
                        <span className="block text-[11px] text-zinc-500">
                          {p.variants.length} variation(s)
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(p)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                            p.isPublished
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                          }`}
                        >
                          {p.isPublished ? 'Published' : 'Draft'}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(p)}
                            title="Edit Product & Variations"
                            className="p-2 rounded-lg text-zinc-600 hover:text-violet-700 hover:bg-violet-50 transition cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicate(p)}
                            title="Duplicate Product"
                            className="p-2 rounded-lg text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition cursor-pointer"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(p)}
                            title="Delete Product"
                            className="p-2 rounded-lg text-zinc-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* WOOCOMMERCE FULL PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-zinc-950 text-white flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400 block">
                  WooCommerce Product Data Editor
                </span>
                <h3 className="font-display text-lg font-bold">
                  {editingId ? `Edit Product: ${name}` : 'Add New Footwear Product'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Editor Sub-Tabs */}
            <div className="bg-zinc-100 border-b border-zinc-200 px-6 flex gap-1 overflow-x-auto shrink-0">
              {[
                { id: 'general', label: '1. General, Pricing & Ribbon', icon: Tag },
                { id: 'gallery', label: `2. Product Images (${images.length})`, icon: ImageIcon },
                {
                  id: 'variations',
                  label:
                    productType === 'variable'
                      ? `3. Variable Sizes & Colors (${variants.length})`
                      : '3. Simple Inventory',
                  icon: Layers
                },
                { id: 'specs', label: `4. Technical Specs (${specRows.length})`, icon: Sliders }
              ].map((t) => {
                const Icon = t.icon;
                const active = activeEditorTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveEditorTab(t.id as any)}
                    className={`inline-flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition cursor-pointer ${
                      active
                        ? 'border-violet-600 text-violet-700 bg-white'
                        : 'border-transparent text-zinc-600 hover:text-zinc-950'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* TAB 1: GENERAL, PRICING & RIBBON */}
              {activeEditorTab === 'general' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    <div className="sm:col-span-8">
                      <label className="block text-xs font-bold uppercase text-zinc-600 mb-1">
                        Product Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. BDTechZen AeroStride Nitro Runner"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:border-violet-600 outline-none text-sm font-medium"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <label className="block text-xs font-bold uppercase text-zinc-600 mb-1">
                        Master SKU *
                      </label>
                      <input
                        type="text"
                        required
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        placeholder="BDTZ-901"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 font-mono text-sm"
                      />
                    </div>
                  </div>

                  {/* Product Type Selector (WooCommerce style) */}
                  <div className="p-4 rounded-xl bg-violet-50/70 border border-violet-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-violet-800 block">
                        Product Data Type
                      </span>
                      <span className="text-xs text-zinc-600">
                        Choose <strong>Variable Product</strong> for multiple EU sizes/colors, or <strong>Simple Product</strong> for single-SKU items.
                      </span>
                    </div>
                    <div className="inline-flex rounded-xl bg-white p-1 border border-violet-200 shrink-0">
                      <button
                        type="button"
                        onClick={() => setProductType('variable')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          productType === 'variable'
                            ? 'bg-violet-600 text-white'
                            : 'text-zinc-600 hover:text-zinc-900'
                        }`}
                      >
                        Variable Product
                      </button>
                      <button
                        type="button"
                        onClick={() => setProductType('simple')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          productType === 'simple'
                            ? 'bg-violet-600 text-white'
                            : 'text-zinc-600 hover:text-zinc-900'
                        }`}
                      >
                        Simple Product
                      </button>
                    </div>
                  </div>

                  {/* Category, Brand, Gender */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-600 mb-1">
                        Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm bg-white"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.slug}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-600 mb-1">
                        Brand
                      </label>
                      <select
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm bg-white"
                      >
                        {brands.map((b) => (
                          <option key={b.id} value={b.name}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-600 mb-1">
                        Department / Gender
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm bg-white"
                      >
                        <option value="men">Men</option>
                        <option value="women">Women</option>
                        <option value="unisex">Unisex</option>
                        <option value="kids">Kids</option>
                      </select>
                    </div>
                  </div>

                  {/* Pricing BDT */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-600 mb-1">
                        Regular Price (৳ BDT) *
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={regularPriceBDT}
                        onChange={(e) => setRegularPriceBDT(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-600 mb-1">
                        Sale / Promotional Price (৳ BDT — Optional)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={salePriceBDT}
                        onChange={(e) => setSalePriceBDT(e.target.value)}
                        placeholder="Leave blank if no discount"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 font-mono text-sm"
                      />
                    </div>
                  </div>

                  {/* Custom Product Card Ribbon */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase text-zinc-600">
                      Custom Product Ribbon / Badge (Shown on Product Cards)
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={ribbonText}
                        onChange={(e) => setRibbonText(e.target.value)}
                        placeholder="e.g. New Arrival, Limited Drop, 100% Leather (or leave empty)"
                        className="flex-1 px-3.5 py-2 rounded-xl border border-zinc-300 text-sm"
                      />
                      {ribbonText && (
                        <button
                          type="button"
                          onClick={() => setRibbonText('')}
                          className="px-3 py-2 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-600 hover:bg-zinc-100"
                        >
                          Clear Ribbon
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {RIBBON_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setRibbonText(preset)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                            ribbonText === preset
                              ? 'bg-violet-600 text-white border-violet-600'
                              : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-violet-400'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-600 mb-1">
                      Product Description
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe craftsmanship, leather grade, cushioning, and fit..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm"
                    />
                  </div>

                  {/* Merchandising Flags */}
                  <div className="flex flex-wrap gap-5 pt-2">
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-zinc-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isPublished}
                        onChange={(e) => setIsPublished(e.target.checked)}
                        className="w-4 h-4 accent-violet-600"
                      />
                      Published on Storefront
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-zinc-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                        className="w-4 h-4 accent-violet-600"
                      />
                      Featured Collection
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-zinc-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isBestSeller}
                        onChange={(e) => setIsBestSeller(e.target.checked)}
                        className="w-4 h-4 accent-violet-600"
                      />
                      Best Seller Highlight
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 2: GALLERY & IMAGE UPLOADER */}
              {activeEditorTab === 'gallery' && (
                <div className="space-y-6">
                  {/* Upload or Paste URL */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="border-2 border-dashed border-violet-300 hover:border-violet-600 bg-violet-50/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition">
                      <Upload className="w-7 h-7 text-violet-600 mb-2" />
                      <span className="font-display font-bold text-sm text-zinc-900">
                        {uploadingImg ? 'Uploading image(s)...' : 'Upload Product Photos from Device'}
                      </span>
                      <span className="text-xs text-zinc-500 mt-1">
                        Supports JPG, PNG, WebP, SVG (Multi-select enabled)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    <div className="border border-zinc-200 rounded-2xl p-5 flex flex-col justify-center space-y-3 bg-zinc-50">
                      <span className="text-xs font-bold uppercase text-zinc-600">
                        Or Add Image via Direct URL
                      </span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newImageUrl}
                          onChange={(e) => setNewImageUrl(e.target.value)}
                          placeholder="https://... or /uploads/..."
                          className="flex-1 px-3.5 py-2 rounded-xl border border-zinc-300 bg-white text-sm"
                        />
                        <button
                          type="button"
                          onClick={addImageByUrl}
                          className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold cursor-pointer"
                        >
                          Add URL
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Active Product Gallery */}
                  <div>
                    <h4 className="font-display text-xs font-bold uppercase tracking-wider text-zinc-600 mb-3">
                      Active Product Gallery ({images.length}) — First image is the Primary Cover
                    </h4>
                    {images.length === 0 ? (
                      <div className="p-8 rounded-xl border border-zinc-200 text-center text-sm text-zinc-500">
                        No images added yet. Upload a photo or click any free studio preset below.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {images.map((img, idx) => (
                          <div
                            key={`${img}-${idx}`}
                            className={`group relative rounded-xl overflow-hidden border-2 bg-zinc-100 ${
                              idx === 0 ? 'border-violet-600' : 'border-zinc-200'
                            }`}
                          >
                            <img src={img} alt="" className="w-full h-36 object-cover" />
                            {idx === 0 && (
                              <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-violet-600 text-white text-[10px] font-bold uppercase flex items-center gap-1">
                                <Star className="w-3 h-3 fill-white" /> Cover
                              </span>
                            )}
                            <div className="p-2 bg-white flex items-center justify-between gap-1 border-t border-zinc-100">
                              {idx > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => setPrimaryImage(idx)}
                                  className="text-[11px] font-semibold text-violet-700 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                                >
                                  <ArrowUp className="w-3 h-3" /> Set Cover
                                </button>
                              ) : (
                                <span className="text-[11px] text-zinc-400">Primary</span>
                              )}
                              <button
                                type="button"
                                onClick={() => removeImage(idx)}
                                className="p-1 text-zinc-400 hover:text-red-600 cursor-pointer"
                                title="Remove image"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Built-in Free Studio Footwear Library */}
                  <div className="pt-4 border-t border-zinc-200">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-2.5">
                      Quick-Add Free Studio Footwear Assets (Click to append to gallery)
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                      {STUDIO_PRESET_IMAGES.map((preset) => (
                        <button
                          key={preset.url}
                          type="button"
                          onClick={() => setImages((prev) => [...prev, preset.url])}
                          className="group text-left rounded-xl border border-zinc-200 hover:border-violet-500 p-1.5 bg-zinc-50 transition cursor-pointer"
                        >
                          <img
                            src={preset.url}
                            alt={preset.label}
                            className="w-full h-16 object-cover rounded-lg mb-1"
                          />
                          <span className="block text-[10px] font-medium text-zinc-700 truncate">
                            + {preset.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: VARIATIONS MATRIX OR SIMPLE STOCK */}
              {activeEditorTab === 'variations' && (
                <div className="space-y-6">
                  {productType === 'simple' ? (
                    <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-zinc-600 mb-1">
                          Standard Size Label
                        </label>
                        <input
                          type="text"
                          value={simpleSize}
                          onChange={(e) => setSimpleSize(e.target.value)}
                          placeholder="e.g. 42 or Free Size"
                          className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 bg-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-zinc-600 mb-1">
                          Color Label
                        </label>
                        <input
                          type="text"
                          value={simpleColor}
                          onChange={(e) => setSimpleColor(e.target.value)}
                          placeholder="e.g. Obsidian Black"
                          className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 bg-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-zinc-600 mb-1">
                          Available Stock (Pairs)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={simpleStock}
                          onChange={(e) => setSimpleStock(Number(e.target.value))}
                          className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 bg-white font-mono text-sm"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* WooCommerce Bulk Variation Generator */}
                      <div className="bg-violet-50/60 border border-violet-200 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-display font-bold text-sm text-zinc-950 flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-violet-600" /> Bulk EU Size × Color Variation Generator
                            </h4>
                            <p className="text-xs text-zinc-600">
                              Select sizes and colors below, then click Generate to automatically build missing SKU combinations.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <span className="text-xs font-bold uppercase text-zinc-600 block">
                            1. Select EU Sizes:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {EU_SIZES.map((sz) => (
                              <button
                                key={sz}
                                type="button"
                                onClick={() => toggleBulkSize(sz)}
                                className={`px-3 py-1 rounded-lg font-mono text-xs font-bold border transition cursor-pointer ${
                                  bulkSizes.includes(sz)
                                    ? 'bg-violet-600 text-white border-violet-600'
                                    : 'bg-white text-zinc-700 border-zinc-300'
                                }`}
                              >
                                EU {sz}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <span className="text-xs font-bold uppercase text-zinc-600 block">
                            2. Select Colorways:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {COLOR_PRESETS.map((c) => {
                              const selected = bulkColors.some((x) => x.name === c.name);
                              return (
                                <button
                                  key={c.name}
                                  type="button"
                                  onClick={() => toggleBulkColor(c)}
                                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                                    selected
                                      ? 'bg-zinc-950 text-white border-zinc-950'
                                      : 'bg-white text-zinc-700 border-zinc-300'
                                  }`}
                                >
                                  <span
                                    className="w-3.5 h-3.5 rounded-full border border-white/40"
                                    style={{ backgroundColor: c.hex }}
                                  />
                                  {c.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-zinc-700">Initial Stock per Variant:</span>
                            <input
                              type="number"
                              min={0}
                              value={bulkDefaultStock}
                              onChange={(e) => setBulkDefaultStock(Number(e.target.value))}
                              className="w-20 px-2.5 py-1.5 rounded-lg border border-zinc-300 bg-white font-mono text-xs"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={generateBulkVariations}
                            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition cursor-pointer"
                          >
                            + Generate Selected Variations
                          </button>
                          <button
                            type="button"
                            onClick={addSingleVariantRow}
                            className="px-3.5 py-2 rounded-xl bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-800 text-xs font-semibold transition cursor-pointer"
                          >
                            + Add Custom Row
                          </button>
                        </div>
                      </div>

                      {/* Editable Variations Table */}
                      <div className="border border-zinc-200 rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-zinc-950 text-white uppercase tracking-wider">
                              <tr>
                                <th className="py-2.5 px-3">Size</th>
                                <th className="py-2.5 px-3">Color Name</th>
                                <th className="py-2.5 px-3">Swatch</th>
                                <th className="py-2.5 px-3">Stock</th>
                                <th className="py-2.5 px-3">Variant SKU</th>
                                <th className="py-2.5 px-3">Custom Price ৳ (Opt)</th>
                                <th className="py-2.5 px-3 text-right">Remove</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                              {variants.map((v, idx) => (
                                <tr key={v.id || idx} className="bg-white">
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={v.size}
                                      onChange={(e) => updateVariantField(idx, 'size', e.target.value)}
                                      className="w-16 px-2 py-1.5 rounded-lg border border-zinc-300 font-mono"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={v.color}
                                      onChange={(e) => updateVariantField(idx, 'color', e.target.value)}
                                      className="w-36 px-2.5 py-1.5 rounded-lg border border-zinc-300"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="color"
                                      value={v.colorHex || '#18181b'}
                                      onChange={(e) => updateVariantField(idx, 'colorHex', e.target.value)}
                                      className="w-9 h-8 rounded cursor-pointer border border-zinc-300"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      min={0}
                                      value={v.stock}
                                      onChange={(e) => updateVariantField(idx, 'stock', Number(e.target.value))}
                                      className="w-20 px-2 py-1.5 rounded-lg border border-zinc-300 font-mono"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={v.skuVariant}
                                      onChange={(e) => updateVariantField(idx, 'skuVariant', e.target.value)}
                                      className="w-36 px-2.5 py-1.5 rounded-lg border border-zinc-300 font-mono"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      min={0}
                                      value={v.priceOverrideBDT || ''}
                                      onChange={(e) =>
                                        updateVariantField(
                                          idx,
                                          'priceOverrideBDT',
                                          e.target.value ? Number(e.target.value) : undefined
                                        )
                                      }
                                      placeholder="Default"
                                      className="w-24 px-2 py-1.5 rounded-lg border border-zinc-300 font-mono"
                                    />
                                  </td>
                                  <td className="p-2 text-right">
                                    <button
                                      type="button"
                                      onClick={() => removeVariantRow(idx)}
                                      className="p-1.5 text-zinc-400 hover:text-red-600 cursor-pointer"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB 4: TECHNICAL SPECIFICATIONS */}
              {activeEditorTab === 'specs' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-display font-bold text-sm text-zinc-950">
                        Footwear Technical Specifications
                      </h4>
                      <p className="text-xs text-zinc-500">
                        Displayed in the specification table on the product detail page.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSpecRows((prev) => [...prev, { key: '', value: '' }])}
                      className="px-3.5 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold cursor-pointer"
                    >
                      + Add Spec Attribute
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {specRows.map((row, idx) => (
                      <div key={idx} className="flex items-center gap-2.5">
                        <input
                          type="text"
                          value={row.key}
                          onChange={(e) =>
                            setSpecRows((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, key: e.target.value } : r))
                            )
                          }
                          placeholder="Attribute (e.g. Upper Material)"
                          className="w-1/3 px-3.5 py-2 rounded-xl border border-zinc-300 text-sm font-medium"
                        />
                        <input
                          type="text"
                          value={row.value}
                          onChange={(e) =>
                            setSpecRows((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, value: e.target.value } : r))
                            )
                          }
                          placeholder="Value (e.g. Full-Grain Italian Calfskin)"
                          className="flex-1 px-3.5 py-2 rounded-xl border border-zinc-300 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setSpecRows((prev) => prev.filter((_, i) => i !== idx))}
                          className="p-2 text-zinc-400 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-5 border-t border-zinc-200 flex items-center justify-between gap-3">
                <span className="text-xs text-zinc-500">
                  All changes persist immediately to the live Bangladesh storefront.
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-xs font-bold shadow-md shadow-violet-600/20 transition cursor-pointer"
                  >
                    {saving ? 'Saving...' : editingId ? 'Save Product Changes' : 'Publish Product'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
