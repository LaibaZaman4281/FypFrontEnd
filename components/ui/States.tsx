// import { Inbox, Loader2 } from 'lucide-react';
// import type { ReactNode } from 'react';
// import { cn } from '@/lib/utils/cn';

// export function Loader({ label = 'Loading…', className }: { label?: string; className?: string }) {
//   return (
//     <div className={cn('flex flex-col items-center justify-center gap-3 py-16 text-subtle', className)}>
//       <Loader2 className="h-7 w-7 animate-spin text-brand" />
//       <p className="text-sm font-medium">{label}</p>
//     </div>
//   );
// }

// export function EmptyState({
//   title, message, icon, action,
// }: { title: string; message?: string; icon?: ReactNode; action?: ReactNode }) {
//   return (
//     <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white/60 px-6 py-16 text-center">
//       <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-light text-brand">
//         {icon ?? <Inbox size={24} />}
//       </span>
//       <h3 className="text-base font-bold text-ink">{title}</h3>
//       {message && <p className="mt-1 max-w-sm text-sm text-subtle">{message}</p>}
//       {action && <div className="mt-5">{action}</div>}
//     </div>
//   );
// }

// export function SkeletonCard() {
//   return (
//     <div className="animate-pulse rounded-2xl border border-line bg-white p-5">
//       <div className="flex items-center gap-4">
//         <div className="h-14 w-14 rounded-full bg-canvas" />
//         <div className="flex-1 space-y-2">
//           <div className="h-3.5 w-1/3 rounded bg-canvas" />
//           <div className="h-3 w-1/2 rounded bg-canvas" />
//         </div>
//       </div>
//       <div className="mt-4 space-y-2">
//         <div className="h-3 w-full rounded bg-canvas" />
//         <div className="h-3 w-2/3 rounded bg-canvas" />
//       </div>
//     </div>
//   );
// }
import { Inbox, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export function Loader({ label = 'Loading…', className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16 text-subtle', className)}>
      <Loader2 className="h-7 w-7 animate-spin text-brand" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

export function EmptyState({
  title, message, icon, action,
}: { title: string; message?: string; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white/60 px-6 py-16 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-light text-brand">
        {icon ?? <Inbox size={24} />}
      </span>
      <h3 className="text-base font-bold text-ink">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-subtle">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-line bg-white p-5">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-canvas" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-1/3 rounded bg-canvas" />
          <div className="h-3 w-1/2 rounded bg-canvas" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full rounded bg-canvas" />
        <div className="h-3 w-2/3 rounded bg-canvas" />
      </div>
    </div>
  );
}
