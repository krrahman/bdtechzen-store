import React, { useState, useEffect } from 'react';
import {
  User,
  Package,
  Heart,
  MapPin,
  LogOut,
  Plus,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Truck
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Product, Order, Address } from '../types';
import { ProductCard } from '../components/ProductCard';
import { apiFetch } from '../lib/staticApiFallback';
import { sendFormSubmitEmail } from '../lib/adminAlertClient';

interface AccountPageProps {
  initialTab?: string;
  onNavigate: (page: string, params?: Record<string, string>) => void;
  onSelectProduct: (product: Product) => void;
}

const BD_DIVISIONS = [
  'Dhaka',
  'Chattogram',
  'Rajshahi',
  'Khulna',
  'Sylhet',
  'Barishal',
  'Rangpur',
  'Mymensingh'
];

export const AccountPage: React.FC<AccountPageProps> = ({
  initialTab = 'orders',
  onNavigate,
  onSelectProduct
}) => {
  const {
    customerUser,
    customerToken,
    loginCustomer,
    logoutCustomer,
    wishlist,
    settings,
    formatPrice,
    showToast
  } = useStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'addresses'>(
    initialTab === 'wishlist' ? 'wishlist' : initialTab === 'addresses' ? 'addresses' : 'orders'
  );

  // Auth form state
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Member data
  const [orders, setOrders] = useState<Order[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [addresses, setAddresses] = useState<Address[]>(customerUser?.addresses || []);

  // Address form
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [addrName, setAddrName] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrLine, setAddrLine] = useState('');
  const [addrCity, setAddrCity] = useState('Dhaka');
  const [addrDivision, setAddrDivision] = useState('Dhaka');
  const [addrPostal, setAddrPostal] = useState('1212');

  useEffect(() => {
    if (initialTab === 'wishlist' || initialTab === 'addresses' || initialTab === 'orders') {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    apiFetch('/api/products?limit=50')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAllProducts(data);
        else if (Array.isArray(data?.products)) setAllProducts(data.products);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!customerToken) return;
    apiFetch('/api/auth/orders', {
      headers: { Authorization: `Bearer ${customerToken}` }
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setOrders(data);
      })
      .catch(() => {});
  }, [customerToken]);

  useEffect(() => {
    if (customerUser?.addresses) {
      setAddresses(customerUser.addresses);
    }
  }, [customerUser]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload =
        authMode === 'login'
          ? { email, password }
          : { name, email, phone, password, country: 'BD' };
      const res = await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Authentication failed. Please check your details.');
      } else {
        if (
          authMode === 'register' &&
          res.headers.get('x-static-fallback') !== '1' &&
          settings?.notifications?.notifyAdminOnNewUser !== false
        ) {
          const adminEmail = (settings?.notifications?.adminAlertEmail || 'khalil5172@gmail.com').trim();
          void sendFormSubmitEmail(
            adminEmail,
            `[New Customer Registered] ${name} (${phone}) — BDTechZen`,
            {
              Alert_Type: 'New Customer Account Registration',
              Customer_Name: name,
              Customer_Mobile: phone,
              Customer_Email: email,
              Country: 'Bangladesh',
              Registered_At: new Date().toLocaleString('en-BD')
            }
          );
        }
        loginCustomer(data.token, data.user);
      }
    } catch {
      setAuthError('Unable to reach server. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const newAddr: Address = {
      id: `addr_${Date.now()}`,
      fullName: addrName || customerUser?.name || '',
      phone: addrPhone || customerUser?.phone || '',
      address: addrLine,
      city: addrCity,
      stateDivision: addrDivision,
      postalCode: addrPostal,
      country: 'BD',
      isDefault: addresses.length === 0
    };
    const next = [...addresses, newAddr];
    setAddresses(next);
    setShowAddrForm(false);
    setAddrLine('');
    if (customerUser) {
      const updated = { ...customerUser, addresses: next };
      localStorage.setItem('bdtechzen_customer_user', JSON.stringify(updated));
    }
    if (customerToken) {
      try {
        await apiFetch('/api/auth/address', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${customerToken}`
          },
          body: JSON.stringify(newAddr)
        });
      } catch {}
    }
    showToast('Delivery address saved', 'success');
  };

  const handleRemoveAddress = async (id: string) => {
    const next = addresses.filter((a) => a.id !== id);
    setAddresses(next);
    if (customerUser) {
      localStorage.setItem(
        'bdtechzen_customer_user',
        JSON.stringify({ ...customerUser, addresses: next })
      );
    }
    if (customerToken) {
      try {
        await apiFetch('/api/customer/addresses', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${customerToken}`
          },
          body: JSON.stringify({ addresses: next })
        });
      } catch {}
    }
    showToast('Address removed', 'info');
  };

  const wishlistedProducts = allProducts.filter((p) => wishlist.includes(p.id));

  if (!customerUser) {
    return (
      <div className="min-h-screen bg-[#fafafc] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Brand Member Pitch */}
            <div className="lg:col-span-5 bg-zinc-950 text-white rounded-2xl p-8 border border-zinc-800 space-y-6">
              <span className="inline-block px-3 py-1 rounded bg-violet-600/20 text-violet-300 border border-violet-500/30 text-xs font-bold uppercase tracking-widest">
                BDTechZen Member Club
              </span>
              <h1 className="font-display text-3xl font-bold tracking-tight">
                Faster Checkout & Real-Time Parcel Tracking Across Bangladesh.
              </h1>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Sign in or create a free customer account to save delivery addresses across all 8 Bangladesh divisions, track Steadfast/Pathao couriers, and manage size exchanges effortlessly.
              </p>
              <div className="space-y-3 pt-2 border-t border-zinc-800 text-xs text-zinc-300">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-violet-400 shrink-0" />
                  <span>7-Day Hassle-Free Footwear Size Exchange</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Truck className="w-4 h-4 text-violet-400 shrink-0" />
                  <span>Complimentary Nationwide Shipping on Orders Over ৳3,000</span>
                </div>
              </div>
            </div>

            {/* Auth Card */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-zinc-200 p-6 sm:p-8 shadow-sm">
              <div className="flex border-b border-zinc-200 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError('');
                  }}
                  className={`pb-3 px-4 font-display font-semibold text-sm border-b-2 transition cursor-pointer ${
                    authMode === 'login'
                      ? 'border-violet-600 text-violet-700'
                      : 'border-transparent text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  Customer Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setAuthError('');
                  }}
                  className={`pb-3 px-4 font-display font-semibold text-sm border-b-2 transition cursor-pointer ${
                    authMode === 'register'
                      ? 'border-violet-600 text-violet-700'
                      : 'border-transparent text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === 'register' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Tanvir Rahman"
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:border-violet-600 outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
                        Mobile Number (BD) *
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="017XXXXXXXX"
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:border-violet-600 outline-none text-sm"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:border-violet-600 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:border-violet-600 outline-none text-sm"
                  />
                </div>

                {authError && (
                  <p className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
                    {authError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-semibold text-sm transition cursor-pointer"
                >
                  {authLoading
                    ? 'Please wait...'
                    : authMode === 'login'
                    ? 'Sign In to My Account'
                    : 'Create Bangladesh Customer Account'}
                </button>
              </form>
            </div>
          </div>

          {/* Saved Wishlist Preview even when logged out */}
          {wishlistedProducts.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold text-zinc-950">
                Your Saved Wishlist ({wishlistedProducts.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {wishlistedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelect={onSelectProduct}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafc] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Member Header */}
        <div className="bg-zinc-950 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center font-display font-bold text-lg">
              {customerUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-violet-400">
                Verified Member · Bangladesh
              </span>
              <h1 className="font-display text-2xl font-bold">{customerUser.name}</h1>
              <p className="text-xs text-zinc-400">
                {customerUser.email} {customerUser.phone ? `· ${customerUser.phone}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={logoutCustomer}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 transition self-start sm:self-auto cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-red-400" /> Sign Out
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-3">
          {[
            { id: 'orders', label: `My Orders (${orders.length})`, icon: Package },
            { id: 'wishlist', label: `Wishlist (${wishlistedProducts.length})`, icon: Heart },
            { id: 'addresses', label: `Saved Addresses (${addresses.length})`, icon: MapPin }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
                  active
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center space-y-3">
                <Package className="w-10 h-10 text-zinc-300 mx-auto" />
                <h3 className="font-display text-lg font-bold text-zinc-900">No orders placed yet</h3>
                <p className="text-sm text-zinc-500 max-w-md mx-auto">
                  Explore our flagship full-grain leather loafers, running shoes, and everyday court sneakers.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('shop')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition"
                >
                  Browse Collection <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-zinc-200 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-zinc-950">{order.orderNumber}</span>
                      <span className="px-2.5 py-0.5 rounded text-xs font-semibold uppercase bg-violet-50 text-violet-700 border border-violet-200">
                        {order.orderStatus.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Placed on {new Date(order.createdAt).toLocaleDateString('en-GB')} ·{' '}
                      {order.items.length} item(s) · {order.paymentMethod.toUpperCase()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-bold text-lg text-zinc-950">
                      {formatPrice(order.grandTotal)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigate('track', { orderNumber: order.orderNumber })}
                      className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition cursor-pointer"
                    >
                      Track Parcel
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Wishlist Tab */}
        {activeTab === 'wishlist' && (
          <div>
            {wishlistedProducts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center space-y-3">
                <Heart className="w-10 h-10 text-zinc-300 mx-auto" />
                <h3 className="font-display text-lg font-bold text-zinc-900">Your wishlist is empty</h3>
                <p className="text-sm text-zinc-500">
                  Tap the heart icon on any footwear silhouette to save it here for quick comparison.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {wishlistedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} onSelect={onSelectProduct} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Addresses Tab */}
        {activeTab === 'addresses' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-zinc-950">
                Bangladesh Delivery Addresses
              </h2>
              <button
                type="button"
                onClick={() => setShowAddrForm(!showAddrForm)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add New Address
              </button>
            </div>

            {showAddrForm && (
              <form
                onSubmit={handleAddAddress}
                className="bg-white rounded-2xl border border-zinc-200 p-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-600 mb-1">
                    Recipient Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={addrName}
                    onChange={(e) => setAddrName(e.target.value)}
                    placeholder={customerUser.name}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-600 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={addrPhone}
                    onChange={(e) => setAddrPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase text-zinc-600 mb-1">
                    House, Road, Area / Thana *
                  </label>
                  <input
                    type="text"
                    required
                    value={addrLine}
                    onChange={(e) => setAddrLine(e.target.value)}
                    placeholder="House 14, Road 7, Dhanmondi"
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-600 mb-1">
                    City / District *
                  </label>
                  <input
                    type="text"
                    required
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-600 mb-1">
                    Division *
                  </label>
                  <select
                    value={addrDivision}
                    onChange={(e) => setAddrDivision(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-sm bg-white"
                  >
                    {BD_DIVISIONS.map((d) => (
                      <option key={d} value={d}>
                        {d} Division
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddrForm(false)}
                    className="px-4 py-2 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="bg-white rounded-2xl border border-zinc-200 p-5 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold text-zinc-950">{addr.fullName}</p>
                    <p className="text-zinc-600">{addr.phone}</p>
                    <p className="text-zinc-600">
                      {addr.address}, {addr.city}, {addr.stateDivision} {addr.postalCode}, Bangladesh
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAddress(addr.id)}
                    className="p-2 text-zinc-400 hover:text-red-600 transition"
                    title="Delete address"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {addresses.length === 0 && !showAddrForm && (
                <div className="md:col-span-2 bg-white rounded-2xl border border-zinc-200 p-8 text-center text-sm text-zinc-500">
                  <User className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                  No saved addresses yet. Add your Dhaka or regional Bangladesh address for 1-click checkout.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
