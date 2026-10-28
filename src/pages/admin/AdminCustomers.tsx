import React, { useEffect, useState } from 'react';
import { Users, Search, Mail, Phone } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { apiFetch } from '../../lib/staticApiFallback';

interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: 'BD';
  orderCount: number;
  totalSpentBDT: number;
  createdAt: string;
}

export const AdminCustomers: React.FC = () => {
  const { adminToken } = useAdminAuth();
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!adminToken) return;
    setLoading(true);
    apiFetch('/api/admin/customers', {
      headers: { Authorization: `Bearer ${adminToken}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCustomers(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [adminToken]);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || '').includes(search)
  );

  const fmt = (n: number) => `৳${(n || 0).toLocaleString('en-BD')}`;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-lg text-zinc-950 flex items-center gap-2">
            <Users className="w-5 h-5 text-violet-600" /> Registered Bangladesh Customers ({customers.length})
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Lifetime BDT order volume and contact details for verified storefront members.
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, or phone..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-300 text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-10 text-center text-sm text-zinc-500">Loading customer directory...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-zinc-500">
            No registered customer accounts yet. Guest checkout orders are visible in the Orders tab.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500 border-b border-zinc-200">
                <tr>
                  <th className="py-3.5 px-5">Customer</th>
                  <th className="py-3.5 px-5">Contact (BD)</th>
                  <th className="py-3.5 px-5">Joined</th>
                  <th className="py-3.5 px-5">Total Orders</th>
                  <th className="py-3.5 px-5 text-right">Lifetime Spend (BDT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-50/70">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 font-display font-bold flex items-center justify-center text-xs">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-950">{c.name}</p>
                          <span className="text-[11px] text-zinc-400">Bangladesh</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-xs text-zinc-600 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-zinc-400" /> {c.email}
                      </div>
                      {c.phone && (
                        <div className="flex items-center gap-1.5 font-mono">
                          <Phone className="w-3.5 h-3.5 text-zinc-400" /> {c.phone}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-xs font-mono text-zinc-500">
                      {new Date(c.createdAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="py-3.5 px-5 font-mono font-semibold text-zinc-800">
                      {c.orderCount}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono font-bold text-violet-700">
                      {fmt(c.totalSpentBDT)}
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
