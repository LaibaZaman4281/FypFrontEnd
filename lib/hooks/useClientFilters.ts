'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * The RN app passed the filter object between FindServiceScreen and
 * FilterationScreen through route params (`appliedFilters` / `initialFilters`).
 * On the web the same object lives in sessionStorage, so a full page navigation
 * between /client/find-service and /client/filters keeps it intact.
 *
 * Shape is unchanged: { gender, city, categories[], subSkills{}, habits[] }.
 */
export interface ClientFilters {
  gender: string;
  city: string;
  categories: string[];
  subSkills: Record<string, string[]>;
  habits: number[];
}

export const EMPTY_FILTERS: ClientFilters = {
  gender: '',
  city: '',
  categories: [],
  subSkills: {},
  habits: [],
};

const KEY = 'clientFilters';

export function readFilters(): ClientFilters {
  if (typeof window === 'undefined') return EMPTY_FILTERS;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return EMPTY_FILTERS;
    return { ...EMPTY_FILTERS, ...JSON.parse(raw) };
  } catch {
    return EMPTY_FILTERS;
  }
}

export function writeFilters(filters: ClientFilters) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(KEY, JSON.stringify(filters));
}

export function useClientFilters() {
  const [filters, setFilters] = useState<ClientFilters>(EMPTY_FILTERS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setFilters(readFilters());
    setReady(true);
  }, []);

  const update = useCallback((next: ClientFilters) => {
    setFilters(next);
    writeFilters(next);
  }, []);

  const reset = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    writeFilters(EMPTY_FILTERS);
  }, []);

  return { filters, ready, update, reset };
}

/** Count of active filter facets - used for the "Filters (n)" button badge. */
export function countActiveFilters(filters: ClientFilters): number {
  let count = 0;
  if (filters.gender) count += 1;
  if (filters.city) count += 1;
  count += filters.categories.length;
  count += filters.habits.length;
  count += Object.values(filters.subSkills).reduce((sum, list) => sum + (list?.length ?? 0), 0);
  return count;
}
