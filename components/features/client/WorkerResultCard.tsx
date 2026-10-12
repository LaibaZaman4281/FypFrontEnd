// 'use client';

// import Link from 'next/link';
// import { AlertOctagon, AlertTriangle, ChevronRight, MapPin, Star } from 'lucide-react';
// import Avatar from '@/components/ui/Avatar';
// import { cn } from '@/lib/utils/cn';
// import type { WorkerCard } from '@/types';

// /** Same card content as the RN FlatList row, laid out for a responsive grid. */
// export default function WorkerResultCard({ worker }: { worker: WorkerCard }) {
//   const extractCity = (address?: string) => {
//     if (!address || address === 'N/A') return 'N/A';
//     const parts = address.split(',');
//     return parts.length > 1 ? parts[parts.length - 1].trim() : address.trim();
//   };

//   const secondaryCategories = worker.categories && worker.categories.length > 1 ? worker.categories.slice(1) : [];

//   return (
//     <article className="flex flex-col rounded-2xl border border-line bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-pop">
//       <div className="flex gap-4">
//         <div className="relative">
//           <Avatar src={worker.picture} name={worker.name} size="lg" className="rounded-2xl" ring={false} />
//           <span className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold text-white">
//             <Star size={10} className="fill-amber-400 text-amber-400" />
//             {worker.rating || '0.0'}
//           </span>
//         </div>

//         <div className="min-w-0 flex-1">
//           <div className="flex items-start justify-between gap-2">
//             <h3 className="truncate text-base font-bold text-ink">{worker.name}</h3>
//             <span className="shrink-0 text-sm font-bold text-brand">{worker.salary || 'N/A'}</span>
//           </div>
//           <p className="text-xs text-subtle">{worker.gender || 'N/A'}</p>
//           <p className="mt-0.5 text-sm font-semibold text-subtle">{worker.role}</p>

//           <p className="mt-1.5 flex items-center gap-1 text-xs text-subtle">
//             <MapPin size={13} />
//             <span className="truncate">{extractCity(worker.city)}</span>
//           </p>
//         </div>
//       </div>

//       <div className="mt-4 flex flex-wrap gap-1.5">
//         <span
//           className={cn(
//             'rounded-full px-2.5 py-1 text-[11px] font-bold',
//             worker.availableStatus ? 'bg-brand-light text-brand' : 'bg-rose-50 text-danger',
//           )}
//         >
//           {worker.availableStatus ? 'Available' : 'Not Available'}
//         </span>

//         {worker.isBlocked ? (
//           <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-900">
//             <AlertOctagon size={12} /> FIR Record
//           </span>
//         ) : worker.isFlagged ? (
//           <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-900">
//             <AlertTriangle size={12} /> Warned
//           </span>
//         ) : null}

//         {secondaryCategories.map((cat, index) => (
//           <span key={`${cat}-${index}`} className="rounded-full bg-canvas px-2.5 py-1 text-[11px] font-semibold text-subtle">
//             {cat}
//           </span>
//         ))}
//       </div>

//       <Link
//         href={`/client/workers/${worker.id}`}
//         className="mt-5 flex h-11 items-center justify-center gap-1 rounded-xl bg-brand text-sm font-bold text-white transition hover:bg-brand-dark"
//       >
//         View Profile &amp; Interview
//         <ChevronRight size={18} />
//       </Link>
//     </article>
//   );
// }
'use client';

import Link from 'next/link';
import { AlertOctagon, AlertTriangle, ChevronRight, MapPin, Star } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { cn } from '@/lib/utils/cn';
import type { WorkerCard } from '@/types';

/** Same card content as the RN FlatList row, laid out for a responsive grid. */
export default function WorkerResultCard({ worker }: { worker: WorkerCard }) {
  const extractCity = (address?: string) => {
    if (!address || address === 'N/A') return 'N/A';
    const parts = address.split(',');
    return parts.length > 1 ? parts[parts.length - 1].trim() : address.trim();
  };

  const secondaryCategories = worker.categories && worker.categories.length > 1 ? worker.categories.slice(1) : [];

  return (
    <article className="flex flex-col rounded-2xl border border-line bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-pop">
      <div className="flex gap-4">
        <div className="relative">
          <Avatar src={worker.picture} name={worker.name} size="lg" className="rounded-2xl" ring={false} />
          <span className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold text-white">
            <Star size={10} className="fill-amber-400 text-amber-400" />
            {worker.rating || '0.0'}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-base font-bold text-ink">{worker.name}</h3>
            <span className="shrink-0 text-sm font-bold text-brand">{worker.salary || 'N/A'}</span>
          </div>
          <p className="text-xs text-subtle">{worker.gender || 'N/A'}</p>
          <p className="mt-0.5 text-sm font-semibold text-subtle">{worker.role}</p>

          <p className="mt-1.5 flex items-center gap-1 text-xs text-subtle">
            <MapPin size={13} />
            <span className="truncate">{extractCity(worker.city)}</span>
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <span
          className={cn(
            'rounded-full px-2.5 py-1 text-[11px] font-bold',
            worker.availableStatus ? 'bg-brand-light text-brand' : 'bg-rose-50 text-danger',
          )}
        >
          {worker.availableStatus ? 'Available' : 'Not Available'}
        </span>

        {worker.isBlocked ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-900">
            <AlertOctagon size={12} /> FIR Record
          </span>
        ) : worker.isFlagged ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-900">
            <AlertTriangle size={12} /> Warned
          </span>
        ) : null}

        {secondaryCategories.map((cat, index) => (
          <span key={`${cat}-${index}`} className="rounded-full bg-canvas px-2.5 py-1 text-[11px] font-semibold text-subtle">
            {cat}
          </span>
        ))}
      </div>

      <Link
        href={`/client/workers/${worker.id}`}
        className="mt-5 flex h-11 items-center justify-center gap-1 rounded-xl bg-brand text-sm font-bold text-white transition hover:bg-brand-dark"
      >
        View Profile &amp; Interview
        <ChevronRight size={18} />
      </Link>
    </article>
  );
}
