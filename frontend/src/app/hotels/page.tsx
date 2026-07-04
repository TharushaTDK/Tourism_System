'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import HotelCard from '@/components/HotelCard';
import { Hotel } from '@/types';
import { MapIcon } from 'lucide-react';

const CATEGORIES = ['All', 'budget', 'mid_range', 'luxury'];
const TYPES = ['All', 'hotel', 'villa', 'resort', 'homestay'];

export default function HotelsPage() {
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  const [starFilter, setStarFilter] = useState(0);
  const [page, setPage] = useState(1);
  const [mapView, setMapView] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['hotels', category, type, starFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '9' });
      if (category) params.set('category', category);
      if (type) params.set('type', type);
      if (starFilter > 0) params.set('min_stars', String(starFilter));
      const { data } = await api.get(`/hotels?${params}`);
      return data.data as { items: Hotel[]; total: number };
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Hotels & Accommodations</h1>
          <p className="text-gray-500 mt-1">Find the perfect stay across Sri Lanka</p>
        </div>
        <button onClick={() => setMapView(!mapView)} className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${mapView ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:border-blue-400'}`}>
          <MapIcon className="w-4 h-4" /> {mapView ? 'List View' : 'Map View'}
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <div className="flex gap-2">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => { setCategory(c === 'All' ? '' : c); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${(c === 'All' && !category) || category === c ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {c.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {TYPES.map((t) => (
            <button key={t} onClick={() => { setType(t === 'All' ? '' : t); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${(t === 'All' && !type) || type === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-gray-500">Stars:</span>
          {[0, 3, 4, 5].map((s) => (
            <button key={s} onClick={() => { setStarFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${starFilter === s ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s === 0 ? 'All' : '★'.repeat(s) + '+'}
            </button>
          ))}
        </div>
      </div>

      {mapView ? (
        <div className="bg-gray-100 rounded-2xl h-96 flex items-center justify-center border-2 border-dashed border-gray-300">
          <div className="text-center text-gray-400">
            <MapIcon className="w-12 h-12 mx-auto mb-2" />
            <p className="font-medium">Interactive Map</p>
            <p className="text-sm">Map integration available in production</p>
          </div>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 9 }).map((_, i) => <div key={i} className="h-72 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : !data?.items?.length ? (
        <div className="text-center py-20 text-gray-500">No hotels found. Try different filters.</div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{data.total} properties found</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.items.map((h) => <HotelCard key={h.id} hotel={h} />)}
          </div>
          <div className="flex justify-center gap-2 mt-8">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-lg border border-gray-300 text-sm disabled:opacity-40">Previous</button>
            <span className="px-4 py-2 text-sm text-gray-600">Page {page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={!data.items || data.items.length < 9} className="px-4 py-2 rounded-lg border border-gray-300 text-sm disabled:opacity-40">Next</button>
          </div>
        </>
      )}
    </div>
  );
}
