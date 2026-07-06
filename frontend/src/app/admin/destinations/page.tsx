'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Destination } from '@/types';
import { parseGoogleMapsLink } from '@/lib/geo';
import { Star, Edit, Trash2, Plus, X, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import StarRating from '@/components/StarRating';

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => <div className="h-[280px] bg-gray-100 rounded-xl animate-pulse" />,
});

const CATEGORY_OPTIONS = [
  { value: 'cultural', label: 'Cultural' },
  { value: 'beach', label: 'Beach' },
  { value: 'wildlife', label: 'Wildlife' },
  { value: 'hill_country', label: 'Hill Country' },
  { value: 'adventure', label: 'Adventure' },
];

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

interface DestinationForm {
  name: string;
  slug: string;
  emoji: string;
  category: string;
  province: string;
  latitude: string;
  longitude: string;
  short_description: string;
  description: string;
  best_time_to_visit: string;
  entry_fee: string;
  image_url: string;
  budget_price: string;
  mid_range_price: string;
  luxury_price: string;
}

const EMPTY_FORM: DestinationForm = {
  name: '', slug: '', emoji: '📍', category: 'cultural', province: '', latitude: '', longitude: '',
  short_description: '', description: '', best_time_to_visit: '', entry_fee: '0', image_url: '',
  budget_price: '0', mid_range_price: '0', luxury_price: '0',
};

function destinationToForm(d: Destination): DestinationForm {
  return {
    name: d.name,
    slug: d.slug || slugify(d.name),
    emoji: d.emoji || '📍',
    category: d.category,
    province: d.province || '',
    latitude: d.latitude != null ? String(d.latitude) : '',
    longitude: d.longitude != null ? String(d.longitude) : '',
    short_description: d.short_description || '',
    description: d.description || '',
    best_time_to_visit: d.best_time_to_visit || '',
    entry_fee: d.entry_fee != null ? String(d.entry_fee) : '0',
    image_url: d.image_url || d.image_urls?.[0] || '',
    budget_price: d.budget_price != null ? String(d.budget_price) : '0',
    mid_range_price: d.mid_range_price != null ? String(d.mid_range_price) : '0',
    luxury_price: d.luxury_price != null ? String(d.luxury_price) : '0',
  };
}

function DestinationModal({ initial, onClose, onSubmit, saving }: {
  initial: DestinationForm;
  onClose: () => void;
  onSubmit: (form: DestinationForm) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState(initial);
  const [mapsLink, setMapsLink] = useState('');
  const set = <K extends keyof DestinationForm>(key: K, value: DestinationForm[K]) => setForm((f) => ({ ...f, [key]: value }));

  const applyMapsLink = (value: string) => {
    if (!value.trim()) return;
    const parsed = parseGoogleMapsLink(value);
    if (parsed) {
      setForm((f) => ({ ...f, latitude: String(parsed.lat), longitude: String(parsed.lng) }));
      toast.success('Location set from Google Maps link');
    } else {
      toast.error("Couldn't find coordinates in that link — try pasting a full Google Maps URL, or click the map below.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">{initial.name ? 'Edit Destination' : 'Add Destination'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}
          className="p-4 sm:p-6 space-y-4"
        >
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
              <input required value={form.name}
                onChange={(e) => { const name = e.target.value; setForm((f) => ({ ...f, name, slug: f.slug === '' || f.slug === slugify(f.name) ? slugify(name) : f.slug })); }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Emoji</label>
              <input value={form.emoji} onChange={(e) => set('emoji', e.target.value)} maxLength={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="📍" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Slug</label>
            <input required value={form.slug} onChange={(e) => set('slug', slugify(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
              <select value={form.category} onChange={(e) => set('category', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {CATEGORY_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Province</label>
              <input required value={form.province} onChange={(e) => set('province', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Western" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Location</label>
            <input
              value={mapsLink}
              onChange={(e) => setMapsLink(e.target.value)}
              onBlur={(e) => applyMapsLink(e.target.value)}
              onPaste={(e) => { const text = e.clipboardData.getData('text'); setMapsLink(text); applyMapsLink(text); }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Paste a Google Maps link here…"
            />
            <p className="text-[11px] text-gray-400 mt-1">Or just click (or drag the pin) on the map below to set the location.</p>
            <div className="mt-2">
              <LocationPicker
                latitude={form.latitude ? Number(form.latitude) : null}
                longitude={form.longitude ? Number(form.longitude) : null}
                onChange={(lat, lng) => setForm((f) => ({ ...f, latitude: String(lat), longitude: String(lng) }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Latitude</label>
              <input required type="number" step="any" value={form.latitude} onChange={(e) => set('latitude', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="6.9271" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Longitude</label>
              <input required type="number" step="any" value={form.longitude} onChange={(e) => set('longitude', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="79.8612" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Short Description</label>
            <input value={form.short_description} onChange={(e) => set('short_description', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="One-line teaser shown on cards" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Best Time to Visit</label>
              <input value={form.best_time_to_visit} onChange={(e) => set('best_time_to_visit', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Year-round" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Entry Fee (USD)</label>
              <input type="number" step="any" min={0} value={form.entry_fee} onChange={(e) => set('entry_fee', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Image URL</label>
            <input value={form.image_url} onChange={(e) => set('image_url', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://..." />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Visit Cost per Traveler (USD)</label>
            <p className="text-[11px] text-gray-400 mb-1.5">Entry fees / on-site activities, used in the trip cost estimate.</p>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">Budget</label>
                <input type="number" step="any" min={0} value={form.budget_price} onChange={(e) => set('budget_price', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 sm:px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">Mid-Range</label>
                <input type="number" step="any" min={0} value={form.mid_range_price} onChange={(e) => set('mid_range_price', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 sm:px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">Luxury</label>
                <input type="number" step="any" min={0} value={form.luxury_price} onChange={(e) => set('luxury_price', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 sm:px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border-2 border-gray-300 text-gray-600 py-2.5 rounded-lg font-medium hover:border-gray-400">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Destination'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminDestinationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<'new' | Destination | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-destinations', page],
    queryFn: async () => {
      const { data } = await api.get(`/destinations?page=${page}&limit=15`);
      return data.data as { items: Destination[]; total: number };
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-destinations'] });
    queryClient.invalidateQueries({ queryKey: ['planner-destinations'] });
    queryClient.invalidateQueries({ queryKey: ['featured-destinations'] });
  };

  const toggleFeatured = useMutation({
    mutationFn: (id: number) => api.patch(`/destinations/${id}/feature`),
    onSuccess: () => { invalidate(); toast.success('Featured status updated'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/destinations/${id}`),
    onSuccess: () => { invalidate(); toast.success('Destination deleted'); },
  });

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post('/destinations', payload),
    onSuccess: () => { invalidate(); toast.success('Destination created'); setModal(null); },
    onError: () => toast.error('Failed to create destination'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) => api.put(`/destinations/${id}`, payload),
    onSuccess: () => { invalidate(); toast.success('Destination updated'); setModal(null); },
    onError: () => toast.error('Failed to update destination'),
  });

  const handleSubmit = (form: DestinationForm) => {
    const payload = {
      name: form.name,
      slug: form.slug,
      emoji: form.emoji || '📍',
      category: form.category,
      province: form.province,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
      short_description: form.short_description,
      description: form.description,
      best_time_to_visit: form.best_time_to_visit,
      entry_fee: form.entry_fee ? Number(form.entry_fee) : 0,
      image_urls: form.image_url ? [form.image_url] : [],
      budget_price: form.budget_price ? Number(form.budget_price) : 0,
      mid_range_price: form.mid_range_price ? Number(form.mid_range_price) : 0,
      luxury_price: form.luxury_price ? Number(form.luxury_price) : 0,
    };
    if (modal && modal !== 'new') updateMutation.mutate({ id: modal.id, payload });
    else createMutation.mutate(payload);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Destination Management</h1>
          <p className="text-gray-500">{data?.total || 0} destinations</p>
        </div>
        <button onClick={() => setModal('new')} className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 sm:self-start">
          <Plus className="w-4 h-4" /> Add Destination
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {isLoading ? <div className="p-8 text-center text-gray-400">Loading...</div> : !data?.items?.length ? <div className="p-8 text-center text-gray-400">No destinations.</div> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['', 'Name', 'Category', 'Rating', 'Featured', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.items.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-xl">{d.emoji || '📍'}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{d.name}<div className="text-xs text-gray-400 font-normal">{d.province}</div></td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full capitalize">{d.category}</span>
                      </td>
                      <td className="px-4 py-3"><StarRating rating={d.rating} size="sm" /></td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleFeatured.mutate(d.id)}
                          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors whitespace-nowrap ${d.is_featured ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                          <Star className="w-3 h-3" /> {d.is_featured ? 'Featured' : 'Not Featured'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => setModal(d)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => { if (confirm('Delete this destination?')) deleteMutation.mutate(d.id); }}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-center gap-2 p-4">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded border border-gray-300 text-xs disabled:opacity-40">Previous</button>
              <span className="px-3 py-1.5 text-xs text-gray-600">Page {page}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={!data.items || data.items.length < 15} className="px-3 py-1.5 rounded border border-gray-300 text-xs disabled:opacity-40">Next</button>
            </div>
          </>
        )}
      </div>

      {modal && (
        <DestinationModal
          initial={modal === 'new' ? EMPTY_FORM : destinationToForm(modal)}
          onClose={() => setModal(null)}
          onSubmit={handleSubmit}
          saving={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}
