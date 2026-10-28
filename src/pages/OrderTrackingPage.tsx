import React, { useState, useEffect } from 'react';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldAlert,
  ArrowRight,
  Smartphone,
  Mail
} from 'lucide-react';
import { Order } from '../types';
import { apiFetch } from '../lib/staticApiFallback';

interface OrderTrackingPageProps {
  initialOrderNumber?: string;
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

const STEPS = [
  { key: 'confirmed', label: 'Order Confirmed', desc: 'Logged in Dhaka studio & SMS/Email sent' },
  { key: 'processing', label: 'Finishing & Boxing', desc: 'Pair matched, brushed & packed with dust bags' },
  { key: 'shipped', label: 'With Courier', desc: 'In transit via Steadfast, Pathao, or RedX' },
  { key: 'delivered', label: 'Delivered', desc: 'Handed over at your doorstep' }
];

export const OrderTrackingPage: React.FC<OrderTrackingPageProps> = ({ initialOrderNumber = '', onNavigate }) => {
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [contact, setContact] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchOrder = async (num: string, contactVal?: string) => {
    if (!num.trim()) {
      setError('Please enter your Order Reference Number (e.g. BDTZ-104820).');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const encodedNum = encodeURIComponent(num.trim());
      const qs =
        contactVal?.trim() && /\d{6,}/.test(contactVal.trim())
          ? `?phone=${encodeURIComponent(contactVal.trim())}`
          : '';
      const res = await apiFetch(`/api/orders/track/${encodedNum}${qs}`);
      const data = await res.json();
      if (!res.ok) {
        setOrder(null);
        setError(data.error || 'No matching order found. Please check your Order Reference and mobile number.');
      } else {
        setOrder(data);
      }
    } catch {
      setError('Unable to reach our dispatch ledger right now. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderNumber) {
      fetchOrder(initialOrderNumber);
    }
  }, [initialOrderNumber]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(orderNumber, contact);
  };

  const getActiveStepIndex = (status: Order['orderStatus']) => {
    if (status === 'pending_payment' || status === 'confirmed') return 0;
    if (status === 'processing') return 1;
    if (status === 'shipped') return 2;
    if (status === 'delivered') return 3;
    return -1;
  };

  const fmt = (val: number) => `৳${(val || 0).toLocaleString('en-BD')}`;

  return (
    <div className="min-h-screen bg-[#f7f6f2] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="max-w-2xl">
          <p className="text-xs text-zinc-500">
            Dhaka Fulfillment &amp; Nationwide Courier Ledger
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#111113] tracking-tight mt-1">
            Track Your Order
          </h1>
          <p className="text-zinc-600 text-xs sm:text-sm mt-2 leading-relaxed">
            Enter the order reference from your SMS or email confirmation to check live courier progress and notification history.
          </p>
        </div>

        {/* Search Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-[#e5e2da] p-5 sm:p-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-5">
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                Order Reference *
              </label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="e.g. BDTZ-104820"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#f7f6f2] border border-[#dedad0] focus:border-[#111113] outline-none font-mono text-sm"
              />
            </div>

            <div className="sm:col-span-5">
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                Mobile Number or Email (Optional)
              </label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="017XXXXXXXX or name@example.com"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#f7f6f2] border border-[#dedad0] focus:border-[#111113] outline-none text-sm"
              />
            </div>

            <div className="sm:col-span-2 flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#111113] hover:bg-zinc-800 disabled:opacity-60 text-white font-medium text-xs sm:text-sm transition cursor-pointer whitespace-nowrap"
              >
                <Search className="w-4 h-4" />
                <span>{loading ? 'Checking...' : 'Locate'}</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </form>

        {/* Order Result */}
        {order && (
          <div className="bg-white rounded-xl border border-[#e5e2da] overflow-hidden">
            {/* Top Status Strip */}
            <div className="bg-[#111113] text-white p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 text-xs text-zinc-400">
                  <span className="font-mono text-base font-semibold text-white">{order.orderNumber}</span>
                  <span aria-hidden="true">·</span>
                  <span className="capitalize text-emerald-400 font-medium">
                    {order.orderStatus.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1 font-mono tabular-nums">
                  Placed{' '}
                  {new Date(order.createdAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[11px] text-zinc-400 block">Total Payable</span>
                <span className="font-mono tabular-nums text-xl font-semibold text-white">{fmt(order.grandTotal)}</span>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-8">
              {/* Cancelled / Return Banner */}
              {['cancelled', 'return_requested', 'returned'].includes(order.orderStatus) ? (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
                  Current Status: <strong className="uppercase">{order.orderStatus.replace('_', ' ')}</strong>
                  {order.cancellationReason && <p className="mt-1">Note: {order.cancellationReason}</p>}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                  {STEPS.map((step, index) => {
                    const activeIdx = getActiveStepIndex(order.orderStatus);
                    const completed = index <= activeIdx;
                    return (
                      <div
                        key={step.key}
                        className={`p-4 rounded-lg border transition ${
                          completed
                            ? 'bg-[#f7f6f2] border-[#111113]'
                            : 'bg-white border-[#ece9e2] opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono font-medium ${
                              completed ? 'bg-[#111113] text-white' : 'bg-[#ece9e2] text-zinc-600'
                            }`}
                          >
                            {completed ? <CheckCircle2 className="w-3.5 h-3.5" /> : `0${index + 1}`}
                          </div>
                          <span className="text-[11px] font-mono text-zinc-500">
                            0{index + 1}
                          </span>
                        </div>
                        <p className="font-display font-semibold text-xs sm:text-sm text-[#111113]">{step.label}</p>
                        <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">{step.desc}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Courier Info & Destination */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#ece9e2]">
                <div className="p-4 rounded-lg bg-[#f7f6f2] border border-[#e5e2da] space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                    <Truck className="w-3.5 h-3.5 text-[#111113]" />
                    <span>Assigned Courier &amp; Waybill</span>
                  </div>
                  <p className="text-sm font-semibold text-[#111113]">
                    {order.courierName || 'Assigned upon dispatch (Steadfast / Pathao / RedX)'}
                  </p>
                  <p className="text-xs font-mono text-zinc-600">
                    Waybill: {order.trackingNumber || 'Awaiting courier scan'}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-[#f7f6f2] border border-[#e5e2da] space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                    <MapPin className="w-3.5 h-3.5 text-[#111113]" />
                    <span>Delivery Destination</span>
                  </div>
                  {order.shippingAddress.fullName && (
                    <p className="text-sm font-semibold text-[#111113]">{order.shippingAddress.fullName}</p>
                  )}
                  <p className="text-xs text-zinc-600">
                    {order.shippingAddress.address ? `${order.shippingAddress.address}, ` : ''}
                    {order.shippingAddress.city}, {order.shippingAddress.stateDivision}, Bangladesh
                  </p>
                </div>
              </div>

              {/* Dispatched SMS & Email Notifications */}
              {order.notifications && order.notifications.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-display text-xs font-semibold text-[#111113]">
                    SMS &amp; Email Updates Sent ({order.notifications.length})
                  </h3>
                  <div className="divide-y divide-[#ece9e2] border border-[#e5e2da] rounded-lg overflow-hidden">
                    {order.notifications.map((n) => (
                      <div key={n.id} className="p-3.5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-start gap-2.5">
                          {n.channel === 'sms' ? (
                            <Smartphone className="w-3.5 h-3.5 text-[#111113] shrink-0 mt-0.5" />
                          ) : (
                            <Mail className="w-3.5 h-3.5 text-[#111113] shrink-0 mt-0.5" />
                          )}
                          <div>
                            <p className="font-medium text-[#111113]">
                              {n.channel === 'sms' ? 'Mobile SMS' : 'Email Receipt'}{' '}
                              <span className="text-zinc-400" aria-hidden="true">·</span>{' '}
                              <span className="font-mono text-zinc-600">{n.recipient}</span>
                            </p>
                            <p className="text-[11px] text-zinc-500 mt-0.5">{n.subject || n.message}</p>
                          </div>
                        </div>
                        <span className="text-[11px] font-mono tabular-nums text-zinc-400 shrink-0">
                          {new Date(n.sentAt).toLocaleString('en-GB')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity Timeline (clean hairline rows, zero thick left border) */}
              {order.auditLog && order.auditLog.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-display text-xs font-semibold text-[#111113] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-600" />
                    <span>Fulfillment Ledger</span>
                  </h3>
                  <div className="divide-y divide-[#ece9e2] border border-[#e5e2da] rounded-lg bg-[#f7f6f2]/60">
                    {order.auditLog.map((entry, idx) => (
                      <div key={idx} className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                        <span className="font-medium text-[#111113]">{entry.note || entry.action}</span>
                        <span className="text-zinc-500 font-mono tabular-nums text-[11px] shrink-0">
                          {new Date(entry.timestamp).toLocaleString('en-GB')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Items Summary */}
              <div className="pt-4 border-t border-[#ece9e2] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-zinc-600">
                  <Package className="w-4 h-4 text-[#111113]" />
                  <span>
                    {order.items.reduce((s, i) => s + i.quantity, 0)} pair(s) <span aria-hidden="true">·</span> Payment:{' '}
                    <strong className="uppercase text-[#111113]">{order.paymentMethod}</strong> ({order.paymentStatus})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('shop')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#111113] hover:text-zinc-600 cursor-pointer"
                >
                  <span>Browse Collection</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
