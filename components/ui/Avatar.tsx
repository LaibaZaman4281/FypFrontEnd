'use client';

import { useState } from 'react';
import { resolveImage } from '@/lib/config';
import { initials } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

const SIZES = { xs: 'h-8 w-8 text-[11px]', sm: 'h-10 w-10 text-xs', md: 'h-14 w-14 text-sm', lg: 'h-20 w-20 text-lg', xl: 'h-28 w-28 text-2xl' };

/**
 * Replaces RN <Image source={{uri: `${SERVER_BASE}${picture}`}} /> with a plain
 * <img> that falls back to initials when the backend has no photo (the RN app
 * used a local default-user.png / a remote worker_default.jpg inconsistently).
 */
export default function Avatar({
  src, name, size = 'md', className, ring = true,
}: {
  src?: string | null;
  name?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
  ring?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const url = resolveImage(src);

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-light font-bold text-brand',
        ring && 'ring-2 ring-white',
        SIZES[size],
        className,
      )}
    >
      {url && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name || 'avatar'} className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        initials(name)
      )}
    </span>
  );
}
