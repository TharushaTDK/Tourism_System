import Link from 'next/link';
import { MapPin, Star, DollarSign } from 'lucide-react';
import { Hotel } from '@/types';
import StarRating from './StarRating';

interface Props { hotel: Hotel; }

const CATEGORY_COLORS: Record<string, string> = {
  budget: 'bg-green-100 text-green-700',
  mid_range: 'bg-blue-100 text-blue-700',
  luxury: 'bg-yellow-100 text-yellow-800',
};

export default function HotelCard({ hotel }: Props) {
  const image = hotel.image_urls?.[0];
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-100">
      <div className="relative h-44 bg-gradient-to-br from-blue-400 to-blue-600 overflow-hidden group">
        {image ? (
          <img src={image} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🏨</div>
        )}
        <span className={`absolute top-3 left-3 text-xs font-semibold px-2 py-1 rounded-full capitalize ${CATEGORY_COLORS[hotel.category] ?? 'bg-white/90 text-gray-700'}`}>
          {hotel.category.replace('_', ' ')}
        </span>
        {hotel.star_rating && (
          <div className="absolute top-3 right-3 bg-black/60 text-yellow-400 px-2 py-0.5 rounded-full flex items-center gap-0.5 text-xs">
            {'★'.repeat(hotel.star_rating)}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-800 mb-1 line-clamp-1">{hotel.name}</h3>
        <div className="flex items-center gap-1 text-gray-500 text-xs mb-2">
          <MapPin className="w-3.5 h-3.5 text-blue-500" /> {hotel.address}
        </div>
        <div className="flex flex-wrap gap-1 mb-3">
          {hotel.amenities?.slice(0, 3).map((a, i) => (
            <span key={i} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{a}</span>
          ))}
        </div>
        <div className="flex items-center justify-between mb-3">
          <StarRating rating={hotel.rating} size="sm" showCount count={hotel.review_count} />
          <div className="flex items-center gap-0.5 text-blue-600 font-bold text-sm">
            <DollarSign className="w-3.5 h-3.5" />{Number(hotel.price_per_night).toFixed(0)}
            <span className="text-xs text-gray-400 font-normal">/night</span>
          </div>
        </div>
        <Link href={`/hotels/${hotel.id}`} className="block text-center bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          View Hotel
        </Link>
      </div>
    </div>
  );
}
