import React from 'react';
import { Heart, Eye } from 'lucide-react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

const FALLBACK_SHOE_IMG = '/src/assets/images/hero_bdtechzen_flagship_1792768997575.jpg';

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { toggleWishlist, isInWishlist, setQuickViewProduct } = useStore();

  const isLiked = isInWishlist(product.id);
  const basePrice = product.salePriceBDT || product.regularPriceBDT;
  const regularPrice = product.regularPriceBDT;
  const isOnSale = Boolean(product.salePriceBDT && product.salePriceBDT < product.regularPriceBDT);

  const variantPrices = product.variants
    .map((v) => v.priceOverrideBDT || basePrice)
    .filter((p) => p > 0);
  const minPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : basePrice;
  const maxPrice = variantPrices.length > 0 ? Math.max(...variantPrices) : basePrice;
  const hasPriceRange = maxPrice > minPrice;

  const totalStock = product.variants.reduce((acc, v) => acc + v.stock, 0);

  const uniqueColors = Array.from(
    new Map(
      product.variants.map((v) => [v.color, v.colorHex || '#18181b'])
    ).entries()
  );

  const inStockSizes = Array.from(
    new Set(product.variants.filter((v) => v.stock > 0).map((v) => v.size))
  );

  // Maximum 1 quiet text marker per card
  const activeTag =
    totalStock === 0
      ? 'Sold Out'
      : product.ribbonText && product.ribbonText.trim() !== ''
      ? product.ribbonText.trim()
      : '';

  const primaryImg = product.images[0] || FALLBACK_SHOE_IMG;
  const secondaryImg = product.images[1] || null;

  return (
    <article className="group flex flex-col bg-white border border-stone-200/90 rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-zinc-950/5">
      {/* Studio Image Frame (68% visual dominance, warm stone backdrop) */}
      <div
        onClick={() => onSelect(product)}
        className="relative aspect-4/3 w-full bg-[#f1efea] overflow-hidden cursor-pointer"
      >
        <img
          src={primaryImg}
          alt={product.name}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = FALLBACK_SHOE_IMG;
          }}
          className={`w-full h-full object-cover object-center transition-all duration-500 group-hover:scale-103 ${
            secondaryImg ? 'group-hover:opacity-0' : ''
          }`}
        />

        {secondaryImg && (
          <img
            src={secondaryImg}
            alt={`${product.name} studio detail`}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = FALLBACK_SHOE_IMG;
            }}
            className="absolute inset-0 w-full h-full object-cover object-center opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-103"
          />
        )}

        {/* Single Restrained Label */}
        {activeTag && (
          <div className="absolute top-3 left-3 pointer-events-none">
            <span
              className={`text-[11px] font-medium px-2.5 py-0.5 rounded tracking-wide ${
                totalStock === 0
                  ? 'bg-red-700 text-white'
                  : 'bg-[#111113]/88 text-stone-100 backdrop-blur-xs'
              }`}
            >
              {activeTag}
            </span>
          </div>
        )}

        {/* Subtle Hover Actions */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 opacity-95 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
            className="w-8 h-8 rounded-full bg-white/95 text-zinc-800 shadow-xs flex items-center justify-center hover:bg-[#111113] hover:text-white transition-colors cursor-pointer"
            aria-label="Save pair"
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setQuickViewProduct(product);
            }}
            className="w-8 h-8 rounded-full bg-white/95 text-zinc-800 shadow-xs flex items-center justify-center hover:bg-[#111113] hover:text-white transition-colors cursor-pointer"
            aria-label="Quick view"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Clean Unboxed Card Body */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
        <div className="cursor-pointer space-y-1" onClick={() => onSelect(product)}>
          {/* Unboxed Metadata Line */}
          <div className="text-[11px] text-zinc-500 flex items-center justify-between gap-2">
            <div className="truncate">
              <span>{product.brand}</span>
              <span className="mx-1.5 text-zinc-300" aria-hidden="true">·</span>
              <span className="capitalize">{product.category.replace('-', ' ')}</span>
            </div>
            {inStockSizes.length > 0 && (
              <span className="font-mono text-[11px] text-zinc-400 shrink-0 tabular-nums">
                {product.productType === 'simple'
                  ? 'Standard'
                  : `EU ${inStockSizes[0]}–${inStockSizes[inStockSizes.length - 1]}`}
              </span>
            )}
          </div>

          <h3 className="text-[15px] font-semibold font-display text-zinc-950 line-clamp-1 group-hover:text-zinc-700 transition-colors pt-0.5">
            {product.name}
          </h3>

          {/* Quiet Color Swatches */}
          <div className="pt-1.5 flex items-center gap-1.5">
            {uniqueColors.slice(0, 4).map(([colorName, hex]) => (
              <span
                key={colorName}
                title={colorName}
                className="w-3 h-3 rounded-full border border-stone-300"
                style={{ backgroundColor: hex }}
              />
            ))}
            <span className="text-[11px] text-zinc-500 pl-1 truncate">
              {uniqueColors.length > 1
                ? `${uniqueColors.length} finishes`
                : uniqueColors[0]?.[0] || ''}
            </span>
          </div>
        </div>

        {/* Baseline-Aligned Tabular Price & Action */}
        <div className="mt-4 pt-3.5 border-t border-stone-100 flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2">
            {hasPriceRange && (
              <span className="text-[11px] text-zinc-500">From</span>
            )}
            <span className="text-[15px] font-semibold text-zinc-950 font-mono tabular-nums">
              ৳{minPrice.toLocaleString('en-BD')}
            </span>
            {isOnSale && !hasPriceRange && (
              <span className="text-xs text-zinc-400 line-through font-mono tabular-nums">
                ৳{regularPrice.toLocaleString('en-BD')}
              </span>
            )}
          </div>

          <button
            onClick={() => onSelect(product)}
            className="text-xs font-medium text-zinc-700 group-hover:text-zinc-950 transition-colors cursor-pointer whitespace-nowrap"
          >
            {product.productType === 'variable' ? 'Select size →' : 'View pair →'}
          </button>
        </div>
      </div>
    </article>
  );
};
