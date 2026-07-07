'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Booking, Trip } from '@/types';
import { Calendar, DollarSign, X, BookOpen, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, getStatusColor, formatDate } from '@/lib/utils';
import TripCard from '@/components/dashboard/TripCard';
import AdvancePaymentModal from '@/components/dashboard/AdvancePaymentModal';

const BOOKING_TABS = ['All', 'Hotels', 'Activities', 'Transport', 'Packages'];
const TRIP_FILTERS: { label: string; value: '' | 'pending_approval' | 'quoted' | 'payment_submitted' | 'approved' }[] = [
  { label: 'All', value: '' },
  { label: 'Pending Approval', value: 'pending_approval' },
  { label: 'Awaiting Payment', value: 'quoted' },
  { label: 'Payment Submitted', value: 'payment_submitted' },
  { label: 'Approved', value: 'approved' },
];

const rangeMid = (t: Trip) => {
  const r = t.trip_details?.cost_estimate?.total;
  if (r) return Math.round((r.low + r.high) / 2);
  return Number(t.estimated_cost || t.total_budget) || 0;
};

export default function TripsPage() {
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [tripFilter, setTripFilter] = useState<'' | 'pending_approval' | 'quoted' | 'payment_submitted' | 'approved'>('');
  const [bookingTab, setBookingTab] = useState('All');
  const [payingTrip, setPayingTrip] = useState<Trip | null>(null);

  useEffect(() => { if (hasHydrated && !isAuthenticated) router.push('/login'); }, [hasHydrated, isAuthenticated, router]);

  const { data: trips, isLoading: tripsLoading } = useQuery({
    queryKey: ['my-itineraries'],
    queryFn: async () => { const { data } = await api.get('/itineraries/my'); return data.data as Trip[]; },
    enabled: isAuthenticated,
    refetchOnMount: 'always',
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: async () => { const { data } = await api.get('/bookings/my'); return data.data as Booking[]; },
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/itineraries/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['my-itineraries'] }); toast.success('Trip deleted'); },
    onError: () => toast.error('Failed to delete'),
  });

  const shareMutation = useMutation({
    mutationFn: (id: number) => api.post(`/itineraries/${id}/share`),
    onSuccess: (data) => { navigator.clipboard.writeText(window.location.origin + '/itinerary/' + data.data?.data?.share_token); toast.success('Share link copied!'); },
  });

  const cancelBookingMutation = useMutation({
    mutationFn: (id: number) => api.put(`/bookings/${id}/cancel`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['my-bookings'] }); toast.success('Booking cancelled'); },
    onError: () => toast.error('Could not cancel booking'),
  });

  const visibleTrips = trips?.filter((t) => {
    if (tripFilter === 'pending_approval') return t.status === 'pending_approval' || t.status === 'price_set';
    if (tripFilter === 'quoted') return t.status === 'quoted';
    if (tripFilter === 'payment_submitted') return t.status === 'payment_submitted';
    if (tripFilter === 'approved') return ['approved', 'planned', 'active', 'completed'].includes(t.status);
    return true;
  });

  const bookingTypeMap: Record<string, string> = { Hotels: 'hotel', Activities: 'activity', Transport: 'transport', Packages: 'package' };
  const filteredBookings = bookings?.filter((b) => bookingTab === 'All' || b.booking_type === bookingTypeMap[bookingTab]) || [];
  const BOOKING_ICONS: Record<string, string> = { hotel: '🏨', activity: '🎯', transport: '🚗', package: '📦' };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Trips</h1>
        <p className="text-gray-500 mt-1">Your trip requests and every booking you&apos;ve made, in one place</p>
      </div>

      {/* Trip Requests */}
      <div className="mb-10">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex gap-2 flex-wrap">
            {TRIP_FILTERS.map((f) => (
              <button key={f.value} onClick={() => setTripFilter(f.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${tripFilter === f.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {f.label}
              </button>
            ))}
          </div>
          <Link href="/planner" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm">
            <Plus className="w-4 h-4" /> New Trip
          </Link>
        </div>

        {tripsLoading ? (
          <div className="space-y-4">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-36 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : !trips?.length ? (
          <div className="bg-white rounded-xl border border-gray-100 text-center py-16">
            <div className="text-5xl mb-4">🗺️</div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">No Trips Yet</h3>
            <p className="text-gray-500 mb-6 text-sm">Use our planner to create your perfect Sri Lanka trip</p>
            <Link href="/planner" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700">
              Plan Your Trip
            </Link>
          </div>
        ) : !visibleTrips?.length ? (
          <div className="bg-white rounded-xl border border-gray-100 text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">No trips match this filter</h3>
            <button onClick={() => setTripFilter('')} className="text-blue-600 hover:underline text-sm font-medium">Show all trips</button>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleTrips.map((t) => (
              <TripCard key={t.id} trip={t} expanded={expandedId === t.id}
                onToggleExpand={() => setExpandedId(expandedId === t.id ? null : t.id)}
                onShare={() => shareMutation.mutate(t.id)}
                onDelete={() => { if (confirm('Delete this trip?')) deleteMutation.mutate(t.id); }}
                onPay={() => setPayingTrip(t)}
              />
            ))}
          </div>
        )}
      </div>

      {payingTrip && <AdvancePaymentModal trip={payingTrip} onClose={() => setPayingTrip(null)} />}

      {/* Bookings */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">Bookings</h2>
        <p className="text-gray-500 text-sm mb-4">Hotels, activities, transport & packages you&apos;ve reserved</p>

        <div className="flex gap-2 flex-wrap mb-6">
          {BOOKING_TABS.map((tab) => (
            <button key={tab} onClick={() => setBookingTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${bookingTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {tab}
            </button>
          ))}
        </div>

        {bookingsLoading ? (
          <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : !filteredBookings.length ? (
          <div className="text-center py-16 text-gray-500 bg-white rounded-xl border border-gray-100">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No {bookingTab !== 'All' ? bookingTab.toLowerCase() : ''} bookings found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((b) => (
              <div key={b.id} className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-wrap">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-xl flex items-center justify-center text-xl sm:text-2xl shrink-0">
                    {BOOKING_ICONS[b.booking_type || 'activity'] || '📋'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
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
                    <button onClick={() => { if (confirm('Cancel this booking?')) cancelBookingMutation.mutate(b.id); }}
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
    </div>
  );
}
