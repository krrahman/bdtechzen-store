import React from 'react';
import {
  CheckCircle2,
  Printer,
  Truck,
  ArrowRight,
  MapPin,
  CreditCard,
  Smartphone,
  Mail,
  ExternalLink
} from 'lucide-react';
import { Order } from '../types';
import { useStore } from '../context/StoreContext';
import { BrandLogo } from '../components/BrandLogo';

interface OrderSuccessPageProps {
  order: Order;
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

const PAYMENT_LABELS: Record<string, string> = {
  cod: 'Cash on Delivery (COD)',
  bkash: 'bKash Merchant Payment',
  nagad: 'Nagad Mobile Wallet',
  rocket: 'DBBL Rocket',
  sslcommerz: 'SSLCOMMERZ (Card / NetBanking)',
  card: 'Debit / Credit Card'
};

export const OrderSuccessPage: React.FC<OrderSuccessPageProps> = ({ order, onNavigate }) => {
  const { settings } = useStore();
  const fmt = (val: number) => `৳${(val || 0).toLocaleString('en-BD')}`;

  const smsNotifications = (order.notifications || []).filter((n) => n.channel === 'sms');
  const emailNotifications = (order.notifications || []).filter((n) => n.channel === 'email');
  const latestSms = smsNotifications[smsNotifications.length - 1];
  const latestEmail = emailNotifications[emailNotifications.length - 1];

  return (
    <div className="min-h-screen bg-[#f7f6f2] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Top Confirmation Banner */}
        <div className="bg-[#111113] text-white rounded-t-xl p-7 sm:p-8 border border-[#111113] print:bg-white print:text-[#111113] print:border-zinc-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <BrandLogo
                theme="dark"
                size="md"
                logoUrl={settings?.logoUrl}
                storeName={settings?.storeName || 'BDTechZen'}
                className="mb-4 print:hidden"
              />
              <div className="inline-flex items-center gap-2 text-emerald-400 text-xs font-medium mb-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Order Confirmed &amp; Dispatched to Atelier Queue</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
                Thank you, {order.customerName.split(' ')[0]}.
              </h1>
              <p className="text-zinc-400 text-xs sm:text-sm mt-1.5 max-w-md leading-relaxed">
                We have sent your order confirmation to both your mobile number and email address.
              </p>
            </div>

            <div className="bg-[#1a1a1e] border border-white/10 rounded-lg px-4 py-3 text-left sm:text-right shrink-0 print:bg-zinc-50 print:border-zinc-200 print:text-[#111113]">
              <span className="text-[11px] text-zinc-400 block">Order Reference</span>
              <span className="font-mono text-lg font-semibold text-white print:text-[#111113]">
                {order.orderNumber}
              </span>
              <span className="text-xs text-zinc-400 block mt-0.5 font-mono tabular-nums">
                {new Date(order.createdAt).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Official Invoice Body */}
        <div className="bg-white rounded-b-xl border border-t-0 border-[#e5e2da] p-6 sm:p-8 space-y-8">
          {/* Live Mobile SMS & Email Notification Confirmation */}
          <div className="bg-[#f7f6f2] rounded-xl border border-[#e5e2da] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#e5e2da]">
              <h2 className="font-display text-xs font-semibold text-[#111113]">
                Instant Customer Notifications Dispatched
              </h2>
              <span className="text-[11px] text-emerald-800 font-medium">
                SMS &amp; Email Delivered
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Mobile SMS Receipt */}
              <div className="bg-white rounded-lg border border-[#e5e2da] p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[#111113] inline-flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-zinc-700" />
                    Mobile SMS Sent
                  </span>
                  <span className="font-mono text-[11px] text-zinc-600">
                    {latestSms?.recipient || order.customerPhone}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-600 leading-relaxed font-mono bg-[#f7f6f2] p-2.5 rounded border border-[#ece9e2]">
                  {latestSms?.message ||
                    `BDTechZen: Hi ${order.customerName.split(' ')[0]}, your order #${order.orderNumber} (BDT ${order.grandTotal.toLocaleString('en-BD')}) is confirmed.`}
                </p>
              </div>

              {/* Email Receipt */}
              <div className="bg-white rounded-lg border border-[#e5e2da] p-4 space-y-2 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[#111113] inline-flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-zinc-700" />
                      Digital Invoice Emailed
                    </span>
                    <span className="text-[11px] text-emerald-800 font-medium">Sent</span>
                  </div>
                  <p className="text-xs text-zinc-700 font-mono truncate">
                    {latestEmail?.recipient || order.customerEmail}
                  </p>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    {latestEmail?.subject || `Order Confirmed — #${order.orderNumber} | BDTechZen`}
                  </p>
                </div>

                {latestEmail?.previewUrl && (
                  <a
                    href={latestEmail.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-[#111113] underline underline-offset-4 hover:text-zinc-600 pt-1 print:hidden"
                  >
                    <span>Open Dispatched Email Copy</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Customer & Payment Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-[#ece9e2]">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                <MapPin className="w-3.5 h-3.5 text-[#111113]" />
                <span>Delivery Address</span>
              </div>
              <p className="font-semibold text-[#111113] text-sm">{order.shippingAddress.fullName}</p>
              <p className="text-xs font-mono text-zinc-600">{order.shippingAddress.phone}</p>
              <p className="text-xs text-zinc-600 leading-relaxed">
                {order.shippingAddress.address}, {order.shippingAddress.city},{' '}
                {order.shippingAddress.stateDivision}
                {order.shippingAddress.postalCode ? ` (${order.shippingAddress.postalCode})` : ''}, Bangladesh
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                <CreditCard className="w-3.5 h-3.5 text-[#111113]" />
                <span>Settlement &amp; Dispatch Status</span>
              </div>
              <p className="font-semibold text-[#111113] text-sm">
                {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod.toUpperCase()}
              </p>
              <p className="text-xs text-zinc-600">
                Payment: <span className="font-medium text-[#111113] capitalize">{order.paymentStatus}</span>{' '}
                <span aria-hidden="true">·</span> Status:{' '}
                <span className="font-medium text-[#111113] capitalize">
                  {order.orderStatus.replace('_', ' ')}
                </span>
              </p>
              {order.transactionRef && (
                <p className="text-xs font-mono text-zinc-500 pt-0.5">Ref: {order.transactionRef}</p>
              )}
            </div>
          </div>

          {/* Ordered Items */}
          <div>
            <h2 className="font-display text-xs font-semibold text-[#111113] mb-3">
              Ordered Footwear ({order.items.length})
            </h2>
            <div className="divide-y divide-[#ece9e2] border border-[#e5e2da] rounded-xl overflow-hidden">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 bg-white">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.productName}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-lg object-cover bg-[#f1efea] border border-[#e5e2da] shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-[#f1efea] shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#111113] text-sm truncate font-display">{item.productName}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      EU {item.size} <span aria-hidden="true">·</span> {item.color} <span aria-hidden="true">·</span> Qty {item.quantity}
                    </p>
                    <p className="text-[11px] font-mono text-zinc-400 mt-0.5">SKU {item.productSku}</p>
                  </div>
                  <div className="text-right font-mono tabular-nums font-semibold text-sm text-[#111113]">
                    {fmt(item.totalPrice)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Breakdown */}
          <div className="bg-[#f7f6f2] rounded-xl p-5 border border-[#e5e2da] space-y-2.5 text-xs sm:text-sm">
            <div className="flex justify-between text-zinc-600">
              <span>Subtotal</span>
              <span className="font-mono tabular-nums font-medium text-[#111113]">{fmt(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-800">
                <span>Courtesy Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                <span className="font-mono tabular-nums font-medium">-{fmt(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-zinc-600">
              <span>Courier ({order.shippingMethod || 'Bangladesh Courier'})</span>
              <span className="font-mono tabular-nums font-medium text-[#111113]">
                {order.shippingCharge === 0 ? 'Complimentary' : fmt(order.shippingCharge)}
              </span>
            </div>
            <div className="pt-3 border-t border-[#dedad0] flex justify-between items-baseline">
              <span className="font-display font-semibold text-base text-[#111113]">Total Payable (BDT)</span>
              <span className="font-mono tabular-nums text-xl font-semibold text-[#111113]">{fmt(order.grandTotal)}</span>
            </div>
          </div>

          {/* Care & Exchange Note */}
          <p className="text-xs text-zinc-600 leading-relaxed">
            Each pair is hand-brushed, checked for stitch alignment, and packed with cotton dust bags in our Dhaka studio before courier handover. Need a half-step or full EU size swap? Reach our sizing desk on WhatsApp ({settings?.whatsappNumber || '+8801623604635'}) within 7 days of delivery.
          </p>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#ece9e2] print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#dedad0] text-[#111113] hover:bg-[#f7f6f2] text-xs font-medium transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice</span>
            </button>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('track', { orderNumber: order.orderNumber })}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#111113] bg-white hover:bg-[#f7f6f2] text-[#111113] text-xs font-semibold transition cursor-pointer"
              >
                <Truck className="w-4 h-4" />
                <span>Track Order</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('shop')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#111113] hover:bg-zinc-800 text-white text-xs font-semibold transition cursor-pointer"
              >
                <span>Continue Browsing</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
