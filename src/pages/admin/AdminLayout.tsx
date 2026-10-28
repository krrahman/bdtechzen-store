import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Layers,
  Ticket,
  MessageSquare,
  Settings,
  ExternalLink,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useStore } from '../../context/StoreContext';
import { BrandLogo } from '../../components/BrandLogo';

interface AdminLayoutProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onGoToStore: () => void;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
  { id: 'products', label: 'Products & Variations', icon: Package },
  { id: 'orders', label: 'Orders & Couriers', icon: ShoppingBag },
  { id: 'categories', label: 'Categories & Brands', icon: Layers },
  { id: 'coupons', label: 'Promo Coupons', icon: Ticket },
  { id: 'customers', label: 'Customers (BD)', icon: Users },
  { id: 'reviews', label: 'Reviews & Inbox', icon: MessageSquare },
  { id: 'settings', label: 'Store & Hero Settings', icon: Settings }
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onTabChange,
  onGoToStore,
  children
}) => {
  const { adminUser, logoutAdmin } = useAdminAuth();
  const { settings } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeNav = NAV_ITEMS.find((n) => n.id === currentTab) || NAV_ITEMS[0];

  return (
    <div className="min-h-screen bg-[#f4f4f8] text-zinc-900 flex">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Dark Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-68 bg-zinc-950 text-white flex flex-col border-r border-zinc-800 transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-zinc-800/90">
          <button
            type="button"
            onClick={() => onTabChange('dashboard')}
            className="text-left cursor-pointer"
          >
            <BrandLogo
              theme="dark"
              size="sm"
              logoUrl={settings?.logoUrl}
              storeName={settings?.storeName || 'BDTechZen'}
            />
          </button>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-zinc-900 bg-zinc-900/50">
          <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400 block">
            Full Commerce Control
          </span>
          <span className="text-xs text-zinc-400">Bangladesh Storefront (৳ BDT)</span>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onTabChange(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                  active
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/25'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800 space-y-2">
          <button
            type="button"
            onClick={onGoToStore}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-200 transition cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-violet-400" /> View Live Storefront
          </button>

          <div className="flex items-center justify-between pt-2 px-1">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {adminUser?.name || 'krrahman'}
              </p>
              <p className="text-[11px] text-zinc-500 truncate">Super Administrator</p>
            </div>
            <button
              type="button"
              onClick={logoutAdmin}
              title="Sign Out"
              className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-900 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-zinc-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display text-lg font-bold text-zinc-950">{activeNav.label}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-medium">
              Bangladesh · BDT (৳) · COD Active
            </span>
            <button
              type="button"
              onClick={onGoToStore}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold transition cursor-pointer"
            >
              Storefront <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
};
