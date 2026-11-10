'use client';

import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';
import { RatingStars } from '@/components/ui/Rating';
import CriteriaBreakdown, { type CriteriaItem } from '@/components/features/reviews/CriteriaBreakdown';
import ReviewEndReason from '@/components/features/reviews/ReviewEndReason';
import { cn } from '@/lib/utils/cn';

/**
 * Port of `assets/components/helpers/ReviewCard.js`.
 *
 * The mobile card and both web review screens rendered the same seven pieces —
 * reviewer, ending badge, overall stars, the *contract-ending reason*, remarks,
 * worked period and the collapsible criteria breakdown. The reason block was the
 * one piece missing from the web, so the two screens now share this component
 * instead of each re-inlining the other six.
 *
 * `endType` drives only the coloured Terminated/Resigned chip (anything else —
 * Completed, Hired, blank — shows no chip, exactly as in RN). `endReasonType`
 * falls back to `endType` for the reason block, which also understands the
 * pending-resignation variant.
 */
export interface ReviewCardProps {
  name?: string;
  image?: string | null;
  /** When set, the reviewer name becomes a link (client profile / worker detail). */
  nameHref?: string;
  rating?: number;
  date?: string;
  workedPeriod?: string;
  endType?: string | null;
  endReasonType?: string | null;
  endReason?: string | null;
  text?: string;
  criteria?: CriteriaItem[];
}

const END_BADGE: Record<string, { label: string; className: string }> = {
  terminated: { label: 'Terminated', className: 'bg-rose-100 text-rose-700' },
  resigned: { label: 'Resigned', className: 'bg-violet-100 text-violet-700' },
};

function resolveEndBadge(endType?: string | null) {
  return END_BADGE[String(endType ?? '').toLowerCase()] ?? null;
}

export default function ReviewCard({
  name = 'Anonymous',
  image = '',
  nameHref,
  rating = 0,
  date = '',
  workedPeriod = '',
  endType = '',
  endReasonType = '',
  endReason = '',
  text = '',
  criteria = [],
}: ReviewCardProps) {
  const badge = resolveEndBadge(endType);

  const nameEl = nameHref ? (
    <Link href={nameHref} className="truncate text-sm font-bold text-brand hover:underline">
      {name}
    </Link>
  ) : (
    <p className="truncate text-sm font-bold text-ink">{name}</p>
  );

  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="flex items-center gap-3">
        <Avatar src={image || undefined} name={name} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {nameEl}
            {badge && (
              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', badge.className)}>
                {badge.label}
              </span>
            )}
          </div>
          {date && <p className="mt-0.5 text-[11px] text-subtle">{date}</p>}
        </div>
      </div>

      {workedPeriod && (
        <p className="mt-3 inline-block rounded-lg border border-line bg-canvas px-2 py-1 text-[11px] text-subtle">
          {workedPeriod}
        </p>
      )}

      <div className="mt-2 flex items-center gap-1.5">
        <RatingStars value={rating} />
        <span className="text-[13px] font-bold text-ink">{rating}</span>
      </div>

      <ReviewEndReason endType={endReasonType || endType} reason={endReason} />

      {text && <p className="mt-2 text-[13px] leading-relaxed text-subtle">{text}</p>}

      <CriteriaBreakdown criteria={criteria} />
    </div>
  );
}
