'use client';

/**
 * Port of `assets/components/Worker/AddSkillScreen.js` as rewritten in
 * frontend `a26103d`.
 *
 * The key change from the earlier version: **skills and experience are two
 * different things, stored in two different tables**, so they are collected
 * separately and submitted as two payloads:
 *
 *   skillsJson       → [{ CategoryId, SkillsId }]          → Worker_Category junction
 *   experiencesJson  → [{ WorkAt, ExpDetail, Duration }]   → Experience table
 *
 * Also ported from that rewrite:
 *  - one primary category + MANY secondary categories (was a single optional one)
 *  - per-category sub-skill cache, so each category's skills are fetched once
 *  - de-selecting a category also drops the sub-skills chosen under it
 *  - `Number(...)` coercion at every boundary (ids used to go out as strings)
 *  - save requires a primary category + at least one sub-skill chip;
 *    **experience entries are optional**
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Briefcase, BriefcaseBusiness, Car, ChefHat, Plus, Shapes, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Input } from '@/components/ui/Field';
import { EmptyState, Loader } from '@/components/ui/States';
import NotificationHelper from '@/lib/hooks/useNotification';
import { AccountService } from '@/lib/api/services';
import { cn } from '@/lib/utils/cn';

/** Row written to the Worker_Category junction table. */
export interface SkillRecord {
  CategoryId: number;
  SkillsId: number;
}

/** Row written to the Experience table. */
export interface ExperienceRecord {
  WorkAt: string;
  ExpDetail: string;
  Duration: string;
}

interface CategoryOption {
  id: number;
  name: string;
}

interface SkillOption {
  id: number;
  name: string;
}

/** Same icon mapping rules as getIconName() in the RN screen. */
function categoryIcon(name?: string) {
  const norm = name?.toLowerCase().trim() || '';
  if (norm.includes('clean')) return Briefcase;
  if (norm.includes('driv')) return Car;
  if (norm.includes('cook')) return ChefHat;
  return BriefcaseBusiness;
}

/** Same duration string the RN screen computed from the "working since" date. */
function calculateDuration(startDate: string): string {
  const start = new Date(startDate);
  const end = new Date();
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  if (years > 0 && months > 0) return `${years} Years, ${months} Months`;
  if (years > 0) return `${years} ${years === 1 ? 'Year' : 'Years'}`;
  return `${months} ${months === 1 ? 'Month' : 'Months'}`;
}

export default function SkillsBuilder({
  initialSkills = [],
  initialExperiences = [],
  onSave,
  saveLabel = 'Save and Continue',
  busy = false,
}: {
  initialSkills?: SkillRecord[];
  initialExperiences?: ExperienceRecord[];
  onSave: (skills: SkillRecord[], experiences: ExperienceRecord[], primaryCategoryId: number | null) => void;
  saveLabel?: string;
  busy?: boolean;
}) {
  const [dbCategories, setDbCategories] = useState<CategoryOption[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  /* ---- category selections ---- */
  const [primary, setPrimary] = useState<CategoryOption | null>(null);
  const [secondaryCategories, setSecondaryCategories] = useState<CategoryOption[]>([]);

  /* ---- sub-skills, cached per category ---- */
  const [subSkillsMap, setSubSkillsMap] = useState<Record<number, SkillOption[]>>({});
  const [loadingSkillsForCat, setLoadingSkillsForCat] = useState<Record<number, boolean>>({});
  const [selectedSkills, setSelectedSkills] = useState<SkillRecord[]>(initialSkills);

  /* ---- experience box (completely separate from skills) ---- */
  const [experienceList, setExperienceList] = useState<ExperienceRecord[]>(initialExperiences);
  const [workAt, setWorkAt] = useState('');
  const [description, setDescription] = useState('');
  const [dateText, setDateText] = useState('');

  const [prefilled, setPrefilled] = useState(false);

  /* ---------------- categories ---------------- */
  useEffect(() => {
    AccountService.getCategories()
      .then((data: any) => {
        if (Array.isArray(data)) {
          setDbCategories(
            data.map((c: any) => ({
              id: Number(c.categoryId ?? c.id ?? c.category_ID),
              name: c.categoryName ?? c.name ?? c.category_Name,
            })),
          );
        }
      })
      .catch(() => NotificationHelper.showError('Failed to load schema categories.'))
      .finally(() => setCategoriesLoading(false));
  }, []);

  /* ---------------- sub-skills, fetched once per category ---------------- */
  const fetchSubSkillsForCategory = useCallback(
    (catId: number) => {
      if (!catId) return;
      setLoadingSkillsForCat((prevLoading) => {
        if (prevLoading[catId]) return prevLoading;
        setSubSkillsMap((prevMap) => {
          if (prevMap[catId]) return prevMap;

          AccountService.getSkillsByCategory(catId)
            .then((data: any) => {
              if (Array.isArray(data)) {
                const formatted = data.map((item: any, index: number) => ({
                  id: Number(item.skillsId ?? item.id ?? item.SkillsId ?? index + 1),
                  name: item.skillName ?? item.name ?? item.SkillName ?? 'Skill',
                }));
                setSubSkillsMap((m) => ({ ...m, [catId]: formatted }));
              }
            })
            .catch(() => undefined)
            .finally(() => setLoadingSkillsForCat((l) => ({ ...l, [catId]: false })));

          return prevMap;
        });
        return { ...prevLoading, [catId]: true };
      });
    },
    [],
  );

  /* ---------------- edit-mode pre-fill ---------------- */
  useEffect(() => {
    if (dbCategories.length === 0 || prefilled) return;

    if (initialSkills.length > 0) {
      const catIds = [...new Set(initialSkills.map((s) => Number(s.CategoryId)))];
      const primCat = dbCategories.find((c) => c.id === catIds[0]);
      const secCats = dbCategories.filter((c) => catIds.slice(1).includes(c.id));
      if (primCat) setPrimary(primCat);
      setSecondaryCategories(secCats);
      catIds.forEach((id) => fetchSubSkillsForCategory(id));
    }

    setPrefilled(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbCategories, prefilled]);

  /* ---------------- selection handlers ---------------- */
  const selectPrimary = (cat: CategoryOption) => {
    setPrimary(cat);
    setSecondaryCategories((current) => current.filter((item) => item.id !== cat.id));
    fetchSubSkillsForCategory(cat.id);
  };

  const toggleSecondary = (cat: CategoryOption) => {
    if (secondaryCategories.some((item) => item.id === cat.id)) {
      setSecondaryCategories((current) => current.filter((item) => item.id !== cat.id));
      // de-selecting a category drops the sub-skills chosen under it
      setSelectedSkills((prev) => prev.filter((s) => s.CategoryId !== cat.id));
    } else {
      setSecondaryCategories((current) => [...current, cat]);
      fetchSubSkillsForCategory(cat.id);
    }
  };

  const toggleSkillChip = (categoryId: number, skillId: number) => {
    const exists = selectedSkills.some((s) => s.CategoryId === categoryId && s.SkillsId === skillId);
    if (exists) {
      setSelectedSkills((prev) => prev.filter((s) => !(s.CategoryId === categoryId && s.SkillsId === skillId)));
    } else {
      setSelectedSkills((prev) => [...prev, { CategoryId: categoryId, SkillsId: skillId }]);
    }
  };

  /* ---------------- experience handlers ---------------- */
  const handleAddExperience = () => {
    if (!workAt.trim() || !description.trim() || !dateText) {
      NotificationHelper.showError('Please fill all experience fields (Workplace, Role, and Date).');
      return;
    }

    setExperienceList((prev) => [
      ...prev,
      { WorkAt: workAt.trim(), ExpDetail: description.trim(), Duration: calculateDuration(dateText) },
    ]);

    setWorkAt('');
    setDescription('');
    setDateText('');
    NotificationHelper.showSuccess('Experience added to your list.');
  };

  const removeExperience = (index: number) => {
    setExperienceList((prev) => prev.filter((_, i) => i !== index));
  };

  /* ---------------- save ---------------- */
  const handleFinalSave = () => {
    if (!primary) {
      NotificationHelper.showError('Please select a Primary Category.');
      return;
    }
    if (selectedSkills.length === 0) {
      NotificationHelper.showError('Please select at least one sub-skill chip to proceed.');
      return;
    }
    // Experience is intentionally optional, matching the RN rules.
    onSave(selectedSkills, experienceList, primary.id);
  };

  const activeCategories = useMemo(
    () => [primary, ...secondaryCategories].filter(Boolean) as CategoryOption[],
    [primary, secondaryCategories],
  );

  if (categoriesLoading) return <Loader label="Loading categories…" />;

  return (
    <div className="space-y-6">
      {/* ═══════ BOX 1 — categories & sub-skills ═══════ */}
      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Shapes size={20} className="text-brand" />
          <h3 className="text-base font-bold text-ink">Select Categories &amp; Sub-Skills</h3>
        </div>

        <p className="label-xs mb-2">Primary category (select 1)</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {dbCategories.map((cat) => {
            const Icon = categoryIcon(cat.name);
            const selected = primary?.id === cat.id;
            return (
              <button
                key={`primary-${cat.id}`}
                type="button"
                onClick={() => selectPrimary(cat)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 text-sm font-semibold transition',
                  selected ? 'border-brand bg-brand text-white shadow-sm' : 'border-line bg-white text-ink hover:border-brand-border',
                )}
              >
                <Icon size={22} className={selected ? 'text-white' : 'text-brand'} />
                {cat.name}
              </button>
            );
          })}
        </div>

        <p className="label-xs mb-2 mt-5">
          Secondary categories <span className="font-medium normal-case text-subtle">(optional, select any)</span>
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {dbCategories.map((cat) => {
            const Icon = categoryIcon(cat.name);
            const selected = secondaryCategories.some((item) => item.id === cat.id);
            const disabled = primary?.id === cat.id;
            return (
              <button
                key={`secondary-${cat.id}`}
                type="button"
                disabled={disabled}
                onClick={() => toggleSecondary(cat)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 text-sm font-semibold transition disabled:opacity-30',
                  selected ? 'border-brand bg-brand text-white shadow-sm' : 'border-line bg-white text-ink hover:border-brand-border',
                )}
              >
                <Icon size={22} className={selected ? 'text-white' : 'text-brand'} />
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* sub-skill chips, one block per active category */}
        {activeCategories.length > 0 && (
          <div className="mt-6 space-y-4">
            {activeCategories.map((cat) => {
              const skills = subSkillsMap[cat.id];
              const loading = loadingSkillsForCat[cat.id] && !skills;
              return (
                <div key={`chips-${cat.id}`} className="rounded-xl border border-line bg-canvas p-4">
                  <p className="mb-2 text-sm font-bold text-ink">
                    {cat.name}
                    {primary?.id === cat.id && (
                      <span className="ml-2 rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-bold uppercase text-brand">
                        Primary
                      </span>
                    )}
                  </p>

                  {loading ? (
                    <p className="text-sm text-subtle">Loading skills…</p>
                  ) : !skills || skills.length === 0 ? (
                    <p className="text-sm text-subtle">No sub categories found for this category.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => {
                        const active = selectedSkills.some(
                          (s) => s.CategoryId === cat.id && s.SkillsId === skill.id,
                        );
                        return (
                          <button
                            key={`${cat.id}-${skill.id}`}
                            type="button"
                            onClick={() => toggleSkillChip(cat.id, skill.id)}
                            className={cn(
                              'rounded-full px-3.5 py-1.5 text-sm font-semibold transition',
                              active ? 'bg-brand text-white' : 'bg-white text-subtle ring-1 ring-line hover:bg-brand-light',
                            )}
                          >
                            {skill.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-4 text-xs font-semibold text-subtle">
          {selectedSkills.length === 0
            ? 'Select at least one sub-skill'
            : `${selectedSkills.length} sub-skill${selectedSkills.length > 1 ? 's' : ''} selected`}
        </p>
      </Card>

      {/* ═══════ BOX 2 — work experience (optional) ═══════ */}
      <Card>
        <div className="mb-1 flex items-center gap-2">
          <BriefcaseBusiness size={20} className="text-brand" />
          <h3 className="text-base font-bold text-ink">Work Experience</h3>
          <span className="rounded-full bg-canvas px-2 py-0.5 text-[10px] font-bold uppercase text-subtle">Optional</span>
        </div>
        <p className="mb-4 text-sm text-subtle">Add previous placements. You can save without any.</p>

        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Working since"
            type="date"
            max={new Date().toISOString().split('T')[0]}
            value={dateText}
            onChange={(e) => setDateText(e.target.value)}
          />
          <Input
            label="Where did you work?"
            value={workAt}
            onChange={(e) => setWorkAt(e.target.value)}
            placeholder="Employer / household"
          />
          <Input
            label="Describe your role"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What did you do?"
          />
        </div>

        <Button type="button" onClick={handleAddExperience} variant="secondary" className="mt-4" icon={<Plus size={16} />}>
          Add Experience
        </Button>

        {experienceList.length > 0 && (
          <ul className="mt-5 divide-y divide-line">
            {experienceList.map((exp, index) => (
              <li key={`${exp.WorkAt}-${index}`} className="flex items-center gap-3 py-3">
                <BriefcaseBusiness size={17} className="shrink-0 text-brand" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{exp.WorkAt}</p>
                  <p className="truncate text-xs text-subtle">
                    {exp.ExpDetail} — {exp.Duration}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeExperience(index)}
                  className="rounded-lg p-2 text-danger transition hover:bg-rose-50"
                  aria-label="Remove experience"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {experienceList.length === 0 && (
          <EmptyState title="No experience added" message="This is optional — skills alone are enough to continue." />
        )}
      </Card>

      <Button onClick={handleFinalSave} size="lg" loading={busy} fullWidth>
        {saveLabel}
      </Button>
    </div>
  );
}
