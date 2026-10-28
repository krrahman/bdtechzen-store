import React, { useState } from 'react';
import {
  ShieldCheck,
  Truck,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  Ruler,
  HelpCircle,
  Send,
  CheckCircle2
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { apiFetch } from '../lib/staticApiFallback';

interface StaticPagesProps {
  type:
    | 'about'
    | 'contact'
    | 'faq'
    | 'size-guide'
    | 'shipping-policy'
    | 'return-policy'
    | 'privacy'
    | 'terms';
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

const SIZE_CHART = [
  { eu: '38', uk: '5', usMen: '6', usWomen: '7.5', cm: '24.0 cm' },
  { eu: '39', uk: '6', usMen: '6.5', usWomen: '8.0', cm: '24.7 cm' },
  { eu: '40', uk: '6.5', usMen: '7.5', usWomen: '9.0', cm: '25.3 cm' },
  { eu: '41', uk: '7.5', usMen: '8.5', usWomen: '10.0', cm: '26.0 cm' },
  { eu: '42', uk: '8', usMen: '9', usWomen: '10.5', cm: '26.7 cm' },
  { eu: '43', uk: '9', usMen: '10', usWomen: '11.5', cm: '27.3 cm' },
  { eu: '44', uk: '9.5', usMen: '10.5', usWomen: '12.0', cm: '28.0 cm' },
  { eu: '45', uk: '10.5', usMen: '11.5', usWomen: '—', cm: '28.7 cm' }
];

const FAQS = [
  {
    q: 'How fast is delivery inside and outside Dhaka?',
    a: 'Inside Dhaka Metro, orders arrive within 24–48 hours (৳70 flat rate). Across Chattogram, Sylhet, Rajshahi, Khulna, Barishal, Rangpur, and Mymensingh divisions, delivery takes 2–4 business days (৳130 flat rate). Orders above ৳3,000 ship completely FREE nationwide.'
  },
  {
    q: 'Which payment methods do you accept in Bangladesh?',
    a: 'We support Cash on Delivery (COD) nationwide across Bangladesh, as well as instant digital checkout via bKash, Nagad, Rocket, and SSLCOMMERZ (Visa, Mastercard, AMEX, and local internet banking).'
  },
  {
    q: 'What if the shoe size does not fit me?',
    a: 'Every BDTechZen pair is covered by our 7-Day Easy Size Exchange Guarantee. Keep the outsole clean and original box intact, and our courier will swap your pair for the right EU size.'
  },
  {
    q: 'Are your leather shoes crafted from genuine leather?',
    a: 'Yes. Our formal loafers, Chelsea boots, and artisanal sandals are crafted from 100% full-grain calfskin leather with breathable cushioned footbeds suited to Bangladesh weather.'
  }
];

export const StaticPages: React.FC<StaticPagesProps> = ({ type, onNavigate }) => {
  const { settings, showToast } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await apiFetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, subject, message })
      });
      if (res.ok) {
        setSent(true);
        setName('');
        setEmail('');
        setPhone('');
        setSubject('');
        setMessage('');
        showToast('Message received! Our Dhaka support desk will reply shortly.', 'success');
      }
    } catch {
      showToast('Could not send message. Please try WhatsApp or phone.', 'error');
    } finally {
      setSending(false);
    }
  };

  if (type === 'about') {
    return (
      <div className="min-h-screen bg-[#fafafc] py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="bg-zinc-950 text-white rounded-3xl p-8 sm:p-12 border border-zinc-800 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-violet-400">
                About {settings?.storeName || 'BDTechZen'}
              </span>
              <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
                Precision-Engineered Footwear Designed for Modern Bangladesh.
              </h1>
              <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                Born in Dhaka, BDTechZen blends biomechanical cushioning with hand-burnished full-grain leather craftsmanship. Whether navigating monsoon streets, executive boardrooms, or evening runs, every silhouette is tested for tropical breathability and enduring comfort.
              </p>
            </div>
            <div className="lg:col-span-5">
              <img
                src="/src/assets/images/hero_bdtechzen_flagship_1792768997575.jpg"
                alt="BDTechZen Studio Footwear"
                className="w-full h-64 object-cover rounded-2xl border border-zinc-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-2">
              <ShieldCheck className="w-7 h-7 text-violet-600" />
              <h3 className="font-display font-bold text-lg text-zinc-950">12-Point Quality Inspection</h3>
              <p className="text-sm text-zinc-600">
                Every outsole bond, stitch tension, and insole arch is inspected in our Dhaka studio prior to dispatch.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-2">
              <Truck className="w-7 h-7 text-violet-600" />
              <h3 className="font-display font-bold text-lg text-zinc-950">64-District Coverage</h3>
              <p className="text-sm text-zinc-600">
                Express home delivery across all 8 divisions of Bangladesh via Steadfast, Pathao, and RedX couriers.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-2">
              <RefreshCw className="w-7 h-7 text-violet-600" />
              <h3 className="font-display font-bold text-lg text-zinc-950">7-Day Size Exchange</h3>
              <p className="text-sm text-zinc-600">
                Ordered the wrong EU size? Request an effortless doorstep size swap within 7 days of receiving your pair.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'size-guide') {
    return (
      <div className="min-h-screen bg-[#fafafc] py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-violet-600 flex items-center gap-1.5 mb-2">
              <Ruler className="w-4 h-4" /> Official Footwear Sizing
            </span>
            <h1 className="font-display text-3xl font-bold text-zinc-950">
              EU / Foot Length Size Conversion Chart
            </h1>
            <p className="text-sm text-zinc-600 mt-2">
              Place your heel against a flat wall on a sheet of paper, mark your longest toe, and measure the length in centimeters (cm). If you are between two sizes, we recommend sizing up.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-950 text-white text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">EU Size (Standard BD)</th>
                  <th className="py-3.5 px-4">UK Size</th>
                  <th className="py-3.5 px-4">US Men</th>
                  <th className="py-3.5 px-4">US Women</th>
                  <th className="py-3.5 px-4">Heel-to-Toe (CM)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {SIZE_CHART.map((row) => (
                  <tr key={row.eu} className="hover:bg-violet-50/40">
                    <td className="py-3.5 px-4 font-mono font-bold text-violet-700">EU {row.eu}</td>
                    <td className="py-3.5 px-4 font-mono text-zinc-700">{row.uk}</td>
                    <td className="py-3.5 px-4 font-mono text-zinc-700">{row.usMen}</td>
                    <td className="py-3.5 px-4 font-mono text-zinc-700">{row.usWomen}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-zinc-900">{row.cm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'contact') {
    return (
      <div className="min-h-screen bg-[#fafafc] py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 bg-zinc-950 text-white rounded-2xl p-8 space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-violet-400">
              Customer Concierge
            </span>
            <h1 className="font-display text-3xl font-bold">Get in Touch With Our Dhaka Studio</h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Have a question about sizing, leather care, bulk corporate orders, or courier tracking? Reach us directly between 10:00 AM – 10:00 PM BST.
            </p>
            <div className="space-y-4 pt-2 text-sm">
              <div className="flex items-center gap-3 text-zinc-200">
                <Phone className="w-4 h-4 text-violet-400 shrink-0" />
                <span className="font-mono">{settings?.supportPhone || '+880 1623-604635'}</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-200">
                <Mail className="w-4 h-4 text-violet-400 shrink-0" />
                <span>{settings?.supportEmail || 'support@bdtechzen.com'}</span>
              </div>
              <div className="flex items-start gap-3 text-zinc-200">
                <MapPin className="w-4 h-4 text-violet-400 shrink-0 mt-1" />
                <span>Gulshan Avenue, Gulshan-2, Dhaka 1212, Bangladesh</span>
              </div>
              <div className="pt-2">
                <a
                  href={`https://wa.me/${(settings?.whatsappNumber || '+8801623604635').replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-semibold transition-colors"
                >
                  <span>Chat on WhatsApp ({settings?.whatsappNumber || '+8801623604635'})</span>
                </a>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white rounded-2xl border border-zinc-200 p-6 sm:p-8 shadow-sm">
            {sent ? (
              <div className="py-12 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h3 className="font-display text-xl font-bold text-zinc-950">Inquiry Received!</h3>
                <p className="text-sm text-zinc-600">
                  Thank you for contacting BDTechZen. Our support specialist will respond shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <h2 className="font-display text-xl font-bold text-zinc-950">Send Us a Message</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-zinc-600 mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nusrat Jahan"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-zinc-600 mb-1">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="017XXXXXXXX"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-zinc-600 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-zinc-600 mb-1">
                      Subject *
                    </label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Size exchange / Order query"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-600 mb-1">
                    Message *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us your order number or question..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition cursor-pointer"
                >
                  <Send className="w-4 h-4" /> {sending ? 'Sending...' : 'Submit Inquiry'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'faq') {
    return (
      <div className="min-h-screen bg-[#fafafc] py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-violet-600 flex items-center gap-1.5 mb-2">
              <HelpCircle className="w-4 h-4" /> Help Center
            </span>
            <h1 className="font-display text-3xl font-bold text-zinc-950">Frequently Asked Questions</h1>
          </div>
          <div className="space-y-4">
            {FAQS.map((item, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-2">
                <h3 className="font-display font-bold text-base text-zinc-950">{item.q}</h3>
                <p className="text-sm text-zinc-600 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Policy pages: shipping-policy, return-policy, privacy, terms
  const policyContent: Record<string, { title: string; subtitle: string; sections: Array<{ h: string; p: string }> }> = {
    'shipping-policy': {
      title: 'Bangladesh Shipping & Delivery Policy',
      subtitle: 'Fast, insured courier fulfillment across all 64 districts of Bangladesh.',
      sections: [
        {
          h: '1. Delivery Zones & Charges',
          p: `Inside Dhaka Metro: ৳${settings?.shippingBD.insideDhaka ?? 70} (24–48 hours). Outside Dhaka (all 8 divisions): ৳${settings?.shippingBD.outsideDhaka ?? 130} (2–4 business days). Orders over ৳${(settings?.shippingBD.freeShippingThreshold ?? 3000).toLocaleString()} qualify for complimentary nationwide shipping.`
        },
        {
          h: '2. Courier Partners & Parcel Inspection',
          p: 'We ship via Steadfast Courier, Pathao Courier, and RedX. You will receive an SMS/WhatsApp waybill link once your footwear leaves our Dhaka warehouse.'
        }
      ]
    },
    'return-policy': {
      title: '7-Day Size Exchange & Return Policy',
      subtitle: 'Shop confidently with hassle-free size exchanges across Bangladesh.',
      sections: [
        {
          h: '1. 7-Day Easy Size Exchange',
          p: 'If your ordered pair feels tight or loose, request an exchange within 7 days of delivery. Footwear must be unworn outdoors, with clean soles and original BDTechZen packaging.'
        },
        {
          h: '2. Damaged or Incorrect Item',
          p: 'In the rare case of a manufacturing defect or wrong variant dispatched, BDTechZen covers 100% of return and replacement courier charges.'
        }
      ]
    },
    privacy: {
      title: 'Privacy Policy',
      subtitle: 'How BDTechZen protects your personal and payment information in Bangladesh.',
      sections: [
        {
          h: '1. Data Collection',
          p: 'We collect only your name, Bangladesh mobile number, email, and delivery address strictly to fulfill your footwear orders and provide shipment updates.'
        },
        {
          h: '2. Secure Digital Payments',
          p: 'bKash, Nagad, Rocket, and SSLCOMMERZ transactions are processed over encrypted gateways. We never store your mobile banking PIN or card CVV.'
        }
      ]
    },
    terms: {
      title: 'Terms & Conditions',
      subtitle: 'Standard commercial terms governing orders placed on BDTechZen.',
      sections: [
        {
          h: '1. Pricing & Currency',
          p: 'All prices across BDTechZen are listed exclusively in Bangladeshi Taka (৳ BDT) inclusive of applicable local charges.'
        },
        {
          h: '2. Cash on Delivery Verification',
          p: 'For high-value Cash on Delivery orders outside Dhaka Metro, our support desk may confirm your delivery address via phone call prior to courier dispatch.'
        }
      ]
    }
  };

  const activePolicy = policyContent[type] || policyContent['shipping-policy'];

  return (
    <div className="min-h-screen bg-[#fafafc] py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-zinc-200 p-8 sm:p-10 space-y-6 shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-violet-600">
            Official Store Policy
          </span>
          <h1 className="font-display text-3xl font-bold text-zinc-950 mt-1">{activePolicy.title}</h1>
          <p className="text-sm text-zinc-500 mt-1">{activePolicy.subtitle}</p>
        </div>
        <div className="space-y-6 pt-4 border-t border-zinc-100">
          {activePolicy.sections.map((sec, idx) => (
            <div key={idx} className="space-y-1.5">
              <h2 className="font-display font-bold text-base text-zinc-900">{sec.h}</h2>
              <p className="text-sm text-zinc-600 leading-relaxed">{sec.p}</p>
            </div>
          ))}
        </div>
        <div className="pt-4 border-t border-zinc-100">
          <button
            type="button"
            onClick={() => onNavigate('shop')}
            className="text-sm font-semibold text-violet-600 hover:text-violet-700"
          >
            ← Back to Storefront
          </button>
        </div>
      </div>
    </div>
  );
};
