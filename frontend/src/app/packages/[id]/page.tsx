'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { TourPackage } from '@/types';
import { Calendar, Users, DollarSign, Check, X } from 'lucide-react';
import StarRating from '@/components/StarRating';
import PackageCard from '@/components/PackageCard';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/lib/utils';

export default function PackageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuthStore();
  const [booking, setBooking] = useState({ check_in: '', guests: 2 });
  const [bookingLoading, setBookingLoading] = useState(false);

  const { data: pkg, isLoading } = useQuery({
    queryKey: ['package', id],
    queryFn: async () => {
      const { data } = await api.get<{ data: TourPackage }>(`/packages/${id}`);
      return data.data;
    },
  });

  const { data: similar } = useQuery({
    queryKey: ['similar-packages', pkg?.category],
    queryFn: async () => {
      const { data } = await api.get<{ data: { items: TourPackage[] } }>(`/packages?category=${pkg?.category}&limit=4`);
      return (data.data?.items || []).filter((p: TourPackage) => p.id !== Number(id)).slice(0, 3);
    },
    enabled: !!pkg,
  });

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Please login to book'); return; }
    setBookingLoading(true);
    try {
      await api.post('/bookings', { booking_type: 'package', reference_id: Number(id), check_in: booking.check_in, guests: booking.guests });
      toast.success('Package booked! Check your dashboard.');
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  if (isLoading) return <div className="max-w-5xl mx-auto px-4 py-10"><div className="h-96 bg-gray-200 rounded-xl animate-pulse" /></div>;
  if (!pkg) return <div className="text-center py-20 text-gray-500">Package not found.</div>;

  const totalCost = pkg.price_per_person * booking.guests;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="h-72 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 mb-6">
            {pkg.image_urls?.[0] && <img src={pkg.image_urls[0]} alt={pkg.name} className="w-full h-full object-cover" />}
          </div>
          <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full capitalize">{pkg.category}</span>
          <h1 className="text-3xl font-bold text-gray-800 mt-3 mb-2">{pkg.name}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
            <span className="flex items-center gap-1"><Calendar className="w-4 h-4 text-blue-500" /> {pkg.duration_days} days</span>
            <span className="flex items-center gap-1"><Users className="w-4 h-4 text-blue-500" /> Max {pkg.max_group}</span>
            <StarRating rating={pkg.rating} size="sm" showCount count={pkg.review_count} />
          </div>
          <p className="text-gray-700 leading-relaxed mb-8">{pkg.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-green-50 rounded-xl p-5">
              <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2"><Check className="w-4 h-4" /> Inclusions</h3>
              <ul className="space-y-2">
                {pkg.inclusions?.map((inc, i) => <li key={i} className="flex items-start gap-2 text-sm text-green-700"><Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />{inc}</li>)}
              </ul>
            </div>
            <div className="bg-red-50 rounded-xl p-5">
              <h3 className="font-bold text-red-800 mb-3 flex items-center gap-2"><X className="w-4 h-4" /> Exclusions</h3>
              <ul className="space-y-2">
                {pkg.exclusions?.map((exc, i) => <li key={i} className="flex items-start gap-2 text-sm text-red-700"><X className="w-3.5 h-3.5 mt-0.5 shrink-0" />{exc}</li>)}
              </ul>
            </div>
          </div>

          {similar && similar.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-800 mb-4">Similar Packages</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {similar.map((p) => <PackageCard key={p.id} pkg={p} />)}
              </div>
            </div>
          )}
        </div>

        {/* Booking Sidebar */}
        <div>
          <div className="bg-white rounded-2xl shadow-md p-6 sticky top-20 border border-gray-100">
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-extrabold text-blue-600">${Number(pkg.price_per_person).toFixed(0)}</span>
              <span className="text-gray-400 text-sm">/person</span>
            </div>
            <p className="text-xs text-gray-400 mb-5">{pkg.duration_days} days tour</p>
            <form onSubmit={handleBook} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Start Date</label>
                <input type="date" required value={booking.check_in} min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setBooking({ ...booking, check_in: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Travelers</label>
                <input type="number" min={1} max={pkg.max_group} value={booking.guests}
                  onChange={(e) => setBooking({ ...booking, guests: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <div className="flex justify-between text-gray-600 mb-2">${Number(pkg.price_per_person).toFixed(0)} × {booking.guests} people<span>{formatCurrency(totalCost)}</span></div>
                <div className="flex justify-between font-bold text-gray-800 border-t border-gray-200 pt-2">Total<span className="text-blue-600">{formatCurrency(totalCost)}</span></div>
              </div>
              <button type="submit" disabled={bookingLoading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
                {bookingLoading ? 'Booking...' : 'Book Package'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
