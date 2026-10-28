import React, { useState, useEffect } from 'react';
import { Heart, ShoppingBag, Truck, Ruler, Check, ChevronRight, MessageCircle } from 'lucide-react';
import { Product, Review } from '../types';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { apiFetch } from '../lib/staticApiFallback';

interface ProductDetailPageProps {
  slugOrId: string;
  onNavigate: (page: string, params?: Record<string, string>) => void;
  onSelectProduct: (product: Product) => void;
}

const FALLBACK_SHOE_IMG = '/src/assets/images/hero_atelier_lookbook_1792778291527.jpg';

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ slugOrId, onNavigate, onSelectProduct }) => {
  const { country, addToCart, toggleWishlist, isInWishlist, showToast, settings } = useStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'specs' | 'reviews' | 'shipping'>('specs');
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  const [reviewName, setReviewName] = useState('');
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewsList, setReviewsList] = useState<Review[]>([]);

  useEffect(() => {
    setLoading(true);
    setActiveImageIndex(0);
    apiFetch(`/api/products/${slugOrId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data) => {
        if (data.product) {
          setProduct(data.product);
          setRelated(data.related || []);
          if (data.product.variants?.length > 0) {
            const firstAvailable = data.product.variants.find((v: any) => v.stock > 0) || data.product.variants[0];
            setSelectedSize(firstAvailable.size);
            setSelectedColor(firstAvailable.color);
          }
          fetchReviews(data.product.id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slugOrId]);

  const fetchReviews = (prodId: string) => {
    apiFetch(`/api/reviews/${prodId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setReviewsList(data);
      })
      .catch(() => {});
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center animate-pulse">
        <div className="h-96 bg-[#ece9e2] rounded-xl mb-8" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-semibold text-[#111113] font-display">Silhouette Not Found</h2>
        <p className="text-xs text-zinc-500">This pair may have sold through its current leather batch.</p>
        <button
          onClick={() => onNavigate('shop')}
          className="px-6 py-2.5 bg-[#111113] text-white rounded-lg text-xs font-medium cursor-pointer"
        >
          Return to Collection
        </button>
      </div>
    );
  }

  const isLiked = isInWishlist(product.id);
  const uniqueColors = Array.from(new Set(product.variants.map((v) => v.color)));
  const uniqueSizes = Array.from(new Set(product.variants.map((v) => v.size)));

  const activeColor = selectedColor || uniqueColors[0] || '';
  const activeSize = selectedSize || uniqueSizes[0] || '';

  const matchedVariant = product.variants.find((v) => v.size === activeSize && v.color === activeColor);
  const availableStock = matchedVariant ? matchedVariant.stock : 0;

  const currentPrice = matchedVariant?.priceOverrideBDT || product.salePriceBDT || product.regularPriceBDT;
  const regularPrice = product.regularPriceBDT;
  const isOnSale = Boolean(currentPrice < regularPrice);

  const rawWhatsapp = settings?.whatsappNumber || '+8801623604635';
  const cleanWhatsapp = rawWhatsapp.replace(/[^0-9]/g, '') || '8801623604635';
  const whatsappOrderText = encodeURIComponent(
    `Hello BDTechZen Atelier, I would like to reserve via Cash on Delivery:\n• Pair: ${product.name}\n• SKU: ${matchedVariant?.skuVariant || product.sku}\n• Finish: ${activeColor}\n• EU Size: ${activeSize}\n• Quantity: ${quantity}\n• Total: ৳${(currentPrice * quantity).toLocaleString('en-BD')}`
  );

  const handleColorSwitch = (newColor: string, colorIdx: number) => {
    setSelectedColor(newColor);
    if (product.images.length > 1) {
      setActiveImageIndex(colorIdx % product.images.length);
    }
    const hasCurrentSize = product.variants.some(
      (v) => v.color === newColor && v.size === activeSize && v.stock > 0
    );
    if (!hasCurrentSize) {
      const fallbackVariant = product.variants.find((v) => v.color === newColor && v.stock > 0);
      if (fallbackVariant) setSelectedSize(fallbackVariant.size);
    }
  };

  const handleAddToCart = () => {
    addToCart(product, activeSize, activeColor, quantity);
  };

  const handleBuyNow = () => {
    const res = addToCart(product, activeSize, activeColor, quantity);
    if (res.success) {
      onNavigate('checkout');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName || !reviewComment) {
      showToast('Please enter your name and fit notes', 'error');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await apiFetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          userName: reviewName,
          userCountry: country,
          rating: reviewRating,
          title: reviewTitle || 'Fit & Leather Impressions',
          comment: reviewComment
        })
      });

      if (res.ok) {
        showToast('Thank you — your review is now live.', 'success');
        setReviewComment('');
        setReviewTitle('');
        fetchReviews(product.id);
      } else {
        showToast('Unable to publish review right now', 'error');
      }
    } catch {
      showToast('Connection error while posting review', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 lg:pb-16 space-y-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-zinc-500">
        <button onClick={() => onNavigate('home')} className="hover:text-[#111113] cursor-pointer">
          Home
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
        <button onClick={() => onNavigate('shop')} className="hover:text-[#111113] cursor-pointer">
          All Footwear
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
        <button
          onClick={() => onNavigate('shop', { category: product.category })}
          className="capitalize hover:text-[#111113] cursor-pointer"
        >
          {product.category.replace('-', ' ')}
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
        <span className="text-[#111113] font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Contiguous Purchase Module */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Sticky Gallery */}
        <div className="lg:col-span-7 space-y-3.5 lg:sticky lg:top-24">
          <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-[#f1efea] border border-[#e5e2da]">
            <img
              src={product.images[activeImageIndex] || product.images[0] || FALLBACK_SHOE_IMG}
              alt={product.name}
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = FALLBACK_SHOE_IMG;
              }}
              className="w-full h-full object-cover object-center"
            />
            {(product.ribbonText || isOnSale) && (
              <span className="absolute top-4 left-4 bg-[#111113]/90 text-white text-[11px] font-medium px-2.5 py-1 rounded tracking-wide">
                {product.ribbonText || 'Seasonal Price'}
              </span>
            )}
            <button
              onClick={() => toggleWishlist(product.id)}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-white/95 text-[#111113] border border-[#e5e2da] hover:bg-[#111113] hover:text-white transition-colors cursor-pointer"
              aria-label="Save to Wishlist"
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
          </div>

          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border transition-opacity shrink-0 cursor-pointer bg-[#f1efea] ${
                    activeImageIndex === idx
                      ? 'border-[#111113] ring-1 ring-[#111113] opacity-100'
                      : 'border-[#dedad0] opacity-65 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} studio angle ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = FALLBACK_SHOE_IMG;
                    }}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Sticky Purchase Module */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
              <span>
                {product.brand} <span aria-hidden="true">·</span>{' '}
                <span className="capitalize">{product.category.replace('-', ' ')}</span>
              </span>
              <span className="font-mono text-[11px]">SKU {matchedVariant?.skuVariant || product.sku}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-semibold text-[#111113] font-display tracking-tight leading-snug">
              {product.name}
            </h1>

            <div className="flex items-center gap-2 mt-2 text-xs text-zinc-600">
              <span className="text-[#111113] font-medium">★ {product.rating}</span>
              <span aria-hidden="true">·</span>
              <button
                onClick={() => setActiveTab('reviews')}
                className="underline underline-offset-4 hover:text-[#111113] cursor-pointer"
              >
                {reviewsList.length || product.reviewCount} client fit notes
              </button>
            </div>

            <div className="mt-5 flex flex-wrap items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-semibold text-[#111113] font-mono tabular-nums">
                ৳{currentPrice.toLocaleString('en-BD')}
              </span>
              {isOnSale && (
                <span className="text-base text-zinc-400 line-through font-mono tabular-nums">
                  ৳{regularPrice.toLocaleString('en-BD')}
                </span>
              )}
              <span className="text-xs text-zinc-600">
                <span aria-hidden="true">·</span> Cash on Delivery available
              </span>
            </div>
          </div>

          <p className="text-sm text-zinc-600 leading-relaxed">{product.description}</p>

          {/* Color Variants */}
          <div className="space-y-2.5 pt-5 border-t border-[#e5e2da]">
            <label className="block text-xs font-semibold font-display text-[#111113]">
              Leather / Upper Finish: <span className="text-zinc-600 font-sans font-normal">{activeColor}</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {uniqueColors.map((color, cIdx) => {
                const sample = product.variants.find((v) => v.color === color);
                const hasOverride =
                  sample?.priceOverrideBDT &&
                  sample.priceOverrideBDT !== (product.salePriceBDT || product.regularPriceBDT);
                return (
                  <button
                    key={color}
                    onClick={() => handleColorSwitch(color, cIdx)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs rounded-lg border font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      activeColor === color
                        ? 'border-[#111113] bg-[#111113] text-white'
                        : 'border-[#dedad0] text-zinc-800 hover:border-[#111113] bg-white'
                    }`}
                  >
                    {sample?.colorHex && (
                      <span
                        className="w-3 h-3 rounded-full border border-black/15 shrink-0"
                        style={{ backgroundColor: sample.colorHex }}
                      />
                    )}
                    <span>{color}</span>
                    {hasOverride && (
                      <span className={`font-mono text-[10px] ${activeColor === color ? 'text-zinc-300' : 'text-zinc-400'}`}>
                        ৳{sample?.priceOverrideBDT?.toLocaleString('en-BD')}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size Variants */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold font-display text-[#111113]">
                Size (EU): <span className="font-mono font-normal text-zinc-600">{activeSize}</span>
              </label>
              <button
                onClick={() => setIsSizeGuideOpen(true)}
                className="text-xs text-zinc-700 hover:text-[#111113] font-medium flex items-center gap-1 underline underline-offset-4 cursor-pointer"
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>Last & Size Guide</span>
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {uniqueSizes.map((size) => {
                const variant = product.variants.find((v) => v.size === size && v.color === activeColor);
                const stock = variant?.stock || 0;
                const isOutOfStock = stock <= 0;

                return (
                  <button
                    key={size}
                    disabled={isOutOfStock}
                    onClick={() => setSelectedSize(size)}
                    className={`py-2.5 text-xs font-mono tabular-nums font-medium rounded-lg border text-center transition-colors cursor-pointer ${
                      activeSize === size
                        ? 'border-[#111113] bg-[#111113] text-white'
                        : isOutOfStock
                        ? 'border-[#ece9e2] bg-[#f4f2ed] text-zinc-300 line-through cursor-not-allowed'
                        : 'border-[#dedad0] text-[#111113] hover:border-[#111113] bg-white'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>

            <div className="pt-1 text-xs">
              {availableStock > 0 && availableStock < 10 ? (
                <span className="text-amber-800 font-medium">
                  Small batch — {availableStock} pair{availableStock === 1 ? '' : 's'} remaining in {activeColor} (EU {activeSize}).
                </span>
              ) : availableStock >= 10 ? (
                <span className="text-emerald-800 font-medium flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> In stock in Dhaka — dispatches within 24 hours
                </span>
              ) : (
                <span className="text-red-700 font-medium">Currently sold out in EU {activeSize}</span>
              )}
            </div>
          </div>

          {/* Quantity & CTAs */}
          <div className="space-y-3 pt-2">
            <div className="flex gap-3">
              <div className="flex items-center border border-[#dedad0] rounded-lg bg-white px-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-2.5 py-1 text-zinc-600 hover:text-[#111113] cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="px-3 text-xs font-mono tabular-nums font-semibold text-[#111113]">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(Math.max(1, availableStock), quantity + 1))}
                  className="px-2.5 py-1 text-zinc-600 hover:text-[#111113] cursor-pointer"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={availableStock <= 0}
                className="flex-1 py-3 px-4 bg-white border border-[#111113] text-[#111113] hover:bg-[#f1efea] disabled:border-zinc-300 disabled:text-zinc-300 rounded-lg text-xs font-semibold font-display flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Bag</span>
              </button>
            </div>

            <button
              onClick={handleBuyNow}
              disabled={availableStock <= 0}
              className="w-full py-3.5 px-4 bg-[#111113] hover:bg-zinc-800 disabled:bg-zinc-300 text-white rounded-lg text-xs font-semibold font-display transition-colors cursor-pointer"
            >
              Order Now — Cash on Delivery / bKash
            </button>

            <a
              href={`https://wa.me/${cleanWhatsapp}?text=${whatsappOrderText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 bg-white border border-[#dedad0] hover:border-[#111113] text-[#111113] rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-700" />
              <span>Consult Sizing Desk on WhatsApp ({rawWhatsapp})</span>
            </a>
          </div>

          {/* Bangladesh COD, SMS & Delivery Card */}
          <div className="p-4 bg-white rounded-xl border border-[#e5e2da] space-y-2 text-xs">
            <div className="flex items-center gap-2 font-semibold font-display text-[#111113]">
              <Truck className="w-4 h-4 text-zinc-700" />
              <span>Doorstep Delivery, Instant SMS & 7-Day Size Swap</span>
            </div>
            <p className="text-zinc-600 leading-relaxed text-[11px]">
              You will receive an instant SMS confirmation on your mobile number and an emailed invoice as soon as your order is placed. Inside Dhaka: 24–48 hours (৳{settings?.shippingBD.insideDhaka || 70}). Nationwide districts: 2–4 business days (৳{settings?.shippingBD.outsideDhaka || 130}). Complimentary shipping above ৳{(settings?.shippingBD.freeShippingThreshold || 3000).toLocaleString('en-BD')}.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="pt-8 border-t border-[#e5e2da]">
        <div className="flex gap-8 border-b border-[#e5e2da] text-sm font-medium font-display overflow-x-auto">
          <button
            onClick={() => setActiveTab('specs')}
            className={`pb-3 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'specs' ? 'border-b-2 border-[#111113] text-[#111113] font-semibold' : 'text-zinc-500 hover:text-[#111113]'
            }`}
          >
            Construction & Materials
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'reviews' ? 'border-b-2 border-[#111113] text-[#111113] font-semibold' : 'text-zinc-500 hover:text-[#111113]'
            }`}
          >
            Client Fit Notes ({reviewsList.length})
          </button>
          <button
            onClick={() => setActiveTab('shipping')}
            className={`pb-3 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'shipping' ? 'border-b-2 border-[#111113] text-[#111113] font-semibold' : 'text-zinc-500 hover:text-[#111113]'
            }`}
          >
            Delivery, COD & Size Exchange
          </button>
        </div>

        <div className="py-8">
          {activeTab === 'specs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
              {Object.entries(product.specifications || {}).length === 0 ? (
                <p className="text-xs text-zinc-500">Finished on BDTechZen anatomical lasts in Dhaka.</p>
              ) : (
                Object.entries(product.specifications).map(([key, val]) => (
                  <div key={key} className="p-4 bg-white rounded-xl border border-[#e5e2da] text-xs">
                    <span className="font-medium text-zinc-400 block text-[11px]">{key}</span>
                    <span className="font-medium text-[#111113] mt-0.5 block">{val}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
              <div className="md:col-span-7 space-y-4">
                {reviewsList.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-6">Be the first client in Bangladesh to share fit notes on this pair.</p>
                ) : (
                  reviewsList.map((rev) => (
                    <div key={rev.id} className="p-5 bg-white rounded-xl border border-[#e5e2da] space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-zinc-500">
                          <span className="font-semibold font-display text-[#111113]">{rev.userName}</span>
                          {rev.isVerifiedPurchase && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-emerald-800 font-medium">Verified Buyer</span>
                            </>
                          )}
                        </div>
                        <span className="text-[#111113] font-mono">{'★'.repeat(rev.rating)}</span>
                      </div>
                      <h4 className="font-semibold text-[#111113]">{rev.title}</h4>
                      <p className="text-zinc-600 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="md:col-span-5 bg-white p-6 rounded-xl border border-[#e5e2da] space-y-4">
                <h3 className="text-sm font-semibold text-[#111113] font-display">Share Your Fit Notes</h3>
                <form onSubmit={handleReviewSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-medium text-zinc-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      placeholder="e.g. Tariqul Islam"
                      required
                      className="w-full px-3 py-2 bg-[#f7f6f2] border border-[#dedad0] rounded-lg focus:outline-none focus:border-[#111113]"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-zinc-700 mb-1">Rating</label>
                    <select
                      value={reviewRating}
                      onChange={(e) => setReviewRating(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#f7f6f2] border border-[#dedad0] rounded-lg"
                    >
                      <option value={5}>5 Stars — Exceptional fit & finish</option>
                      <option value={4}>4 Stars — Very comfortable</option>
                      <option value={3}>3 Stars — Good everyday wear</option>
                      <option value={2}>2 Stars — Fit ran slightly snug</option>
                      <option value={1}>1 Star — Not as expected</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-zinc-700 mb-1">Summary</label>
                    <input
                      type="text"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      placeholder="e.g. Zero heel slip from day one"
                      className="w-full px-3 py-2 bg-[#f7f6f2] border border-[#dedad0] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-zinc-700 mb-1">Fit & Leather Impressions *</label>
                    <textarea
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="How did the EU size fit your instep? How is the leather creasing?"
                      required
                      className="w-full px-3 py-2 bg-[#f7f6f2] border border-[#dedad0] rounded-lg focus:outline-none focus:border-[#111113]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="w-full py-2.5 bg-[#111113] text-white font-medium rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    {submittingReview ? 'Publishing...' : 'Publish Review'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="max-w-2xl text-xs space-y-4 text-zinc-600 leading-relaxed">
              <h4 className="text-sm font-semibold text-[#111113] font-display">
                Hand-Finished Inspection, Instant SMS Confirmation & Doorstep Size Exchange
              </h4>
              <p>
                Before leaving our Dhaka studio, each pair is brushed, checked for stitch tension and welt alignment, and packed in a double-wall box with individual cotton dust bags.
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>Instant Mobile SMS & Email Receipt:</strong> As soon as you confirm your order, our system dispatches a confirmation SMS to your mobile number and an itemized receipt to your email.
                </li>
                <li>
                  <strong>Cash on Delivery Nationwide:</strong> Settle in cash with the courier rider upon parcel handover anywhere across all 8 divisions of Bangladesh.
                </li>
                <li>
                  <strong>Dhaka Metro Express:</strong> 24–48 hours (৳{settings?.shippingBD.insideDhaka || 70}).
                </li>
                <li>
                  <strong>All 64 Districts:</strong> 2–4 business days via Steadfast, Pathao, or RedX (৳{settings?.shippingBD.outsideDhaka || 130}).
                </li>
                <li>
                  <strong>7-Day Doorstep Size Swap:</strong> If your pair feels snug across the instep, request a size swap within 7 days of delivery for unworn pairs.
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Related Footwear */}
      {related.length > 0 && (
        <div className="pt-12 border-t border-[#e5e2da]">
          <div className="mb-6">
            <p className="text-xs text-zinc-500">From the Same Last Archive</p>
            <h3 className="text-xl font-semibold text-[#111113] font-display mt-0.5">Complementary Pairs</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {related.slice(0, 3).map((p) => (
              <ProductCard key={p.id} product={p} onSelect={onSelectProduct} />
            ))}
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom Buy Bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#e5e2da] px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold font-display text-[#111113] truncate">{product.name}</p>
          <p className="text-xs font-mono tabular-nums font-semibold text-[#111113]">
            ৳{currentPrice.toLocaleString('en-BD')} <span className="text-[11px] font-sans font-normal text-zinc-500">· EU {activeSize} · COD</span>
          </p>
        </div>
        <button
          onClick={handleBuyNow}
          disabled={availableStock <= 0}
          className="px-5 py-2.5 bg-[#111113] hover:bg-zinc-800 disabled:bg-zinc-300 text-white rounded-lg text-xs font-semibold font-display shrink-0 cursor-pointer whitespace-nowrap"
        >
          Order Now
        </button>
      </div>

      {/* Size Guide Modal */}
      {isSizeGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsSizeGuideOpen(false)} className="fixed inset-0 bg-[#0e0e10]/60 backdrop-blur-xs" />
          <div className="relative bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl z-10 space-y-4 border border-[#e5e2da]">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5e2da]">
              <h3 className="text-base font-semibold text-[#111113] font-display">BDTechZen EU / UK Last Sizing</h3>
              <button onClick={() => setIsSizeGuideOpen(false)} className="text-zinc-400 hover:text-[#111113] cursor-pointer">
                ✕
              </button>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Our footwear follows European (EU) sizing with slightly relaxed instep volume suited to South Asian feet. Measure heel-to-toe barefoot on paper; if between sizes, step up one EU size.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#f1efea] text-[#111113]">
                  <tr>
                    <th className="p-2 font-semibold">EU</th>
                    <th className="p-2 font-semibold">UK</th>
                    <th className="p-2 font-semibold">US Men</th>
                    <th className="p-2 font-semibold">US Women</th>
                    <th className="p-2 font-semibold">Heel-to-Toe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ece9e2] font-mono tabular-nums">
                  <tr><td className="p-2 font-semibold">36</td><td className="p-2">3.5</td><td className="p-2">—</td><td className="p-2">5.5</td><td className="p-2">23.0 cm</td></tr>
                  <tr><td className="p-2 font-semibold">37</td><td className="p-2">4.0</td><td className="p-2">—</td><td className="p-2">6.5</td><td className="p-2">23.5 cm</td></tr>
                  <tr><td className="p-2 font-semibold">38</td><td className="p-2">5.0</td><td className="p-2">6.0</td><td className="p-2">7.0</td><td className="p-2">24.0 cm</td></tr>
                  <tr><td className="p-2 font-semibold">39</td><td className="p-2">5.5</td><td className="p-2">6.5</td><td className="p-2">8.0</td><td className="p-2">24.5 cm</td></tr>
                  <tr><td className="p-2 font-semibold">40</td><td className="p-2">6.5</td><td className="p-2">7.5</td><td className="p-2">8.5</td><td className="p-2">25.0 cm</td></tr>
                  <tr><td className="p-2 font-semibold">41</td><td className="p-2">7.0</td><td className="p-2">8.0</td><td className="p-2">9.5</td><td className="p-2">26.0 cm</td></tr>
                  <tr><td className="p-2 font-semibold">42</td><td className="p-2">8.0</td><td className="p-2">9.0</td><td className="p-2">10.0</td><td className="p-2">26.5 cm</td></tr>
                  <tr><td className="p-2 font-semibold">43</td><td className="p-2">9.0</td><td className="p-2">10.0</td><td className="p-2">—</td><td className="p-2">27.5 cm</td></tr>
                  <tr><td className="p-2 font-semibold">44</td><td className="p-2">9.5</td><td className="p-2">10.5</td><td className="p-2">—</td><td className="p-2">28.0 cm</td></tr>
                  <tr><td className="p-2 font-semibold">45</td><td className="p-2">10.5</td><td className="p-2">11.5</td><td className="p-2">—</td><td className="p-2">29.0 cm</td></tr>
                </tbody>
              </table>
            </div>
            <button
              onClick={() => setIsSizeGuideOpen(false)}
              className="w-full py-2.5 bg-[#111113] text-white rounded-lg text-xs font-medium cursor-pointer"
            >
              Close Guide
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
