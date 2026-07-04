'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Booking } from '@/types';
import { Calendar, DollarSign, X, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, getStatusColor, formatDate } from '@/lib/utils';

const TABS = ['All', 'Hotels', 'Activities', 'Transport', 'Packages'];

export default function BookingsPage() {
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => { if (hasHydrated && !isAuthenticated) router.push('/login'); }, [hasHydrated, isAuthenticated, router]);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: async () => { const { data } = await api.get('/bookings/my'); return data.data as Booking[]; },
    enabled: isAuthenticated,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => api.put(`/bookings/${id}/cancel`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['my-bookings'] }); toast.success('Booking cancelled'); },
    onError: () => toast.error('Could not cancel booking'),
  });

  const typeMap: Record<string, string> = { 'Hotels': 'hotel', 'Activities': 'activity', 'Transport': 'transport', 'Packages': 'package' };
  const filtered = bookings?.filter(b => activeTab === 'All' || b.booking_type === typeMap[activeTab]) || [];

  const BOOKING_ICONS: Record<string, string> = { hotel: '🏨', activity: '🎯', transport: '🚗', package: '📦' };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">My Bookings</h1>
      <p className="text-gray-500 mb-6">All your travel reservations in one place</p>

      <div className="flex gap-2 flex-wrap mb-6">
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {tab}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : !filtered.length ? (
        <div className="text-center py-20 text-gray-500">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No {activeTab !== 'All' ? activeTab.toLowerCase() : ''} bookings found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((b) => (
            <div key={b.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl shrink-0">
                  {BOOKING_ICONS[b.booking_type || 'activity'] || '📋'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-800 truncate">{b.destination_name || `Booking #${b.id}`}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full border capitalize shrink-0 ${getStatusColor(b.status)}`}>{b.status}</span>
                    {b.payment_status && <span className={`text-xs px-2 py-0.5 rounded-full border capitalize shrink-0 ${getStatusColor(b.payment_status)}`}>{b.payment_status}</span>}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    {b.check_in && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(b.check_in)} {b.check_out ? `→ ${formatDate(b.check_out)}` : ''}</span>}
                    <span>{b.guests} guests</span>
                    <span className="flex items-center gap-1 font-semibold text-gray-700"><DollarSign className="w-3.5 h-3.5 text-blue-500" /> {formatCurrency(Number(b.total_amount || b.total_price) || 0)}</span>
                  </div>
                </div>
                {b.status === 'pending' && (
                  <button onClick={() => { if (confirm('Cancel this booking?')) cancelMutation.mutate(b.id); }}
                    className="shrink-0 flex items-center gap-1 text-xs text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors border border-red-200">
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
