// import { Briefcase, Clock4, Home, HomeIcon } from 'lucide-react';
// import { cn } from '@/lib/utils/cn';
// import { isPartTime, statusTone } from '@/lib/utils/status';
// import { toHHMM } from '@/lib/utils/format';
// import type { ReactNode } from 'react';

// export function Badge({ children, className, icon }: { children: ReactNode; className?: string; icon?: ReactNode }) {
//   return (
//     <span
//       className={cn(
//         'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1',
//         className || 'bg-slate-100 text-slate-600 ring-slate-200',
//       )}
//     >
//       {icon}
//       {children}
//     </span>
//   );
// }

// /** Status pill - same vocabulary as Interview.Status / WorkerDecision. */
// export function StatusPill({ value }: { value?: string | null }) {
//   if (!value) return null;
//   return <Badge className={statusTone(value)}>{value}</Badge>;
// }

// /** Port of helpers/JobTypeBadge.js */
// export function JobTypeBadge({ jobType }: { jobType?: unknown }) {
//   const part = isPartTime(jobType);
//   return (
//     <Badge
//       className={part ? 'bg-amber-50 text-warn ring-amber-200' : 'bg-brand-light text-brand ring-brand-border'}
//       icon={part ? <Clock4 size={12} /> : <Briefcase size={12} />}
//     >
//       {part ? 'Part-Time' : 'Full-Time'}
//     </Badge>
//   );
// }

// /** Port of helpers/ResidenceBadge.js */
// export function ResidenceBadge({ isResidenceProvided }: { isResidenceProvided?: boolean | null }) {
//   const provided = !!isResidenceProvided;
//   return (
//     <Badge
//       className={provided ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-slate-100 text-slate-600 ring-slate-200'}
//       icon={provided ? <Home size={12} /> : <HomeIcon size={12} />}
//     >
//       {provided ? 'Residence: Yes' : 'Residence: No'}
//     </Badge>
//   );
// }

// /** Port of helpers/SlotTimeLabel.js */
// export function SlotTimeLabel({ startTime, endTime }: { startTime?: string | null; endTime?: string | null }) {
//   const start = toHHMM(startTime);
//   const end = toHHMM(endTime);
//   if (!start || !end) return null;
//   return (
//     <Badge className="bg-teal-50 text-teal-700 ring-teal-200" icon={<Clock4 size={12} />}>
//       {start} – {end}
//     </Badge>
//   );
// }
import { Briefcase, Clock4, Home, HomeIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { isPartTime, statusTone } from '@/lib/utils/status';
import { toHHMM } from '@/lib/utils/format';
import type { ReactNode } from 'react';

export function Badge({ children, className, icon }: { children: ReactNode; className?: string; icon?: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1',
        className || 'bg-slate-100 text-slate-600 ring-slate-200',
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/** Status pill - same vocabulary as Interview.Status / WorkerDecision. */
export function StatusPill({ value }: { value?: string | null }) {
  if (!value) return null;
  return <Badge className={statusTone(value)}>{value}</Badge>;
}

/** Port of helpers/JobTypeBadge.js */
export function JobTypeBadge({ jobType }: { jobType?: unknown }) {
  const part = isPartTime(jobType);
  return (
    <Badge
      className={part ? 'bg-amber-50 text-warn ring-amber-200' : 'bg-brand-light text-brand ring-brand-border'}
      icon={part ? <Clock4 size={12} /> : <Briefcase size={12} />}
    >
      {part ? 'Part-Time' : 'Full-Time'}
    </Badge>
  );
}

/** Port of helpers/ResidenceBadge.js */
export function ResidenceBadge({ isResidenceProvided }: { isResidenceProvided?: boolean | null }) {
  const provided = !!isResidenceProvided;
  return (
    <Badge
      className={provided ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-slate-100 text-slate-600 ring-slate-200'}
      icon={provided ? <Home size={12} /> : <HomeIcon size={12} />}
    >
      {provided ? 'Residence: Yes' : 'Residence: No'}
    </Badge>
  );
}

/** Port of helpers/SlotTimeLabel.js */
export function SlotTimeLabel({ startTime, endTime }: { startTime?: string | null; endTime?: string | null }) {
  const start = toHHMM(startTime);
  const end = toHHMM(endTime);
  if (!start || !end) return null;
  return (
    <Badge className="bg-teal-50 text-teal-700 ring-teal-200" icon={<Clock4 size={12} />}>
      {start} – {end}
    </Badge>
  );
}
