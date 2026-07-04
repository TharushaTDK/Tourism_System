'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import PackageCard from '@/components/PackageCard';
import { TourPackage } from '@/types';

const CATEGORIES = ['All', 'budget', 'family', 'honeymoon', 'adventure', 'luxury', 'wildlife'];
const DURATION_FILTERS = [
  { label: 'All', min: 0, max: 999 },
  { label: '1–3 days', min: 1, max: 3 },
  { label: '4–7 days', min: 4, max: 7 },
  { label: '8–14 days', min: 8, max: 14 },
  { label: '15+ days', min: 15, max: 999 },
];

export default function PackagesPage() {
  const [category, setCategory] = useState('');
  const [durationIdx, setDurationIdx] = useState(0);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['packages', category, durationIdx, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '8' });
      if (category) params.set('category', category);
      const dur = DURATION_FILTERS[durationIdx];
      if (dur.min > 0) { params.set('min_days', String(dur.min)); params.set('max_days', String(dur.max)); }
      const { data } = await api.get(`/packages?${params}`);
      return data.data as { items: TourPackage[]; total: number };
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Tour Packages</h1>
      <p className="text-gray-500 mb-8">All-inclusive Sri Lanka tours for every type of traveler</p>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => { setCategory(c === 'All' ? '' : c); setPage(1); }}
              className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${(c === 'All' && !category) || category === c ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {c}
            </button>
          ))}
        </div>
        <select value={durationIdx} onChange={(e) => { setDurationIdx(Number(e.target.value)); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          {DURATION_FILTERS.map((d, i) => <option key={i} value={i}>{d.label}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-80 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : !data?.items?.length ? (
        <div className="text-center py-20 text-gray-500">No packages found. Try different filters.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {data.items.map((p) => <PackageCard key={p.id} pkg={p} />)}
          </div>
          <div className="flex justify-center gap-2 mt-8">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-lg border border-gray-300 text-sm disabled:opacity-40">Previous</button>
            <span className="px-4 py-2 text-sm text-gray-600">Page {page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={!data.items || data.items.length < 8} className="px-4 py-2 rounded-lg border border-gray-300 text-sm disabled:opacity-40">Next</button>
          </div>
        </>
      )}
    </div>
  );
}
