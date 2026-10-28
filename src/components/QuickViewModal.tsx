import React, { useState } from 'react';
import { X, ShoppingBag } from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface QuickViewModalProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ onNavigate }) => {
  const { quickViewProduct, setQuickViewProduct, addToCart } = useStore();
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity] = useState<number>(1);

  if (!quickViewProduct) return null;

  const product = quickViewProduct;
  const uniqueColors = Array.from(new Set(product.variants.map((v) => v.color)));
  const uniqueSizes = Array.from(new Set(product.variants.map((v) => v.size)));

  const activeColor = selectedColor || uniqueColors[0] || '';
  const activeSize = selectedSize || uniqueSizes[0] || '';

  const matchedVariant = product.variants.find((v) => v.size === activeSize && v.color === activeColor);
  const currentStock = matchedVariant?.stock || 0;
  const currentPrice = matchedVariant?.priceOverrideBDT || product.salePriceBDT || product.regularPriceBDT;

  const handleAddToCart = () => {
    const res = addToCart(product, activeSize, activeColor, quantity);
    if (res.success) {
      setQuickViewProduct(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div
        onClick={() => setQuickViewProduct(null)}
        className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs transition-opacity"
      />

      <div className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden z-10 grid grid-cols-1 md:grid-cols-2 border border-zinc-200">
        <button
          onClick={() => setQuickViewProduct(null)}
          className="absolute top-4 right-4 z-20 p-2 text-zinc-500 hover:text-zinc-950 rounded-full bg-white/90 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Image */}
        <div className="bg-zinc-100 aspect-square md:aspect-auto h-full flex items-center justify-center p-4">
          <img
            src={product.images[0] || '/src/assets/images/hero_bdtechzen_flagship_1792768997575.jpg'}
            alt={product.name}
            className="w-full h-full object-cover rounded-xl"
          />
        </div>

        {/* Purchase Module */}
        <div className="p-6 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[11px] font-semibold tracking-wider text-violet-700 uppercase">
              {product.brand} · {product.category.replace('-', ' ')}
            </span>
            <h3 className="text-lg font-bold font-display text-zinc-950 mt-1">{product.name}</h3>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-bold text-zinc-950 font-mono tabular-nums">
                ৳{currentPrice.toLocaleString('en-BD')}
              </span>
              {product.salePriceBDT && product.salePriceBDT < product.regularPriceBDT && (
                <span className="text-xs text-zinc-400 line-through font-mono">
                  ৳{product.regularPriceBDT.toLocaleString('en-BD')}
                </span>
              )}
            </div>

            <p className="mt-2 text-xs text-zinc-600 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1.5">
              Color: <span className="font-normal text-zinc-500">{activeColor}</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {uniqueColors.map((c) => {
                const sampleVar = product.variants.find((v) => v.color === c);
                return (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition-colors cursor-pointer ${
                      activeColor === c
                        ? 'border-violet-600 bg-violet-600 text-white font-medium'
                        : 'border-zinc-200 text-zinc-700 hover:border-zinc-400'
                    }`}
                  >
                    {sampleVar?.colorHex && (
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-white/40 shrink-0"
                        style={{ backgroundColor: sampleVar.colorHex }}
                      />
                    )}
                    <span>{c}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size Selection */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-zinc-800">Size (EU)</label>
              <span className="text-[11px] text-zinc-500 font-mono">
                {currentStock > 0 ? `${currentStock} pair(s) left` : 'Out of stock'}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {uniqueSizes.map((s) => {
                const v = product.variants.find((vr) => vr.size === s && vr.color === activeColor);
                const hasStock = (v?.stock || 0) > 0;
                return (
                  <button
                    key={s}
                    disabled={!hasStock}
                    onClick={() => setSelectedSize(s)}
                    className={`py-1.5 text-xs font-mono font-medium rounded-lg border transition-colors cursor-pointer ${
                      activeSize === s
                        ? 'border-violet-600 bg-violet-600 text-white'
                        : hasStock
                        ? 'border-zinc-200 text-zinc-800 hover:border-violet-400'
                        : 'border-zinc-100 text-zinc-300 line-through cursor-not-allowed bg-zinc-50'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleAddToCart}
              disabled={currentStock <= 0}
              className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-300 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              {currentStock > 0 ? 'Add to Bag · Cash on Delivery Available' : 'Out of Stock'}
            </button>

            <button
              onClick={() => {
                setQuickViewProduct(null);
                onNavigate('product', { slug: product.slug });
              }}
              className="w-full text-center text-xs text-violet-700 hover:text-violet-900 font-medium underline underline-offset-4 cursor-pointer"
            >
              View Full Product Details & Specs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
