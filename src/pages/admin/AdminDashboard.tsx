import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Package,
  AlertTriangle,
  Plus,
  Settings,
  Layers,
  Ticket,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Truck
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Order } from '../../types';
import { apiFetch } from '../../lib/staticApiFallback';

interface AdminDashboardProps {
  onNavigateTab: (tab: string) => void;
}

interface DashboardStats {
  revenue: {
    totalRevenueBDT: number;
    pendingCodBDT: number;
    todaySalesBDT: number;
  };
  orders: {
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  inventory: {
    totalProducts: number;
    totalUnits: number;
    lowStock: number;
    outOfStock: number;
  };
  customersCount: number;
  categoriesCount: number;
  couponsCount: number;
  paymentMethodCounts: Record<string, number>;
  recentOrders: Order[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const { adminToken, logoutAdmin } = useAdminAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminToken) return;
    setLoading(true);
    apiFetch('/api/admin/stats', {
      headers: { Authorization: `Bearer ${adminToken}` }
    })
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          logoutAdmin();
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setStats(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [adminToken]);

  const fmt = (n: number) => `৳${(n || 0).toLocaleString('en-BD')}`;

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-2xl bg-white border border-zinc-200 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center text-sm text-zinc-500">
        Unable to load dashboard telemetry. Please refresh.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Command Bar */}
      <div className="bg-zinc-950 text-white rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border border-zinc-800">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-violet-400">
            BDTechZen Command Center
          </span>
          <h2 className="font-display text-2xl font-bold mt-0.5">
            Welcome back, Administrator
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Manage variable footwear SKUs, upload gallery images, configure ribbons, and dispatch Bangladesh couriers.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => onNavigateTab('products')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition cursor-pointer shadow-lg shadow-violet-600/20"
          >
            <Plus className="w-4 h-4" /> Add / Edit Products
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('categories')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-semibold transition cursor-pointer"
          >
            <Layers className="w-4 h-4 text-violet-400" /> Categories & Brands
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('settings')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-semibold transition cursor-pointer"
          >
            <Settings className="w-4 h-4 text-violet-400" /> Logo, Hero & Shipping
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500">
            <span>Collected Revenue (Paid)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="font-mono text-2xl font-bold text-zinc-950">
            {fmt(stats.revenue.totalRevenueBDT)}
          </p>
          <p className="text-xs text-zinc-500">
            Today&apos;s Gross Volume:{' '}
            <span className="font-mono font-semibold text-zinc-800">
              {fmt(stats.revenue.todaySalesBDT)}
            </span>
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500">
            <span>Active COD / Pending Pipeline</span>
            <Clock className="w-4 h-4 text-violet-600" />
          </div>
          <p className="font-mono text-2xl font-bold text-violet-700">
            {fmt(stats.revenue.pendingCodBDT)}
          </p>
          <p className="text-xs text-zinc-500">
            Awaiting courier collection / settlement
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500">
            <span>Total Orders</span>
            <ShoppingBag className="w-4 h-4 text-violet-600" />
          </div>
          <p className="font-mono text-2xl font-bold text-zinc-950">{stats.orders.total}</p>
          <p className="text-xs text-zinc-500">
            <span className="font-semibold text-amber-600">{stats.orders.pending} new</span> ·{' '}
            <span className="font-semibold text-emerald-600">{stats.orders.delivered} delivered</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500">
            <span>Catalog & Stock Units</span>
            <Package className="w-4 h-4 text-violet-600" />
          </div>
          <p className="font-mono text-2xl font-bold text-zinc-950">
            {stats.inventory.totalProducts} SKUs
          </p>
          <p className="text-xs text-zinc-500">
            <span className="font-mono font-semibold text-zinc-800">{stats.inventory.totalUnits}</span>{' '}
            total pairs across variants
          </p>
        </div>
      </div>

      {/* Fulfillment Pipeline & Inventory Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-2xl border border-zinc-200 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base text-zinc-950">
              Bangladesh Fulfillment Pipeline
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('orders')}
              className="text-xs font-semibold text-violet-600 hover:text-violet-700 inline-flex items-center gap-1 cursor-pointer"
            >
              Manage Orders <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80">
              <Clock className="w-4 h-4 text-amber-600 mb-1.5" />
              <span className="font-mono text-xl font-bold text-zinc-950 block">
                {stats.orders.pending}
              </span>
              <span className="text-xs text-zinc-600">Confirmed / New</span>
            </div>
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80">
              <Package className="w-4 h-4 text-blue-600 mb-1.5" />
              <span className="font-mono text-xl font-bold text-zinc-950 block">
                {stats.orders.processing}
              </span>
              <span className="text-xs text-zinc-600">Packing QC</span>
            </div>
            <div className="p-4 rounded-xl bg-violet-50/70 border border-violet-200/80">
              <Truck className="w-4 h-4 text-violet-600 mb-1.5" />
              <span className="font-mono text-xl font-bold text-zinc-950 block">
                {stats.orders.shipped}
              </span>
              <span className="text-xs text-zinc-600">In Transit</span>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mb-1.5" />
              <span className="font-mono text-xl font-bold text-zinc-950 block">
                {stats.orders.delivered}
              </span>
              <span className="text-xs text-zinc-600">Delivered</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base text-zinc-950">Store Health & Alerts</h3>
            <Ticket className="w-4 h-4 text-violet-600" />
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/70">
              <span className="text-zinc-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Low Stock Products (&lt;12 pairs)
              </span>
              <span className="font-mono font-bold text-zinc-950">{stats.inventory.lowStock}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/70">
              <span className="text-zinc-600">Out of Stock Products</span>
              <span className="font-mono font-bold text-red-600">{stats.inventory.outOfStock}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/70">
              <span className="text-zinc-600">Active Promo Coupons</span>
              <span className="font-mono font-bold text-violet-700">{stats.couponsCount}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/70">
              <span className="text-zinc-600">Registered Customers (BD)</span>
              <span className="font-mono font-bold text-zinc-950">{stats.customersCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
          <h3 className="font-display font-bold text-base text-zinc-950">Recent Orders</h3>
          <button
            type="button"
            onClick={() => onNavigateTab('orders')}
            className="text-xs font-semibold text-violet-600 hover:text-violet-700 cursor-pointer"
          >
            View All Orders →
          </button>
        </div>

        {stats.recentOrders.length === 0 ? (
          <div className="p-10 text-center text-sm text-zinc-500">
            No customer orders yet. Place a test order from the storefront to inspect courier workflows!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500 border-b border-zinc-200">
                <tr>
                  <th className="py-3 px-5">Order ID</th>
                  <th className="py-3 px-5">Customer</th>
                  <th className="py-3 px-5">Destination</th>
                  <th className="py-3 px-5">Gateway</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Total (BDT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-50/80">
                    <td className="py-3.5 px-5 font-mono font-bold text-violet-700">
                      {order.orderNumber}
                    </td>
                    <td className="py-3.5 px-5">
                      <p className="font-semibold text-zinc-900">{order.customerName}</p>
                      <p className="text-xs text-zinc-500">{order.customerPhone}</p>
                    </td>
                    <td className="py-3.5 px-5 text-xs text-zinc-600">
                      {order.shippingAddress.city}, {order.shippingAddress.stateDivision}
                    </td>
                    <td className="py-3.5 px-5 uppercase font-mono text-xs font-semibold text-zinc-700">
                      {order.paymentMethod}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="px-2.5 py-0.5 rounded text-xs font-semibold uppercase bg-violet-50 text-violet-700 border border-violet-200">
                        {order.orderStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono font-bold text-zinc-950">
                      {fmt(order.grandTotal)}
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
