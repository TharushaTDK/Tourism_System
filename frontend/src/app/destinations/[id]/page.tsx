'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import PlanTripLink from '@/components/PlanTripLink';
import { Destination, Review } from '@/types';
import { MapPin, Star, Clock, DollarSign, Info, Calendar, Sparkles } from 'lucide-react';

export default function DestinationDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: destination, isLoading } = useQuery({
    queryKey: ['destination', id],
    queryFn: async () => {
      const { data } = await api.get<{ data: Destination }>(`/destinations/${id}`);
      return data.data;
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', 'destination', id],
    queryFn: async () => {
      const { data } = await api.get<{ data: Review[] }>(`/reviews/destination/${id}`);
      return (data.data ?? []) as Review[];
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-4">
        <div className="h-72 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }
  if (!destination) return <div className="text-center py-20 text-gray-500">Destination not found.</div>;

  const mainImage = destination.image_urls?.[0];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Image Gallery */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-2xl overflow-hidden h-56 sm:h-72 mb-8">
        <div className="sm:col-span-2 bg-gradient-to-br from-blue-400 to-blue-600 relative">
          {mainImage && <img src={mainImage} alt={destination.name} className="w-full h-full object-cover" />}
        </div>
        <div className="hidden sm:grid grid-rows-2 gap-2">
          {[1, 2].map((i) => (
            <div key={i} className="bg-gradient-to-br from-blue-300 to-blue-500 relative overflow-hidden">
              {destination.image_urls?.[i] && (
                <img src={destination.image_urls[i]} alt={`${destination.name} ${i}`} className="w-full h-full object-cover" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded-full capitalize mb-2 inline-block">
                {destination.category.replace('_', ' ')}
              </span>
              <h1 className="text-3xl font-bold text-gray-800">{destination.name}</h1>
              <div className="flex items-center gap-1 text-gray-500 mt-1">
                <MapPin className="w-4 h-4 text-blue-500" />
                {destination.province}, {destination.country}
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-100 px-4 py-2 rounded-xl">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <span className="text-xl font-bold text-gray-800">{Number(destination.rating).toFixed(1)}</span>
              <span className="text-xs text-gray-400">({destination.review_count} reviews)</span>
            </div>
          </div>

          <p className="text-gray-600 leading-relaxed mb-6">{destination.description}</p>

          {/* Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {destination.best_time_to_visit && (
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <Calendar className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Best Time</p>
                <p className="text-sm font-semibold text-gray-700">{destination.best_time_to_visit}</p>
              </div>
            )}
            {destination.entry_fee !== undefined && (
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <DollarSign className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Entry Fee</p>
                <p className="text-sm font-semibold text-gray-700">
                  {Number(destination.entry_fee) === 0 ? 'Free' : `$${Number(destination.entry_fee).toFixed(0)}`}
                </p>
              </div>
            )}
            {destination.opening_hours && (
              <div className="bg-purple-50 rounded-xl p-4 text-center">
                <Clock className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Opening Hours</p>
                <p className="text-sm font-semibold text-gray-700">{destination.opening_hours}</p>
              </div>
            )}
            <div className="bg-orange-50 rounded-xl p-4 text-center">
              <Info className="w-5 h-5 text-orange-500 mx-auto mb-1" />
              <p className="text-xs text-gray-500">Province</p>
              <p className="text-sm font-semibold text-gray-700">{destination.province}</p>
            </div>
          </div>

          {/* Reviews */}
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Visitor Reviews <span className="text-gray-400 text-base font-normal">({reviews?.length ?? 0})</span>
          </h2>
          <div className="space-y-4">
            {reviews?.map((r) => (
              <div key={r.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-700 text-sm">{(r as Review & { user_name?: string }).user_name ?? 'Traveler'}</span>
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} />
                    ))}
                  </div>
                </div>
                {r.title && <p className="text-sm font-medium text-gray-800 mb-1">{r.title}</p>}
                <p className="text-gray-600 text-sm">{r.comment}</p>
              </div>
            ))}
            {!reviews?.length && (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <Star className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No reviews yet. Be the first!</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Plan Trip */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-600 rounded-xl p-5 text-white">
            <Sparkles className="w-6 h-6 text-blue-200 mb-2" />
            <h3 className="font-bold text-lg mb-1">Plan Your Visit</h3>
            <p className="text-blue-100 text-sm mb-4">Create a personalized itinerary including {destination.name}.</p>
            <PlanTripLink className="block w-full text-center bg-white text-blue-700 font-semibold py-2.5 rounded-lg hover:bg-blue-50 transition-colors text-sm">
              Start Planner →
            </PlanTripLink>
          </div>

          {/* Quick Info */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-4">Quick Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Category</span>
                <span className="font-medium text-gray-700 capitalize">{destination.category.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Location</span>
                <span className="font-medium text-gray-700">{destination.province}</span>
              </div>
              {destination.entry_fee !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Entry Fee</span>
                  <span className="font-medium text-blue-600">
                    {Number(destination.entry_fee) === 0 ? 'Free Entry' : `$${Number(destination.entry_fee)}`}
                  </span>
                </div>
              )}
              {destination.opening_hours && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Hours</span>
                  <span className="font-medium text-gray-700">{destination.opening_hours}</span>
                </div>
              )}
            </div>
          </div>

          {/* Book Transport */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-3">Getting There</h3>
            <p className="text-gray-500 text-sm mb-4">Need a driver to {destination.name}? Book a private vehicle.</p>
            <Link href="/transport" className="block w-full text-center border border-blue-500 text-blue-600 font-semibold py-2.5 rounded-lg hover:bg-blue-50 transition-colors text-sm">
              Book Transport
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
