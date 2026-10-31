import React, { useEffect, useState } from 'react';
import { ArrowRight, ChevronRight, MessageCircle } from 'lucide-react';
import { Product, Category } from '../types';
import { ProductCard } from '../components/ProductCard';
import { useStore } from '../context/StoreContext';
import { apiFetch } from '../lib/staticApiFallback';

interface HomePageProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
  onSelectProduct: (product: Product) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onSelectProduct }) => {
  const { settings } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeChapter, setActiveChapter] = useState<number>(0);
  const [collectionTab, setCollectionTab] = useState<'all' | 'formal' | 'sneakers' | 'running' | 'women'>('all');

  useEffect(() => {
    Promise.all([
      apiFetch('/api/products?limit=24').then((res) => res.json()),
      apiFetch('/api/categories').then((res) => res.json())
    ])
      .then(([prodData, catData]) => {
        if (prodData?.products) setProducts(prodData.products);
        if (Array.isArray(catData)) setCategories(catData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const rawWhatsapp = settings?.whatsappNumber || '+8801623604635';
  const cleanWhatsapp = rawWhatsapp.replace(/[^0-9]/g, '') || '8801623604635';

  const editorialChapters = [
    {
      index: '01',
      shortTitle: 'Everyday Calfskin & Court',
      provenance: 'Dhaka Cordwainer Studio · Direct to Consumer',
      headline:
        settings?.heroBanner.title &&
        settings.heroBanner.title !== 'Shoes built to walk Dhaka, cut from full-grain calfskin.' &&
        settings.heroBanner.title !== 'Shoes built to walk, cut from full-grain calfskin.'
          ? settings.heroBanner.title
          : 'Walk with confidence, anywhere',
      body:
        settings?.heroBanner.subtitle ||
        'We pair Italian-tanned calfskin and water-resistant suede with cushioned anatomical footbeds—so your morning commute in Motijheel feels as effortless as dinner in Gulshan.',
      ctaText: settings?.heroBanner.ctaText || 'Shop the Collection',
      ctaAction: () => onNavigate('shop'),
      image:
        settings?.heroBanner.imageUrl &&
        !settings.heroBanner.imageUrl.includes('hero_atelier_lookbook')
          ? settings.heroBanner.imageUrl
          : '/src/assets/images/hero_bangladeshi_models_1792779716481.jpg',
      captionTitle: 'Mayfair Cap-Toe Calfskin Oxford & Cognac Horsebit Loafer',
      captionMeta: 'Worn in Dhaka · Full-grain leather · EU 36–45 · From ৳4,150'
    },
    {
      index: '02',
      shortTitle: 'Blake-Stitched Dress',
      provenance: 'Bench-Finished Formal · Zero Break-In Week',
      headline: 'Hand-burnished Oxfords that flex from the first morning.',
      body: 'Closed-channel Blake stitching joins supple calfskin uppers directly to the outsole without rigid welting bulk—lined in breathable leather suited to warm Bangladesh boardrooms and evening receptions.',
      ctaText: 'Explore Loafers & Oxfords',
      ctaAction: () => onNavigate('shop', { category: 'formal-shoes' }),
      image: '/src/assets/images/hero_bangladeshi_formal_1792779717196.jpg',
      captionTitle: 'Obsidian Calfskin Oxford & Black Napa Heeled Loafer',
      captionMeta: 'Hand-finished formal leather · EU 36–45 · ৳4,150 – ৳6,690'
    },
    {
      index: '03',
      shortTitle: 'Road & Lake Runners',
      provenance: 'Featherweight Cushioning · Humid-Climate Knit',
      headline: 'Built for 6 AM laps around Gulshan Lake and Hatirjheel.',
      body: 'Open-weave engineered mesh vents heat immediately, while dual-density nitrogen midsoles absorb harsh concrete impact mile after mile without bottoming out.',
      ctaText: 'Browse Running & Athletic',
      ctaAction: () => onNavigate('shop', { category: 'sports-running' }),
      image: '/src/assets/images/product_trail_marathon_shoe_1792775363886.jpg',
      captionTitle: 'Velox Marathon Elite 03 Racer',
      captionMeta: 'Breathable knit · High-traction rubber · ৳4,990'
    }
  ];

  const activeHero = editorialChapters[activeChapter] || editorialChapters[0];

  const filteredProducts = products
    .filter((p) => {
      if (collectionTab === 'formal') return p.category === 'formal-shoes' || p.category === 'mens-shoes';
      if (collectionTab === 'sneakers') return p.category === 'sneakers' || p.category === 'casual-shoes';
      if (collectionTab === 'running') return p.category === 'sports-running';
      if (collectionTab === 'women') return p.category === 'womens-shoes' || p.gender === 'women';
      return true;
    })
    .slice(0, 9);

  return (
    <div className="space-y-24 pb-20">
      {/* SECTION 1: EDITORIAL CAMPAIGN HERO + 4-COLUMN SERVICE LEDGER */}
      <section className="bg-[#0e0e10] text-white border-b border-zinc-800/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
          {/* Left Editorial Column */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-10">
            <div className="space-y-6">
              <p className="text-xs font-medium tracking-wide text-stone-400">
                {activeHero.provenance}
              </p>

              <h1 className="text-3xl sm:text-4xl lg:text-[2.85rem] font-semibold font-display tracking-tight leading-[1.12] text-white">
                {activeHero.headline}
              </h1>

              <p className="text-[15px] text-stone-300 leading-relaxed max-w-lg">
                {activeHero.body}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={activeHero.ctaAction}
                  className="px-6 py-3.5 bg-white hover:bg-stone-200 text-zinc-950 rounded-lg text-xs font-semibold font-display transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <span>{activeHero.ctaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
                    'Hello BDTechZen, I would like sizing advice / to place a Cash on Delivery order.'
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3.5 bg-transparent hover:bg-zinc-900 text-stone-200 border border-zinc-700 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-2 whitespace-nowrap"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>Sizing Desk · +880 1623-604635</span>
                </a>
              </div>
            </div>

            {/* Clean Editorial Chapter Switcher (01 / 02 / 03) */}
            <div className="pt-6 border-t border-zinc-800/80 grid grid-cols-3 gap-4">
              {editorialChapters.map((chap, idx) => {
                const isCurrent = activeChapter === idx;
                return (
                  <button
                    key={chap.index}
                    type="button"
                    onClick={() => setActiveChapter(idx)}
                    className="text-left group cursor-pointer focus:outline-none"
                  >
                    <div
                      className={`h-[2px] w-full mb-3 transition-colors ${
                        isCurrent ? 'bg-white' : 'bg-zinc-800 group-hover:bg-zinc-600'
                      }`}
                    />
                    <span className="block font-mono text-[11px] text-stone-400 tabular-nums">
                      {chap.index}
                    </span>
                    <span
                      className={`block text-xs font-medium mt-0.5 truncate transition-colors ${
                        isCurrent ? 'text-white' : 'text-stone-500 group-hover:text-stone-300'
                      }`}
                    >
                      {chap.shortTitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Full-Bleed 16:9 Campaign Frame + Below-Frame Editorial Caption (Keeps Models' Shoes 100% Unobstructed) */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/90 group">
              <img
                src={activeHero.image}
                alt={activeHero.captionTitle}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-102"
              />
            </div>

            <div className="pt-3.5 px-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-xs sm:text-sm font-semibold font-display text-white">
                  {activeHero.captionTitle}
                </p>
                <p className="text-xs text-stone-400 mt-0.5">
                  {activeHero.captionMeta}
                </p>
              </div>
              <button
                onClick={activeHero.ctaAction}
                className="text-xs font-medium text-stone-200 underline underline-offset-4 hover:text-white transition-colors self-start sm:self-auto cursor-pointer whitespace-nowrap"
              >
                View silhouettes →
              </button>
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Service Ledger Below Hero Split */}
        <div className="border-t border-zinc-800/90 bg-[#121215]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800/80 text-xs">
            <div className="py-4 sm:pr-6">
              <span className="font-semibold font-display text-white block">Cash on Delivery Nationwide</span>
              <span className="text-stone-400 text-[11px] mt-0.5 block">
                Inspect your pair at the doorstep across all 64 districts
              </span>
            </div>
            <div className="py-4 sm:px-6">
              <span className="font-semibold font-display text-white block">24–48h Dhaka Dispatch</span>
              <span className="text-stone-400 text-[11px] mt-0.5 block">
                2–4 business days outside Dhaka via Steadfast & Pathao
              </span>
            </div>
            <div className="py-4 sm:px-6">
              <span className="font-semibold font-display text-white block">Instant SMS & Email Updates</span>
              <span className="text-stone-400 text-[11px] mt-0.5 block">
                Automatic order receipt & courier waybill alerts on your phone
              </span>
            </div>
            <div className="py-4 sm:pl-6">
              <span className="font-semibold font-display text-white block">7-Day Doorstep Size Swap</span>
              <span className="text-stone-400 text-[11px] mt-0.5 block">
                Between two EU sizes? We exchange unworn pairs effortlessly
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: CURATED COLLECTION GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-1.5">
            <p className="text-xs text-zinc-500">Current Release · Priced in BDT (৳)</p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-950 font-display tracking-tight">
              Pairs Made for Daily Rotation
            </h2>
          </div>

          {/* Interactive Filter Controls */}
          <div className="flex flex-wrap items-center gap-1 bg-stone-200/70 p-1 rounded-lg self-start">
            {[
              { id: 'all', label: 'All Pairs' },
              { id: 'formal', label: 'Loafers & Oxfords' },
              { id: 'sneakers', label: 'Court & Street' },
              { id: 'running', label: 'Running' },
              { id: 'women', label: 'Women' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCollectionTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  collectionTab === tab.id
                    ? 'bg-white text-zinc-950 shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-stone-200 aspect-4/3 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {filteredProducts.map((p) => (
              <ProductCard key={p.id} product={p} onSelect={onSelectProduct} />
            ))}
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-stone-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">
            Showing {filteredProducts.length} of {products.length} available silhouettes · Complimentary delivery above ৳3,000
          </p>
          <button
            onClick={() => onNavigate('shop')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#111113] hover:bg-zinc-800 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            <span>View Full Catalog ({products.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* SECTION 3: INSIDE THE WORKSHOP & SILHOUETTE INDEX */}
      <section className="bg-white border-y border-stone-200/90 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
            {/* Documentary Workbench Image */}
            <div className="lg:col-span-6 flex">
              <div className="w-full rounded-xl overflow-hidden bg-[#f1efea] border border-stone-200/80 flex-1">
                <img
                  src="/src/assets/images/atelier_leather_craft_1792778292354.jpg"
                  alt="Full-grain calfskin hides, wooden EU 42 shoe last, and lasting tools on our oak workbench"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Concrete Shoemaking Copy */}
            <div className="lg:col-span-6 flex flex-col justify-center space-y-8">
              <div className="space-y-3">
                <p className="text-xs text-zinc-500">Materials & Lasting</p>
                <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-950 font-display tracking-tight leading-snug">
                  Why a well-lasted pair feels better in year three than week one.
                </h2>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  Most mass-market dress shoes stiffen up with coated split leather and paperboard insoles. We cut uppers from supple full-grain hides and shape them over anatomical lasts proportioned for South Asian insteps.
                </p>
              </div>

              <div className="divide-y divide-stone-200 border-y border-stone-200">
                <div className="py-4 grid grid-cols-12 gap-4">
                  <span className="col-span-2 sm:col-span-1 font-mono text-xs text-zinc-400 pt-0.5">01.</span>
                  <div className="col-span-10 sm:col-span-11">
                    <h3 className="text-sm font-semibold font-display text-zinc-950">
                      Full-grain calfskin that develops patina, never peels
                    </h3>
                    <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                      Natural open-pore leather breathes through eight-hour workdays and softens around the flex point of your forefoot.
                    </p>
                  </div>
                </div>

                <div className="py-4 grid grid-cols-12 gap-4">
                  <span className="col-span-2 sm:col-span-1 font-mono text-xs text-zinc-400 pt-0.5">02.</span>
                  <div className="col-span-10 sm:col-span-11">
                    <h3 className="text-sm font-semibold font-display text-zinc-950">
                      Wider forefoot room with a locked-in heel cup
                    </h3>
                    <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                      Our EU 36–45 lasts eliminate pinky-toe pinch while preventing heel slip when walking briskly.
                    </p>
                  </div>
                </div>

                <div className="py-4 grid grid-cols-12 gap-4">
                  <span className="col-span-2 sm:col-span-1 font-mono text-xs text-zinc-400 pt-0.5">03.</span>
                  <div className="col-span-10 sm:col-span-11">
                    <h3 className="text-sm font-semibold font-display text-zinc-950">
                      High-grip rubber channels for wet marble & monsoon streets
                    </h3>
                    <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                      Every leather sole incorporates discreet anti-slip rubber traction pods tested for wet Dhaka pavements and lobby tiles.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Silhouette Portals */}
          <div>
            <div className="flex items-end justify-between mb-6">
              <h3 className="text-lg font-semibold font-display text-zinc-950">Browse by Department</h3>
              <button
                onClick={() => onNavigate('size-guide')}
                className="text-xs font-medium text-zinc-600 hover:text-zinc-950 underline underline-offset-4 cursor-pointer"
              >
                EU / UK Size Guide
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {(categories.length > 0 ? categories.slice(0, 4) : []).map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => onNavigate('shop', { category: cat.slug })}
                  className="group relative aspect-4/3 rounded-xl overflow-hidden cursor-pointer bg-[#f1efea] border border-stone-200"
                >
                  <img
                    src={cat.image || '/src/assets/images/product_oxford_dress_shoe_1792775360783.jpg'}
                    alt={cat.name}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-104"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 text-white">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold font-display">{cat.name}</h4>
                      <ChevronRight className="w-4 h-4 text-stone-300 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: ATTRIBUTABLE CLIENT NOTES & PERSONAL SIZING DESK */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs text-zinc-500">Client Ledger · Bangladesh</p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-950 font-display tracking-tight mt-1">
              Worn Across Dhaka, Chattogram & Sylhet
            </h2>
          </div>
          <p className="text-xs text-zinc-500 font-mono tabular-nums">
            4.9 / 5.0 across verified orders
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white border border-stone-200/90 rounded-xl flex flex-col justify-between space-y-5">
            <p className="text-sm text-zinc-700 leading-relaxed">
              “Before switching to the Mayfair Cap-Toe Oxford, stiff formal shoes blistered my heel during site visits. Wore my EU 42 pair ten hours straight on day one without a single pinch.”
            </p>
            <div className="pt-4 border-t border-stone-100 text-xs">
              <p className="font-semibold font-display text-zinc-950">Nafis Rahman</p>
              <p className="text-zinc-500 mt-0.5">Principal Architect · Gulshan-2, Dhaka</p>
            </div>
          </div>

          <div className="p-6 bg-white border border-stone-200/90 rounded-xl flex flex-col justify-between space-y-5">
            <p className="text-sm text-zinc-700 leading-relaxed">
              “Received an instant SMS and email invoice the moment I placed my Cash on Delivery order. Steadfast delivered to Agrabad in 48 hours, and the cognac penny loafer leather looks twice its price.”
            </p>
            <div className="pt-4 border-t border-stone-100 text-xs">
              <p className="font-semibold font-display text-zinc-950">Tanvir Hasan</p>
              <p className="text-zinc-500 mt-0.5">Corporate Banking VP · Agrabad, Chattogram</p>
            </div>
          </div>

          <div className="p-6 bg-white border border-stone-200/90 rounded-xl flex flex-col justify-between space-y-5">
            <p className="text-sm text-zinc-700 leading-relaxed">
              “Unsure between EU 38 and 39 in the Celeste Napa Mule, I messaged their WhatsApp desk with my foot length. Their recommendation fit like a glove right out of the box.”
            </p>
            <div className="pt-4 border-t border-stone-100 text-xs">
              <p className="font-semibold font-display text-zinc-950">Nusrat Jahan</p>
              <p className="text-zinc-500 mt-0.5">University Lecturer · Dhanmondi, Dhaka</p>
            </div>
          </div>
        </div>

        {/* Calm Personal Sizing & First-Order Privilege Card */}
        <div className="rounded-xl bg-[#111113] text-white p-7 sm:p-10 border border-zinc-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs text-stone-400">
              Dhaka Sizing Desk · 10:00 AM – 10:00 PM BST
            </p>
            <h3 className="text-xl sm:text-2xl font-semibold font-display tracking-tight">
              Between two sizes, or prefer ordering over WhatsApp?
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              Send your heel-to-toe measurement in centimeters to <span className="text-white font-mono">{rawWhatsapp}</span> for an exact last recommendation—or use code <span className="text-white font-mono font-semibold underline decoration-stone-500 underline-offset-4">ZEN10</span> at checkout for 10% off your first order above ৳2,500.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
                'Hello BDTechZen, I would like sizing advice / to place a Cash on Delivery order.'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>WhatsApp · {rawWhatsapp}</span>
            </a>
            <button
              onClick={() => onNavigate('shop')}
              className="px-5 py-3 bg-white hover:bg-stone-200 text-zinc-950 rounded-lg text-xs font-semibold font-display transition-colors cursor-pointer whitespace-nowrap"
            >
              Browse All Pairs →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
