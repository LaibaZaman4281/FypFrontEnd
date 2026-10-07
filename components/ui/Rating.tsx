'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export function RatingStars({ value = 0, size = 14, className }: { value?: number | string; size?: number; className?: string }) {
  const score = Number(value) || 0;
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(score) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
        />
      ))}
    </span>
  );
}

/** Interactive picker used by review / termination / resignation forms. */
export function RatingInput({ value, onChange, size = 30 }: { value: number; onChange: (v: number) => void; size?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" onClick={() => onChange(i)} aria-label={`${i} star`} className="transition hover:scale-110">
          <Star size={size} className={i <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
        </button>
      ))}
    </div>
  );
}
