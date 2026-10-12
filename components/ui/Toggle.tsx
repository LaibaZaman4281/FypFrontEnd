// 'use client';

// import { cn } from '@/lib/utils/cn';

// /** Replaces RN <Switch /> (duty status toggle on the worker dashboard). */
// export default function Toggle({
//   checked, onChange, label, disabled,
// }: { checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean }) {
//   return (
//     <button
//       type="button"
//       role="switch"
//       aria-checked={checked}
//       aria-label={label}
//       disabled={disabled}
//       onClick={() => onChange(!checked)}
//       className={cn(
//         'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition disabled:opacity-50',
//         checked ? 'bg-success' : 'bg-slate-300',
//       )}
//     >
//       <span className={cn('inline-block h-5 w-5 transform rounded-full bg-white shadow transition', checked ? 'translate-x-6' : 'translate-x-1')} />
//     </button>
//   );
// }
'use client';

import { cn } from '@/lib/utils/cn';

/** Replaces RN <Switch /> (duty status toggle on the worker dashboard). */
export default function Toggle({
  checked, onChange, label, disabled,
}: { checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition disabled:opacity-50',
        checked ? 'bg-success' : 'bg-slate-300',
      )}
    >
      <span className={cn('inline-block h-5 w-5 transform rounded-full bg-white shadow transition', checked ? 'translate-x-6' : 'translate-x-1')} />
    </button>
  );
}
