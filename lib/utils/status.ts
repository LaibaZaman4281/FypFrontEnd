/**
 * The backend stores workflow state as free strings and the RN screens compared
 * them with inconsistent casing ('Rejected' vs 'rejected'). Centralised here so
 * behaviour is identical everywhere - the values themselves are unchanged.
 */

export const STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  JOB_REJECTED: 'JobRejected',
  FINALIZED: 'Finalized',
  HIRED: 'Hired',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  TERMINATED: 'Terminated',
  RESIGNED: 'Resigned',
} as const;

export type StatusValue = (typeof STATUS)[keyof typeof STATUS];

export function isStatus(value: unknown, expected: string): boolean {
  return String(value ?? '').trim().toLowerCase() === expected.trim().toLowerCase();
}

export function isAnyStatus(value: unknown, expected: string[]): boolean {
  const normalised = String(value ?? '').trim().toLowerCase();
  return expected.some((item) => item.trim().toLowerCase() === normalised);
}

/** Tailwind classes for a status pill - keeps colour semantics from the RN badges. */
export function statusTone(value?: string | null): string {
  const v = String(value ?? '').toLowerCase();
  if (v.includes('accept') || v.includes('approve') || v.includes('final') || v.includes('hire'))
    return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  if (v.includes('reject') || v.includes('terminat') || v.includes('block'))
    return 'bg-rose-50 text-rose-700 ring-rose-200';
  if (v.includes('resign')) return 'bg-amber-50 text-amber-700 ring-amber-200';
  if (v.includes('pending')) return 'bg-brand-light text-brand ring-brand-border';
  return 'bg-slate-100 text-slate-600 ring-slate-200';
}

/** Ported from helpers/JobTypeBadge.js */
export function jobTypeLabel(jobType?: unknown): 'Part-Time' | 'Full-Time' {
  const value = (jobType ?? '').toString().trim().toLowerCase().replace(/[\s_]/g, '-');
  return value.startsWith('part') ? 'Part-Time' : 'Full-Time';
}

export function isPartTime(jobType?: unknown): boolean {
  return jobTypeLabel(jobType) === 'Part-Time';
}
