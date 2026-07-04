'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { DriverTrip } from '@/types';
import { Car, MapPin, Navigation, CheckCircle, DollarSign, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';
import StarRating from '@/components/StarRating';

export default function DriverDashboardPage() {
  const { isAuthenticated, user, hasHydrated } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) { router.push('/driver'); return; }
    if (user?.role !== 'driver') { router.push('/'); }
  }, [hasHydrated, isAuthenticated, user, router]);

  const { data: trips } = useQuery({
    queryKey: ['driver-trips'],
    queryFn: async () => { const { data } = await api.get('/trips/my'); return data.data as DriverTrip[]; },
    enabled: isAuthenticated && user?.role === 'driver',
  });

  const { data: stats } = useQuery({
    queryKey: ['driver-stats'],
    queryFn: async () => { const { data } = await api.get('/drivers/my/stats'); return data.data; },
    enabled: isAuthenticated,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.patch(`/trips/${id}/status`, { status }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['driver-trips'] }); toast.success('Trip status updated'); },
  });

  const todayTrips = trips?.filter(t => {
    const tripDate = new Date(t.pickup_date).toDateString();
    return tripDate === new Date().toDateString();
  }) || [];
  const completedTrips = trips?.filter(t => t.status === 'completed') || [];
  const totalEarnings = completedTrips.reduce((sum, t) => sum + (t.fare || 0), 0);

  if (!isAuthenticated || user?.role !== 'driver') return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Driver Dashboard</h1>
        <p className="text-gray-500">Welcome back, {user?.name?.split(' ')[0]}!</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Today's Trips", value: todayTrips.length, icon: Car, color: 'emerald' },
          { label: 'Total Earnings', value: formatCurrency(totalEarnings), icon: DollarSign, color: 'yellow' },
          { label: 'Rating', value: (stats?.rating || 4.8).toFixed(1) + '⭐', icon: Star, color: 'orange' },
          { label: 'Completed', value: completedTrips.length, icon: CheckCircle, color: 'blue' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className={`w-10 h-10 bg-${color}-100 rounded-xl flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 text-${color}-600`} />
            </div>
            <p className="text-xl font-bold text-gray-800">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-800 mb-5">Today&apos;s Schedule</h2>
          {!todayTrips.length ? (
            <div className="text-center py-8 text-gray-400">
              <Car className="w-10 h-10 mx-auto mb-2 text-gray-200" />
              <p className="text-sm">No trips scheduled for today.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todayTrips.map((trip) => (
                <div key={trip.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-500" /> {trip.origin}
                      </div>
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-800">
                        <Navigation className="w-3.5 h-3.5 text-blue-600" /> {trip.destination}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-800">{trip.pickup_time}</p>
                      {trip.fare && <p className="text-xs text-blue-600 font-medium">{formatCurrency(trip.fare)}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {trip.status === 'scheduled' && (
                      <button onClick={() => updateStatus.mutate({ id: trip.id, status: 'in_progress' })}
                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-xs font-medium hover:bg-blue-700">
                        Start Trip
                      </button>
                    )}
                    {trip.status === 'in_progress' && (
                      <>
                        <button onClick={() => updateStatus.mutate({ id: trip.id, status: 'completed' })}
                          className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-xs font-medium hover:bg-blue-700">
                          Complete Trip
                        </button>
                        <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer"
                          className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-xs font-medium text-center hover:bg-gray-200">
                          Navigate
                        </a>
                      </>
                    )}
                    {(trip.status === 'completed' || trip.status === 'cancelled') && (
                      <span className={`text-xs px-3 py-1.5 rounded-full capitalize ${trip.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{trip.status}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Earnings */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-800 mb-5">Recent Earnings</h2>
          <div className="space-y-3">
            {completedTrips.slice(0, 6).map((t) => (
              <div key={t.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="text-gray-800 font-medium">{t.origin} → {t.destination}</p>
                  <p className="text-gray-400 text-xs">{t.pickup_date}</p>
                </div>
                <p className="font-bold text-blue-600">{formatCurrency(t.fare || 0)}</p>
              </div>
            ))}
            {!completedTrips.length && <p className="text-gray-400 text-sm text-center py-8">No completed trips yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
