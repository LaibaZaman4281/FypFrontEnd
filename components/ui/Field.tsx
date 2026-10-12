// 'use client';

// import { cn } from '@/lib/utils/cn';
// import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

// interface BaseProps {
//   label?: string;
//   hint?: string;
//   error?: string;
//   icon?: ReactNode;
//   trailing?: ReactNode;
//   className?: string;
// }

// function Shell({ label, hint, error, children }: BaseProps & { children: ReactNode }) {
//   return (
//     <label className="block">
//       {label && <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>}
//       {children}
//       {error ? (
//         <span className="mt-1 block text-xs font-medium text-danger">{error}</span>
//       ) : hint ? (
//         <span className="mt-1 block text-xs text-subtle">{hint}</span>
//       ) : null}
//     </label>
//   );
// }

// const CONTROL =
//   'w-full rounded-xl border border-line bg-white px-3.5 text-[15px] text-ink placeholder:text-muted ' +
//   'transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10 disabled:bg-canvas';

// export function Input({
//   label, hint, error, icon, trailing, className, ...rest
// }: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
//   return (
//     <Shell label={label} hint={hint} error={error}>
//       <div className="relative flex items-center">
//         {icon ? <span className="pointer-events-none absolute left-3 text-brand">{icon}</span> : null}
//         <input
//           {...rest}
//           className={cn(CONTROL, 'h-11', icon ? 'pl-10' : '', trailing ? 'pr-11' : '', error ? 'border-danger' : '', className)}
//         />
//         {trailing && <span className="absolute right-2 flex items-center">{trailing}</span>}
//       </div>
//     </Shell>
//   );
// }

// export function Textarea({
//   label, hint, error, className, ...rest
// }: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
//   return (
//     <Shell label={label} hint={hint} error={error}>
//       <textarea {...rest} className={cn(CONTROL, 'min-h-[110px] py-3 leading-relaxed', error ? 'border-danger' : '', className)} />
//     </Shell>
//   );
// }

// export function Select({
//   label, hint, error, className, children, ...rest
// }: BaseProps & SelectHTMLAttributes<HTMLSelectElement>) {
//   return (
//     <Shell label={label} hint={hint} error={error}>
//       <select {...rest} className={cn(CONTROL, 'h-11 appearance-none bg-[length:16px] pr-9', error ? 'border-danger' : '', className)}>
//         {children}
//       </select>
//     </Shell>
//   );
// }
'use client';

import { cn } from '@/lib/utils/cn';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface BaseProps {
  label?: string;
  hint?: string;
  error?: string;
  icon?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}

function Shell({ label, hint, error, children }: BaseProps & { children: ReactNode }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>}
      {children}
      {error ? (
        <span className="mt-1 block text-xs font-medium text-danger">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-subtle">{hint}</span>
      ) : null}
    </label>
  );
}

const CONTROL =
  'w-full rounded-xl border border-line bg-white px-3.5 text-[15px] text-ink placeholder:text-muted ' +
  'transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10 disabled:bg-canvas';

export function Input({
  label, hint, error, icon, trailing, className, ...rest
}: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Shell label={label} hint={hint} error={error}>
      <div className="relative flex items-center">
        {icon ? <span className="pointer-events-none absolute left-3 text-brand">{icon}</span> : null}
        <input
          {...rest}
          className={cn(CONTROL, 'h-11', icon ? 'pl-10' : '', trailing ? 'pr-11' : '', error ? 'border-danger' : '', className)}
        />
        {trailing && <span className="absolute right-2 flex items-center">{trailing}</span>}
      </div>
    </Shell>
  );
}

export function Textarea({
  label, hint, error, className, ...rest
}: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Shell label={label} hint={hint} error={error}>
      <textarea {...rest} className={cn(CONTROL, 'min-h-[110px] py-3 leading-relaxed', error ? 'border-danger' : '', className)} />
    </Shell>
  );
}

export function Select({
  label, hint, error, className, children, ...rest
}: BaseProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Shell label={label} hint={hint} error={error}>
      <select {...rest} className={cn(CONTROL, 'h-11 appearance-none bg-[length:16px] pr-9', error ? 'border-danger' : '', className)}>
        {children}
      </select>
    </Shell>
  );
}
