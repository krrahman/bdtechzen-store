import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, Check } from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface CartDrawerProps {
  onNavigate: (page: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onNavigate }) => {
  const {
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    cart,
    removeFromCart,
    updateCartQuantity,
    cartSubtotal,
    cartCount,
    settings,
    appliedCoupon,
    applyCouponCode,
    removeCouponCode
  } = useStore();

  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  if (!isCartDrawerOpen) return null;

  const freeThreshold = settings?.shippingBD.freeShippingThreshold || 3000;
  const amountToFreeShipping = Math.max(0, freeThreshold - cartSubtotal);
  const progressPercent = Math.min(100, Math.round((cartSubtotal / freeThreshold) * 100));

  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
  const estimatedTotal = Math.max(0, cartSubtotal - discountAmount);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    setCouponLoading(true);
    const result = await applyCouponCode(couponInput);
    setCouponLoading(false);
    if (!result.success) {
      setCouponError(result.message);
    } else {
      setCouponInput('');
    }
  };

  const handleCheckoutClick = () => {
    setIsCartDrawerOpen(false);
    onNavigate('checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        onClick={() => setIsCartDrawerOpen(false)}
        className="absolute inset-0 bg-[#0e0e10]/55 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#f7f6f2] shadow-2xl flex flex-col border-l border-[#e5e2da]">
          {/* Header */}
          <div className="px-5 py-4 sm:px-6 bg-white border-b border-[#e5e2da] flex items-center justify-between">
            <div className="flex items-baseline gap-2.5">
              <h2 className="text-base font-semibold text-[#111113] font-display tracking-tight">Shopping Bag</h2>
              <span className="text-xs text-zinc-500 font-mono tabular-nums">
                {cartCount} {cartCount === 1 ? 'pair' : 'pairs'}
              </span>
            </div>
            <button
              onClick={() => setIsCartDrawerOpen(false)}
              className="p-2 text-zinc-500 hover:text-[#111113] rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
              aria-label="Close bag drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Free Shipping Progress */}
          <div className="bg-[#f1efea] px-5 py-3 border-b border-[#e5e2da] text-xs">
            {amountToFreeShipping > 0 ? (
              <p className="text-zinc-700">
                Add <span className="font-semibold text-[#111113] font-mono tabular-nums">৳{amountToFreeShipping.toLocaleString('en-BD')}</span> more for complimentary nationwide delivery.
              </p>
            ) : (
              <p className="text-[#111113] font-medium flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-700" /> Complimentary nationwide delivery unlocked
              </p>
            )}
            <div className="w-full bg-[#dedad0] h-1 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#111113] h-full transition-transform duration-200 origin-left"
                style={{ transform: `scaleX(${progressPercent / 100})` }}
              />
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3.5">
            {cart.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <ShoppingBag className="w-10 h-10 text-zinc-300 mx-auto stroke-[1.5]" />
                <h3 className="text-base font-semibold font-display text-[#111113]">Your bag is currently empty</h3>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
                  Explore our full-grain calfskin loafers, Blake-stitched dress shoes, and everyday court sneakers.
                </p>
                <button
                  onClick={() => {
                    setIsCartDrawerOpen(false);
                    onNavigate('shop');
                  }}
                  className="mt-3 px-5 py-2.5 bg-[#111113] text-white rounded-lg text-xs font-medium hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Browse Footwear
                </button>
              </div>
            ) : (
              cart.map((item) => {
                const unitPrice = item.priceBDT;
                return (
                  <div
                    key={`${item.productId}-${item.size}-${item.color}`}
                    className="flex gap-3.5 p-3.5 bg-white rounded-xl border border-[#e5e2da]"
                  >
                    <img
                      src={item.image || '/src/assets/images/hero_atelier_lookbook_1792778291527.jpg'}
                      alt={item.productName}
                      referrerPolicy="no-referrer"
                      className="w-20 h-20 object-cover rounded-lg bg-[#f1efea] shrink-0"
                    />
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-xs font-semibold text-[#111113] line-clamp-1 font-display">
                            {item.productName}
                          </h4>
                          <button
                            onClick={() => removeFromCart(item.productId, item.size, item.color)}
                            className="text-zinc-400 hover:text-red-600 transition-colors shrink-0 cursor-pointer"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          EU {item.size} <span aria-hidden="true">·</span> {item.color}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border border-[#dedad0] rounded-md bg-[#f7f6f2]">
                          <button
                            onClick={() => updateCartQuantity(item.productId, item.size, item.color, item.quantity - 1)}
                            className="p-1.5 hover:bg-zinc-200/60 text-zinc-700 cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 text-xs font-mono tabular-nums font-medium text-[#111113]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(item.productId, item.size, item.color, item.quantity + 1)}
                            className="p-1.5 hover:bg-zinc-200/60 text-zinc-700 cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="text-xs font-semibold text-[#111113] font-mono tabular-nums">
                          ৳{(unitPrice * item.quantity).toLocaleString('en-BD')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Summary */}
          {cart.length > 0 && (
            <div className="p-5 sm:p-6 border-t border-[#e5e2da] bg-white space-y-4">
              {appliedCoupon ? (
                <div className="flex items-center justify-between px-3 py-2 bg-[#f7f6f2] border border-[#dedad0] rounded-lg text-xs text-[#111113]">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold font-mono">{appliedCoupon.code}</span>
                    <span className="text-emerald-700 font-mono tabular-nums">(-৳{appliedCoupon.discount.toLocaleString('en-BD')})</span>
                  </div>
                  <button
                    onClick={removeCouponCode}
                    className="text-zinc-600 font-medium hover:text-[#111113] underline underline-offset-2 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="space-y-1">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Courtesy code (e.g. ZEN10)"
                      className="flex-1 px-3 py-2 text-xs bg-[#f7f6f2] border border-[#dedad0] rounded-lg uppercase font-mono focus:outline-none focus:border-[#111113]"
                    />
                    <button
                      type="submit"
                      disabled={couponLoading}
                      className="px-4 py-2 bg-[#111113] hover:bg-zinc-800 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {couponLoading ? 'Applying...' : 'Apply'}
                    </button>
                  </div>
                  {couponError && <p className="text-[11px] text-red-600">{couponError}</p>}
                </form>
              )}

              <div className="space-y-1.5 text-xs text-zinc-600 pt-2 border-t border-[#ece9e2]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono tabular-nums text-[#111113] font-medium">
                    ৳{cartSubtotal.toLocaleString('en-BD')}
                  </span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Courtesy Discount</span>
                    <span className="font-mono tabular-nums font-medium">
                      -৳{appliedCoupon.discount.toLocaleString('en-BD')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Courier Delivery</span>
                  <span className="text-zinc-500">
                    {amountToFreeShipping === 0 ? 'Complimentary' : 'Calculated at checkout'}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-[#111113] pt-2.5 border-t border-[#e5e2da]">
                  <span className="font-display">Estimated Total</span>
                  <span className="font-mono tabular-nums">
                    ৳{estimatedTotal.toLocaleString('en-BD')}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleCheckoutClick}
                  className="w-full py-3 bg-[#111113] hover:bg-zinc-800 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-[11px] text-center text-zinc-500">
                  Cash on Delivery available nationwide · Instant SMS & Email receipt
                </p>
                <button
                  onClick={() => {
                    setIsCartDrawerOpen(false);
                    onNavigate('cart');
                  }}
                  className="w-full py-1.5 text-zinc-600 hover:text-[#111113] text-xs font-medium transition-colors text-center block cursor-pointer"
                >
                  Open Full Bag & Delivery Estimator
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
