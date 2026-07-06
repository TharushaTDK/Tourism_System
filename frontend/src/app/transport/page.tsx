'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Driver } from '@/types';
import { MapPin, Calendar, Users, Star, Car, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import StarRating from '@/components/StarRating';

const VEHICLES = [
  { type: 'sedan', label: 'Sedan', emoji: '🚗', price: 40, capacity: 3, features: ['AC', 'Music System', 'GPS'] },
  { type: 'suv', label: 'SUV', emoji: '🚙', price: 60, capacity: 5, features: ['AC', 'Extra Luggage', 'GPS', '4WD'] },
  { type: 'van', label: 'Van', emoji: '🚐', price: 80, capacity: 12, features: ['AC', 'Large Luggage', 'GPS', 'Reclining Seats'] },
  { type: 'luxury', label: 'Luxury', emoji: '🚘', price: 120, capacity: 4, features: ['Premium AC', 'WiFi', 'Refreshments', 'Leather Seats'] },
];

export default function TransportPage() {
  const { isAuthenticated } = useAuthStore();
  const [form, setForm] = useState({ from: 'Bandaranaike International Airport', to: '', date: '', time: '09:00', travelers: 2 });
  const [selectedVehicle, setSelectedVehicle] = useState('sedan');
  const [bookingLoading, setBookingLoading] = useState(false);

  const { data: drivers } = useQuery({
    queryKey: ['drivers', selectedVehicle],
    queryFn: async () => {
      const { data } = await api.get<{ data: Driver[] }>(`/drivers?vehicle_type=${selectedVehicle}&available=true`);
      return data.data || [];
    },
  });

  const handleBook = async (driverId: number) => {
    if (!isAuthenticated) { toast.error('Please login to book transport'); return; }
    if (!form.to || !form.date) { toast.error('Please fill in destination and date'); return; }
    setBookingLoading(true);
    try {
      const vehicle = VEHICLES.find(v => v.type === selectedVehicle);
      await api.post('/trips', { driver_id: driverId, origin: form.from, destination: form.to, pickup_date: form.date, pickup_time: form.time, fare: vehicle?.price || 40 });
      toast.success('Transport booked! Driver will contact you soon.');
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  const selectedVehicleInfo = VEHICLES.find(v => v.type === selectedVehicle);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Transportation Services</h1>
      <p className="text-gray-500 mb-8">Airport pickups, intercity travel, and sightseeing tours</p>

      {/* Trip Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="font-bold text-gray-800 mb-5 flex items-center gap-2"><MapPin className="w-5 h-5 text-blue-600" /> Plan Your Transfer</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">From</label>
            <input value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">To (Destination)</label>
            <input placeholder="e.g., Kandy, Sigiriya, Colombo..." value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1"><Calendar className="w-4 h-4" /> Pickup Date</label>
            <input type="date" value={form.date} min={new Date().toISOString().split('T')[0]} onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Pickup Time</label>
              <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1"><Users className="w-4 h-4" /> Travelers</label>
              <input type="number" min={1} max={12} value={form.travelers} onChange={(e) => setForm({ ...form, travelers: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Selector */}
      <div className="mb-8">
        <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Car className="w-5 h-5 text-blue-600" /> Select Vehicle Type</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {VEHICLES.map((v) => (
            <button key={v.type} onClick={() => setSelectedVehicle(v.type)}
              className={`p-4 rounded-xl border-2 text-center transition-all ${selectedVehicle === v.type ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 bg-white'}`}>
              <div className="text-3xl mb-2">{v.emoji}</div>
              <div className="font-semibold text-gray-800 text-sm">{v.label}</div>
              <div className="text-blue-600 font-bold text-sm">${v.price}/day</div>
              <div className="text-xs text-gray-400 mt-1">Up to {v.capacity} people</div>
              <div className="mt-2 space-y-0.5">
                {v.features.slice(0, 2).map((f) => (
                  <div key={f} className="flex items-center gap-1 text-xs text-gray-500"><Check className="w-3 h-3 text-blue-500" />{f}</div>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Available Drivers */}
      <div>
        <h2 className="font-bold text-gray-800 mb-4">Available Drivers ({selectedVehicleInfo?.label})</h2>
        {!drivers || drivers.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
            <Car className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p>No drivers available for this vehicle type right now.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {drivers.map((driver) => (
              <div key={driver.id} className="bg-white rounded-xl border border-gray-100 p-5 flex flex-wrap sm:flex-nowrap items-center gap-5 hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-lg shrink-0">
                  {driver.profile_image ? (
                    <img src={driver.profile_image} alt={driver.name} className="w-14 h-14 rounded-full object-cover" />
                  ) : driver.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-800">{driver.name}</h3>
                    {driver.is_verified && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">✓ Verified</span>}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mb-1">
                    <StarRating rating={driver.rating} size="sm" />
                    {driver.completed_trips && <span>{driver.completed_trips} trips</span>}
                  </div>
                  {driver.languages && <p className="text-xs text-gray-400">Speaks: {driver.languages.join(', ')}</p>}
                  {driver.vehicle && (
                    <p className="text-xs text-gray-500 mt-1">{driver.vehicle.make} {driver.vehicle.model} · {driver.vehicle.ac ? '❄️ AC' : 'No AC'} · {driver.vehicle.capacity} seats</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-blue-600 text-lg">${selectedVehicleInfo?.price}<span className="text-xs text-gray-400 font-normal">/day</span></p>
                  <button onClick={() => handleBook(driver.id)} disabled={bookingLoading}
                    className="mt-2 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
                    Book
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
