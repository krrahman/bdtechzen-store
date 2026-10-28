import React, { useEffect, useState } from 'react';
import { Star, CheckCircle2, XCircle, Trash2, Mail, MessageSquare } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Review, ContactSubmission } from '../../types';
import { apiFetch } from '../../lib/staticApiFallback';

export const AdminReviews: React.FC = () => {
  const { adminToken } = useAdminAuth();
  const [tab, setTab] = useState<'reviews' | 'inbox'>('reviews');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [messages, setMessages] = useState<ContactSubmission[]>([]);

  const loadAll = async () => {
    if (!adminToken) return;
    try {
      const [rRes, mRes] = await Promise.all([
        apiFetch('/api/admin/reviews', { headers: { Authorization: `Bearer ${adminToken}` } }),
        apiFetch('/api/admin/contact-messages', { headers: { Authorization: `Bearer ${adminToken}` } })
      ]);
      const [rData, mData] = await Promise.all([rRes.json(), mRes.json()]);
      if (Array.isArray(rData)) setReviews(rData);
      if (Array.isArray(mData)) setMessages(mData);
    } catch {}
  };

  useEffect(() => {
    loadAll();
  }, [adminToken]);

  const updateReviewStatus = async (id: string, status: Review['status']) => {
    if (!adminToken) return;
    const res = await apiFetch(`/api/admin/reviews/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    }
  };

  const deleteReview = async (id: string) => {
    if (!adminToken) return;
    const res = await apiFetch(`/api/admin/reviews/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (res.ok) {
      setReviews((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const updateMessageStatus = async (id: string, status: ContactSubmission['status']) => {
    if (!adminToken) return;
    const res = await apiFetch(`/api/admin/contact-messages/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab('reviews')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            tab === 'reviews'
              ? 'bg-violet-600 text-white'
              : 'bg-white border border-zinc-200 text-zinc-600'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> Product Reviews ({reviews.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('inbox')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            tab === 'inbox'
              ? 'bg-violet-600 text-white'
              : 'bg-white border border-zinc-200 text-zinc-600'
          }`}
        >
          <Mail className="w-4 h-4" /> Customer Inquiries ({messages.length})
        </button>
      </div>

      {tab === 'reviews' ? (
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="bg-white rounded-2xl border border-zinc-200 p-10 text-center text-sm text-zinc-500">
              No product reviews submitted yet.
            </div>
          ) : (
            reviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white rounded-2xl border border-zinc-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400' : 'text-zinc-300'}`}
                        />
                      ))}
                    </div>
                    <span className="font-bold text-sm text-zinc-950">{rev.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        rev.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700'
                          : rev.status === 'rejected'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {rev.status}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-600">{rev.comment}</p>
                  <p className="text-xs text-zinc-400">
                    By {rev.userName} · {new Date(rev.createdAt).toLocaleDateString('en-GB')}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {rev.status !== 'approved' && (
                    <button
                      type="button"
                      onClick={() => updateReviewStatus(rev.id, 'approved')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </button>
                  )}
                  {rev.status !== 'rejected' && (
                    <button
                      type="button"
                      onClick={() => updateReviewStatus(rev.id, 'rejected')}
                      className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Hide
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteReview(rev.id)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="bg-white rounded-2xl border border-zinc-200 p-10 text-center text-sm text-zinc-500">
              No contact inquiries yet.
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className="bg-white rounded-2xl border border-zinc-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-zinc-950">{msg.subject}</span>
                    <span className="px-2 py-0.5 rounded bg-violet-50 text-violet-700 text-[10px] font-bold uppercase">
                      {msg.status}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-600">{msg.message}</p>
                  <p className="text-xs text-zinc-400">
                    {msg.name} · {msg.phone} · {msg.email}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {msg.status !== 'resolved' && (
                    <button
                      type="button"
                      onClick={() => updateMessageStatus(msg.id, 'resolved')}
                      className="px-3.5 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-semibold cursor-pointer"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
