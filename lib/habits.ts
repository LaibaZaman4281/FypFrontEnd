/**
 * Habit logic shared by every screen that touches habits, ported from the three
 * React Native places that each carried their own copy:
 *
 *   assets/components/Worker/MyHabitsScreen.js      (worker profile + signup step)
 *   assets/components/Auth/SignupScreen.js          (signup catalogue)
 *   assets/components/Client/FilterationScreen.js   (client filter facet)
 *
 * Backend contract (Controllers/HabitsController.cs):
 *
 *   GET  api/Habits/GetHabits                 [AllowAnonymous]
 *        -> [{ habitId, name, sortOrder, exclusiveGroup }]        IsActive && IsWorkerSelectable
 *   GET  api/Habits/GetClientFilterHabits     [AllowAnonymous]
 *        -> [{ habitId, name, sortOrder, exclusiveGroup }]        ... && IsClientFilterable
 *   GET  api/Habits/GetWorkerHabits/{workerId}
 *        -> { workerId, habitIds: number[], habits: [{ id, name }] }
 *   POST api/Habits/UpdateWorkerHabits        { workerId, habitIds }
 *        -> { message, workerId, habitIds, habits }
 *
 * Rules that must stay identical everywhere (the server enforces them too, so any
 * drift here surfaces as a 400):
 *   - ids are positive integers, de-duplicated  (backend: .Where(id => id > 0).Distinct())
 *   - at most one habit per `exclusiveGroup`     (HabitSelectionRules.FindExclusiveGroupConflict)
 */

import { apiFetch } from '@/lib/api/client';
import { API_HABITS } from '@/lib/config';
import { HabitsService } from '@/lib/api/services';

/**
 * A habit row as the backend projects it. Deliberately standalone rather than
 * extending `Habit` (which requires `habitName`) — the master list sends
 * `{ habitId, name }`, worker-own rows send `{ id, name }`, and older snapshots
 * used `habitName`, so every field is optional apart from the id.
 */
export interface HabitRow {
  habitId?: number;
  /** `GetWorkerHabits` returns `{ id, name }` rows. */
  id?: number;
  name?: string;
  habitName?: string;
  sortOrder?: number;
  exclusiveGroup?: string | null;
  [key: string]: unknown;
}

export type HabitSource = 'client-filter' | 'worker-catalog';

export interface HabitCatalogResult {
  habits: HabitRow[];
  /** Which endpoint produced the list — surfaced in the UI when it is a fallback. */
  source: HabitSource | null;
  /** Human-readable reason when the preferred endpoint could not be used. */
  note: string;
}

/* ------------------------------------------------------------------ */
/* primitives                                                          */
/* ------------------------------------------------------------------ */

/** `getHabitId` from RN — `habitId` on the master list, `id` on worker-own rows. */
export function getHabitId(habit: Partial<HabitRow> | null | undefined): number {
  const raw = habit?.habitId ?? habit?.id;
  const value = Number(raw);
  return Number.isInteger(value) ? value : 0;
}

export function getHabitName(habit: Partial<HabitRow> | null | undefined): string {
  return habit?.name ?? habit?.habitName ?? '';
}

/** `normalizeHabitIds` from MyHabitsScreen: unique positive integers only. */
export function normalizeHabitIds(ids: unknown): number[] {
  const list = Array.isArray(ids) ? ids : [];
  return [...new Set(list.map(Number).filter((id) => Number.isInteger(id) && id > 0))];
}

/** Lower-cased exclusive group, or null when the habit is freely combinable. */
export function habitGroup(habit: Partial<HabitRow> | null | undefined): string | null {
  const group = habit?.exclusiveGroup?.trim().toLowerCase();
  return group ? group : null;
}

export function findHabit(catalog: HabitRow[], habitId: number | string): HabitRow | undefined {
  const id = Number(habitId);
  return catalog.find((habit) => getHabitId(habit) === id);
}

/**
 * `findExclusiveGroupConflict` from MyHabitsScreen: returns the offending group
 * name when two selected habits share one, otherwise null.
 */
export function findExclusiveGroupConflict(ids: number[], catalog: HabitRow[]): string | null {
  const seen = new Set<string>();
  for (const id of ids) {
    const group = habitGroup(findHabit(catalog, id));
    if (!group) continue;
    if (seen.has(group)) return group;
    seen.add(group);
  }
  return null;
}

/**
 * `toggleHabit` from MyHabitsScreen: unticking removes the id; ticking a habit
 * that belongs to an exclusive group removes *every* other id in that group
 * first, so a radio pair can never end up both selected.
 */
export function toggleHabitSelection(prev: number[], habitId: number, catalog: HabitRow[]): number[] {
  const id = Number(habitId);
  if (prev.includes(id)) return prev.filter((selected) => selected !== id);

  const targetGroup = habitGroup(findHabit(catalog, id));
  if (!targetGroup) return [...prev, id];

  const sameGroupIds = new Set(
    catalog.filter((habit) => habitGroup(habit) === targetGroup).map((habit) => getHabitId(habit)),
  );
  return [...prev.filter((selected) => !sameGroupIds.has(Number(selected))), id];
}

/* ------------------------------------------------------------------ */
/* fetchers                                                            */
/* ------------------------------------------------------------------ */

/** Rejects after `ms` so a hung request can never wedge a screen on "Loading". */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Timed out after ${ms / 1000}s.`)), ms)),
  ]);
}

const TIMEOUT_MS = 12000;

/** Worker-selectable catalogue — what signup and My Habits use. */
export async function fetchWorkerHabitCatalog(): Promise<HabitRow[]> {
  const list = await withTimeout(HabitsService.getHabits(), TIMEOUT_MS);
  return Array.isArray(list) ? (list as HabitRow[]) : [];
}

/** This worker's saved habits, already normalised. */
export async function fetchWorkerHabits(workerId: number | string): Promise<number[]> {
  const mine: any = await withTimeout(HabitsService.getWorkerHabits(workerId), TIMEOUT_MS);
  return normalizeHabitIds(mine?.habitIds);
}

/**
 * Client filter facet.
 *
 * RN calls `GetClientFilterHabits` and nothing else, which means an install whose
 * `Habits` table has `IsClientFilterable = 0` everywhere (that column defaults to
 * false in Fyp1Context) renders an empty facet with no explanation. Here the same
 * endpoint is tried first — when it answers, `source` is `'client-filter'` and the
 * behaviour is identical to the app — and the worker catalogue is used only when
 * it comes back empty or fails, with `note` explaining why so the UI can say so.
 */
export async function fetchClientFilterHabits(): Promise<HabitCatalogResult> {
  let note = '';

  try {
    const list = await withTimeout(apiFetch<HabitRow[]>(`${API_HABITS}/GetClientFilterHabits`), TIMEOUT_MS);
    const habits = Array.isArray(list) ? list : [];
    if (habits.length > 0) return { habits, source: 'client-filter', note: '' };
    note = 'No habit is marked client-filterable on the server, so the worker catalogue is shown instead.';
  } catch (error: any) {
    note = error?.message
      ? `GetClientFilterHabits failed: ${error.message}`
      : 'GetClientFilterHabits failed.';
  }

  try {
    const habits = await fetchWorkerHabitCatalog();
    if (habits.length > 0) return { habits, source: 'worker-catalog', note };
    return {
      habits: [],
      source: null,
      note: `${note} The habits table is empty on the backend.`.trim(),
    };
  } catch (error: any) {
    return {
      habits: [],
      source: null,
      note: `${note} ${error?.message ?? 'Could not load habits.'}`.trim(),
    };
  }
}

/** Replace this worker's habits. Returns the ids the server actually stored. */
export async function saveWorkerHabits(workerId: number | string, habitIds: number[]) {
  const result: any = await HabitsService.updateWorkerHabits({
    workerId: Number(workerId),
    habitIds: normalizeHabitIds(habitIds),
  });
  return {
    message: typeof result?.message === 'string' ? result.message : '',
    habitIds: normalizeHabitIds(result?.habitIds),
  };
}

/** Copy used by all three screens so the wording never drifts. */
export const HABIT_COPY = {
  conflict: 'Choose only one option from each opposite habit pair.',
  emptySelection: 'Please keep at least one habit ticked.',
  catalogFailed: 'Could not load the habit list.',
  networkFailed: 'Network error while loading habits.',
  saveFailed: 'Could not save your habits.',
} as const;
