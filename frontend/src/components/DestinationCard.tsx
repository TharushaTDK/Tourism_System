import Link from 'next/link';
import { MapPin, Star, Clock } from 'lucide-react';
import { Destination } from '@/types';

const CATEGORY_LABELS: Record<string, string> = {
  cultural: '🏛️ Cultural',
  beach: '🏖️ Beach',
  wildlife: '🦁 Wildlife',
  hill_country: '🏔️ Hill Country',
  adventure: '🧗 Adventure',
};

interface Props {
  destination: Destination;
}

export default function DestinationCard({ destination }: Props) {
  const imageUrl = destination.image_urls?.[0];

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 group">
      <div className="relative h-48 bg-gradient-to-br from-blue-400 to-blue-600 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={destination.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="w-16 h-16 text-white opacity-40" />
          </div>
        )}
        <span className="absolute top-3 right-3 bg-white/90 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full">
          {CATEGORY_LABELS[destination.category] ?? destination.category}
        </span>
        {destination.is_featured && (
          <span className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
            ⭐ Featured
          </span>
        )}
      </div>

      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-800 mb-1 truncate">{destination.name}</h3>

        <div className="flex items-center gap-1 text-gray-500 text-sm mb-2">
          <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
          <span className="truncate">{destination.province}, {destination.country}</span>
        </div>

        <p className="text-gray-600 text-sm line-clamp-2 mb-4">
          {destination.short_description || destination.description}
        </p>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-sm font-semibold text-gray-700">
              {Number(destination.rating).toFixed(1)}
            </span>
            <span className="text-xs text-gray-400">({destination.review_count})</span>
          </div>

          {destination.best_time_to_visit && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              {destination.best_time_to_visit}
            </div>
          )}
        </div>

        <Link
          href={`/destinations/${destination.id}`}
          className="block w-full text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
        >
          Explore →
        </Link>
      </div>
    </div>
  );
}
