import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit3, Upload, Check, Layers, Award } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Category, Brand } from '../../types';
import { apiFetch } from '../../lib/staticApiFallback';

const PRESET_CAT_IMAGES = [
  '/src/assets/images/hero_bdtechzen_flagship_1792768997575.jpg',
  '/src/assets/images/product_oxford_dress_shoe_1792775360783.jpg',
  '/src/assets/images/product_high_top_sneaker_1792775362853.jpg',
  '/src/assets/images/product_penny_loafer_tan_1792775363081.jpg',
  '/src/assets/images/product_womens_leather_mule_1792775364104.jpg',
  '/src/assets/images/product_trail_marathon_shoe_1792775363886.jpg',
  '/src/assets/images/product_leather_loafer_1792768998636.jpg',
  '/src/assets/images/product_court_sneaker_1792769000669.jpg',
  '/src/assets/images/product_leather_sandal_1792769000370.jpg',
  '/src/assets/images/category_men_shoes_1792739006791.jpg',
  '/src/assets/images/category_women_sneakers_1792739007245.jpg'
];

export const AdminCategories: React.FC = () => {
  const { adminToken } = useAdminAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  // Category Form
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catImage, setCatImage] = useState(PRESET_CAT_IMAGES[0]);
  const [catFeatured, setCatFeatured] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Brand Form
  const [brandName, setBrandName] = useState('');
  const [feedback, setFeedback] = useState('');

  const notify = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 3000);
  };

  const loadAll = async () => {
    try {
      const [cRes, bRes] = await Promise.all([apiFetch('/api/categories'), apiFetch('/api/brands')]);
      const [cData, bData] = await Promise.all([cRes.json(), bRes.json()]);
      if (Array.isArray(cData)) setCategories(cData);
      if (Array.isArray(bData)) setBrands(bData);
    } catch {}
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleCatImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !adminToken) return;
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = reject;
        r.readAsDataURL(file);
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
      if (res.ok && data.url) setCatImage(data.url);
    } catch {}
    setUploading(false);
    e.target.value = '';
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !catName.trim()) return;

    const url = editingCatId ? `/api/admin/categories/${editingCatId}` : '/api/admin/categories';
    const method = editingCatId ? 'PUT' : 'POST';

    const res = await apiFetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: catName.trim(),
        description: catDesc.trim(),
        image: catImage,
        isFeatured: catFeatured
      })
    });

    if (res.ok) {
      setEditingCatId(null);
      setCatName('');
      setCatDesc('');
      setCatImage(PRESET_CAT_IMAGES[0]);
      await loadAll();
      notify(editingCatId ? 'Category updated!' : 'Category added!');
    }
  };

  const startEditCategory = (c: Category) => {
    setEditingCatId(c.id);
    setCatName(c.name);
    setCatDesc(c.description);
    setCatImage(c.image);
    setCatFeatured(c.isFeatured);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!adminToken) return;
    const res = await apiFetch(`/api/admin/categories/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (res.ok) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      notify('Category deleted');
    }
  };

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !brandName.trim()) return;
    const res = await apiFetch('/api/admin/brands', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ name: brandName.trim() })
    });
    if (res.ok) {
      setBrandName('');
      await loadAll();
      notify('Brand created');
    }
  };

  const handleDeleteBrand = async (id: string) => {
    if (!adminToken) return;
    const res = await apiFetch(`/api/admin/brands/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (res.ok) {
      setBrands((prev) => prev.filter((b) => b.id !== id));
      notify('Brand removed');
    }
  };

  return (
    <div className="space-y-8">
      {feedback && (
        <div className="bg-zinc-950 text-white px-4 py-3 rounded-xl border border-violet-500/40 text-sm flex items-center gap-2">
          <Check className="w-4 h-4 text-violet-400" /> {feedback}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Category Manager */}
        <div className="lg:col-span-7 space-y-6">
          <form
            onSubmit={handleSaveCategory}
            className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-lg text-zinc-950 flex items-center gap-2">
                <Layers className="w-5 h-5 text-violet-600" />
                {editingCatId ? 'Edit Category' : 'Add Footwear Category'}
              </h2>
              {editingCatId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingCatId(null);
                    setCatName('');
                    setCatDesc('');
                  }}
                  className="text-xs font-semibold text-zinc-500 hover:text-zinc-800"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-600 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Formal Leather Loafers"
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-600 mb-1">
                  Short Subtitle
                </label>
                <input
                  type="text"
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Handcrafted calfskin classics"
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase text-zinc-600">
                Category Cover Image
              </label>
              <div className="flex items-center gap-3">
                <img
                  src={catImage}
                  alt="Preview"
                  className="w-16 h-16 rounded-xl object-cover border border-zinc-200 shrink-0"
                />
                <input
                  type="text"
                  value={catImage}
                  onChange={(e) => setCatImage(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-zinc-300 text-xs font-mono"
                />
                <label className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  {uploading ? '...' : 'Upload'}
                  <input type="file" accept="image/*" onChange={handleCatImageUpload} className="hidden" />
                </label>
              </div>
              <div className="flex gap-2 pt-1 overflow-x-auto">
                {PRESET_CAT_IMAGES.map((img) => (
                  <button
                    key={img}
                    type="button"
                    onClick={() => setCatImage(img)}
                    className={`w-11 h-11 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer ${
                      catImage === img ? 'border-violet-600' : 'border-zinc-200'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={catFeatured}
                  onChange={(e) => setCatFeatured(e.target.checked)}
                  className="w-4 h-4 accent-violet-600"
                />
                Feature on Home Page Grid
              </label>

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {editingCatId ? 'Update Category' : 'Add Category'}
              </button>
            </div>
          </form>

          {/* Categories List */}
          <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100 overflow-hidden">
            {categories.map((c) => (
              <div key={c.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={c.image}
                    alt={c.name}
                    className="w-12 h-12 rounded-xl object-cover border border-zinc-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-zinc-950 truncate">{c.name}</p>
                    <p className="text-xs text-zinc-500 font-mono">slug: {c.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEditCategory(c)}
                    className="p-2 rounded-lg text-zinc-500 hover:text-violet-700 hover:bg-violet-50 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(c.id)}
                    className="p-2 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Brands Manager */}
        <div className="lg:col-span-5 space-y-6">
          <form
            onSubmit={handleAddBrand}
            className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4 shadow-xs"
          >
            <h2 className="font-display font-bold text-lg text-zinc-950 flex items-center gap-2">
              <Award className="w-5 h-5 text-violet-600" /> Brands & Labels ({brands.length})
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. BDTechZen Craft"
                className="flex-1 px-3.5 py-2 rounded-xl border border-zinc-300 text-sm"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold cursor-pointer"
              >
                + Add
              </button>
            </div>
          </form>

          <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100">
            {brands.map((b) => (
              <div key={b.id} className="px-5 py-3.5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-zinc-900">{b.name}</p>
                  <p className="text-[11px] font-mono text-zinc-400">{b.slug}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteBrand(b.id)}
                  className="p-1.5 text-zinc-400 hover:text-red-600 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
