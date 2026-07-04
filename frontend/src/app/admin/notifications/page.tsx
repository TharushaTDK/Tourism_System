'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { Bell, Send, Users, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

const NOTIFICATION_TYPES = ['booking', 'weather', 'event', 'recommendation', 'system'];

export default function AdminNotificationsPage() {
  const [form, setForm] = useState({ title: '', message: '', type: 'system', target: 'all', user_id: '' });

  const sendNotification = useMutation({
    mutationFn: (payload: typeof form) => api.post('/notifications/send', payload),
    onSuccess: () => { toast.success('Notification sent!'); setForm({ ...form, title: '', message: '' }); },
    onError: () => toast.error('Failed to send notification'),
  });

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Notification Manager</h1>
        <p className="text-gray-500">Send notifications to tourists</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="font-bold text-gray-800 mb-5 flex items-center gap-2"><Bell className="w-5 h-5 text-blue-600" /> Send Notification</h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Notification Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white capitalize">
              {NOTIFICATION_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Target Audience</label>
            <div className="flex gap-3">
              {[
                { value: 'all', label: 'All Tourists', icon: Globe },
                { value: 'specific', label: 'Specific User', icon: Users },
              ].map(({ value, label, icon: Icon }) => (
                <button key={value} onClick={() => setForm({ ...form, target: value })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${form.target === value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>
          </div>

          {form.target === 'specific' && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">User ID</label>
              <input type="number" placeholder="Enter user ID" value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Title</label>
            <input type="text" placeholder="Notification title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Message</label>
            <textarea rows={4} placeholder="Notification message..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          <button onClick={() => sendNotification.mutate(form)}
            disabled={!form.title || !form.message || sendNotification.isPending}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
            <Send className="w-4 h-4" /> {sendNotification.isPending ? 'Sending...' : 'Send Notification'}
          </button>
        </div>
      </div>

      {/* Quick templates */}
      <div className="mt-6 bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="font-bold text-gray-800 mb-4">Quick Templates</h3>
        <div className="space-y-2">
          {[
            { title: '🌧️ Weather Alert', message: 'Heavy rainfall expected in southern Sri Lanka this weekend. Plan accordingly.', type: 'weather' },
            { title: '🎉 Perahera Festival', message: 'The Kandy Esala Perahera begins this week! Book your spot early.', type: 'event' },
            { title: '🏷️ Special Offer', message: 'Get 20% off all activity bookings this month with code LANKA20!', type: 'recommendation' },
          ].map((t, i) => (
            <button key={i} onClick={() => setForm({ ...form, title: t.title, message: t.message, type: t.type })}
              className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors border border-gray-100">
              <p className="text-sm font-medium text-gray-800">{t.title}</p>
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{t.message}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
