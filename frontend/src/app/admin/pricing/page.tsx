'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { CostSetting, TransportRate, BudgetCategory } from '@/types';
import { Plus, Trash2, Edit, X } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORY_LABEL: Record<BudgetCategory, string> = { budget: 'Budget', mid_range: 'Mid-Range', luxury: 'Luxury' };
const CATEGORY_BADGE: Record<BudgetCategory, string> = {
  budget: 'bg-green-100 text-green-700',
  mid_range: 'bg-blue-100 text-blue-700',
  luxury: 'bg-purple-100 text-purple-700',
};

interface RateForm {
  category: BudgetCategory;
  vehicle_type: string;
  min_passengers: string;
  max_passengers: string;
  price_per_km: string;
}

const EMPTY_RATE: RateForm = { category: 'budget', vehicle_type: '', min_passengers: '1', max_passengers: '3', price_per_km: '' };

function rateToForm(r: TransportRate): RateForm {
  return {
    category: r.category,
    vehicle_type: r.vehicle_type,
    min_passengers: String(r.min_passengers),
    max_passengers: String(r.max_passengers),
    price_per_km: String(r.price_per_km),
  };
}

function TransportRateModal({ initial, onClose, onSubmit, saving }: {
  initial: RateForm; onClose: () => void; onSubmit: (form: RateForm) => void; saving: boolean;
}) {
  const [form, setForm] = useState(initial);
  const set = <K extends keyof RateForm>(key: K, value: RateForm[K]) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">{initial.vehicle_type ? 'Edit Transport Rate' : 'Add Transport Rate'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Budget Category</label>
            <select value={form.category} onChange={(e) => set('category', e.target.value as BudgetCategory)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {(Object.keys(CATEGORY_LABEL) as BudgetCategory[]).map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Vehicle Type</label>
            <input required value={form.vehicle_type} onChange={(e) => set('vehicle_type', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Van" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Min Passengers</label>
              <input required type="number" min={1} value={form.min_passengers} onChange={(e) => set('min_passengers', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Max Passengers</label>
              <input required type="number" min={1} value={form.max_passengers} onChange={(e) => set('max_passengers', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Price per km (USD)</label>
            <input required type="number" step="any" min={0} value={form.price_per_km} onChange={(e) => set('price_per_km', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.35" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border-2 border-gray-300 text-gray-600 py-2.5 rounded-lg font-medium hover:border-gray-400">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Rate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CostSettingsCard({ settings }: { settings: CostSetting[] }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Record<number, { accommodation_per_night: string; food_per_day: string }>>({});

  const updateMutation = useMutation({
    mutationFn: ({ category, payload }: { category: BudgetCategory; payload: { accommodation_per_night: number; food_per_day: number } }) =>
      api.put(`/pricing/settings/${category}`, payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-cost-settings'] }); queryClient.invalidateQueries({ queryKey: ['planner-cost-settings'] }); toast.success('Saved'); },
    onError: () => toast.error('Failed to save'),
  });

  const rowValue = (s: CostSetting, field: 'accommodation_per_night' | 'food_per_day') =>
    editing[s.id]?.[field] ?? String(s[field]);

  const setRow = (s: CostSetting, field: 'accommodation_per_night' | 'food_per_day', value: string) =>
    setEditing((e) => ({ ...e, [s.id]: { accommodation_per_night: rowValue(s, 'accommodation_per_night'), food_per_day: rowValue(s, 'food_per_day'), [field]: value } }));

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h2 className="font-bold text-gray-800 mb-1">Accommodation &amp; Food (per day)</h2>
      <p className="text-xs text-gray-400 mb-4">Applied per traveler, per night/day, by budget tier.</p>
      <div className="space-y-3">
        {settings.map((s) => (
          <div key={s.id} className="flex items-center gap-3">
            <span className={`text-xs font-medium px-2 py-1 rounded-full w-24 text-center shrink-0 ${CATEGORY_BADGE[s.category]}`}>{CATEGORY_LABEL[s.category]}</span>
            <div className="flex-1">
              <label className="block text-[10px] text-gray-400 mb-0.5">Accommodation / night ($)</label>
              <input type="number" step="any" min={0} value={rowValue(s, 'accommodation_per_night')}
                onChange={(e) => setRow(s, 'accommodation_per_night', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] text-gray-400 mb-0.5">Food / day ($)</label>
              <input type="number" step="any" min={0} value={rowValue(s, 'food_per_day')}
                onChange={(e) => setRow(s, 'food_per_day', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button
              onClick={() => updateMutation.mutate({ category: s.category, payload: { accommodation_per_night: Number(rowValue(s, 'accommodation_per_night')), food_per_day: Number(rowValue(s, 'food_per_day')) } })}
              className="self-end text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-700 shrink-0">
              Save
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminPricingPage() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<'new' | TransportRate | null>(null);

  const { data: settings = [], isLoading: loadingSettings } = useQuery({
    queryKey: ['admin-cost-settings'],
    queryFn: async () => { const { data } = await api.get('/pricing/settings'); return data.data as CostSetting[]; },
  });

  const { data: rates = [], isLoading: loadingRates } = useQuery({
    queryKey: ['admin-transport-rates'],
    queryFn: async () => { const { data } = await api.get('/pricing/transport-rates'); return data.data as TransportRate[]; },
  });

  const invalidateRates = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-transport-rates'] });
    queryClient.invalidateQueries({ queryKey: ['planner-transport-rates'] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post('/pricing/transport-rates', payload),
    onSuccess: () => { invalidateRates(); toast.success('Transport rate created'); setModal(null); },
    onError: () => toast.error('Failed to create rate'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) => api.put(`/pricing/transport-rates/${id}`, payload),
    onSuccess: () => { invalidateRates(); toast.success('Transport rate updated'); setModal(null); },
    onError: () => toast.error('Failed to update rate'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/pricing/transport-rates/${id}`),
    onSuccess: () => { invalidateRates(); toast.success('Transport rate deleted'); },
  });

  const handleSubmit = (form: RateForm) => {
    const payload = {
      category: form.category,
      vehicle_type: form.vehicle_type,
      min_passengers: Number(form.min_passengers),
      max_passengers: Number(form.max_passengers),
      price_per_km: Number(form.price_per_km),
    };
    if (modal && modal !== 'new') updateMutation.mutate({ id: modal.id, payload });
    else createMutation.mutate(payload);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Pricing</h1>
        <p className="text-gray-500">Rates used to auto-calculate customer trip cost estimates.</p>
      </div>

      {loadingSettings ? <div className="p-8 text-center text-gray-400">Loading...</div> : <CostSettingsCard settings={settings} />}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-800">Transport Rates (per km)</h2>
            <p className="text-xs text-gray-400">Tiered by budget category and passenger count.</p>
          </div>
          <button onClick={() => setModal('new')} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Add Rate
          </button>
        </div>
        {loadingRates ? <div className="p-8 text-center text-gray-400">Loading...</div> : !rates.length ? <div className="p-8 text-center text-gray-400">No transport rates yet.</div> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Category', 'Vehicle', 'Passengers', 'Price / km', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rates.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_BADGE[r.category]}`}>{CATEGORY_LABEL[r.category]}</span></td>
                  <td className="px-4 py-3 font-medium text-gray-800">{r.vehicle_type}</td>
                  <td className="px-4 py-3 text-gray-600">{r.min_passengers}–{r.max_passengers} pax</td>
                  <td className="px-4 py-3 text-gray-800">${Number(r.price_per_km).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => setModal(r)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => { if (confirm('Delete this transport rate?')) deleteMutation.mutate(r.id); }}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <TransportRateModal
          initial={modal === 'new' ? EMPTY_RATE : rateToForm(modal)}
          onClose={() => setModal(null)}
          onSubmit={handleSubmit}
          saving={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}
