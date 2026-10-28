import React, { useEffect, useState } from 'react';
import {
  Save,
  Upload,
  RotateCcw,
  Image as ImageIcon,
  Truck,
  CreditCard,
  Store,
  Check,
  Bell,
  Send,
  Smartphone,
  Mail
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useStore } from '../../context/StoreContext';
import { StoreSettings } from '../../types';
import { BrandLogo } from '../../components/BrandLogo';
import { apiFetch } from '../../lib/staticApiFallback';
import { sendFormSubmitEmail, AdminAlertDispatchResult } from '../../lib/adminAlertClient';

const HERO_PRESET_IMAGES = [
  '/src/assets/images/hero_bangladeshi_models_1792779716481.jpg',
  '/src/assets/images/hero_bangladeshi_formal_1792779717196.jpg',
  '/src/assets/images/hero_atelier_lookbook_1792778291527.jpg',
  '/src/assets/images/atelier_leather_craft_1792778292354.jpg',
  '/src/assets/images/hero_bdtechzen_flagship_1792768997575.jpg',
  '/src/assets/images/product_oxford_dress_shoe_1792775360783.jpg',
  '/src/assets/images/product_leather_loafer_1792768998636.jpg'
];

export const AdminSettings: React.FC = () => {
  const { adminToken } = useAdminAuth();
  const { refreshSettings } = useStore();

  const [form, setForm] = useState<StoreSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [testingAlert, setTestingAlert] = useState(false);
  const [testAlertResult, setTestAlertResult] = useState<AdminAlertDispatchResult | null>(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!adminToken) return;
    apiFetch('/api/admin/settings', {
      headers: { Authorization: `Bearer ${adminToken}` }
    })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.storeName) {
          setForm({
            ...data,
            notifications: {
              emailEnabled: true,
              smsEnabled: true,
              senderName: 'BDTechZen Studio',
              adminAlertEmail: 'khalil5172@gmail.com',
              adminAlertPhone: '+8801623604635',
              notifyAdminOnNewOrder: true,
              notifyAdminOnNewUser: true,
              ntfyTopic: 'bdtechzen-khalil-8801623604635',
              smsGatewayUrl: '',
              smsApiKey: '',
              smsSenderId: 'BDTechZen',
              ...(data.notifications || {})
            }
          });
        }
      })
      .catch(() => {});
  }, [adminToken]);

  const uploadSingleImage = async (file: File): Promise<string | null> => {
    if (!adminToken) return null;
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await apiFetch('/api/admin/upload-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ dataUrl })
      });
      const data = await res.json();
      return res.ok && data.url ? data.url : null;
    } catch {
      return null;
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !form) return;
    setUploadingLogo(true);
    const url = await uploadSingleImage(file);
    if (url) setForm({ ...form, logoUrl: url });
    setUploadingLogo(false);
    e.target.value = '';
  };

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !form) return;
    setUploadingHero(true);
    const url = await uploadSingleImage(file);
    if (url) {
      setForm({
        ...form,
        heroBanner: { ...form.heroBanner, imageUrl: url }
      });
    }
    setUploadingHero(false);
    e.target.value = '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !form) return;
    setSaving(true);
    try {
      const res = await apiFetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        const updated = await res.json();
        setForm(updated);
        await refreshSettings();
        setFeedback('Store branding, hero campaign, Email/SMS alerts, and gateways saved live!');
        setTimeout(() => setFeedback(''), 4000);
      }
    } catch {}
    setSaving(false);
  };

  const handleSendTestAlert = async () => {
    if (!adminToken || !form) return;
    setTestingAlert(true);
    setTestAlertResult(null);
    try {
      // Save latest settings first so both static & server state have current email/phone/keys
      await apiFetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify(form)
      });
      await refreshSettings();

      const res = await apiFetch('/api/admin/test-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ settings: form })
      });
      const data = await res.json();
      let result: AdminAlertDispatchResult = data?.result || {
        emailSent: false,
        emailMessage: 'Check inbox for FormSubmit activation',
        netlifyFormCaptured: false,
        mobilePushSent: false,
        smsSent: false,
        smsMessage: 'Not configured'
      };

      // If handled by Node backend (not browser static fallback) and emailSent was false, trigger browser FormSubmit directly so Origin header matches live site
      if (res.headers.get('x-static-fallback') !== '1' && !result.emailSent) {
        const adminEmail = (form.notifications?.adminAlertEmail || 'khalil5172@gmail.com').trim();
        const adminPhone = (form.notifications?.adminAlertPhone || form.whatsappNumber || '+8801623604635').trim();
        const browserEmail = await sendFormSubmitEmail(
          adminEmail,
          '[Test Alert] BDTechZen Admin Order & User Notification Verified',
          {
            Status: 'Admin Email Alert Connected Successfully',
            Admin_Email: adminEmail,
            Admin_Mobile: adminPhone,
            Triggers_Active: 'New Order Placed + New User Account Created',
            Tested_At: new Date().toLocaleString('en-BD')
          }
        );
        result = {
          ...result,
          emailSent: browserEmail.ok,
          emailMessage: browserEmail.message
        };
      }

      setTestAlertResult(result);
    } catch {
      setTestAlertResult({
        emailSent: false,
        emailMessage: 'Network error while dispatching test alert.',
        netlifyFormCaptured: false,
        mobilePushSent: false,
        smsSent: false,
        smsMessage: 'Network error'
      });
    }
    setTestingAlert(false);
  };

  if (!form) {
    return (
      <div className="bg-white rounded-2xl border border-zinc-200 p-10 text-center text-sm text-zinc-500">
        Loading store configuration...
      </div>
    );
  }

  const notif = {
    emailEnabled: true,
    smsEnabled: true,
    senderName: 'BDTechZen Studio',
    adminAlertEmail: 'khalil5172@gmail.com',
    adminAlertPhone: '+8801623604635',
    notifyAdminOnNewOrder: true,
    notifyAdminOnNewUser: true,
    ntfyTopic: 'bdtechzen-khalil-8801623604635',
    smsGatewayUrl: '',
    smsApiKey: '',
    smsSenderId: 'BDTechZen',
    ...(form.notifications || {})
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {feedback && (
        <div className="bg-zinc-950 text-white px-4 py-3 rounded-xl border border-zinc-800 text-sm flex items-center gap-2 shadow-lg">
          <Check className="w-4 h-4 text-emerald-400" /> {feedback}
        </div>
      )}

      {/* 1. Brand Identity & Custom Logo */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
          <div>
            <h2 className="font-display font-bold text-lg text-zinc-950 flex items-center gap-2">
              <Store className="w-5 h-5 text-zinc-900" /> Brand Identity, Logo &amp; Utility Strip
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Use the built-in BDTechZen honeycomb mark or upload your own PNG/SVG wordmark.
            </p>
          </div>

          <div className="px-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center gap-3">
            <span className="text-[11px] font-bold uppercase text-zinc-400">Live Preview:</span>
            <BrandLogo theme="light" size="md" logoUrl={form.logoUrl} storeName={form.storeName} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-4">
            <label className="block text-xs font-bold uppercase text-zinc-600 mb-1">
              Store Name
            </label>
            <input
              type="text"
              value={form.storeName}
              onChange={(e) => setForm({ ...form, storeName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm font-semibold"
            />
          </div>

          <div className="md:col-span-5">
            <label className="block text-xs font-bold uppercase text-zinc-600 mb-1">
              Custom Logo URL (Leave empty for BDTechZen Vector Mark)
            </label>
            <input
              type="text"
              value={form.logoUrl || ''}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              placeholder="Default: Official BDTechZen Honeycomb Logo"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm font-mono"
            />
          </div>

          <div className="md:col-span-3 flex gap-2">
            <label className="flex-1 px-3 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold text-center cursor-pointer inline-flex items-center justify-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </label>
            {form.logoUrl && (
              <button
                type="button"
                onClick={() => setForm({ ...form, logoUrl: '' })}
                title="Reset to BDTechZen vector logo"
                className="p-2.5 rounded-xl border border-zinc-300 text-zinc-600 hover:bg-zinc-100 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-zinc-600 mb-1">
              Support Phone (Bangladesh)
            </label>
            <input
              type="text"
              value={form.supportPhone}
              onChange={(e) => setForm({ ...form, supportPhone: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-zinc-600 mb-1">
              WhatsApp Number
            </label>
            <input
              type="text"
              value={form.whatsappNumber}
              onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-zinc-600 mb-1">
              Support Email
            </label>
            <input
              type="email"
              value={form.supportEmail}
              onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase text-zinc-600">
              Top Utility Strip Message
            </label>
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.announcementEnabled}
                onChange={(e) => setForm({ ...form, announcementEnabled: e.target.checked })}
                className="w-4 h-4 accent-zinc-950"
              />
              Show Utility Strip
            </label>
          </div>
          <input
            type="text"
            value={form.announcementText}
            onChange={(e) => setForm({ ...form, announcementText: e.target.value })}
            className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-sm"
          />
        </div>
      </div>

      {/* 2. Flagship Hero Campaign Editor */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4 shadow-xs">
        <h2 className="font-display font-bold text-lg text-zinc-950 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-zinc-900" /> Home Hero Campaign Customizer
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-zinc-600 mb-1">
              Primary Hero Headline
            </label>
            <input
              type="text"
              value={form.heroBanner.title}
              onChange={(e) =>
                setForm({ ...form, heroBanner: { ...form.heroBanner, title: e.target.value } })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-sm font-semibold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-zinc-600 mb-1">
              Primary CTA Button Label
            </label>
            <input
              type="text"
              value={form.heroBanner.ctaText}
              onChange={(e) =>
                setForm({ ...form, heroBanner: { ...form.heroBanner, ctaText: e.target.value } })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-zinc-600 mb-1">
            Hero Editorial Lead
          </label>
          <textarea
            rows={2}
            value={form.heroBanner.subtitle}
            onChange={(e) =>
              setForm({ ...form, heroBanner: { ...form.heroBanner, subtitle: e.target.value } })
            }
            className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase text-zinc-600">
            Campaign Hero Photograph
          </label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <img
              src={form.heroBanner.imageUrl}
              alt="Hero preview"
              className="w-24 h-16 rounded-xl object-cover border border-zinc-200 shrink-0"
            />
            <input
              type="text"
              value={form.heroBanner.imageUrl}
              onChange={(e) =>
                setForm({ ...form, heroBanner: { ...form.heroBanner, imageUrl: e.target.value } })
              }
              className="w-full sm:flex-1 px-3.5 py-2 rounded-xl border border-zinc-300 text-xs font-mono"
            />
            <label className="px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 shrink-0">
              <Upload className="w-3.5 h-3.5" />
              {uploadingHero ? 'Uploading...' : 'Upload Hero Photo'}
              <input type="file" accept="image/*" onChange={handleHeroUpload} className="hidden" />
            </label>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {HERO_PRESET_IMAGES.map((img) => (
              <button
                key={img}
                type="button"
                onClick={() =>
                  setForm({ ...form, heroBanner: { ...form.heroBanner, imageUrl: img } })
                }
                className={`w-16 h-11 rounded-lg overflow-hidden border-2 cursor-pointer ${
                  form.heroBanner.imageUrl === img ? 'border-zinc-950' : 'border-zinc-200'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Admin & Customer Order + New User Email & Mobile SMS Notifications */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
          <div>
            <h2 className="font-display font-bold text-lg text-zinc-950 flex items-center gap-2">
              <Bell className="w-5 h-5 text-zinc-900" /> Admin &amp; Customer Email + Mobile Alert Center
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Receive real-time Admin Email &amp; Mobile alerts whenever a customer places a New Order or registers a New User Account (works on Netlify Drag &amp; Drop, Netlify Functions &amp; cPanel).
            </p>
          </div>

          <button
            type="button"
            onClick={handleSendTestAlert}
            disabled={testingAlert}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white text-xs font-bold shadow-xs transition cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            {testingAlert ? 'Sending Test Alert...' : 'Send Test & Activate Alerts'}
          </button>
        </div>

        {testAlertResult && (
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2 text-xs">
            <p className="font-bold text-zinc-900 uppercase tracking-wide">
              Live Test Dispatch Summary:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-white border border-zinc-200">
                <p className="font-semibold text-zinc-900 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-zinc-700" />
                  Admin Email: {testAlertResult.emailSent ? 'Delivered' : 'Action Needed (1-Time)'}
                </p>
                <p className="text-zinc-600 mt-1">{testAlertResult.emailMessage}</p>
              </div>
              <div className="p-3 rounded-lg bg-white border border-zinc-200">
                <p className="font-semibold text-zinc-900 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-zinc-700" />
                  Instant Mobile Push (ntfy): {testAlertResult.mobilePushSent ? 'Sent Live!' : 'Off'}
                </p>
                <p className="text-zinc-600 mt-1">
                  {testAlertResult.mobilePushSent
                    ? `Dispatched to ntfy topic "${notif.ntfyTopic}"`
                    : 'Enter a unique ntfy topic below for free mobile ring alerts.'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-white border border-zinc-200">
                <p className="font-semibold text-zinc-900 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-zinc-700" />
                  BD Carrier SIM SMS: {testAlertResult.smsSent ? 'Sent Live!' : 'Optional API Key'}
                </p>
                <p className="text-zinc-600 mt-1">{testAlertResult.smsMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Primary Admin Recipient Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-zinc-600 mb-1">
              Admin Alert Email (Orders &amp; New Users)
            </label>
            <input
              type="email"
              value={notif.adminAlertEmail || ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  notifications: { ...notif, adminAlertEmail: e.target.value }
                })
              }
              placeholder="khalil5172@gmail.com"
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-zinc-600 mb-1">
              Admin Mobile Number (SMS Alert)
            </label>
            <input
              type="text"
              value={notif.adminAlertPhone || ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  notifications: { ...notif, adminAlertPhone: e.target.value }
                })
              }
              placeholder="+8801623604635"
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-zinc-600 mb-1">
              Notification Sender Display Name
            </label>
            <input
              type="text"
              value={notif.senderName}
              onChange={(e) =>
                setForm({
                  ...form,
                  notifications: { ...notif, senderName: e.target.value }
                })
              }
              placeholder="BDTechZen Studio"
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 text-sm"
            />
          </div>
        </div>

        {/* Event Triggers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="flex items-center gap-2.5 p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 cursor-pointer text-xs font-semibold text-zinc-900">
            <input
              type="checkbox"
              checked={notif.notifyAdminOnNewOrder !== false}
              onChange={(e) =>
                setForm({
                  ...form,
                  notifications: { ...notif, notifyAdminOnNewOrder: e.target.checked }
                })
              }
              className="w-4 h-4 accent-zinc-950"
            />
            <span>Admin Alert on New Order</span>
          </label>

          <label className="flex items-center gap-2.5 p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 cursor-pointer text-xs font-semibold text-zinc-900">
            <input
              type="checkbox"
              checked={notif.notifyAdminOnNewUser !== false}
              onChange={(e) =>
                setForm({
                  ...form,
                  notifications: { ...notif, notifyAdminOnNewUser: e.target.checked }
                })
              }
              className="w-4 h-4 accent-zinc-950"
            />
            <span>Admin Alert on New User Signup</span>
          </label>

          <label className="flex items-center gap-2.5 p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 cursor-pointer text-xs font-semibold text-zinc-900">
            <input
              type="checkbox"
              checked={notif.emailEnabled}
              onChange={(e) =>
                setForm({
                  ...form,
                  notifications: { ...notif, emailEnabled: e.target.checked }
                })
              }
              className="w-4 h-4 accent-zinc-950"
            />
            <span>Customer Order Email Invoice</span>
          </label>

          <label className="flex items-center gap-2.5 p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 cursor-pointer text-xs font-semibold text-zinc-900">
            <input
              type="checkbox"
              checked={notif.smsEnabled}
              onChange={(e) =>
                setForm({
                  ...form,
                  notifications: { ...notif, smsEnabled: e.target.checked }
                })
              }
              className="w-4 h-4 accent-zinc-950"
            />
            <span>Customer Order SMS (+880)</span>
          </label>
        </div>

        {/* Free Instant Mobile Push + Optional BD Bulk SMS Gateway */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 border-t border-zinc-100">
          <div className="p-4 rounded-xl bg-zinc-50/80 border border-zinc-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase text-zinc-800">
                100% Free Instant Mobile Phone Alert (ntfy App)
              </p>
              <span className="text-[11px] font-semibold text-emerald-700">No API Key Needed</span>
            </div>
            <input
              type="text"
              value={notif.ntfyTopic || ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  notifications: { ...notif, ntfyTopic: e.target.value }
                })
              }
              placeholder="bdtechzen-khalil-8801623604635"
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-zinc-300 text-xs font-mono"
            />
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Install the free <strong>ntfy</strong> app on Android/iPhone, tap <strong>+</strong> and subscribe to <code className="font-mono text-zinc-800">{notif.ntfyTopic || 'bdtechzen-khalil-8801623604635'}</code>. Your phone will ring immediately on every new order &amp; new user registration.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50/80 border border-zinc-200 space-y-2.5">
            <p className="text-xs font-bold uppercase text-zinc-800">
              Bangladesh Direct SIM SMS Gateway (BulkSMSBD / GreenWeb)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                value={notif.smsGatewayUrl || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    notifications: { ...notif, smsGatewayUrl: e.target.value }
                  })
                }
                placeholder="http://bulksmsbd.net/api/smsapi"
                className="w-full px-3 py-2 rounded-xl bg-white border border-zinc-300 text-xs font-mono"
              />
              <input
                type="text"
                value={notif.smsSenderId || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    notifications: { ...notif, smsSenderId: e.target.value }
                  })
                }
                placeholder="Sender ID (e.g. BDTechZen)"
                className="w-full px-3 py-2 rounded-xl bg-white border border-zinc-300 text-xs font-mono"
              />
            </div>
            <input
              type="password"
              value={notif.smsApiKey || ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  notifications: { ...notif, smsApiKey: e.target.value }
                })
              }
              placeholder="Paste BulkSMSBD / Alpha SMS / GreenWeb API Key or Token"
              className="w-full px-3 py-2 rounded-xl bg-white border border-zinc-300 text-xs font-mono"
            />
          </div>
        </div>
      </div>

      {/* 4. Bangladesh Shipping Rates & Payment Gateways */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4 shadow-xs">
          <h2 className="font-display font-bold text-lg text-zinc-950 flex items-center gap-2">
            <Truck className="w-5 h-5 text-zinc-900" /> Bangladesh Delivery Fees (৳ BDT)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-600 mb-1">
                Inside Dhaka (৳)
              </label>
              <input
                type="number"
                min={0}
                value={form.shippingBD.insideDhaka}
                onChange={(e) =>
                  setForm({
                    ...form,
                    shippingBD: { ...form.shippingBD, insideDhaka: Number(e.target.value) }
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-zinc-600 mb-1">
                Outside Dhaka (৳)
              </label>
              <input
                type="number"
                min={0}
                value={form.shippingBD.outsideDhaka}
                onChange={(e) =>
                  setForm({
                    ...form,
                    shippingBD: { ...form.shippingBD, outsideDhaka: Number(e.target.value) }
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-zinc-600 mb-1">
                Free Over (৳)
              </label>
              <input
                type="number"
                min={0}
                value={form.shippingBD.freeShippingThreshold}
                onChange={(e) =>
                  setForm({
                    ...form,
                    shippingBD: {
                      ...form.shippingBD,
                      freeShippingThreshold: Number(e.target.value)
                    }
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 font-mono text-sm"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4 shadow-xs">
          <h2 className="font-display font-bold text-lg text-zinc-950 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-zinc-900" /> Bangladesh Payment Gateways
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {[
              { key: 'codEnabledBD', label: 'Cash on Delivery (COD)' },
              { key: 'bkashEnabled', label: 'bKash Digital Checkout' },
              { key: 'nagadEnabled', label: 'Nagad Instant Pay' },
              { key: 'rocketEnabled', label: 'Rocket Mobile Banking' },
              { key: 'sslcommerzEnabled', label: 'SSLCOMMERZ (Cards/Bank)' }
            ].map((gw) => (
              <label
                key={gw.key}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 cursor-pointer font-medium text-zinc-800"
              >
                <input
                  type="checkbox"
                  checked={(form.paymentGateways as any)[gw.key]}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      paymentGateways: {
                        ...form.paymentGateways,
                        [gw.key]: e.target.checked
                      }
                    })
                  }
                  className="w-4 h-4 accent-zinc-950"
                />
                <span>{gw.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 disabled:opacity-60 text-white font-display font-bold text-sm shadow-sm transition cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving Store Settings...' : 'Save All Store & Notification Settings'}
        </button>
      </div>
    </form>
  );
};
