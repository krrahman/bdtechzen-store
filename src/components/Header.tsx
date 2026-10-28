import React, { useState } from 'react';
import { Search, ShoppingBag, Heart, User as UserIcon, Menu, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { BrandLogo } from './BrandLogo';

interface HeaderProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
  currentPage: string;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const { cartCount, wishlist, setIsCartDrawerOpen, settings } = useStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('shop', { search: searchQuery.trim() });
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  // Strict 5-link single-line navigation contract
  const navLinks: Array<{ label: string; page: string; params: Record<string, string> }> = [
    { label: 'Shop All', page: 'shop', params: {} },
    { label: 'Men', page: 'shop', params: { category: 'mens-shoes' } },
    { label: 'Women', page: 'shop', params: { category: 'womens-shoes' } },
    { label: 'Sneakers', page: 'shop', params: { category: 'sneakers' } },
    { label: 'Loafers & Dress', page: 'shop', params: { category: 'formal-shoes' } }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/90">
      {/* Slim Dismissible Top Utility Strip (< 36px) */}
      {settings?.announcementEnabled && !announcementDismissed && (
        <div className="bg-[#111113] text-stone-300 text-[11px] h-8 px-4 tracking-wide border-b border-zinc-800/80 flex items-center">
          <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-4">
            <p className="truncate text-stone-200">
              {settings.announcementText}
            </p>
            <div className="flex items-center gap-4 shrink-0 text-stone-400">
              <button
                onClick={() => onNavigate('track')}
                className="hidden sm:inline hover:text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                Track Shipment
              </button>
              <button
                onClick={() => onNavigate('size-guide')}
                className="hidden md:inline hover:text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                Size Guide
              </button>
              <button
                onClick={() => setAnnouncementDismissed(true)}
                className="text-stone-500 hover:text-stone-200 transition-colors cursor-pointer p-0.5"
                aria-label="Dismiss notice"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main 3-Zone Architectural Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 sm:h-18 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 -ml-2 text-zinc-800 hover:text-zinc-950 focus:outline-none cursor-pointer"
              aria-label="Open menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <button
              onClick={() => onNavigate('home')}
              className="hover:opacity-85 transition-opacity cursor-pointer whitespace-nowrap shrink-0"
              aria-label="BDTechZen Home"
            >
              <BrandLogo
                theme="light"
                size="md"
                logoUrl={settings?.logoUrl}
                storeName={settings?.storeName || 'BDTechZen'}
              />
            </button>
          </div>

          {/* Zone 2: 5 Clean Single-Line Text Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-[14px] font-medium text-zinc-700">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => onNavigate(link.page, link.params)}
                className="relative py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer hover:text-zinc-950 after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[1.5px] after:bg-zinc-950 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-left"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: Utility & Primary Bag Action */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 text-zinc-700 hover:text-zinc-950 transition-colors cursor-pointer"
              aria-label="Search catalog"
            >
              <Search className="w-4.5 h-4.5" />
            </button>

            <button
              onClick={() => onNavigate('account')}
              className="p-2 text-zinc-700 hover:text-zinc-950 transition-colors cursor-pointer"
              aria-label="Account"
            >
              <UserIcon className="w-4.5 h-4.5" />
            </button>

            <button
              onClick={() => onNavigate('account', { tab: 'wishlist' })}
              className="hidden sm:block p-2 text-zinc-700 hover:text-zinc-950 transition-colors relative cursor-pointer"
              aria-label="Saved Pairs"
            >
              <Heart className="w-4.5 h-4.5" />
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-0.5 text-[10px] font-mono font-bold text-zinc-950 tabular-nums">
                  {wishlist.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#111113] hover:bg-zinc-800 text-white rounded-lg transition-colors text-xs font-medium cursor-pointer whitespace-nowrap shrink-0"
              aria-label="Shopping Bag"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Bag</span>
              <span className="tabular-nums font-mono text-stone-300">({cartCount})</span>
            </button>
          </div>
        </div>

        {/* Collapsible Search Bar */}
        {isSearchOpen && (
          <div className="py-3.5 border-t border-stone-200/80">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Cap-Toe Oxfords, penny loafers, court sneakers, or SKU..."
                className="w-full pl-10 pr-24 py-2.5 text-sm bg-[#f7f6f2] border border-stone-300 rounded-lg focus:outline-none focus:border-zinc-900 focus:bg-white transition-colors"
                autoFocus
              />
              <button
                type="submit"
                className="absolute right-1.5 px-4 py-1.5 bg-[#111113] text-white rounded-md text-xs font-medium hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Search
              </button>
            </form>
          </div>
        )}

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-stone-200 space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => {
                  onNavigate(link.page, link.params);
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2.5 text-sm font-medium font-display text-zinc-900 hover:bg-stone-100 rounded-lg"
              >
                {link.label}
              </button>
            ))}
            <div className="pt-3 mt-2 border-t border-stone-200 flex flex-col gap-1">
              <button
                onClick={() => {
                  onNavigate('track');
                  setIsMobileMenuOpen(false);
                }}
                className="text-left px-3 py-2 text-xs text-zinc-600 hover:text-zinc-950"
              >
                Track My Shipment
              </button>
              <button
                onClick={() => {
                  onNavigate('size-guide');
                  setIsMobileMenuOpen(false);
                }}
                className="text-left px-3 py-2 text-xs text-zinc-600 hover:text-zinc-950"
              >
                EU / UK Size Conversion Guide
              </button>
              <button
                onClick={() => {
                  onNavigate('account');
                  setIsMobileMenuOpen(false);
                }}
                className="text-left px-3 py-2 text-xs text-zinc-600 hover:text-zinc-950"
              >
                Customer Account & Saved Pairs
              </button>
              <button
                onClick={() => {
                  onNavigate('admin');
                  setIsMobileMenuOpen(false);
                }}
                className="text-left px-3 py-2 text-xs text-zinc-500 hover:text-zinc-900"
              >
                Staff Portal (Admin)
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
