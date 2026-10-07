'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

/** Replaces the hand-rolled RN screen headers (back arrow + title + action). */
export default function PageHeader({
  title, subtitle, action, back = false, backHref,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  back?: boolean;
  backHref?: string;
}) {
  const router = useRouter();

  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {back && (
          <button
            onClick={() => (backHref ? router.push(backHref) : router.back())}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-ink transition hover:bg-canvas"
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-subtle">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </header>
  );
}
