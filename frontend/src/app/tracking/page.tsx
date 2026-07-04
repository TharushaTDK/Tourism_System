'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { MapPin, Navigation, Phone, Clock, Car } from 'lucide-react';
import { TripLocation, DriverTrip } from '@/types';
import { io, Socket } from 'socket.io-client';
import api from '@/lib/api';

export default function TrackingPage() {
  const { isAuthenticated, user, hasHydrated } = useAuthStore();
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  const [currentLocation, setCurrentLocation] = useState<TripLocation | null>(null);
  const [trip, setTrip] = useState<DriverTrip | null>(null);
  const [progress, setProgress] = useState(35);
  const [eta, setEta] = useState('45 min');
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) { router.push('/login'); return; }

    api.get('/trips/active').then(({ data }) => {
      if (data.data) setTrip(data.data);
    }).catch(() => {});

    const socket: Socket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000', {
      auth: { token: localStorage.getItem('token') },
    });

    socketRef.current = socket;
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    if (trip) {
      socket.emit('join_trip', trip.id);
      socket.on('location_update', (data: TripLocation) => {
        setCurrentLocation(data);
        setProgress(p => Math.min(95, p + 1));
      });
    }

    return () => { socket.disconnect(); };
  }, [hasHydrated, isAuthenticated, router, trip]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Navigation className="w-6 h-6 text-blue-600" /> Live Trip Tracking
        </h1>
        <div className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full ${connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          {connected ? 'Live' : 'Connecting...'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Placeholder */}
        <div className="lg:col-span-2">
          <div className="bg-gray-100 rounded-2xl h-80 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, #059669 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            <MapPin className="w-16 h-16 text-blue-400 mb-3" />
            <p className="text-gray-600 font-semibold">Interactive Map</p>
            <p className="text-gray-400 text-sm mt-1">Real-time GPS tracking active</p>
            {currentLocation && (
              <p className="text-xs text-blue-600 mt-2 font-mono">
                📍 {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </p>
            )}
          </div>

          {/* Progress */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Trip Progress</span>
              <span className="text-sm font-bold text-blue-600">{progress}%</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-blue-500 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>{trip?.origin || 'Colombo Airport'}</span>
              <span>{trip?.destination || 'Destination'}</span>
            </div>
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-4">
          {/* ETA */}
          <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
            <div className="flex items-center gap-2 text-blue-700 mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-semibold">Estimated Arrival</span>
            </div>
            <p className="text-3xl font-extrabold text-blue-700">{eta}</p>
            <p className="text-xs text-blue-500 mt-1">Based on current traffic</p>
          </div>

          {/* Driver */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Car className="w-4 h-4 text-blue-500" /> Your Driver</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                {trip?.driver ? trip.driver.name.slice(0, 2).toUpperCase() : 'DR'}
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{trip?.driver?.name || 'Driver Name'}</p>
                <p className="text-xs text-gray-400">{trip?.vehicle?.make} {trip?.vehicle?.model} · {trip?.vehicle?.plate_number || 'ABC-1234'}</p>
              </div>
            </div>
            <a href={`tel:${trip?.driver?.phone || '+94771234567'}`}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              <Phone className="w-4 h-4" /> Call Driver
            </a>
          </div>

          {/* Next Destination */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-500" /> Next Stop</h3>
            <p className="text-gray-700 font-medium">{trip?.destination || 'Sigiriya Rock Fortress'}</p>
            <p className="text-xs text-gray-400 mt-1">Arriving in approximately {eta}</p>
          </div>

          {!trip && (
            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100 text-center">
              <p className="text-yellow-700 text-sm font-medium">No active trip found.</p>
              <p className="text-yellow-600 text-xs mt-1">Book transport to start tracking.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
