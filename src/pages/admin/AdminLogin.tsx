import React, { useState } from 'react';
import { Lock, User, ArrowLeft, ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useStore } from '../../context/StoreContext';
import { BrandLogo } from '../../components/BrandLogo';

interface AdminLoginProps {
  onSuccess: () => void;
  onBackToStore: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onBackToStore }) => {
  const { loginAdmin, isLoading } = useAdminAuth();
  const { settings } = useStore();

  const [username, setUsername] = useState('krrahman');
  const [password, setPassword] = useState('kr123456');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await loginAdmin(username, password);
    if (res.success) {
      onSuccess();
    } else {
      setError(res.message || 'Invalid administrator credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle Violet Ambient Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[560px] h-[560px] bg-violet-600/15 blur-[130px] rounded-full" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <button
          type="button"
          onClick={onBackToStore}
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white mb-8 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Live Storefront
        </button>

        <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="space-y-3">
            <BrandLogo
              theme="dark"
              size="lg"
              logoUrl={settings?.logoUrl}
              storeName={settings?.storeName || 'BDTechZen'}
            />
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-violet-400">
                <ShieldCheck className="w-3.5 h-3.5" /> WooCommerce-Style Store Console
              </span>
              <h1 className="font-display text-2xl font-bold text-white mt-1">
                Administrator Sign In
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Full control over products, variable sizes & colors, images, ribbons, orders, coupons, and Bangladesh gateways.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Admin Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="krrahman"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none text-sm text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none text-sm text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/50 border border-red-900/60 rounded-xl px-3.5 py-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-display font-semibold text-sm shadow-lg shadow-violet-600/25 transition cursor-pointer"
            >
              {isLoading ? 'Signing in...' : 'Enter Admin Dashboard'}
            </button>
          </form>

          <div className="pt-4 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
            <span>Active Admin: krrahman</span>
            <span>BDT (৳) · Bangladesh</span>
          </div>
        </div>
      </div>
    </div>
  );
};
