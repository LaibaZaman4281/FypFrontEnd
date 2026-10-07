'use client';

import { cn } from '@/lib/utils/cn';

/** Horizontal pill tabs - replaces the RN category tab rows. */
export default function Tabs({
  items, value, onChange, className,
}: {
  items: { label: string; value: string; count?: number }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex gap-2 overflow-x-auto pb-1', className)}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            onClick={() => onChange(item.value)}
            className={cn(
              'shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition',
              active ? 'bg-brand text-white shadow-sm' : 'bg-white text-subtle ring-1 ring-line hover:bg-canvas',
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span className={cn('ml-1.5 rounded-full px-1.5 py-0.5 text-[11px]', active ? 'bg-white/20' : 'bg-canvas')}>
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
