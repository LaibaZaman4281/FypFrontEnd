'use client';

import { FileText, ShieldAlert } from 'lucide-react';
import { getReviewReasonDetails } from '@/lib/utils/reviewEndReason';

/**
 * Port of `assets/components/helpers/ReviewEndReason.js`.
 *
 * Contract-ending reasons are kept visually separate from the reviewer's own
 * remarks — the backend sends them as `endReasonType`/`endReason` on every
 * review projection, derived from the matching Termination or Resignation row.
 */
export default function ReviewEndReason({
  endType = '',
  reason = '',
  className = '',
}: {
  endType?: string | null;
  reason?: string | null;
  className?: string;
}) {
  const { label, text, isTermination } = getReviewReasonDetails(endType, reason);
  const Icon = isTermination ? ShieldAlert : FileText;

  return (
    <div
      className={`mt-2 rounded-xl border border-line bg-canvas px-3 py-2.5 ${className}`}
      aria-label={`${label}: ${text}`}
    >
      <p className="flex items-center gap-1.5 text-xs font-bold text-ink">
        <Icon size={13} className={isTermination ? 'text-danger' : 'text-subtle'} />
        {label}
      </p>
      <p className="mt-1 text-[13px] leading-relaxed text-subtle">{text}</p>
    </div>
  );
}
