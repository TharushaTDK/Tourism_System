'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Activity, Review } from '@/types';
import { MapPin, Clock, Users, DollarSign, Calendar, Check } from 'lucide-react';
import StarRating from '@/components/StarRating';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { calculateNights, formatCurrency } from '@/lib/utils';

export default function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuthStore();
  const [selectedImage, setSelectedImage] = useState(0);
  const [booking, setBooking] = useState({ date: '', guests: 1 });
  const [bookingLoading, setBookingLoading] = useState(false);

  const { data: activity, isLoading } = useQuery({
    queryKey: ['activity', id],
    queryFn: async () => {
      const { data } = await api.get<{ data: Activity }>(`/activities/${id}`);
      return data.data;
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', 'activity', id],
    queryFn: async () => {
      const { data } = await api.get<{ data: Review[] }>(`/reviews/activity/${id}`);
      return data.data || [];
    },
  });

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Please login to book'); return; }
    setBookingLoading(true);
    try {
      await api.post('/bookings', { booking_type: 'activity', reference_id: Number(id), check_in: booking.date, guests: booking.guests });
      toast.success('Activity booked successfully!');
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  if (isLoading) return <div className="max-w-5xl mx-auto px-4 py-10"><div className="h-96 bg-gray-200 rounded-xl animate-pulse" /></div>;
  if (!activity) return <div className="text-center py-20 text-gray-500">Activity not found.</div>;

  const images = activity.image_urls || [];
  const totalCost = activity.price_per_person * booking.guests;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Image gallery */}
          <div className="mb-4 rounded-2xl overflow-hidden h-72 bg-gray-100">
            {images[selectedImage] ? (
              <img src={images[selectedImage]} alt={activity.name} className="w-full h-full object-cover" />
            ) : <div className="w-full h-full flex items-center justify-center text-6xl">🎯</div>}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 mb-6 flex-wrap">
              {images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImage(i)} className={`w-20 h-14 rounded-lg overflow-hidden border-2 shrink-0 ${i === selectedImage ? 'border-blue-500' : 'border-transparent'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div>
              <div className="flex gap-2 mb-2">
                <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full capitalize">{activity.category}</span>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${activity.difficulty === 'easy' ? 'bg-green-100 text-green-700' : activity.difficulty === 'hard' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{activity.difficulty}</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-800">{activity.name}</h1>
              <div className="flex items-center gap-1 text-gray-500 mt-1"><MapPin className="w-4 h-4 text-blue-500" /> {activity.location}</div>
            </div>
            <StarRating rating={activity.rating} size="md" showCount count={activity.review_count} />
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-5 pb-5 border-b border-gray-100">
            {activity.duration_hours && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-blue-500" /> {activity.duration_hours} hours</span>}
            <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-blue-500" /> {activity.min_group}–{activity.max_group} people</span>
          </div>

          <p className="text-gray-700 leading-relaxed mb-6">{activity.description}</p>

          <h3 className="font-bold text-gray-800 mb-3">What&apos;s Included</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-8">
            {['Professional guide', 'Safety equipment', 'Insurance coverage', 'Refreshments'].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-blue-500 shrink-0" /> {item}
              </div>
            ))}
          </div>

          <h3 className="font-bold text-gray-800 mb-4">Reviews ({reviews?.length || 0})</h3>
          <div className="space-y-3">
            {reviews?.map((r) => (
              <div key={r.id} className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-700 text-sm">{r.user_name}</span>
                  <StarRating rating={r.rating} size="sm" />
                </div>
                {r.comment && <p className="text-gray-600 text-sm">{r.comment}</p>}
              </div>
            ))}
            {!reviews?.length && <p className="text-gray-400 text-sm">No reviews yet.</p>}
          </div>
        </div>

        {/* Booking Sidebar */}
        <div>
          <div className="bg-white rounded-2xl shadow-md p-6 sticky top-20 border border-gray-100">
            <div className="flex items-baseline gap-1 mb-5">
              <span className="text-3xl font-extrabold text-blue-600">${Number(activity.price_per_person).toFixed(0)}</span>
              <span className="text-gray-400 text-sm">/person</span>
            </div>
            <form onSubmit={handleBook} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1"><Calendar className="w-4 h-4" /> Date</label>
                <input type="date" required value={booking.date} min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setBooking({ ...booking, date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1"><Users className="w-4 h-4" /> Guests</label>
                <input type="number" min={activity.min_group} max={activity.max_group} value={booking.guests}
                  onChange={(e) => setBooking({ ...booking, guests: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>${Number(activity.price_per_person).toFixed(0)} × {booking.guests} people</span>
                  <span>{formatCurrency(totalCost)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-800 text-base border-t border-gray-200 pt-2 mt-2">
                  <span>Total</span><span className="text-blue-600">{formatCurrency(totalCost)}</span>
                </div>
              </div>
              <button type="submit" disabled={bookingLoading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
                {bookingLoading ? 'Booking...' : 'Book Now'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
