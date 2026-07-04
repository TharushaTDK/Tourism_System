'use client';

import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  count?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export default function StarRating({ rating, size = 'md', showCount, count, interactive, onChange }: StarRatingProps) {
  const sz = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-6 h-6' : 'w-4.5 h-4.5';

  const handleClick = (i: number) => {
    if (interactive && onChange) onChange(i);
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = i <= Math.floor(rating);
          const half = !filled && i - 0.5 <= rating;
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleClick(i)}
              disabled={!interactive}
              className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform disabled:cursor-default`}
            >
              <Star
                className={`${sz} ${filled || half ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
              />
            </button>
          );
        })}
      </div>
      {showCount && count !== undefined && (
        <span className="text-xs text-gray-500 ml-0.5">({count})</span>
      )}
      {!showCount && (
        <span className={`font-semibold text-gray-700 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          {Number(rating).toFixed(1)}
        </span>
      )}
    </div>
  );
}
