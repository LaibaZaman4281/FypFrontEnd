'use client';

import Link from 'next/link';
import { BadgeCheck, ChevronRight, GraduationCap, MapPin, Star } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { cn } from '@/lib/utils/cn';
import type { WorkerCard } from '@/types';

/**
 * Port of the `renderWorkerCard` row in
 * `assets/components/Client/FindServiceScreen.js`, laid out as a grid tile.
 *
 * Content parity with the RN card: rating, name, salary, gender, primary role,
 * city (last comma-separated part of the address), the available / not-available
 * pill, and the two verification chips the backend actually projects on
 * `GetWorkersForClient`:
 *
 *     isPoliceVerified   -> "Police Verified"  (non-revoked, in-date certificate)
 *     isCompanyCertified -> "Certified"        (company cert OR course certificate)
 *
 * The earlier web port showed "FIR Record" / "Warned" chips instead; those read
 * `isBlocked` / `isFlagged`, which this endpoint never returns.
 *
 * Layout: every tile is the same shape and the CTA is pinned to the bottom, so a
 * grid row stays aligned when one worker has more skills than another. Blank and
 * "-" categories are dropped — the API emits them for workers whose extra
 * category rows are empty, and they rendered as an empty pill with a stray dash.
 */

const IGNORED_CATEGORY = new Set(['', '-', '—', 'n/a', 'null', 'undefined']);

function cleanCategory(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return IGNORED_CATEGORY.has(trimmed.toLowerCase()) ? null : trimmed;
}

export default function WorkerResultCard({ worker }: { worker: WorkerCard }) {
  const extractCity = (address?: string) => {
    if (!address || address === 'N/A') return 'N/A';
    const parts = address.split(',');
    return parts.length > 1 ? parts[parts.length - 1].trim() : address.trim();
  };

  const allCategories = (worker.categories || []).map(cleanCategory).filter(Boolean) as string[];
  const city = extractCity(worker.city);
  const rating = worker.rating || '0.0';

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-line bg-white p-4 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-pop">
      {/* ---------- header ---------- */}
      <div className="flex items-start gap-3">
        <Avatar
          src={worker.picture}
          name={worker.name}
          size="md"
          className="shrink-0 rounded-xl"
          ring={false}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-[15px] font-extrabold leading-tight text-ink" title={worker.name}>
              {worker.name || 'Worker'}
            </h3>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ink px-1.5 py-0.5 text-[11px] font-bold text-white">
              <Star size={10} className="fill-amber-400 text-amber-400" />
              {rating}
            </span>
          </div>

          <p className="mt-1 text-sm font-bold text-brand">{worker.salary || 'N/A'}</p>

          <p className="mt-0.5 truncate text-xs font-semibold text-subtle" title={worker.role}>
            {worker.role}
            {worker.gender ? <span className="text-muted"> · {worker.gender}</span> : null}
          </p>

          <p className="mt-1 flex items-center gap-1 text-xs text-subtle" title={worker.city}>
            <MapPin size={12} className="shrink-0" />
            <span className="truncate">{city}</span>
          </p>
        </div>
      </div>

      {/* ---------- status + verification ---------- */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[11px] font-bold',
            worker.availableStatus ? 'bg-brand-light text-brand' : 'bg-rose-50 text-danger',
          )}
        >
          {worker.availableStatus ? 'Available' : 'Not Available'}
        </span>

        {worker.isPoliceVerified ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
            <BadgeCheck size={11} /> Police Verified
          </span>
        ) : null}

        {worker.isCompanyCertified ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-900">
            <GraduationCap size={11} /> Certified
          </span>
        ) : null}
      </div>

      {/* ---------- skills ---------- */}
      {allCategories.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {allCategories.slice(0, 4).map((cat, index) => (
            <span
              key={`${cat}-${index}`}
              className="rounded-md bg-canvas px-2 py-0.5 text-[11px] font-semibold text-subtle"
            >
              {cat}
            </span>
          ))}
          {allCategories.length > 4 && (
            <span className="rounded-md bg-canvas px-2 py-0.5 text-[11px] font-semibold text-muted">
              +{allCategories.length - 4}
            </span>
          )}
        </div>
      )}

      {/* ---------- CTA, pinned to the bottom of every tile ---------- */}
      <div className="mt-auto pt-4">
        <Link
          href={`/client/workers/${worker.id}`}
          className="flex h-10 items-center justify-center gap-1 whitespace-nowrap rounded-xl bg-brand px-3 text-[13px] font-bold text-white transition hover:bg-brand-dark"
        >
          View Profile &amp; Interview
          <ChevronRight size={15} className="shrink-0" />
        </Link>
      </div>
    </article>
  );
}
