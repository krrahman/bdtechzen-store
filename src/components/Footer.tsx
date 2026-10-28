import React, { useState } from 'react';
import { Mail, Phone, MessageCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { BrandLogo } from './BrandLogo';

interface FooterProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { settings, showToast } = useStore();
  const [newsletterEmail, setNewsletterEmail] = useState('');

  const rawWhatsapp = settings?.whatsappNumber || '+8801623604635';
  const cleanWhatsapp = rawWhatsapp.replace(/[^0-9]/g, '') || '8801623604635';
  const displayPhone = settings?.supportPhone || '+880 1623-604635';

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      showToast('You are subscribed to BDTechZen release dispatches.', 'success');
      setNewsletterEmail('');
    }
  };

  return (
    <footer className="bg-[#0e0e10] text-stone-400 text-sm border-t border-zinc-800/90 mt-20">
      {/* Main Footer Columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-12 gap-12">
        {/* Brand & Dhaka Studio Contact */}
        <div className="md:col-span-4 space-y-4">
          <button onClick={() => onNavigate('home')} className="cursor-pointer">
            <BrandLogo
              theme="dark"
              size="md"
              logoUrl={settings?.logoUrl}
              storeName={settings?.storeName || 'BDTechZen'}
            />
          </button>
          <p className="text-stone-400 text-xs leading-relaxed max-w-sm">
            {settings?.storeTagline ||
              'Full-grain calfskin loafers, Blake-stitched Oxfords, and everyday court sneakers—made for walking Bangladesh.'}
          </p>

          <div className="pt-2 space-y-2 text-xs text-stone-300">
            <a
              href={`tel:${displayPhone.replace(/\s+/g, '')}`}
              className="flex items-center gap-2.5 hover:text-white transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span className="font-mono">{displayPhone}</span>
            </a>
            <a
              href={`https://wa.me/${cleanWhatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 hover:text-emerald-400 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-mono">WhatsApp Sizing & COD: {rawWhatsapp}</span>
            </a>
            <a
              href={`mailto:${settings?.supportEmail || 'support@bdtechzen.com'}`}
              className="flex items-center gap-2.5 hover:text-white transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span>{settings?.supportEmail || 'support@bdtechzen.com'}</span>
            </a>
          </div>
        </div>

        {/* Footwear */}
        <div className="md:col-span-2 space-y-3">
          <h5 className="text-white text-xs font-semibold font-display">Footwear</h5>
          <ul className="space-y-2.5 text-xs">
            <li>
              <button onClick={() => onNavigate('shop', { category: 'mens-shoes' })} className="hover:text-white transition-colors cursor-pointer">
                Men's Collection
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('shop', { category: 'womens-shoes' })} className="hover:text-white transition-colors cursor-pointer">
                Women's Collection
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('shop', { category: 'formal-shoes' })} className="hover:text-white transition-colors cursor-pointer">
                Oxfords & Loafers
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('shop', { category: 'sneakers' })} className="hover:text-white transition-colors cursor-pointer">
                Court & Street Sneakers
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('shop', { category: 'sports-running' })} className="hover:text-white transition-colors cursor-pointer">
                Road & Lake Runners
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('shop', { category: 'sandals-slippers' })} className="hover:text-white transition-colors cursor-pointer">
                Nubuck Slides
              </button>
            </li>
          </ul>
        </div>

        {/* Client Service */}
        <div className="md:col-span-3 space-y-3">
          <h5 className="text-white text-xs font-semibold font-display">Client Service</h5>
          <ul className="space-y-2.5 text-xs">
            <li>
              <button onClick={() => onNavigate('track')} className="hover:text-white transition-colors cursor-pointer">
                Track Your Shipment
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('size-guide')} className="hover:text-white transition-colors cursor-pointer">
                EU / UK Size Conversion
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('shipping-policy')} className="hover:text-white transition-colors cursor-pointer">
                Delivery & Cash on Delivery
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('return-policy')} className="hover:text-white transition-colors cursor-pointer">
                7-Day Size Exchange
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('about')} className="hover:text-white transition-colors cursor-pointer">
                Our Dhaka Workshop
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('contact')} className="hover:text-white transition-colors cursor-pointer">
                Contact & Sizing Desk
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('faq')} className="hover:text-white transition-colors cursor-pointer">
                Common Questions
              </button>
            </li>
          </ul>
        </div>

        {/* Release Notes */}
        <div className="md:col-span-3 space-y-3">
          <h5 className="text-white text-xs font-semibold font-display">Workshop Dispatch</h5>
          <p className="text-xs text-stone-400 leading-relaxed">
            Occasional notes when small-batch calfskin colours, restocked EU sizes, and seasonal archive sales go live.
          </p>
          <form onSubmit={handleNewsletter} className="space-y-2">
            <input
              type="email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="you@email.com"
              required
              className="w-full px-3.5 py-2.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-stone-200 placeholder-stone-500 focus:outline-none focus:border-stone-500"
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-white hover:bg-stone-200 text-zinc-950 text-xs font-semibold font-display rounded-lg transition-colors cursor-pointer"
            >
              Join Dispatch
            </button>
          </form>
        </div>
      </div>

      {/* Quiet Bottom Ledger */}
      <div className="border-t border-zinc-900 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div className="flex flex-wrap items-center gap-2 text-stone-400">
            <span>Bangladesh Payment Methods:</span>
            <span className="text-stone-200">Cash on Delivery</span>
            <span className="text-zinc-700">·</span>
            <span>bKash</span>
            <span className="text-zinc-700">·</span>
            <span>Nagad</span>
            <span className="text-zinc-700">·</span>
            <span>Rocket</span>
            <span className="text-zinc-700">·</span>
            <span>SSLCOMMERZ</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('admin')}
              className="text-stone-400 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              Staff Admin
            </button>
            <span className="text-zinc-800">·</span>
            <span>© {new Date().getFullYear()} {settings?.storeName || 'BDTechZen'}. Dhaka, Bangladesh.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
