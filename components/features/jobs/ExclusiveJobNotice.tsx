'use client';

import { Lock } from 'lucide-react';
import { EXCLUSIVE_COPY, isExclusiveFullTime, type ExclusiveAwareItem } from '@/lib/utils/exclusiveJob';

/**
 * The three renderings of "exclusive full-time" that the React Native app added
 * in commit `a70d626`, in one component:
 *
 *   request    -> a pending interview request that *would* become exclusive
 *   offer      -> a confirmed job offer; accepting activates the restriction
 *   commitment -> an active contract that is already exclusive
 *
 * Renders nothing at all unless the record is both flagged and full-time, which is
 * exactly how every backend projection narrows the flag.
 */
export default function ExclusiveJobNotice({
  item,
  variant = 'request',
  className = '',
}: {
  item: ExclusiveAwareItem | null | undefined;
  variant?: 'request' | 'offer' | 'commitment';
  className?: string;
}) {
  if (!isExclusiveFullTime(item)) return null;

  if (variant === 'commitment') {
    return (
      <p className={`inline-flex items-center gap-1 text-xs font-bold text-amber-800 ${className}`}>
        <Lock size={11} /> {EXCLUSIVE_COPY.commitmentLabel}
      </p>
    );
  }

  const isOffer = variant === 'offer';

  return (
    <div className={`mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 ${className}`}>
      <p className="flex items-center gap-1.5 text-[13px] font-extrabold text-amber-900">
        <Lock size={13} />
        {isOffer ? 'Exclusive full-time offer' : 'Exclusive full-time request'}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-amber-800">
        {isOffer ? EXCLUSIVE_COPY.offerNotice : EXCLUSIVE_COPY.requestNotice}
      </p>
    </div>
  );
}

