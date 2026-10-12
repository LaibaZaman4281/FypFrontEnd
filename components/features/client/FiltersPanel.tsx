// 'use client';

// /**
//  * Port of `assets/components/Client/FilterationScreen.js`.
//  *
//  * Same data sources (GetFiltersData for categories + their skills, the habits
//  * catalogue), the same facets (gender / categories / city / habits / sub-skills)
//  * and the same AND-logic semantics the backend applies.
//  *
//  * One deviation, deliberate: the mobile screen requested habits from
//  * `${API_DASHBOARD}/GetHabits`, a route that does not exist on the backend
//  * (habits live under /api/Habits). We call the real endpoint so the habits facet
//  * actually renders - see MIGRATION_NOTES.md.
//  */

// import { useEffect, useState } from 'react';
// import { Check, ChevronDown, X } from 'lucide-react';
// import Button from '@/components/ui/Button';
// import { DashboardService, HabitsService } from '@/lib/api/services';
// import { cn } from '@/lib/utils/cn';
// import { EMPTY_FILTERS, type ClientFilters } from '@/lib/hooks/useClientFilters';
// import type { Habit } from '@/types';

// const RECOMMENDED_CITIES = [
//   'Islamabad', 'Rawalpindi', 'Lahore', 'Karachi',
//   'Faisalabad', 'Peshawar', 'Multan', 'Quetta',
//   'Gujranwala', 'Sialkot',
// ];

// interface CategoryRow {
//   categoryId: number;
//   categoryName: string;
//   skills?: string[];
// }

// export default function FiltersPanel({
//   value,
//   onApply,
//   onReset,
//   onClose,
//   compact = false,
// }: {
//   value: ClientFilters;
//   onApply: (filters: ClientFilters) => void;
//   onReset: () => void;
//   onClose?: () => void;
//   compact?: boolean;
// }) {
//   const [allCategories, setAllCategories] = useState<CategoryRow[]>([]);
//   const [habitsCatalog, setHabitsCatalog] = useState<Habit[]>([]);
//   const [isLoading, setIsLoading] = useState(true);

//   const [selectedGender, setSelectedGender] = useState(value.gender || '');
//   const [selectedCity, setSelectedCity] = useState(value.city || '');
//   const [selectedSkills, setSelectedSkills] = useState<string[]>(value.categories || []);
//   const [subFilters, setSubFilters] = useState<Record<string, string[]>>(value.subSkills || {});
//   const [selectedHabitIds, setSelectedHabitIds] = useState<number[]>(value.habits || []);
//   const [cityOpen, setCityOpen] = useState(false);

//   useEffect(() => {
//     let cancelled = false;

//     (async () => {
//       try {
//         const data: any = await DashboardService.getFiltersData();
//         if (!cancelled && Array.isArray(data)) {
//           setAllCategories(data);
//           setSubFilters((prev) => {
//             if (Object.keys(prev).length > 0) return prev;
//             const initial: Record<string, string[]> = {};
//             data.forEach((cat: CategoryRow) => {
//               initial[cat.categoryName] = [];
//             });
//             return initial;
//           });
//         }
//       } catch {
//         /* same as RN: logged and ignored */
//       } finally {
//         if (!cancelled) setIsLoading(false);
//       }
//     })();

//     HabitsService.getHabits()
//       .then((list) => !cancelled && setHabitsCatalog(Array.isArray(list) ? list : []))
//       .catch(() => undefined);

//     return () => {
//       cancelled = true;
//     };
//   }, []);

//   const getCategoryLabel = (selection: string) => {
//     const match = allCategories.find(
//       (cat) => cat.categoryId?.toString() === selection || cat.categoryName === selection,
//     );
//     return match ? match.categoryName : selection;
//   };

//   const isCategorySelected = (cat: CategoryRow) => {
//     const idString = cat.categoryId?.toString();
//     return selectedSkills.some((item) => item === idString || item === cat.categoryName || getCategoryLabel(item) === cat.categoryName);
//   };

//   const toggleSkillSelection = (categoryId: number | string) => {
//     const id = categoryId?.toString();
//     const categoryName = getCategoryLabel(id);
//     const isSelected = selectedSkills.some(
//       (item) => item === id || item === categoryName || getCategoryLabel(item) === categoryName,
//     );

//     if (isSelected) {
//       setSelectedSkills(
//         selectedSkills.filter((item) => item !== id && item !== categoryName && getCategoryLabel(item) !== categoryName),
//       );
//     } else {
//       setSelectedSkills([...selectedSkills, id]);
//     }
//   };

//   const toggleSubFilter = (category: string, optionValue: string) => {
//     const current = subFilters[category] ? [...subFilters[category]] : [];
//     const next = current.includes(optionValue) ? current.filter((item) => item !== optionValue) : [...current, optionValue];
//     setSubFilters({ ...subFilters, [category]: next });
//   };

//   const toggleHabitFilter = (habitId: number) => {
//     setSelectedHabitIds((prev) => (prev.includes(habitId) ? prev.filter((id) => id !== habitId) : [...prev, habitId]));
//   };

//   const handleApply = () => {
//     onApply({
//       gender: selectedGender,
//       city: selectedCity,
//       categories: selectedSkills,
//       subSkills: subFilters,
//       habits: selectedHabitIds,
//     });
//   };

//   const handleReset = () => {
//     const resetSubFilters: Record<string, string[]> = {};
//     allCategories.forEach((cat) => {
//       resetSubFilters[cat.categoryName] = [];
//     });
//     setSelectedGender('');
//     setSelectedСitySafe('');
//     setSelectedSkills([]);
//     setSelectedHabitIds([]);
//     setSubFilters(resetSubFilters);
//     onReset();
//   };

//   // helper kept separate so the reset above reads cleanly
//   function setSelectedСitySafe(next: string) {
//     setSelectedCity(next);
//   }

//   if (isLoading) {
//     return <p className="py-10 text-center text-sm text-subtle">Loading filters…</p>;
//   }

//   const activeTags = [
//     ...(selectedGender ? [{ key: 'gender', label: selectedGender, remove: () => setSelectedGender('') }] : []),
//     ...(selectedCity ? [{ key: 'city', label: selectedCity, remove: () => setSelectedCity('') }] : []),
//     ...selectedSkills.map((s) => ({ key: `cat-${s}`, label: getCategoryLabel(s), remove: () => toggleSkillSelection(s) })),
//   ];

//   return (
//     <div className={cn('space-y-6', compact && 'space-y-5')}>
//       {activeTags.length > 0 && (
//         <div className="flex flex-wrap gap-2">
//           {activeTags.map((tag) => (
//             <span key={tag.key} className="inline-flex items-center gap-1.5 rounded-full bg-brand-light px-3 py-1 text-xs font-bold text-brand">
//               {tag.label}
//               <button type="button" onClick={tag.remove} aria-label={`Remove ${tag.label}`}>
//                 <X size={13} />
//               </button>
//             </span>
//           ))}
//         </div>
//       )}

//       {/* GENDER */}
//       <section>
//         <p className="label-xs mb-2">Gender</p>
//         <div className="flex gap-2">
//           {['Male', 'Female', 'Both'].map((g) => (
//             <button
//               key={g}
//               type="button"
//               onClick={() => setSelectedGender(g)}
//               className={cn(
//                 'flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition',
//                 selectedGender === g ? 'border-brand bg-brand text-white' : 'border-line bg-white text-subtle hover:bg-canvas',
//               )}
//             >
//               {g}
//             </button>
//           ))}
//         </div>
//       </section>

//       {/* CATEGORIES */}
//       <section>
//         <p className="label-xs mb-2">Skills</p>
//         <div className="flex flex-wrap gap-2">
//           {allCategories.map((cat) => (
//             <button
//               key={cat.categoryId}
//               type="button"
//               onClick={() => toggleSkillSelection(cat.categoryId)}
//               className={cn(
//                 'rounded-full px-3.5 py-1.5 text-sm font-semibold transition',
//                 isCategorySelected(cat) ? 'bg-brand text-white' : 'bg-white text-subtle ring-1 ring-line hover:bg-canvas',
//               )}
//             >
//               {cat.categoryName}
//             </button>
//           ))}
//         </div>
//       </section>

//       {/* CITY */}
//       <section>
//         <p className="label-xs mb-2">City</p>
//         <div className="relative">
//           <button
//             type="button"
//             onClick={() => setCityOpen(!cityOpen)}
//             className="flex w-full items-center justify-between rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm font-semibold text-ink"
//           >
//             <span className={cn(!selectedCity && 'text-muted')}>{selectedCity || 'Select Recommended City'}</span>
//             <ChevronDown size={18} className="text-muted" />
//           </button>

//           {cityOpen && (
//             <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-line bg-white py-1 shadow-pop">
//               {RECOMMENDED_CITIES.map((city) => (
//                 <li key={city}>
//                   <button
//                     type="button"
//                     onClick={() => {
//                       setSelectedCity(city);
//                       setCityOpen(false);
//                     }}
//                     className="flex w-full items-center justify-between px-4 py-2 text-left text-sm font-medium text-ink hover:bg-canvas"
//                   >
//                     {city}
//                     {selectedCity === city && <Check size={16} className="text-brand" />}
//                   </button>
//                 </li>
//               ))}
//             </ul>
//           )}
//         </div>
//       </section>

//       {/* HABITS - worker must hold every ticked habit */}
//       {habitsCatalog.length > 0 && (
//         <section>
//           <p className="label-xs mb-2">Habits</p>
//           <div className="flex flex-wrap gap-2">
//             {habitsCatalog.map((habit: any) => {
//               const habitId = habit.habitId ?? habit.id;
//               const isActive = selectedHabitIds.includes(habitId);
//               return (
//                 <button
//                   key={habitId}
//                   type="button"
//                   onClick={() => toggleHabitFilter(habitId)}
//                   className={cn(
//                     'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition',
//                     isActive ? 'bg-brand text-white' : 'bg-white text-subtle ring-1 ring-line hover:bg-canvas',
//                   )}
//                 >
//                   {isActive && <Check size={13} />}
//                   {habit.name ?? habit.habitName}
//                 </button>
//               );
//             })}
//           </div>
//           {selectedHabitIds.length > 0 && (
//             <p className="mt-2 text-xs text-subtle">
//               Workers must match all {selectedHabitIds.length} selected habit{selectedHabitIds.length > 1 ? 's' : ''}.
//             </p>
//           )}
//         </section>
//       )}

//       {/* SUB-CATEGORIES for each selected category */}
//       {selectedSkills.length > 0 && (
//         <section className="space-y-4">
//           <p className="label-xs">Sub-category</p>
//           {allCategories
//             .filter((cat) => isCategorySelected(cat))
//             .map((cat) => (
//               <div key={`sub-${cat.categoryId}`}>
//                 <p className="mb-1.5 text-sm font-bold text-ink">{cat.categoryName}</p>
//                 <div className="flex flex-wrap gap-2">
//                   {(cat.skills || []).map((opt) => {
//                     const active = (subFilters[cat.categoryName] || []).includes(opt);
//                     return (
//                       <button
//                         key={opt}
//                         type="button"
//                         onClick={() => toggleSubFilter(cat.categoryName, opt)}
//                         className={cn(
//                           'rounded-full px-3 py-1.5 text-xs font-semibold transition',
//                           active ? 'bg-brand text-white' : 'bg-canvas text-subtle ring-1 ring-line hover:bg-white',
//                         )}
//                       >
//                         {opt}
//                       </button>
//                     );
//                   })}
//                 </div>
//               </div>
//             ))}
//         </section>
//       )}

//       <div className="flex gap-3 pt-2">
//         <Button variant="outline" fullWidth onClick={handleReset}>
//           Reset
//         </Button>
//         <Button
//           fullWidth
//           onClick={() => {
//             handleApply();
//             onClose?.();
//           }}
//         >
//           Apply
//         </Button>
//       </div>
//     </div>
//   );
// }

// export { EMPTY_FILTERS };

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

import { useEffect, useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import { DashboardService, HabitsService } from '@/lib/api/services';
import { cn } from '@/lib/utils/cn';
import { EMPTY_FILTERS, type ClientFilters } from '@/lib/hooks/useClientFilters';
import type { Habit } from '@/types';

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
}: {
  value: ClientFilters;
  onApply: (filters: ClientFilters) => void;
  onReset: () => void;
  onClose?: () => void;
  compact?: boolean;
}) {
  const [allCategories, setAllCategories] = useState<CategoryRow[]>([]);
  const [habitsCatalog, setHabitsCatalog] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedGender, setSelectedGender] = useState(value.gender || '');
  const [selectedCity, setSelectedCity] = useState(value.city || '');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(value.categories || []);
  const [subFilters, setSubFilters] = useState<Record<string, string[]>>(value.subSkills || {});
  const [selectedHabitIds, setSelectedHabitIds] = useState<number[]>(value.habits || []);
  const [cityOpen, setCityOpen] = useState(false);

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

    HabitsService.getHabits()
      .then((list) => !cancelled && setHabitsCatalog(Array.isArray(list) ? list : []))
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
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
    setSelectedHabitIds((prev) => (prev.includes(habitId) ? prev.filter((id) => id !== habitId) : [...prev, habitId]));
  };

  const handleApply = () => {
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
    setSelectedСitySafe('');
    setSelectedSkills([]);
    setSelectedHabitIds([]);
    setSubFilters(resetSubFilters);
    onReset();
  };

  // helper kept separate so the reset above reads cleanly
  function setSelectedСitySafe(next: string) {
    setSelectedCity(next);
  }

  if (isLoading) {
    return <p className="py-10 text-center text-sm text-subtle">Loading filters…</p>;
  }

  const activeTags = [
    ...(selectedGender ? [{ key: 'gender', label: selectedGender, remove: () => setSelectedGender('') }] : []),
    ...(selectedCity ? [{ key: 'city', label: selectedCity, remove: () => setSelectedCity('') }] : []),
    ...selectedSkills.map((s) => ({ key: `cat-${s}`, label: getCategoryLabel(s), remove: () => toggleSkillSelection(s) })),
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
      <section>
        <p className="label-xs mb-2">Gender</p>
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
      <section>
        <p className="label-xs mb-2">Skills</p>
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
      <section>
        <p className="label-xs mb-2">City</p>
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
              {RECOMMENDED_CITIES.map((city) => (
                <li key={city}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCity(city);
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

      {/* HABITS - worker must hold every ticked habit */}
      {habitsCatalog.length > 0 && (
        <section>
          <p className="label-xs mb-2">Habits</p>
          <div className="flex flex-wrap gap-2">
            {habitsCatalog.map((habit: any) => {
              const habitId = habit.habitId ?? habit.id;
              const isActive = selectedHabitIds.includes(habitId);
              return (
                <button
                  key={habitId}
                  type="button"
                  onClick={() => toggleHabitFilter(habitId)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition',
                    isActive ? 'bg-brand text-white' : 'bg-white text-subtle ring-1 ring-line hover:bg-canvas',
                  )}
                >
                  {isActive && <Check size={13} />}
                  {habit.name ?? habit.habitName}
                </button>
              );
            })}
          </div>
          {selectedHabitIds.length > 0 && (
            <p className="mt-2 text-xs text-subtle">
              Workers must match all {selectedHabitIds.length} selected habit{selectedHabitIds.length > 1 ? 's' : ''}.
            </p>
          )}
        </section>
      )}

      {/* SUB-CATEGORIES for each selected category */}
      {selectedSkills.length > 0 && (
        <section className="space-y-4">
          <p className="label-xs">Sub-category</p>
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

