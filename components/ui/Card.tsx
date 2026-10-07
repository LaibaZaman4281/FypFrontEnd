import { cn } from '@/lib/utils/cn';
import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  as?: 'div' | 'article' | 'section';
  padded?: boolean;
  hoverable?: boolean;
}

export default function Card({
  as: Tag = 'div', padded = true, hoverable = false, className, children, ...rest
}: CardProps) {
  return (
    <Tag
      {...rest}
      className={cn(
        'rounded-2xl border border-line bg-white shadow-card',
        padded && 'p-5',
        hoverable && 'transition hover:-translate-y-0.5 hover:shadow-pop',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-base font-bold text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-subtle">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
