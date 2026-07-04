import Link from 'next/link';
import { MapPin, Clock, Users, DollarSign } from 'lucide-react';
import { Activity } from '@/types';
import StarRating from './StarRating';

interface Props { activity: Activity; }

const DIFFICULTY_COLORS = {
  easy: 'bg-green-100 text-green-700',
  moderate: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
};

const CATEGORY_COLORS: Record<string, string> = {
  safari: 'bg-amber-100 text-amber-700',
  train: 'bg-blue-100 text-blue-700',
  hiking: 'bg-lime-100 text-lime-700',
  adventure: 'bg-orange-100 text-orange-700',
  cultural: 'bg-purple-100 text-purple-700',
  wellness: 'bg-teal-100 text-teal-700',
};

export default function ActivityCard({ activity }: Props) {
  const image = activity.image_urls?.[0];
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden group border border-gray-100">
      <div className="relative h-44 bg-gradient-to-br from-blue-400 to-blue-600 overflow-hidden">
        {image ? (
          <img src={image} alt={activity.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            {activity.category === 'safari' ? '🦒' : activity.category === 'train' ? '🚂' : activity.category === 'hiking' ? '🥾' : '🎯'}
          </div>
        )}
        <span className={`absolute top-3 left-3 text-xs font-semibold px-2 py-1 rounded-full capitalize ${CATEGORY_COLORS[activity.category] ?? 'bg-white/90 text-gray-700'}`}>
          {activity.category}
        </span>
        <span className={`absolute top-3 right-3 text-xs font-semibold px-2 py-1 rounded-full capitalize ${DIFFICULTY_COLORS[activity.difficulty]}`}>
          {activity.difficulty}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-800 mb-1.5 line-clamp-1">{activity.name}</h3>
        <div className="flex items-center gap-1 text-gray-500 text-xs mb-2">
          <MapPin className="w-3.5 h-3.5 text-blue-500" /> {activity.location}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          {activity.duration_hours && (
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {activity.duration_hours}h</span>
          )}
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Up to {activity.max_group}</span>
        </div>
        <div className="flex items-center justify-between mb-3">
          <StarRating rating={activity.rating} size="sm" showCount count={activity.review_count} />
          <div className="flex items-center gap-0.5 text-blue-600 font-semibold text-sm">
            <DollarSign className="w-3.5 h-3.5" />{Number(activity.price_per_person).toFixed(0)}
            <span className="text-xs text-gray-400 font-normal">/person</span>
          </div>
        </div>
        <Link href={`/activities/${activity.id}`} className="block text-center bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          Book Now
        </Link>
      </div>
    </div>
  );
}
