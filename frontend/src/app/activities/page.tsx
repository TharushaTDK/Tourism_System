'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import ActivityCard from '@/components/ActivityCard';
import { Activity } from '@/types';
import { Filter, SlidersHorizontal } from 'lucide-react';

const CATEGORIES = ['All', 'safari', 'train', 'hiking', 'adventure', 'cultural', 'wellness'];
const DIFFICULTIES = ['All', 'easy', 'moderate', 'hard'];

export default function ActivitiesPage() {
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [maxPrice, setMaxPrice] = useState(500);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['activities', category, difficulty, maxPrice, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '9' });
      if (category) params.set('category', category);
      if (difficulty) params.set('difficulty', difficulty);
      params.set('max_price', String(maxPrice));
      const { data } = await api.get(`/activities?${params}`);
      return data.data as { items: Activity[]; total: number };
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Activities & Experiences</h1>
        <p className="text-gray-500 mt-1">Discover thrilling experiences across Sri Lanka</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Filters */}
        <div className="lg:w-56 shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-20">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><SlidersHorizontal className="w-4 h-4" /> Filters</h3>

            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Category</p>
              <div className="space-y-1.5">
                {CATEGORIES.map((c) => (
                  <button key={c} onClick={() => { setCategory(c === 'All' ? '' : c); setPage(1); }}
                    className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors capitalize ${(c === 'All' && !category) || category === c ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Difficulty</p>
              <div className="space-y-1.5">
                {DIFFICULTIES.map((d) => (
                  <button key={d} onClick={() => { setDifficulty(d === 'All' ? '' : d); setPage(1); }}
                    className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors capitalize ${(d === 'All' && !difficulty) || difficulty === d ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Max Price: ${maxPrice}</p>
              <input type="range" min={10} max={500} step={10} value={maxPrice}
                onChange={(e) => { setMaxPrice(Number(e.target.value)); setPage(1); }}
                className="w-full accent-blue-600" />
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 9 }).map((_, i) => <div key={i} className="h-72 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : !data?.items?.length ? (
            <div className="text-center py-20 text-gray-500">
              <Filter className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No activities found. Try adjusting your filters.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">{data.total} activities found</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {data.items.map((a) => <ActivityCard key={a.id} activity={a} />)}
              </div>
              <div className="flex justify-center gap-2 mt-8">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-lg border border-gray-300 text-sm disabled:opacity-40">Previous</button>
                <span className="px-4 py-2 text-sm text-gray-600">Page {page}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={!data || data.items.length < 9} className="px-4 py-2 rounded-lg border border-gray-300 text-sm disabled:opacity-40">Next</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
