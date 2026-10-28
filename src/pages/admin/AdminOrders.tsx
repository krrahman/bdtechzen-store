import React, { useEffect, useState } from 'react';
import {
  Search,
  Eye,
  Trash2,
  Printer,
  Truck,
  X,
  Check,
  MapPin,
  CreditCard,
  Send,
  Smartphone,
  Mail,
  ExternalLink
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Order } from '../../types';
import { apiFetch } from '../../lib/staticApiFallback';

const COURIER_PRESETS = [
  'Steadfast Courier',
  'Pathao Courier',
  'RedX Logistics',
  'Paperfly',
  'Sundarban Courier Service'
];

const ORDER_STATUSES: Array<{ value: Order['orderStatus']; label: string }> = [
  { value: 'pending_payment', label: 'Pending Payment' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Finishing & Packing' },
  { value: 'shipped', label: 'Shipped (In Transit)' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'return_requested', label: 'Size Swap / Return Requested' },
  { value: 'returned', label: 'Returned' }
];

export const AdminOrders: React.FC = () => {
  const { adminToken } = useAdminAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editStatus, setEditStatus] = useState<Order['orderStatus']>('confirmed');
  const [editPaymentStatus, setEditPaymentStatus] = useState<Order['paymentStatus']>('pending');
  const [editCourier, setEditCourier] = useState('');
  const [editTracking, setEditTracking] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [resendingNotify, setResendingNotify] = useState(false);
  const [feedback, setFeedback] = useState('');

  const loadOrders = async () => {
    if (!adminToken) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/orders', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setOrders(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, [adminToken]);

  const openOrderModal = (order: Order) => {
    setSelectedOrder(order);
    setEditStatus(order.orderStatus);
    setEditPaymentStatus(order.paymentStatus);
    setEditCourier(order.courierName || 'Steadfast Courier');
    setEditTracking(order.trackingNumber || '');
    setEditNotes(order.internalNotes || '');
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !adminToken) return;
    setSaving(true);
    try {
      const res = await apiFetch(`/api/admin/orders/${selectedOrder.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          status: editStatus,
          paymentStatus: editPaymentStatus,
          courierName: editCourier,
          trackingNumber: editTracking,
          internalNotes: editNotes
        })
      });
      const updated = await res.json();
      if (res.ok) {
        setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
        setSelectedOrder(updated);
        setFeedback(`Order ${updated.orderNumber} updated & customer notified via Email/SMS.`);
        setTimeout(() => setFeedback(''), 3500);
      }
    } catch {}
    setSaving(false);
  };

  const handleResendNotifications = async () => {
    if (!selectedOrder || !adminToken) return;
    setResendingNotify(true);
    try {
      const res = await apiFetch(`/api/admin/orders/${selectedOrder.id}/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        }
      });
      const data = await res.json();
      if (res.ok && data.order) {
        setOrders((prev) => prev.map((o) => (o.id === data.order.id ? data.order : o)));
        setSelectedOrder(data.order);
        setFeedback(`Fresh Email & Mobile SMS sent to ${data.order.customerPhone} and ${data.order.customerEmail}.`);
        setTimeout(() => setFeedback(''), 4000);
      }
    } catch {}
    setResendingNotify(false);
  };

  const handleDeleteOrder = async (id: string, orderNum: string) => {
    if (!adminToken) return;
    const res = await apiFetch(`/api/admin/orders/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (res.ok) {
      setOrders((prev) => prev.filter((o) => o.id !== id));
      if (selectedOrder?.id === id) setSelectedOrder(null);
      setFeedback(`Deleted order ${orderNum}`);
      setTimeout(() => setFeedback(''), 3000);
    }
  };

  const filtered = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.customerPhone.includes(search) ||
      o.customerEmail.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.orderStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const fmt = (n: number) => `৳${(n || 0).toLocaleString('en-BD')}`;

  return (
    <div className="space-y-6">
      {feedback && (
        <div className="bg-zinc-950 text-white px-4 py-3 rounded-xl border border-zinc-800 text-sm flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" /> {feedback}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-4 grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-7 relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Order ID (BDTZ-...), customer name, email, or mobile..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-300 text-sm"
          />
        </div>
        <div className="sm:col-span-5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-sm bg-white"
          >
            <option value="all">All Fulfillment Statuses ({orders.length})</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-10 text-center text-sm text-zinc-500">Loading Bangladesh orders...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-zinc-500">No matching orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500 border-b border-zinc-200">
                <tr>
                  <th className="py-3.5 px-4">Order ID</th>
                  <th className="py-3.5 px-4">Customer, Mobile &amp; Email</th>
                  <th className="py-3.5 px-4">Destination</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Status &amp; Alerts</th>
                  <th className="py-3.5 px-4 text-right">Total (BDT)</th>
                  <th className="py-3.5 px-4 text-right">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-zinc-50/80">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-zinc-950 block">{o.orderNumber}</span>
                      <span className="text-[11px] text-zinc-400 font-mono tabular-nums">
                        {new Date(o.createdAt).toLocaleDateString('en-GB')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-zinc-900">{o.customerName}</p>
                      <p className="text-xs font-mono text-zinc-600">{o.customerPhone}</p>
                      <p className="text-[11px] text-zinc-400 truncate max-w-[180px]">{o.customerEmail}</p>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-zinc-600">
                      {o.shippingAddress.city}, {o.shippingAddress.stateDivision}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs font-bold uppercase text-zinc-800 block">
                        {o.paymentMethod}
                      </span>
                      <span
                        className={`text-[11px] font-semibold uppercase ${
                          o.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                      >
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-semibold capitalize text-zinc-900 block">
                        {o.orderStatus.replace('_', ' ')}
                      </span>
                      <span className="block text-[11px] text-emerald-700 mt-0.5">
                        {(o.notifications || []).length > 0
                          ? `${(o.notifications || []).length} SMS/Email sent`
                          : o.courierName || 'Ready'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-zinc-950">
                      {fmt(o.grandTotal)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openOrderModal(o)}
                          className="px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Inspect
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteOrder(o.id, o.orderNumber)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                          title="Delete Order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail, Notification Log & Courier Dispatch Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-zinc-950 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 block">
                  Order Fulfillment, Courier &amp; Customer Alerts
                </span>
                <h3 className="font-mono text-lg font-bold">{selectedOrder.orderNumber}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResendNotifications}
                  disabled={resendingNotify}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-xs font-semibold text-white cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{resendingNotify ? 'Sending...' : 'Resend Email & SMS'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Slip
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Customer & Payment Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1 text-xs">
                  <span className="font-bold uppercase text-zinc-500 flex items-center gap-1.5 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-zinc-900" /> Recipient &amp; Contact
                  </span>
                  <p className="font-bold text-sm text-zinc-950">{selectedOrder.shippingAddress.fullName}</p>
                  <p className="font-mono text-zinc-800">{selectedOrder.customerPhone}</p>
                  <p className="font-mono text-zinc-600">{selectedOrder.customerEmail}</p>
                  <p className="text-zinc-600 pt-1">
                    {selectedOrder.shippingAddress.address}, {selectedOrder.shippingAddress.city},{' '}
                    {selectedOrder.shippingAddress.stateDivision}, Bangladesh
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1 text-xs">
                  <span className="font-bold uppercase text-zinc-500 flex items-center gap-1.5 mb-1">
                    <CreditCard className="w-3.5 h-3.5 text-zinc-900" /> Gateway &amp; Totals
                  </span>
                  <p className="font-bold text-sm text-zinc-950 uppercase">
                    {selectedOrder.paymentMethod} ({selectedOrder.paymentStatus})
                  </p>
                  <p className="text-zinc-600">
                    Subtotal: {fmt(selectedOrder.subtotal)} · Shipping: {fmt(selectedOrder.shippingCharge)}
                  </p>
                  <p className="font-mono tabular-nums text-base font-bold text-zinc-950 pt-1">
                    Grand Total: {fmt(selectedOrder.grandTotal)}
                  </p>
                </div>
              </div>

              {/* Line Items */}
              <div className="border border-zinc-200 rounded-xl divide-y divide-zinc-100">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      {item.image && (
                        <img src={item.image} alt="" className="w-11 h-11 rounded-lg object-cover border" />
                      )}
                      <div>
                        <p className="font-bold text-zinc-900">{item.productName}</p>
                        <p className="text-zinc-500">
                          EU {item.size} · {item.color} · Qty: {item.quantity} · SKU: {item.productSku}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono tabular-nums font-bold text-zinc-950">{fmt(item.totalPrice)}</span>
                  </div>
                ))}
              </div>

              {/* Customer Email & Mobile SMS Dispatch Log */}
              <div className="border border-zinc-200 rounded-xl p-4 space-y-3 bg-zinc-50/60">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-xs uppercase tracking-wider text-zinc-700">
                    Dispatched Email &amp; Mobile SMS Log ({(selectedOrder.notifications || []).length})
                  </h4>
                  <span className="text-[11px] text-zinc-500">
                    Auto-triggers on order placement &amp; status change
                  </span>
                </div>

                {!selectedOrder.notifications || selectedOrder.notifications.length === 0 ? (
                  <p className="text-xs text-zinc-500">
                    No notifications logged yet. Click &ldquo;Resend Email &amp; SMS&rdquo; above to dispatch immediately.
                  </p>
                ) : (
                  <div className="divide-y divide-zinc-200/80 bg-white rounded-lg border border-zinc-200">
                    {selectedOrder.notifications.map((n) => (
                      <div key={n.id} className="p-3 text-xs space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold text-zinc-900 inline-flex items-center gap-1.5">
                            {n.channel === 'sms' ? (
                              <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
                            ) : (
                              <Mail className="w-3.5 h-3.5 text-zinc-900" />
                            )}
                            {n.channel === 'sms' ? 'Mobile SMS' : 'Email'} →{' '}
                            <span className="font-mono">{n.recipient}</span>
                          </span>
                          <span className="text-[11px] font-mono text-zinc-400">
                            {n.provider} · {new Date(n.sentAt).toLocaleString('en-GB')}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-600 font-mono">{n.message}</p>
                        {n.previewUrl && (
                          <a
                            href={n.previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-900 underline"
                          >
                            <span>View Dispatched Email</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Courier & Status Form */}
              <form
                onSubmit={handleUpdateOrder}
                className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-sm text-zinc-950 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-zinc-900" /> Update Fulfillment &amp; Notify Customer
                  </h4>
                  <span className="text-[11px] text-emerald-700 font-medium">
                    Saving status change sends SMS &amp; Email update
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-600 mb-1">
                      Order Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as Order['orderStatus'])}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-white text-sm"
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-600 mb-1">
                      Payment Status
                    </label>
                    <select
                      value={editPaymentStatus}
                      onChange={(e) => setEditPaymentStatus(e.target.value as Order['paymentStatus'])}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-white text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid / Collected</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-600 mb-1">
                      Bangladesh Courier Partner
                    </label>
                    <input
                      type="text"
                      list="bd-couriers"
                      value={editCourier}
                      onChange={(e) => setEditCourier(e.target.value)}
                      placeholder="Steadfast Courier / Pathao / RedX"
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-white text-sm"
                    />
                    <datalist id="bd-couriers">
                      {COURIER_PRESETS.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-600 mb-1">
                      Consignment / Waybill Number
                    </label>
                    <input
                      type="text"
                      value={editTracking}
                      onChange={(e) => setEditTracking(e.target.value)}
                      placeholder="e.g. SF-98234102"
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-white font-mono text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-600 mb-1">
                    Internal Atelier Note
                  </label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Optional pair check or courier handover note..."
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-white text-sm"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition cursor-pointer"
                  >
                    {saving ? 'Updating & Sending Alerts...' : 'Save Status & Dispatch Alert'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
