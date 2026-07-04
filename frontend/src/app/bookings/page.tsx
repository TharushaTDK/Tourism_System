'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Booking } from '@/types';
import { Calendar, MapPin, Users, DollarSign } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
};

export default function BookingsPage() {
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) router.push('/login');
  }, [hasHydrated, isAuthenticated, router]);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Booking[] }>('/bookings/my');
      return data.data;
    },
    enabled: isAuthenticated,
  });

  if (isLoading) return <div className="max-w-4xl mx-auto px-4 py-10"><div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />)}</div></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">My Bookings</h1>
      <p className="text-gray-500 mb-8">Track all your travel reservations</p>

      {!bookings?.length ? (
        <div className="text-center py-20 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No bookings yet. Start planning your trip!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-32 h-24 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg overflow-hidden flex-shrink-0">
                {b.image_url && <img src={b.image_url} alt={b.destination_name} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-gray-800 text-lg">{b.destination_name}</h3>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${STATUS_COLORS[b.status]}`}>
                    {b.status}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                  <MapPin className="w-4 h-4" /> {b.location}
                </div>
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                  <div className="flex items-center gap-1"><Calendar className="w-4 h-4 text-blue-500" />{b.check_in} → {b.check_out}</div>
                  <div className="flex items-center gap-1"><Users className="w-4 h-4 text-blue-500" />{b.guests} guests</div>
                  <div className="flex items-center gap-1"><DollarSign className="w-4 h-4 text-blue-500" />${Number(b.total_price).toFixed(2)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
