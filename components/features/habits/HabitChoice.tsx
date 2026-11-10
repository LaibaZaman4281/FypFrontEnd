'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { getHabitName, habitGroup, type HabitRow } from '@/lib/habits';

/**
 * One habit option, rendered the way RN renders it.
 *
 * `MyHabitsScreen` and `FilterationScreen` both pick the glyph from the habit
 * itself — a **radio** for anything with an `exclusiveGroup` (only one of the pair
 * may be selected) and a **checkbox** for freely combinable habits. Doing that in
 * one component keeps signup, the worker profile and the client filter identical.
 *
 * `variant` only changes the surround: `chip` is the pill used in the client
 * filter, `row` is the bordered tile used by signup and My Habits.
 */
export default function HabitChoice({
  habit,
  selected,
  onToggle,
  variant = 'row',
  disabled = false,
}: {
  habit: HabitRow;
  selected: boolean;
  onToggle: () => void;
  variant?: 'row' | 'chip';
  disabled?: boolean;
}) {
  const exclusive = habitGroup(habit) !== null;

  const glyph = exclusive ? (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full border',
        variant === 'row' ? 'h-5 w-5' : 'h-3.5 w-3.5',
        selected ? (variant === 'row' ? 'border-brand' : 'border-white') : 'border-slate-400',
      )}
    >
      {selected && (
        <span
          className={cn(
            'rounded-full',
            variant === 'row' ? 'h-2.5 w-2.5 bg-brand' : 'h-1.5 w-1.5 bg-white',
          )}
        />
      )}
    </span>
  ) : (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center border',
        variant === 'row' ? 'h-5 w-5 rounded' : 'h-3.5 w-3.5 rounded-[3px]',
        selected
          ? variant === 'row'
            ? 'border-brand bg-brand text-white'
            : 'border-white bg-white/20'
          : 'border-slate-400',
      )}
    >
      {selected && <Check size={variant === 'row' ? 13 : 10} strokeWidth={3} />}
    </span>
  );

  if (variant === 'chip') {
    return (
      <button
        type="button"
        role={exclusive ? 'radio' : 'checkbox'}
        aria-checked={selected}
        disabled={disabled}
        onClick={onToggle}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition',
          selected ? 'bg-brand text-white' : 'bg-white text-subtle ring-1 ring-line hover:bg-canvas',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        {glyph}
        {getHabitName(habit)}
      </button>
    );
  }

  return (
    <button
      type="button"
      role={exclusive ? 'radio' : 'checkbox'}
      aria-checked={selected}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        'flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition',
        selected ? 'border-brand bg-brand-light text-brand' : 'border-line bg-white text-subtle hover:bg-canvas',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      {glyph}
      <span className="min-w-0 flex-1 truncate">{getHabitName(habit)}</span>
      {exclusive && (
        <span className="shrink-0 rounded-full bg-canvas px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">
          one of pair
        </span>
      )}
    </button>
  );
}
