import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const WhatsAppButton: React.FC = () => {
  const { settings } = useStore();
  const rawWhatsapp = settings?.whatsappNumber || '+8801623604635';
  const whatsappNum = rawWhatsapp.replace(/[^0-9]/g, '') || '8801623604635';
  const message = encodeURIComponent(
    `Hello ${settings?.storeName || 'BDTechZen'}, I would like to inquire about footwear sizing, variable colorways, and Cash on Delivery in Bangladesh.`
  );

  return (
    <a
      href={`https://wa.me/${whatsappNum}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 pl-3.5 pr-4 py-2.5 bg-zinc-950 hover:bg-zinc-900 text-white border border-zinc-800 rounded-full shadow-xl transition-all hover:-translate-y-0.5 text-xs font-medium group"
      aria-label="WhatsApp Concierge +880 1623-604635"
    >
      <span className="w-7 h-7 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0">
        <MessageCircle className="w-4 h-4 fill-white" />
      </span>
      <span className="hidden sm:flex flex-col leading-tight">
        <span className="font-display font-semibold text-white text-[11px]">WhatsApp Concierge</span>
        <span className="font-mono text-[10px] text-zinc-400 group-hover:text-emerald-400 transition-colors">
          +880 1623-604635
        </span>
      </span>
    </a>
  );
};
