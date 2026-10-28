import React, { useState } from 'react';
import { Lock, CheckCircle2, AlertCircle, Mail, Smartphone } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Order } from '../types';
import { apiFetch } from '../lib/staticApiFallback';
import { sendFormSubmitEmail } from '../lib/adminAlertClient';

interface CheckoutPageProps {
  onOrderSuccess: (order: Order, paymentData?: any) => void;
  onNavigate: (page: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onOrderSuccess, onNavigate }) => {
  const {
    cart,
    cartSubtotal,
    appliedCoupon,
    clearCart,
    customerUser,
    settings,
    showToast
  } = useStore();

  const [customerName, setCustomerName] = useState(customerUser?.name || '');
  const [customerEmail, setCustomerEmail] = useState(customerUser?.email || '');
  const [customerPhone, setCustomerPhone] = useState(customerUser?.phone || '');
  const [stateDivision, setStateDivision] = useState('Dhaka Division');
  const [city, setCity] = useState('Dhaka');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bkash' | 'nagad' | 'rocket' | 'sslcommerz'>('cod');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [activePaymentModal, setActivePaymentModal] = useState<{
    order: Order;
    paymentInfo: any;
    trxIdInput: string;
  } | null>(null);

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-semibold text-[#111113] font-display">Your Bag Is Empty</h2>
        <p className="text-xs text-zinc-500">Select a pair from our collection before proceeding to checkout.</p>
        <button
          onClick={() => onNavigate('shop')}
          className="px-6 py-2.5 bg-[#111113] text-white rounded-lg text-xs font-medium hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          Browse Collection
        </button>
      </div>
    );
  }

  const freeThreshold = settings?.shippingBD.freeShippingThreshold || 3000;
  const isFreeShipping = cartSubtotal >= freeThreshold;
  const isDhaka = city.toLowerCase().includes('dhaka') || stateDivision.toLowerCase().includes('dhaka');
  const shippingCharge = isFreeShipping
    ? 0
    : isDhaka
    ? settings?.shippingBD.insideDhaka || 70
    : settings?.shippingBD.outsideDhaka || 130;

  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
  const grandTotal = Math.max(0, cartSubtotal - discountAmount + shippingCharge);

  const validatePhone = (ph: string): boolean => {
    const clean = ph.replace(/\D/g, '');
    return clean.length === 11 || (clean.startsWith('880') && clean.length === 13);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customerName.trim() || !customerPhone.trim() || !customerEmail.trim() || !address.trim() || !city.trim()) {
      setErrorMsg('Please enter your full name, 11-digit mobile number, email address, and complete delivery address.');
      return;
    }

    if (!validatePhone(customerPhone)) {
      setErrorMsg('Please enter a valid 11-digit Bangladesh mobile number (e.g. 01712345678) for SMS confirmation.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        country: 'BD',
        stateDivision,
        city: city.trim(),
        address: address.trim(),
        postalCode: postalCode.trim(),
        deliveryInstructions: deliveryInstructions.trim(),
        items: cart.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          size: i.size,
          color: i.color,
          quantity: i.quantity
        })),
        couponCode: appliedCoupon?.code,
        paymentMethod,
        shippingMethod: isDhaka ? 'Inside Dhaka Express (24–48h)' : 'Nationwide Bangladesh Courier (2–4 Days)',
        userId: customerUser?.id
      };

      const res = await apiFetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (!res.ok) {
        setErrorMsg(data.error || 'Could not complete order. Please verify your details and try again.');
        return;
      }

      const { order, payment } = data;

      // When served by backend without SMTP, ensure FormSubmit browser-origin email still fires
      if (res.headers.get('x-static-fallback') !== '1' && settings?.notifications?.notifyAdminOnNewOrder !== false) {
        const adminEmail = (settings?.notifications?.adminAlertEmail || 'khalil5172@gmail.com').trim();
        const itemsSummary = order.items
          .map(
            (i: any) =>
              `${i.productName} (EU ${i.size}, ${i.color}) x${i.quantity} = Tk ${Number(i.totalPrice).toLocaleString('en-BD')}`
          )
          .join(' | ');
        const fullAddress = `${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.stateDivision}`;
        void sendFormSubmitEmail(
          adminEmail,
          `[New Order ${order.orderNumber}] ৳${Number(order.grandTotal).toLocaleString('en-BD')} (${String(order.paymentMethod).toUpperCase()}) — ${order.customerName}`,
          {
            Order_Reference: order.orderNumber,
            Payable_Total_BDT: `৳${Number(order.grandTotal).toLocaleString('en-BD')} (${String(order.paymentMethod).toUpperCase()})`,
            Customer_Name: order.customerName,
            Customer_Mobile: order.customerPhone,
            Customer_Email: order.customerEmail,
            Delivery_Address: fullAddress,
            Ordered_Pairs: itemsSummary
          }
        );
      }

      if (paymentMethod === 'cod') {
        clearCart();
        showToast(
          `Order #${order.orderNumber} confirmed — SMS & email confirmation sent.`,
          'success'
        );
        onOrderSuccess(order, payment);
      } else {
        setActivePaymentModal({
          order,
          paymentInfo: payment,
          trxIdInput: ''
        });
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Network connection error. Please try again.');
    }
  };

  const handleVerifyOnlinePayment = async () => {
    if (!activePaymentModal) return;

    const { order, paymentInfo, trxIdInput } = activePaymentModal;
    const refToVerify = trxIdInput.trim() || paymentInfo.transactionRef;

    try {
      const res = await apiFetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          transactionRef: refToVerify
        })
      });

      const verifyData = await res.json();
      if (!res.ok) {
        showToast(verifyData.error || 'Payment verification failed', 'error');
        return;
      }

      clearCart();
      setActivePaymentModal(null);
      showToast('Payment verified — SMS & email receipt dispatched!', 'success');
      onOrderSuccess(verifyData.order, paymentInfo);
    } catch {
      showToast('Error verifying payment reference', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="pb-6 border-b border-[#e5e2da] flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-xs text-zinc-500">Dhaka Dispatch & Nationwide Courier</p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#111113] font-display tracking-tight mt-0.5">
            Checkout & Dispatch Details
          </h1>
        </div>
        <p className="text-xs text-zinc-600">
          Instant SMS &amp; Email confirmation sent immediately upon order placement
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-xs text-red-800">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleCheckoutSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Shipping & Gateways */}
        <div className="lg:col-span-7 space-y-6">
          {/* 01. Recipient & Instant Notification Details */}
          <div className="bg-white p-6 sm:p-7 rounded-xl border border-[#e5e2da] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-[#ece9e2]">
              <h2 className="text-sm font-semibold font-display text-[#111113]">
                01. Recipient &amp; Notification Details
              </h2>
              <span className="text-[11px] text-zinc-500">
                Bangladesh Nationwide · BDT (৳)
              </span>
            </div>

            {/* Instant SMS & Email Assurance Strip */}
            <div className="p-3.5 bg-[#f7f6f2] rounded-lg border border-[#e5e2da] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <Smartphone className="w-4 h-4 text-[#111113] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-[#111113] block">Mobile SMS Alert</span>
                  <span className="text-[11px] text-zinc-600">
                    Order ID &amp; payable total sent via SMS to your mobile number.
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-[#111113] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-[#111113] block">Email Invoice &amp; Tracking</span>
                  <span className="text-[11px] text-zinc-600">
                    Itemized footwear receipt &amp; courier updates emailed automatically.
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-medium text-zinc-700 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Nafis Rahman"
                  required
                  className="w-full px-3.5 py-2.5 bg-[#f7f6f2] border border-[#dedad0] rounded-lg focus:outline-none focus:border-[#111113]"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1.5">
                  Bangladesh Mobile Number (for SMS) *
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  required
                  className="w-full px-3.5 py-2.5 bg-[#f7f6f2] border border-[#dedad0] rounded-lg focus:outline-none focus:border-[#111113] font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1.5">
                  Email Address (for Digital Invoice) *
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full px-3.5 py-2.5 bg-[#f7f6f2] border border-[#dedad0] rounded-lg focus:outline-none focus:border-[#111113]"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1.5">Division *</label>
                <select
                  value={stateDivision}
                  onChange={(e) => setStateDivision(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#f7f6f2] border border-[#dedad0] rounded-lg font-medium focus:outline-none focus:border-[#111113]"
                >
                  <option value="Dhaka Division">Dhaka Division</option>
                  <option value="Chattogram Division">Chattogram Division</option>
                  <option value="Rajshahi Division">Rajshahi Division</option>
                  <option value="Khulna Division">Khulna Division</option>
                  <option value="Sylhet Division">Sylhet Division</option>
                  <option value="Barishal Division">Barishal Division</option>
                  <option value="Rangpur Division">Rangpur Division</option>
                  <option value="Mymensingh Division">Mymensingh Division</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1.5">City / Thana / Area *</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Gulshan-2, Dhanmondi, Agrabad, Sylhet"
                  required
                  className="w-full px-3.5 py-2.5 bg-[#f7f6f2] border border-[#dedad0] rounded-lg focus:outline-none focus:border-[#111113]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-medium text-zinc-700 mb-1.5">Street Address &amp; House Details *</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House #, Road #, Block / Sector, Apartment #"
                  required
                  className="w-full px-3.5 py-2.5 bg-[#f7f6f2] border border-[#dedad0] rounded-lg focus:outline-none focus:border-[#111113]"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1.5">Postal Code (Optional)</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="e.g. 1212"
                  className="w-full px-3.5 py-2.5 bg-[#f7f6f2] border border-[#dedad0] rounded-lg font-mono focus:outline-none focus:border-[#111113]"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1.5">Rider Note (Optional)</label>
                <input
                  type="text"
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  placeholder="e.g. Call upon reaching gate"
                  className="w-full px-3.5 py-2.5 bg-[#f7f6f2] border border-[#dedad0] rounded-lg focus:outline-none focus:border-[#111113]"
                />
              </div>
            </div>
          </div>

          {/* 02. Payment Method */}
          <div className="bg-white p-6 sm:p-7 rounded-xl border border-[#e5e2da] space-y-4">
            <div className="pb-3 border-b border-[#ece9e2]">
              <h2 className="text-sm font-semibold font-display text-[#111113]">
                02. Payment Preference
              </h2>
            </div>

            <div className="space-y-2.5 text-xs">
              {settings?.paymentGateways.codEnabledBD !== false && (
                <label
                  className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    paymentMethod === 'cod'
                      ? 'border-[#111113] bg-[#f7f6f2]'
                      : 'border-[#e5e2da] hover:border-zinc-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mt-0.5 accent-[#111113]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#111113]">Cash on Delivery (COD)</span>
                      <span className="text-[11px] text-emerald-800 font-medium">Pay at Doorstep</span>
                    </div>
                    <p className="text-zinc-500 text-[11px] mt-1 leading-relaxed">
                      Receive your boxed pair at home or office and settle in cash directly with the courier rider.
                    </p>
                  </div>
                </label>
              )}

              {settings?.paymentGateways.bkashEnabled !== false && (
                <label
                  className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    paymentMethod === 'bkash'
                      ? 'border-[#111113] bg-[#f7f6f2]'
                      : 'border-[#e5e2da] hover:border-zinc-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="bkash"
                    checked={paymentMethod === 'bkash'}
                    onChange={() => setPaymentMethod('bkash')}
                    className="mt-0.5 accent-[#111113]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#111113]">bKash Merchant Payment</span>
                      <span className="text-[11px] text-zinc-500 font-mono">Instant TrxID</span>
                    </div>
                    <p className="text-zinc-500 text-[11px] mt-1">
                      Direct merchant payment via bKash app with instant receipt confirmation.
                    </p>
                  </div>
                </label>
              )}

              {settings?.paymentGateways.nagadEnabled !== false && (
                <label
                  className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    paymentMethod === 'nagad'
                      ? 'border-[#111113] bg-[#f7f6f2]'
                      : 'border-[#e5e2da] hover:border-zinc-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="nagad"
                    checked={paymentMethod === 'nagad'}
                    onChange={() => setPaymentMethod('nagad')}
                    className="mt-0.5 accent-[#111113]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#111113]">Nagad Mobile Wallet</span>
                      <span className="text-[11px] text-zinc-500 font-mono">App / *167#</span>
                    </div>
                    <p className="text-zinc-500 text-[11px] mt-1">
                      Zero-surcharge merchant settlement via Nagad mobile banking.
                    </p>
                  </div>
                </label>
              )}

              {settings?.paymentGateways.rocketEnabled !== false && (
                <label
                  className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    paymentMethod === 'rocket'
                      ? 'border-[#111113] bg-[#f7f6f2]'
                      : 'border-[#e5e2da] hover:border-zinc-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="rocket"
                    checked={paymentMethod === 'rocket'}
                    onChange={() => setPaymentMethod('rocket')}
                    className="mt-0.5 accent-[#111113]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#111113]">DBBL Rocket</span>
                      <span className="text-[11px] text-zinc-500 font-mono">Dutch-Bangla</span>
                    </div>
                    <p className="text-zinc-500 text-[11px] mt-1">
                      Settle securely via Dutch-Bangla Bank Rocket account.
                    </p>
                  </div>
                </label>
              )}

              {settings?.paymentGateways.sslcommerzEnabled !== false && (
                <label
                  className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    paymentMethod === 'sslcommerz'
                      ? 'border-[#111113] bg-[#f7f6f2]'
                      : 'border-[#e5e2da] hover:border-zinc-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="sslcommerz"
                    checked={paymentMethod === 'sslcommerz'}
                    onChange={() => setPaymentMethod('sslcommerz')}
                    className="mt-0.5 accent-[#111113]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#111113]">Card &amp; Internet Banking (SSLCOMMERZ)</span>
                      <span className="text-[11px] text-zinc-500 font-mono">Visa · MC · Amex</span>
                    </div>
                    <p className="text-zinc-500 text-[11px] mt-1">
                      3D-Secure card and net-banking checkout across Bangladesh banks.
                    </p>
                  </div>
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 sm:p-7 rounded-xl border border-[#e5e2da] space-y-6 lg:sticky lg:top-24">
            <div className="pb-3 border-b border-[#ece9e2] flex items-baseline justify-between">
              <h2 className="text-sm font-semibold font-display text-[#111113]">
                Order Summary
              </h2>
              <span className="text-xs text-zinc-500 font-mono tabular-nums">
                {cart.length} {cart.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            <div className="space-y-3.5 max-h-64 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={`${item.productId}-${item.size}-${item.color}`} className="flex items-center gap-3.5 text-xs">
                  <img
                    src={item.image}
                    alt={item.productName}
                    referrerPolicy="no-referrer"
                    className="w-13 h-13 object-cover rounded-lg bg-[#f1efea] border border-[#e5e2da] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#111113] truncate font-display">{item.productName}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      EU {item.size} <span aria-hidden="true">·</span> {item.color} <span aria-hidden="true">·</span> Qty {item.quantity}
                    </p>
                  </div>
                  <span className="font-mono tabular-nums font-semibold text-[#111113]">
                    ৳{(item.priceBDT * item.quantity).toLocaleString('en-BD')}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-xs text-zinc-600 pt-4 border-t border-[#ece9e2]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums text-[#111113] font-medium">
                  ৳{cartSubtotal.toLocaleString('en-BD')}
                </span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-emerald-800">
                  <span>Courtesy Code ({appliedCoupon.code})</span>
                  <span className="font-mono tabular-nums font-medium">
                    -৳{appliedCoupon.discount.toLocaleString('en-BD')}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Courier ({isDhaka ? 'Inside Dhaka' : 'Outside Dhaka'})</span>
                <span className="font-mono tabular-nums text-[#111113] font-medium">
                  {isFreeShipping ? <span className="text-emerald-800 font-semibold">Complimentary</span> : `৳${shippingCharge}`}
                </span>
              </div>
              <div className="flex justify-between items-baseline text-base font-semibold text-[#111113] pt-3 border-t border-[#e5e2da]">
                <span className="font-display">Total Payable</span>
                <span className="font-mono tabular-nums text-lg text-[#111113]">
                  ৳{grandTotal.toLocaleString('en-BD')}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#111113] hover:bg-zinc-800 disabled:bg-zinc-300 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>
                {isSubmitting ? 'Confirming & Sending SMS...' : `Place Order · ৳${grandTotal.toLocaleString('en-BD')}`}
              </span>
            </button>

            <p className="text-[11px] text-center text-zinc-500 leading-relaxed">
              By placing this order, you will immediately receive an SMS alert on your mobile number and a digital invoice by email.
            </p>
          </div>
        </div>
      </form>

      {/* Online Payment Verification Modal */}
      {activePaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#0e0e10]/70 backdrop-blur-xs" />
          <div className="relative bg-white rounded-xl max-w-md w-full p-6 shadow-2xl z-10 space-y-4 border border-[#e5e2da]">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5e2da]">
              <div>
                <h3 className="text-base font-semibold text-[#111113] font-display">
                  {activePaymentModal.paymentInfo.gateway}
                </h3>
                <p className="text-[11px] text-zinc-500 font-mono">
                  Order #{activePaymentModal.order.orderNumber}
                </p>
              </div>
              <span className="text-sm font-semibold text-[#111113] font-mono tabular-nums">
                ৳{activePaymentModal.order.grandTotal.toLocaleString('en-BD')}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-zinc-600">
              <span className="font-semibold text-[#111113] block">Settlement Steps:</span>
              <ul className="list-decimal pl-5 space-y-1 text-[11px]">
                {activePaymentModal.paymentInfo.paymentInstructions?.instructions.map((inst: string, i: number) => (
                  <li key={i}>{inst}</li>
                ))}
              </ul>
            </div>

            <div className="p-3 bg-[#f7f6f2] border border-[#e5e2da] rounded-lg text-xs text-[#111113]">
              <span className="font-medium block">{activePaymentModal.paymentInfo.message}</span>
              <span className="text-[11px] text-zinc-600">
                Reference: <code className="font-mono font-semibold text-[#111113]">{activePaymentModal.paymentInfo.transactionRef}</code>
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Enter TrxID / Payment Reference
              </label>
              <input
                type="text"
                value={activePaymentModal.trxIdInput}
                onChange={(e) =>
                  setActivePaymentModal({ ...activePaymentModal, trxIdInput: e.target.value })
                }
                placeholder={activePaymentModal.paymentInfo.transactionRef}
                className="w-full px-3 py-2 text-xs bg-[#f7f6f2] border border-[#dedad0] rounded-lg font-mono uppercase focus:outline-none focus:border-[#111113]"
              />
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setActivePaymentModal(null)}
                className="flex-1 py-2.5 bg-[#f1efea] hover:bg-zinc-200 text-[#111113] text-xs font-medium rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyOnlinePayment}
                className="flex-1 py-2.5 bg-[#111113] hover:bg-zinc-800 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Verify &amp; Confirm</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
