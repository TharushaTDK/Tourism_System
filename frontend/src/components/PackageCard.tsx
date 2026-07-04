import Link from 'next/link';
import { Calendar, Users, Check, DollarSign } from 'lucide-react';
import { TourPackage } from '@/types';
import StarRating from './StarRating';

interface Props { pkg: TourPackage; }

const CATEGORY_COLORS: Record<string, string> = {
  budget: 'bg-green-100 text-green-700',
  family: 'bg-blue-100 text-blue-700',
  honeymoon: 'bg-pink-100 text-pink-700',
  adventure: 'bg-orange-100 text-orange-700',
  luxury: 'bg-yellow-100 text-yellow-700',
  wildlife: 'bg-amber-100 text-amber-700',
};

export default function PackageCard({ pkg }: Props) {
  const image = pkg.image_urls?.[0];
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-100">
      <div className="relative h-44 bg-gradient-to-br from-blue-400 to-blue-600 overflow-hidden group">
        {image ? (
          <img src={image} alt={pkg.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🌴</div>
        )}
        <span className={`absolute top-3 left-3 text-xs font-semibold px-2 py-1 rounded-full capitalize ${CATEGORY_COLORS[pkg.category] ?? 'bg-white/90 text-gray-700'}`}>
          {pkg.category}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-800 mb-2 line-clamp-1">{pkg.name}</h3>
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-blue-500" /> {pkg.duration_days} days</span>
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-blue-500" /> Max {pkg.max_group}</span>
        </div>
        {pkg.inclusions?.slice(0, 3).map((inc, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600 mb-1">
            <Check className="w-3.5 h-3.5 text-blue-500 shrink-0" /> {inc}
          </div>
        ))}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <StarRating rating={pkg.rating} size="sm" showCount count={pkg.review_count} />
          <div className="flex items-center gap-0.5 text-blue-600 font-bold">
            <DollarSign className="w-4 h-4" />{Number(pkg.price_per_person).toFixed(0)}
            <span className="text-xs text-gray-400 font-normal">/person</span>
          </div>
        </div>
        <Link href={`/packages/${pkg.id}`} className="mt-3 block text-center border-2 border-blue-600 text-blue-600 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 hover:text-white transition-colors">
          View Package
        </Link>
      </div>
    </div>
  );
}
