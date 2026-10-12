'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { RatingStars } from '@/components/ui/Rating';
import { cn } from '@/lib/utils/cn';

export interface CriteriaItem {
  name: string;
  score: number;
}

interface CriteriaBreakdownProps {
  criteria?: CriteriaItem[];
  accentClass?: string;
  defaultOpen?: boolean;
}

export default function CriteriaBreakdown({
  criteria = [],
  accentClass = 'text-brand',
  defaultOpen = false,
}: CriteriaBreakdownProps) {
  const [open, setOpen] = useState(defaultOpen);
  const list = Array.isArray(criteria) ? criteria : [];
  if (list.length === 0) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'mt-3 flex w-full items-center justify-between border-t border-slate-200 pt-3 text-xs font-bold',
          accentClass,
        )}
      >
        Criteria breakdown
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>

      {open && (
        <div className="mt-2">
          {list.map((criterion, index) => (
            <div
              key={`${criterion.name}-${index}`}
              className="flex items-center justify-between border-b border-slate-100 py-1.5 last:border-b-0"
            >
              <span className="mr-2 flex-1 text-xs text-slate-700">
                {criterion.name}
              </span>
              <span className="flex items-center gap-1.5">
                <RatingStars value={criterion.score} size={12} />
                <span className="text-xs font-bold text-ink">{criterion.score}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}