'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Trip } from '@/types';
import { X, Mail, Phone, MessageCircle, CheckCircle2, MapPin, Calendar, Users, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, formatDateRange, getStatusColor, formatStatusLabel } from '@/lib/utils';

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'approved', label: 'Confirmed' },
];

function DetailModal({ trip, onClose }: { trip: Trip; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(trip.title);
  const [notes, setNotes] = useState(trip.notes || '');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-trips'] });

  const saveMutation = useMutation({
    mutationFn: () => api.put(`/admin/itineraries/${trip.id}`, { title, notes }),
    onSuccess: () => { invalidate(); toast.success('Changes saved'); },
    onError: () => toast.error('Failed to save'),
  });

  const approveMutation = useMutation({
    mutationFn: () => api.patch(`/admin/itineraries/${trip.id}/approve`, { notes }),
    onSuccess: () => { invalidate(); toast.success('Trip confirmed — customer can now see it'); onClose(); },
    onError: () => toast.error('Failed to confirm'),
  });

  const td = trip.trip_details;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-800">Trip #{trip.id}</h2>
            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full border ${getStatusColor(trip.status)}`}>{formatStatusLabel(trip.status)}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-0.5">Customer</p>
              <p className="font-medium text-gray-800">{trip.customer_name}</p>
              <p className="text-xs text-gray-500">{trip.account_email}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              <p className="text-xs text-gray-400 mb-0.5">Contact for this trip</p>
              {trip.contact_email && <p className="flex items-center gap-1.5 text-xs text-gray-700"><Mail className="w-3.5 h-3.5 text-gray-400" /> {trip.contact_email}</p>}
              {trip.contact_phone && <p className="flex items-center gap-1.5 text-xs text-gray-700"><Phone className="w-3.5 h-3.5 text-gray-400" /> {trip.contact_phone}</p>}
              {trip.contact_whatsapp && <p className="flex items-center gap-1.5 text-xs text-gray-700"><MessageCircle className="w-3.5 h-3.5 text-gray-400" /> {trip.contact_whatsapp}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <Calendar className="w-4 h-4 text-blue-500 mx-auto mb-1" />
              <p className="text-xs text-gray-500">{formatDateRange(trip.start_date, trip.end_date)}</p>
              <p className="text-xs text-gray-400">{trip.total_days} days</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <Users className="w-4 h-4 text-blue-500 mx-auto mb-1" />
              <p className="text-xs text-gray-500">
                {td ? `${td.adults} adult${td.adults !== 1 ? 's' : ''}${td.children_6_12 ? `, ${td.children_6_12} child(6-12)` : ''}${td.children_under_5 ? `, ${td.children_under_5} child(<5)` : ''}` : '—'}
              </p>
              <p className="text-xs text-gray-400 capitalize">{td?.budget?.replace('_', ' ')}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <DollarSign className="w-4 h-4 text-blue-500 mx-auto mb-1" />
              <p className="text-xs text-gray-500">
                {td?.cost_estimate?.total ? `${formatCurrency(td.cost_estimate.total.low)} – ${formatCurrency(td.cost_estimate.total.high)}` : (trip.estimated_cost ? formatCurrency(Number(trip.estimated_cost)) : '—')}
              </p>
              <p className="text-xs text-gray-400">Est. total</p>
            </div>
          </div>

          {td?.destination_names?.length ? (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Destinations</p>
              <div className="flex flex-wrap gap-1.5">
                {td.destination_names.map((name) => <span key={name} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{name}</span>)}
              </div>
            </div>
          ) : null}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Itinerary (auto-generated — edit before confirming)</label>
            <textarea rows={10} value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
              className="flex-1 border-2 border-blue-500 text-blue-600 py-2.5 rounded-lg font-semibold hover:bg-blue-50 disabled:opacity-60">
              {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
            {trip.status === 'pending_approval' && (
              <button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}
                className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-60">
                <CheckCircle2 className="w-4 h-4" /> {approveMutation.isPending ? 'Confirming...' : 'Confirm & Notify Customer'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminTripsPage() {
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<Trip | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-trips', status],
    queryFn: async () => {
      const { data } = await api.get(`/admin/itineraries${status ? `?status=${status}` : ''}`);
      return data.data as { items: Trip[]; total: number };
    },
  });

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Trips</h1>
        <p className="text-gray-500">{data?.total ?? 0} trips — review, edit, and confirm customer trip plans</p>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f.value} onClick={() => setStatus(f.value)}
            className={`text-sm font-medium px-4 py-2 rounded-full transition-colors ${status === f.value ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {isLoading ? <div className="p-8 text-center text-gray-400">Loading...</div> : !data?.items?.length ? <div className="p-8 text-center text-gray-400">No trips.</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[680px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Customer', 'Trip', 'Dates', 'Est. Total', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.items.map((t) => {
                  const range = t.trip_details?.cost_estimate?.total;
                  return (
                    <tr key={t.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(t)}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{t.customer_name}</p>
                        <p className="text-xs text-gray-400">{t.contact_email || t.account_email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[220px] truncate">{t.title}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDateRange(t.start_date, t.end_date)}</td>
                      <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                        {range ? `${formatCurrency(range.low)} – ${formatCurrency(range.high)}` : t.estimated_cost ? formatCurrency(Number(t.estimated_cost)) : '—'}
                      </td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(t.status)}`}>{formatStatusLabel(t.status)}</span></td>
                      <td className="px-4 py-3 text-blue-600 text-xs font-medium whitespace-nowrap">Review →</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && <DetailModal trip={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
