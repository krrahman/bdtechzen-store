import React, { useEffect, useState } from 'react';
import { Ticket, Plus, Trash2, Check } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Coupon } from '../../types';
import { apiFetch } from '../../lib/staticApiFallback';

export const AdminCoupons: React.FC = () => {
  const { adminToken } = useAdminAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('10');
  const [minOrderAmount, setMinOrderAmount] = useState('2000');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('1000');
  const [expiryDate, setExpiryDate] = useState('2028-12-31');
  const [usageLimit, setUsageLimit] = useState('500');
  const [feedback, setFeedback] = useState('');

  const notify = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 3000);
  };

  const loadCoupons = async () => {
    if (!adminToken) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/coupons', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setCoupons(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadCoupons();
  }, [adminToken]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !code.trim()) return;

    const res = await apiFetch('/api/admin/coupons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        code: code.trim().toUpperCase(),
        discountType,
        discountValue: Number(discountValue),
        minOrderAmount: Number(minOrderAmount),
        maxDiscountAmount: discountType === 'percentage' && maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
        expiryDate,
        usageLimit: Number(usageLimit) || 500,
        countryRestriction: 'BD',
        isActive: true
      })
    });

    if (res.ok) {
      setCode('');
      await loadCoupons();
      notify('Bangladesh promo coupon created!');
    }
  };

  const handleToggleActive = async (c: Coupon) => {
    if (!adminToken) return;
    const res = await apiFetch(`/api/admin/coupons/${c.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ isActive: !c.isActive })
    });
    if (res.ok) {
      setCoupons((prev) =>
        prev.map((item) => (item.id === c.id ? { ...item, isActive: !c.isActive } : item))
      );
      notify(`Coupon ${c.code} ${!c.isActive ? 'activated' : 'paused'}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!adminToken) return;
    const res = await apiFetch(`/api/admin/coupons/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (res.ok) {
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      notify('Coupon deleted');
    }
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <div className="bg-zinc-950 text-white px-4 py-3 rounded-xl border border-violet-500/40 text-sm flex items-center gap-2">
          <Check className="w-4 h-4 text-violet-400" /> {feedback}
        </div>
      )}

      {/* Create Coupon Card */}
      <form
        onSubmit={handleCreate}
        className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4 shadow-xs"
      >
        <h2 className="font-display font-bold text-lg text-zinc-950 flex items-center gap-2">
          <Ticket className="w-5 h-5 text-violet-600" /> Create Bangladesh Promo Coupon (৳ BDT)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-zinc-600 mb-1">
              Coupon Code *
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="EID20"
              className="w-full px-3 py-2 rounded-xl border border-zinc-300 font-mono text-sm uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-zinc-600 mb-1">
              Discount Type
            </label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-sm bg-white"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Taka (৳)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-zinc-600 mb-1">
              Value ({discountType === 'percentage' ? '%' : '৳'}) *
            </label>
            <input
              type="number"
              required
              min={1}
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-zinc-300 font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-zinc-600 mb-1">
              Min Order (৳)
            </label>
            <input
              type="number"
              min={0}
              value={minOrderAmount}
              onChange={(e) => setMinOrderAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-zinc-300 font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-zinc-600 mb-1">
              Max Cap (৳ Opt)
            </label>
            <input
              type="number"
              min={0}
              disabled={discountType === 'fixed'}
              value={maxDiscountAmount}
              onChange={(e) => setMaxDiscountAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-zinc-300 font-mono text-sm disabled:bg-zinc-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-zinc-600 mb-1">
              Expiry Date
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span>Usage Limit:</span>
            <input
              type="number"
              min={1}
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
              className="w-24 px-2.5 py-1 rounded-lg border border-zinc-300 font-mono text-xs"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Coupon
          </button>
        </div>
      </form>

      {/* Active Coupons Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-10 text-center text-sm text-zinc-500">Loading coupons...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500 border-b border-zinc-200">
                <tr>
                  <th className="py-3.5 px-5">Code</th>
                  <th className="py-3.5 px-5">Discount</th>
                  <th className="py-3.5 px-5">Min Order (BDT)</th>
                  <th className="py-3.5 px-5">Redemptions</th>
                  <th className="py-3.5 px-5">Valid Until</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-50/70">
                    <td className="py-3.5 px-5 font-mono font-bold text-violet-700">{c.code}</td>
                    <td className="py-3.5 px-5 font-mono font-semibold text-zinc-900">
                      {c.discountType === 'percentage'
                        ? `${c.discountValue}% OFF`
                        : `৳${c.discountValue.toLocaleString()} OFF`}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-zinc-600">
                      ৳{c.minOrderAmount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-xs text-zinc-600">
                      {c.timesUsed} / {c.usageLimit}
                    </td>
                    <td className="py-3.5 px-5 text-xs font-mono text-zinc-600">{c.expiryDate}</td>
                    <td className="py-3.5 px-5">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(c)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                          c.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                        }`}
                      >
                        {c.isActive ? 'Active' : 'Paused'}
                      </button>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
