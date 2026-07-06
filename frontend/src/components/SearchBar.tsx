'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Calendar, Users } from 'lucide-react';

export default function SearchBar() {
  const router = useRouter();
  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [travelers, setTravelers] = useState(2);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (destination) params.set('search', destination);
    if (checkIn) params.set('check_in', checkIn);
    if (checkOut) params.set('check_out', checkOut);
    if (travelers) params.set('travelers', String(travelers));
    router.push(`/destinations?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-2 flex flex-col md:flex-row gap-2 max-w-3xl w-full">
      <div className="flex-1 flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 border border-gray-100">
        <Search className="w-4 h-4 text-blue-500 shrink-0" />
        <input
          type="text"
          placeholder="Where in Sri Lanka?"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 border border-gray-100 flex-wrap sm:flex-nowrap">
        <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
        <input
          type="date"
          value={checkIn}
          min={new Date().toISOString().split('T')[0]}
          onChange={(e) => setCheckIn(e.target.value)}
          className="flex-1 min-w-0 bg-transparent text-sm text-gray-700 focus:outline-none"
        />
        <span className="text-gray-300 shrink-0">→</span>
        <input
          type="date"
          value={checkOut}
          min={checkIn || new Date().toISOString().split('T')[0]}
          onChange={(e) => setCheckOut(e.target.value)}
          className="flex-1 min-w-0 bg-transparent text-sm text-gray-700 focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 border border-gray-100">
        <Users className="w-4 h-4 text-blue-500 shrink-0" />
        <button onClick={() => setTravelers(Math.max(1, travelers - 1))} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-blue-600 font-bold">−</button>
        <span className="text-sm font-medium text-gray-700 min-w-[1.5rem] text-center">{travelers}</span>
        <button onClick={() => setTravelers(Math.min(20, travelers + 1))} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-blue-600 font-bold">+</button>
      </div>

      <button
        onClick={handleSearch}
        className="bg-gradient-to-r from-blue-600 to-blue-600 text-white px-7 py-2.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-200 transition-all text-sm"
      >
        Search
      </button>
    </div>
  );
}
