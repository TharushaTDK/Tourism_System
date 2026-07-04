'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Booking, Trip } from '@/types';
import {
  Sparkles, Car, Map, Calendar, DollarSign, MapPin, Clock,
  Trash2, Share2, Mail, Phone, MessageCircle, ChevronDown, ChevronUp, CheckCircle2, Plus, CheckCircle,
} from 'lucide-react';
import { formatCurrency, getStatusColor, formatDate, formatDateRange, formatStatusLabel } from '@/lib/utils';
import toast from 'react-hot-toast';

const rangeMid = (t: Trip) => {
  const r = t.trip_details?.cost_estimate?.total;
  if (r) return Math.round((r.low + r.high) / 2);
  return Number(t.estimated_cost || t.total_budget) || 0;
};

export default function DashboardPage() {
  const { isAuthenticated, user, hasHydrated } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [tripFilter, setTripFilter] = useState<'' | 'pending_approval' | 'approved'>('');

  useEffect(() => { if (hasHydrated && !isAuthenticated) router.push('/login'); }, [hasHydrated, isAuthenticated, router]);

  const { data: bookings } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: async () => { const { data } = await api.get('/bookings/my'); return data.data as Booking[]; },
    enabled: isAuthenticated,
  });

  const { data: trips, isLoading: tripsLoading } = useQuery({
    queryKey: ['my-itineraries'],
    queryFn: async () => { const { data } = await api.get('/itineraries/my'); return data.data as Trip[]; },
    enabled: isAuthenticated,
    refetchOnMount: 'always',
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

  const pendingCount = trips?.filter((t) => t.status === 'pending_approval').length || 0;
  const approvedCount = trips?.filter((t) => ['approved', 'planned', 'active', 'completed'].includes(t.status)).length || 0;
  const totalSpend = trips?.reduce((sum, t) => sum + rangeMid(t), 0) || 0;

  const visibleTrips = trips?.filter((t) => {
    if (tripFilter === 'pending_approval') return t.status === 'pending_approval';
    if (tripFilter === 'approved') return ['approved', 'planned', 'active', 'completed'].includes(t.status);
    return true;
  });

  const FILTER_LABELS: Record<string, string> = { '': 'My Trips', pending_approval: 'Pending Approval Trips', approved: 'Approved Trips' };

  if (!hasHydrated || !isAuthenticated) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
        <p className="text-gray-500 mt-1">Here&apos;s an overview of your trips</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'My Trips', value: trips?.length || 0, icon: MapPin, color: 'blue', filter: '' as const },
          { label: 'Pending Approval', value: pendingCount, icon: Clock, color: 'yellow', filter: 'pending_approval' as const },
          { label: 'Approved', value: approvedCount, icon: CheckCircle, color: 'emerald', filter: 'approved' as const },
          { label: 'Total Approx. Spend', value: formatCurrency(totalSpend), icon: DollarSign, color: 'purple', filter: null },
        ].map(({ label, value, icon: Icon, color, filter }) => {
          const active = filter !== null && tripFilter === filter;
          const clickable = filter !== null;
          return (
            <button
              key={label}
              type="button"
              onClick={() => clickable && setTripFilter(filter)}
              disabled={!clickable}
              className={`bg-white rounded-xl border p-5 text-left transition-all ${clickable ? 'hover:shadow-md cursor-pointer' : 'cursor-default'} ${active ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-100'}`}
            >
              <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center bg-${color}-100`}>
                <Icon className={`w-5 h-5 text-${color}-600`} />
              </div>
              <p className="text-2xl font-bold text-gray-800">{value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{label}</p>
            </button>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-8">
        <h2 className="font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'Plan Trip', href: '/planner', icon: Sparkles, bg: 'bg-blue-50', text: 'text-blue-700' },
            { label: 'Activities', href: '/activities', icon: Map, bg: 'bg-blue-50', text: 'text-blue-700' },
            { label: 'Transport', href: '/transport', icon: Car, bg: 'bg-orange-50', text: 'text-orange-700' },
            { label: 'Chat', href: '/chat', icon: Clock, bg: 'bg-purple-50', text: 'text-purple-700' },
          ].map(({ label, href, icon: Icon, bg, text }) => (
            <Link key={label} href={href} className={`${bg} ${text} rounded-xl p-3 flex flex-col items-center gap-2 hover:opacity-80 transition-opacity text-center`}>
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* My Trips */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-800">{FILTER_LABELS[tripFilter]}</h2>
            {tripFilter && (
              <button onClick={() => setTripFilter('')} className="text-xs text-blue-600 hover:underline font-medium">Clear filter</button>
            )}
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
            {visibleTrips.map((t) => {
              const range = t.trip_details?.cost_estimate?.total;
              const expanded = expandedId === t.id;
              const isApproved = ['approved', 'planned', 'active', 'completed'].includes(t.status);
              return (
                <div key={t.id} className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-2">
                        <h3 className="font-bold text-gray-800">{t.title}</h3>
                        {t.ai_generated && <span className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Auto-Generated</span>}
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(t.status)}`}>{formatStatusLabel(t.status)}</span>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-2">
                        {t.start_date && t.end_date && (
                          <span className="flex items-center gap-1"><Calendar className="w-4 h-4 text-blue-500" /> {formatDateRange(t.start_date, t.end_date)}</span>
                        )}
                        <span>{t.total_days} days</span>
                        {range ? (
                          <span className="flex items-center gap-1"><DollarSign className="w-4 h-4 text-blue-500" /> Approx. {formatCurrency(range.low)} – {formatCurrency(range.high)}</span>
                        ) : t.estimated_cost ? (
                          <span className="flex items-center gap-1"><DollarSign className="w-4 h-4 text-blue-500" /> Est. {formatCurrency(Number(t.estimated_cost))}</span>
                        ) : null}
                      </div>

                      {t.trip_details?.destination_names?.length ? (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {t.trip_details.destination_names.map((name) => (
                            <span key={name} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{name}</span>
                          ))}
                        </div>
                      ) : null}

                      <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-2">
                        {t.contact_email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {t.contact_email}</span>}
                        {t.contact_phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {t.contact_phone}</span>}
                        {t.contact_whatsapp && <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> {t.contact_whatsapp}</span>}
                      </div>

                      {t.status === 'pending_approval' && (
                        <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2 flex items-center gap-1.5 mt-2">
                          <Clock className="w-3.5 h-3.5 shrink-0" /> Waiting for our team&apos;s approval — you&apos;ll be contacted within a few hours.
                        </p>
                      )}

                      {isApproved && t.notes && (
                        <div className="mt-2">
                          <button onClick={() => setExpandedId(expanded ? null : t.id)} className="flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {expanded ? 'Hide' : 'View'} Full Itinerary {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                          {expanded && (
                            <div className="bg-blue-50 rounded-xl p-4 mt-2">
                              <pre className="whitespace-pre-wrap font-sans text-gray-700 text-sm leading-relaxed">{t.notes}</pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4 shrink-0">
                      <button onClick={() => shareMutation.mutate(t.id)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Share">
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => { if (confirm('Delete this trip?')) deleteMutation.mutate(t.id); }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-800">Recent Bookings</h2>
          <Link href="/dashboard/bookings" className="text-sm text-blue-600 hover:underline">View all →</Link>
        </div>
        {!bookings?.length ? (
          <p className="text-gray-400 text-sm text-center py-8">No bookings yet.</p>
        ) : (
          <div className="space-y-3">
            {bookings.slice(0, 5).map((b) => (
              <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-sm font-bold text-blue-700 shrink-0">
                  {b.booking_type === 'hotel' ? '🏨' : b.booking_type === 'activity' ? '🎯' : b.booking_type === 'package' ? '📦' : '🚗'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">{b.destination_name || `Booking #${b.id}`}</p>
                  <p className="text-xs text-gray-400">{b.check_in ? formatDate(b.check_in) : formatDate(b.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-800">{formatCurrency(Number(b.total_amount || b.total_price) || 0)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${getStatusColor(b.status)}`}>{b.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
