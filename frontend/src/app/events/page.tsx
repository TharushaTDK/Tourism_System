'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Event } from '@/types';
import { Calendar, MapPin } from 'lucide-react';
import { formatDateRange } from '@/lib/utils';

const CATEGORIES = ['All', 'festival', 'cultural', 'sports', 'nature'];
const CATEGORY_COLORS: Record<string, string> = {
  festival: 'bg-pink-100 text-pink-700',
  cultural: 'bg-purple-100 text-purple-700',
  sports: 'bg-blue-100 text-blue-700',
  nature: 'bg-green-100 text-green-700',
};

export default function EventsPage() {
  const [category, setCategory] = useState('');

  const { data: events, isLoading } = useQuery({
    queryKey: ['events', category],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '12' });
      if (category) params.set('category', category);
      const { data } = await api.get(`/events?${params}`);
      return data.data as Event[];
    },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Events & Festivals</h1>
      <p className="text-gray-500 mb-8">Experience the vibrant culture and traditions of Sri Lanka</p>

      <div className="flex gap-2 flex-wrap mb-8">
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setCategory(c === 'All' ? '' : c)}
            className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${(c === 'All' && !category) || category === c ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {c}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : !events?.length ? (
        <div className="text-center py-20 text-gray-500">No events found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-44 bg-gradient-to-br from-purple-400 to-pink-500 overflow-hidden">
                {event.image_url && <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />}
              </div>
              <div className="p-4">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${CATEGORY_COLORS[event.category] ?? 'bg-gray-100 text-gray-600'}`}>{event.category}</span>
                <h3 className="font-bold text-gray-800 mt-2 mb-2 line-clamp-1">{event.title}</h3>
                {event.description && <p className="text-gray-500 text-xs line-clamp-2 mb-3">{event.description}</p>}
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-purple-500" /> {formatDateRange(event.start_date, event.end_date)}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="w-3.5 h-3.5 text-purple-500" /> {event.location}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
