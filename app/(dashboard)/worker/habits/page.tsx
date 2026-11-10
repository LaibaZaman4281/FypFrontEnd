'use client';

/**
 * Port of `assets/components/Worker/MyHabitsScreen.js` (non-signup mode).
 *
 * Habit logic now comes from `lib/habits.ts`, which is the single transcription of
 * the RN rules — the same module the signup step and the client filter use, so the
 * three screens can no longer drift apart:
 *
 *   - `normalizeHabitIds` (unique positive ints) applied to what the server returns
 *   - `toggleHabitSelection` — radio semantics inside an `exclusiveGroup`
 *   - `findExclusiveGroupConflict` checked before saving, exactly like RN, which
 *     matters when a pre-existing row already holds both halves of a pair
 *   - "keep at least one habit ticked"
 *   - `UpdateWorkerHabits` body `{ workerId, habitIds }`, adopting the ids the
 *     server echoes back (it may prune anything no longer selectable)
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { EmptyState, Loader } from '@/components/ui/States';
import HabitChoice from '@/components/features/habits/HabitChoice';
import {
  fetchWorkerHabitCatalog,
  fetchWorkerHabits,
  findExclusiveGroupConflict,
  HABIT_COPY,
  normalizeHabitIds,
  saveWorkerHabits,
  toggleHabitSelection,
  type HabitRow,
} from '@/lib/habits';
import NotificationHelper from '@/lib/hooks/useNotification';
import Storage from '@/lib/storage';

export default function MyHabitsPage() {
  const router = useRouter();

  const [catalog, setCatalog] = useState<HabitRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState('');

  const fetchAll = useCallback(async () => {
    const workerId = Storage.getItem('workerId');
    if (!workerId) {
      NotificationHelper.showError('Session not found. Please login again.');
      router.replace('/login');
      return;
    }

    setLoadError('');

    try {
      /* RN loads both in parallel; the catalogue failure is a toast, not a crash. */
      const [list, mine] = await Promise.all([
        fetchWorkerHabitCatalog().catch(() => {
          NotificationHelper.showError(HABIT_COPY.catalogFailed);
          return [] as HabitRow[];
        }),
        fetchWorkerHabits(workerId).catch(() => [] as number[]),
      ]);

      setCatalog(list);
      setSelectedIds(mine);
      setSavedIds(mine);
      if (list.length === 0) setLoadError(HABIT_COPY.catalogFailed);
    } catch {
      NotificationHelper.showError(HABIT_COPY.networkFailed);
      setLoadError(HABIT_COPY.networkFailed);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const toggleHabit = (habitId: number) => {
    setSelectedIds((prev) => toggleHabitSelection(prev, habitId, catalog));
  };

  const hasChanges =
    selectedIds.length !== savedIds.length || selectedIds.some((id) => !savedIds.includes(id));

  const exclusiveConflict = findExclusiveGroupConflict(selectedIds, catalog);

  const handleSave = async () => {
    /* Same two guards as RN, in the same order. */
    if (exclusiveConflict) {
      NotificationHelper.showError(HABIT_COPY.conflict);
      return;
    }
    if (selectedIds.length === 0) {
      NotificationHelper.showError(HABIT_COPY.emptySelection);
      return;
    }

    const workerId = Storage.getItem('workerId');
    if (!workerId) {
      NotificationHelper.showError('Session not found. Please login again.');
      router.replace('/login');
      return;
    }

    try {
      setIsSaving(true);
      const { message, habitIds } = await saveWorkerHabits(workerId, selectedIds);
      const saved = normalizeHabitIds(habitIds.length > 0 ? habitIds : selectedIds);
      setSelectedIds(saved);
      setSavedIds(saved);
      NotificationHelper.showSuccess(message || 'Habits updated.');
      router.push('/worker/dashboard');
    } catch (error: any) {
      NotificationHelper.showError(error?.message || HABIT_COPY.saveFailed);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <Loader label="Loading habits…" />;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="My Habits"
        subtitle="Clients filter workers by these — keep them accurate."
        back
        backHref="/worker/dashboard"
        action={
          <Button
            variant="outline"
            icon={<RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />}
            onClick={() => {
              setIsRefreshing(true);
              void fetchAll();
            }}
          >
            Refresh
          </Button>
        }
      />

      <Card>
        {catalog.length === 0 ? (
          <EmptyState
            title={loadError || HABIT_COPY.catalogFailed}
            message="Check your connection and refresh."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setIsRefreshing(true);
                  void fetchAll();
                }}
              >
                Retry
              </Button>
            }
          />
        ) : (
          <>
            <div className="grid gap-2 sm:grid-cols-2">
              {catalog.map((habit) => {
                const habitId = habit.habitId ?? habit.id;
                return (
                  <HabitChoice
                    key={habitId}
                    habit={habit}
                    selected={selectedIds.includes(Number(habitId))}
                    onToggle={() => toggleHabit(Number(habitId))}
                  />
                );
              })}
            </div>

            {exclusiveConflict && (
              <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-danger">
                {HABIT_COPY.conflict}
              </p>
            )}

            <p className="mt-3 text-xs font-semibold text-subtle">
              {selectedIds.length} habit{selectedIds.length === 1 ? '' : 's'} selected
            </p>

            <Button
              className="mt-5"
              size="lg"
              fullWidth
              disabled={!hasChanges || Boolean(exclusiveConflict)}
              loading={isSaving}
              onClick={handleSave}
            >
              {hasChanges ? 'Save changes' : 'No changes to save'}
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
