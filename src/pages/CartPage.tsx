import React, { useState } from 'react';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Truck } from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface CartPageProps {
  onNavigate: (page: string) => void;
}

export const CartPage: React.FC<CartPageProps> = ({ onNavigate }) => {
  const {
    cart,
    removeFromCart,
    updateCartQuantity,
    cartSubtotal,
    settings,
    appliedCoupon,
    applyCouponCode,
    removeCouponCode
  } = useStore();

  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [shippingDestination, setShippingDestination] = useState<'inside_dhaka' | 'outside_dhaka'>('inside_dhaka');

  const freeThreshold = settings?.shippingBD.freeShippingThreshold || 3000;
  const isFreeShipping = cartSubtotal >= freeThreshold;

  let shippingCharge = 0;
  if (!isFreeShipping) {
    shippingCharge =
      shippingDestination === 'inside_dhaka'
        ? settings?.shippingBD.insideDhaka || 70
        : settings?.shippingBD.outsideDhaka || 130;
  }

  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
  const grandTotal = Math.max(0, cartSubtotal - discountAmount + shippingCharge);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    setCouponLoading(true);
    const res = await applyCouponCode(couponInput);
    setCouponLoading(false);
    if (!res.success) {
      setCouponError(res.message);
    } else {
      setCouponInput('');
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4">
        <ShoppingBag className="w-12 h-12 text-zinc-300 mx-auto stroke-[1.5]" />
        <h2 className="text-2xl font-semibold text-[#111113] font-display">Your Shopping Bag Is Empty</h2>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
          Explore our full-grain calfskin loafers, Blake-stitched dress shoes, and everyday court sneakers.
        </p>
        <button
          onClick={() => onNavigate('shop')}
          className="px-6 py-2.5 bg-[#111113] text-white rounded-lg text-xs font-medium hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          Browse Collection
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="pb-6 border-b border-[#e5e2da]">
        <p className="text-xs text-zinc-500">Dhaka Dispatch &amp; Nationwide Courier</p>
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#111113] font-display tracking-tight mt-0.5">
          Shopping Bag
        </h1>
        <p className="text-xs text-zinc-600 mt-1">
          Review your selected footwear and estimate courier delivery across Bangladesh.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Items */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-xl border border-[#e5e2da] overflow-hidden divide-y divide-[#ece9e2]">
            {cart.map((item) => (
              <div
                key={`${item.productId}-${item.size}-${item.color}`}
                className="p-4 sm:p-6 flex gap-4 sm:gap-6 items-center"
              >
                <img
                  src={item.image || '/src/assets/images/hero_atelier_lookbook_1792778291527.jpg'}
                  alt={item.productName}
                  referrerPolicy="no-referrer"
                  className="w-24 h-24 object-cover rounded-lg bg-[#f1efea] border border-[#e5e2da] shrink-0"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-sm font-semibold font-display text-[#111113]">{item.productName}</h3>
                    <button
                      onClick={() => removeFromCart(item.productId, item.size, item.color)}
                      className="text-zinc-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-zinc-500">
                    EU {item.size} <span aria-hidden="true">·</span> {item.color}
                  </p>

                  <div className="flex items-center justify-between pt-3">
                    <div className="flex items-center border border-[#dedad0] rounded-md bg-[#f7f6f2]">
                      <button
                        onClick={() => updateCartQuantity(item.productId, item.size, item.color, item.quantity - 1)}
                        className="px-2.5 py-1 text-zinc-600 hover:text-[#111113] cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-3 text-xs font-mono tabular-nums font-semibold text-[#111113]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.productId, item.size, item.color, item.quantity + 1)}
                        className="px-2.5 py-1 text-zinc-600 hover:text-[#111113] cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-semibold text-[#111113] font-mono tabular-nums">
                        ৳{(item.priceBDT * item.quantity).toLocaleString('en-BD')}
                      </span>
                      {item.quantity > 1 && (
                        <span className="block text-[11px] text-zinc-400 font-mono tabular-nums">
                          ৳{item.priceBDT.toLocaleString('en-BD')} each
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-1">
            <button
              onClick={() => onNavigate('shop')}
              className="text-xs font-medium text-[#111113] hover:text-zinc-600 underline underline-offset-4 cursor-pointer"
            >
              ← Return to Collection
            </button>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-xl border border-[#e5e2da] p-6 space-y-6">
            <h2 className="text-sm font-semibold text-[#111113] font-display">Bag Summary</h2>

            {/* Delivery Zone Selector */}
            <div className="space-y-2 text-xs">
              <label className="block font-medium text-zinc-700 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-[#111113]" />
                <span>Delivery Destination</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShippingDestination('inside_dhaka')}
                  className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                    shippingDestination === 'inside_dhaka'
                      ? 'border-[#111113] bg-[#111113] text-white'
                      : 'border-[#dedad0] text-zinc-700 hover:border-[#111113]'
                  }`}
                >
                  <span className="block font-semibold">Inside Dhaka</span>
                  <span className="text-[11px] opacity-80 font-mono tabular-nums">
                    ৳{settings?.shippingBD.insideDhaka || 70} · 24–48h
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setShippingDestination('outside_dhaka')}
                  className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                    shippingDestination === 'outside_dhaka'
                      ? 'border-[#111113] bg-[#111113] text-white'
                      : 'border-[#dedad0] text-zinc-700 hover:border-[#111113]'
                  }`}
                >
                  <span className="block font-semibold">Outside Dhaka</span>
                  <span className="text-[11px] opacity-80 font-mono tabular-nums">
                    ৳{settings?.shippingBD.outsideDhaka || 130} · 2–4d
                  </span>
                </button>
              </div>
            </div>

            {/* Coupon */}
            <div className="pt-2 border-t border-[#ece9e2]">
              {appliedCoupon ? (
                <div className="flex items-center justify-between px-3 py-2 bg-[#f7f6f2] border border-[#dedad0] rounded-lg text-xs text-[#111113]">
                  <div>
                    <span className="font-semibold font-mono">{appliedCoupon.code}</span>
                    <span className="ml-1 text-[11px] text-emerald-800 font-mono tabular-nums">
                      (-৳{appliedCoupon.discount.toLocaleString('en-BD')})
                    </span>
                  </div>
                  <button
                    onClick={removeCouponCode}
                    className="font-medium underline hover:text-zinc-600 cursor-pointer"
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
                      className="flex-1 px-3 py-2 text-xs bg-[#f7f6f2] border border-[#dedad0] rounded-lg font-mono uppercase focus:outline-none focus:border-[#111113]"
                    />
                    <button
                      type="submit"
                      disabled={couponLoading}
                      className="px-4 py-2 bg-[#111113] hover:bg-zinc-800 text-white text-xs font-medium rounded-lg cursor-pointer whitespace-nowrap"
                    >
                      {couponLoading ? 'Checking...' : 'Apply'}
                    </button>
                  </div>
                  {couponError && <p className="text-[11px] text-red-600">{couponError}</p>}
                </form>
              )}
            </div>

            {/* Totals */}
            <div className="space-y-2 text-xs text-zinc-600 pt-3 border-t border-[#ece9e2]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums text-[#111113] font-medium">
                  ৳{cartSubtotal.toLocaleString('en-BD')}
                </span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-emerald-800">
                  <span>Courtesy Discount ({appliedCoupon.code})</span>
                  <span className="font-mono tabular-nums font-medium">
                    -৳{appliedCoupon.discount.toLocaleString('en-BD')}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Courier Delivery</span>
                <span className="font-mono tabular-nums text-[#111113] font-medium">
                  {isFreeShipping ? <span className="text-emerald-800 font-semibold">Complimentary</span> : `৳${shippingCharge}`}
                </span>
              </div>
              <div className="flex justify-between items-baseline text-base font-semibold text-[#111113] pt-3 border-t border-[#e5e2da]">
                <span className="font-display">Estimated Total</span>
                <span className="font-mono tabular-nums text-lg text-[#111113]">
                  ৳{grandTotal.toLocaleString('en-BD')}
                </span>
              </div>
            </div>

            <button
              onClick={() => onNavigate('checkout')}
              className="w-full py-3.5 bg-[#111113] hover:bg-zinc-800 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-[11px] text-center text-zinc-500">
              Cash on Delivery, bKash, Nagad &amp; SSLCOMMERZ · Instant SMS &amp; Email confirmation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
