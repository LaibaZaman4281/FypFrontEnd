'use client';

/**
 * Port of `assets/components/Client/FilterationScreen.js`.
 *
 * Same data sources (GetFiltersData for categories + their skills, the habits
 * catalogue), the same facets (gender / categories / city / habits / sub-skills)
 * and the same AND-logic semantics the backend applies.
 *
 * One deviation, deliberate: the mobile screen requested habits from
 * `${API_DASHBOARD}/GetHabits`, a route that does not exist on the backend
 * (habits live under /api/Habits). We call the real endpoint so the habits facet
 * actually renders - see MIGRATION_NOTES.md.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ClipboardCheck, MapPin, Rows3, Users, Wallet, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import HabitChoice from '@/components/features/habits/HabitChoice';
import { DashboardService } from '@/lib/api/services';
import {
  fetchClientFilterHabits,
  findExclusiveGroupConflict,
  getHabitId,
  getHabitName,
  HABIT_COPY,
  toggleHabitSelection,
  type HabitRow,
} from '@/lib/habits';
import { cn } from '@/lib/utils/cn';
import { EMPTY_FILTERS, type ClientFilters } from '@/lib/hooks/useClientFilters';

const RECOMMENDED_CITIES = [
  'Islamabad', 'Rawalpindi', 'Lahore', 'Karachi',
  'Faisalabad', 'Peshawar', 'Multan', 'Quetta',
  'Gujranwala', 'Sialkot',
];

interface CategoryRow {
  categoryId: number;
  categoryName: string;
  skills?: string[];
}

export default function FiltersPanel({
  value,
  onApply,
  onReset,
  onClose,
  compact = false,
  cityOptions,
}: {
  value: ClientFilters;
  onApply: (filters: ClientFilters) => void;
  onReset: () => void;
  onClose?: () => void;
  compact?: boolean;
  /** Overrides the dropdown list (the filter screen injects RN's `defaultCity`). */
  cityOptions?: string[];
}) {
  const [allCategories, setAllCategories] = useState<CategoryRow[]>([]);
  const [habitsCatalog, setHabitsCatalog] = useState<HabitRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedGender, setSelectedGender] = useState(value.gender || '');
  const [selectedCity, setSelectedCity] = useState(value.city || '');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(value.categories || []);
  const [subFilters, setSubFilters] = useState<Record<string, string[]>>(value.subSkills || {});
  const [selectedHabitIds, setSelectedHabitIds] = useState<number[]>(value.habits || []);
  const [cityOpen, setCityOpen] = useState(false);
  const [habitsStatus, setHabitsStatus] = useState<'loading' | 'ready' | 'empty'>('loading');
  const [habitsNote, setHabitsNote] = useState('');
  /* Guards against a stale response overwriting a newer one. Deliberately a
     counter, not a `mounted` boolean: React StrictMode mounts, unmounts and
     remounts in development, and a boolean ref is only initialised on the first
     mount — the cleanup sets it false and nothing restores it, so every later
     update is swallowed and the section sits on "Loading habits…" forever. */
  const habitRequest = useRef(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data: any = await DashboardService.getFiltersData();
        if (!cancelled && Array.isArray(data)) {
          setAllCategories(data);
          setSubFilters((prev) => {
            if (Object.keys(prev).length > 0) return prev;
            const initial: Record<string, string[]> = {};
            data.forEach((cat: CategoryRow) => {
              initial[cat.categoryName] = [];
            });
            return initial;
          });
        }
      } catch {
        /* same as RN: logged and ignored */
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    void loadHabits();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Two-step habit catalogue.
   *
   *   1. `GetClientFilterHabits` — the route RN calls. It filters on
   *      `IsClientFilterable`, a column that **defaults to false**
   *      (Fyp1Context: `HasDefaultValue(false)`), so on a database that was never
   *      seeded for client filtering it answers `[]` and the whole HABITS section
   *      used to vanish silently.
   *   2. `GetHabits` — the worker-selectable catalogue (what signup and My Habits
   *      use). It is a superset, so the facet still works.
   *
   * If both come back empty the section stays on screen with the reason and a
   * Retry button instead of disappearing, which is what made this look like a
   * missing feature rather than a data problem.
   */
  const loadHabits = useCallback(async () => {
    const version = ++habitRequest.current;
    const isCurrent = () => habitRequest.current === version;

    setHabitsStatus('loading');
    setHabitsNote('');

    /* Endpoint order, fallback and messaging all live in lib/habits.ts so the
       client facet uses exactly the same rules as the worker screens. */
    const { habits, source, note } = await fetchClientFilterHabits();
    if (!isCurrent()) return;

    if (habits.length === 0) {
      setHabitsCatalog([]);
      setHabitsStatus('empty');
      setHabitsNote(note);
      return;
    }

    setHabitsCatalog(habits);
    setHabitsStatus('ready');
    setHabitsNote(source === 'worker-catalog' ? note : '');
  }, []);

  const getCategoryLabel = (selection: string) => {
    const match = allCategories.find(
      (cat) => cat.categoryId?.toString() === selection || cat.categoryName === selection,
    );
    return match ? match.categoryName : selection;
  };

  const isCategorySelected = (cat: CategoryRow) => {
    const idString = cat.categoryId?.toString();
    return selectedSkills.some((item) => item === idString || item === cat.categoryName || getCategoryLabel(item) === cat.categoryName);
  };

  const toggleSkillSelection = (categoryId: number | string) => {
    const id = categoryId?.toString();
    const categoryName = getCategoryLabel(id);
    const isSelected = selectedSkills.some(
      (item) => item === id || item === categoryName || getCategoryLabel(item) === categoryName,
    );

    if (isSelected) {
      setSelectedSkills(
        selectedSkills.filter((item) => item !== id && item !== categoryName && getCategoryLabel(item) !== categoryName),
      );
    } else {
      setSelectedSkills([...selectedSkills, id]);
    }
  };

  const toggleSubFilter = (category: string, optionValue: string) => {
    const current = subFilters[category] ? [...subFilters[category]] : [];
    const next = current.includes(optionValue) ? current.filter((item) => item !== optionValue) : [...current, optionValue];
    setSubFilters({ ...subFilters, [category]: next });
  };

  const toggleHabitFilter = (habitId: number) => {
    setSelectedHabitIds((prev) => toggleHabitSelection(prev, habitId, habitsCatalog));
  };

  /* RN blocks Apply when a pair is contradictory; the toggle above prevents it, but
     a previously stored selection (or a future change to the groups) could still
     arrive conflicting, so the guard is kept as a belt-and-braces check. */
  const habitConflict = findExclusiveGroupConflict(selectedHabitIds, habitsCatalog);

  const handleApply = () => {
    if (habitConflict) {
      return;
    }
    onApply({
      gender: selectedGender,
      city: selectedCity,
      categories: selectedSkills,
      subSkills: subFilters,
      habits: selectedHabitIds,
    });
  };

  const handleReset = () => {
    const resetSubFilters: Record<string, string[]> = {};
    allCategories.forEach((cat) => {
      resetSubFilters[cat.categoryName] = [];
    });
    setSelectedGender('');
    setSelectedCity('');
    setSelectedSkills([]);
    setSelectedHabitIds([]);
    setSubFilters(resetSubFilters);
    onReset();
  };

  if (isLoading) {
    return <p className="py-10 text-center text-sm text-subtle">Loading filters…</p>;
  }

  const habitLabel = (habitId: number) => {
    const habit = habitsCatalog.find((entry) => getHabitId(entry) === habitId);
    return getHabitName(habit) || `Habit ${habitId}`;
  };


  /* RN renders four tag kinds in this row: gender, city, each category and each
     habit. The habit tags were missing on the web, so a ticked habit looked
     unremovable without scrolling to the habits section. */
  const activeTags = [
    ...(selectedGender ? [{ key: 'gender', label: selectedGender, remove: () => setSelectedGender('') }] : []),
    ...(selectedCity ? [{ key: 'city', label: selectedCity, remove: () => setSelectedCity('') }] : []),
    ...selectedSkills.map((s) => ({ key: `cat-${s}`, label: getCategoryLabel(s), remove: () => toggleSkillSelection(s) })),
    ...selectedHabitIds.map((id) => ({ key: `habit-${id}`, label: habitLabel(id), remove: () => toggleHabitFilter(id) })),
  ];

  return (
    <div className={cn('space-y-6', compact && 'space-y-5')}>
      {activeTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeTags.map((tag) => (
            <span key={tag.key} className="inline-flex items-center gap-1.5 rounded-full bg-brand-light px-3 py-1 text-xs font-bold text-brand">
              {tag.label}
              <button type="button" onClick={tag.remove} aria-label={`Remove ${tag.label}`}>
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* GENDER */}
      <section className="rounded-2xl border border-line bg-white p-4">
        <p className="label-xs mb-2 flex items-center gap-1.5">
          <Users size={13} /> Gender
        </p>
        <div className="flex gap-2">
          {['Male', 'Female', 'Both'].map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setSelectedGender(g)}
              className={cn(
                'flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition',
                selectedGender === g ? 'border-brand bg-brand text-white' : 'border-line bg-white text-subtle hover:bg-canvas',
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="rounded-2xl border border-line bg-white p-4">
        <p className="label-xs mb-2 flex items-center gap-1.5">
          <Wallet size={13} /> Skills
        </p>
        <div className="flex flex-wrap gap-2">
          {allCategories.map((cat) => (
            <button
              key={cat.categoryId}
              type="button"
              onClick={() => toggleSkillSelection(cat.categoryId)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-sm font-semibold transition',
                isCategorySelected(cat) ? 'bg-brand text-white' : 'bg-white text-subtle ring-1 ring-line hover:bg-canvas',
              )}
            >
              {cat.categoryName}
            </button>
          ))}
        </div>
      </section>

      {/* CITY */}
      <section className="rounded-2xl border border-line bg-white p-4">
        <p className="label-xs mb-2 flex items-center gap-1.5">
          <MapPin size={13} /> City
        </p>
        <div className="relative">
          <button
            type="button"
            onClick={() => setCityOpen(!cityOpen)}
            className="flex w-full items-center justify-between rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm font-semibold text-ink"
          >
            <span className={cn(!selectedCity && 'text-muted')}>{selectedCity || 'Select Recommended City'}</span>
            <ChevronDown size={18} className="text-muted" />
          </button>

          {cityOpen && (
            <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-line bg-white py-1 shadow-pop">
              {(cityOptions ?? ['All', ...RECOMMENDED_CITIES]).map((city) => (
                <li key={city}>
                  <button
                    type="button"
                    onClick={() => {
                      /* "All" means no location restriction — the same value the
                         backend ignores, and what RN's dropdown offers. */
                      setSelectedCity(city === 'All' ? '' : city);
                      setCityOpen(false);
                    }}
                    className="flex w-full items-center justify-between px-4 py-2 text-left text-sm font-medium text-ink hover:bg-canvas"
                  >
                    {city}
                    {selectedCity === city && <Check size={16} className="text-brand" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* HABITS - worker must hold every ticked habit.
          Rendered unconditionally: hiding it when the catalogue came back empty made
          the facet look unimplemented instead of un-seeded. */}
      {(
        <section className="rounded-2xl border border-line bg-white p-4">
          <p className="label-xs mb-2 flex items-center gap-1.5">
            <ClipboardCheck size={13} /> Habits
          </p>

          {habitsStatus === 'loading' && (
            <p className="py-1 text-xs text-subtle">Loading habits…</p>
          )}

          {habitsStatus !== 'loading' && habitsCatalog.length === 0 && (
            <div className="rounded-xl bg-canvas px-3 py-2.5">
              <p className="text-[12px] leading-relaxed text-subtle">
                {habitsNote || 'No habit filters are available on the server.'}
              </p>
              <button
                type="button"
                onClick={() => void loadHabits()}
                className="mt-1.5 text-[12px] font-bold text-brand hover:underline"
              >
                Retry
              </button>
            </div>
          )}
          {habitsCatalog.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {habitsCatalog.map((habit) => (
                <HabitChoice
                  key={getHabitId(habit)}
                  variant="chip"
                  habit={habit}
                  selected={selectedHabitIds.includes(getHabitId(habit))}
                  onToggle={() => toggleHabitFilter(getHabitId(habit))}
                />
              ))}
            </div>
          )}

          {/* Fallback source / conflict feedback, RN-style wording. */}
          {habitsStatus === 'ready' && habitsNote && (
            <p className="mt-2 text-[11px] leading-relaxed text-muted">{habitsNote}</p>
          )}
          {habitConflict && (
            <p className="mt-2 text-[11px] font-semibold text-danger">{HABIT_COPY.conflict}</p>
          )}

          {selectedHabitIds.length > 0 && (
            <p className="mt-2 text-xs text-subtle">
              Workers must match all {selectedHabitIds.length} selected filter
              {selectedHabitIds.length > 1 ? 's' : ''}. Choose only one option from each opposite pair.
            </p>
          )}
        </section>
      )}

      {/* SUB-CATEGORIES for each selected category */}
      {selectedSkills.length > 0 && (
        <section className="space-y-4 rounded-2xl border border-line bg-white p-4">
          <p className="label-xs flex items-center gap-1.5">
            <Rows3 size={13} /> Sub-Category
          </p>
          {allCategories
            .filter((cat) => isCategorySelected(cat))
            .map((cat) => (
              <div key={`sub-${cat.categoryId}`}>
                <p className="mb-1.5 text-sm font-bold text-ink">{cat.categoryName}</p>
                <div className="flex flex-wrap gap-2">
                  {(cat.skills || []).map((opt) => {
                    const active = (subFilters[cat.categoryName] || []).includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleSubFilter(cat.categoryName, opt)}
                        className={cn(
                          'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                          active ? 'bg-brand text-white' : 'bg-canvas text-subtle ring-1 ring-line hover:bg-white',
                        )}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
        </section>
      )}

      <div className="flex gap-3 pt-2">
        <Button variant="outline" fullWidth onClick={handleReset}>
          Reset
        </Button>
        <Button
          fullWidth
          onClick={() => {
            handleApply();
            onClose?.();
          }}
        >
          Apply
        </Button>
      </div>
    </div>
  );
}

export { EMPTY_FILTERS };

