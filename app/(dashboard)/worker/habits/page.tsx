'use client';

/**
 * Port of `assets/components/Worker/MyHabitsScreen.js`.
 * Same parallel load of Habits/GetHabits + Habits/GetWorkerHabits/{workerId},
 * the same "keep at least one habit ticked" rule, the same
 * UpdateWorkerHabits body ({ workerId, habitIds }) and dirty-state tracking.
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { EmptyState, Loader } from '@/components/ui/States';
import { HabitsService } from '@/lib/api/services';
import NotificationHelper from '@/lib/hooks/useNotification';
import Storage from '@/lib/storage';
import { cn } from '@/lib/utils/cn';

export default function MyHabitsPage() {
  const router = useRouter();

  const [catalog, setCatalog] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const workerId = Storage.getItem('workerId');
      if (!workerId) {
        NotificationHelper.showError('Session not found. Please login again.');
        router.replace('/login');
        return;
      }

      const [list, mine] = await Promise.all([
        HabitsService.getHabits().catch(() => {
          NotificationHelper.showError('Could not load the habit list.');
          return [] as any[];
        }),
        HabitsService.getWorkerHabits(workerId).catch(() => null),
      ]);

      setCatalog(Array.isArray(list) ? list : []);

      const habitIds = Array.isArray((mine as any)?.habitIds) ? (mine as any).habitIds : [];
      setSelectedIds(habitIds);
      setSavedIds(habitIds);
    } catch {
      NotificationHelper.showError('Network error while loading habits.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const toggleHabit = (habitId: number) => {
    setSelectedIds((prev) => (prev.includes(habitId) ? prev.filter((id) => id !== habitId) : [...prev, habitId]));
  };

  const hasChanges = selectedIds.length !== savedIds.length || selectedIds.some((id) => !savedIds.includes(id));

  const handleSave = async () => {
    if (selectedIds.length === 0) {
      NotificationHelper.showError('Please keep at least one habit ticked.');
      return;
    }

    try {
      const workerId = Storage.getItem('workerId');
      setIsSaving(true);
      const result: any = await HabitsService.updateWorkerHabits({
        workerId: Number(workerId),
        habitIds: selectedIds,
      });

      const saved = Array.isArray(result?.habitIds) ? result.habitIds : selectedIds;
      setSelectedIds(saved);
      setSavedIds(saved);
      NotificationHelper.showSuccess(result?.message || 'Habits updated.');
      router.push('/worker/dashboard');
    } catch (error: any) {
      NotificationHelper.showError(error?.message || 'Could not save your habits.');
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
              fetchAll();
            }}
          >
            Refresh
          </Button>
        }
      />

      <Card>
        {catalog.length === 0 ? (
          <EmptyState title="Could not load the habit list." message="Check your connection and refresh." />
        ) : (
          <>
            <div className="grid gap-2 sm:grid-cols-2">
              {catalog.map((habit: any) => {
                const habitId = habit.habitId ?? habit.id;
                const isChecked = selectedIds.includes(habitId);
                return (
                  <button
                    key={habitId}
                    type="button"
                    onClick={() => toggleHabit(habitId)}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl border px-3 py-3 text-left text-sm font-semibold transition',
                      isChecked ? 'border-brand bg-brand-light text-brand' : 'border-line bg-white text-subtle hover:bg-canvas',
                    )}
                  >
                    <span className={cn('flex h-5 w-5 items-center justify-center rounded border', isChecked ? 'border-brand bg-brand text-white' : 'border-line')}>
                      {isChecked && <Check size={13} />}
                    </span>
                    {habit.name ?? habit.habitName}
                  </button>
                );
              })}
            </div>

            <p className="mt-3 text-xs font-semibold text-subtle">
              {selectedIds.length} habit{selectedIds.length === 1 ? '' : 's'} selected
            </p>

            <Button className="mt-5" size="lg" fullWidth disabled={!hasChanges} loading={isSaving} onClick={handleSave}>
              {hasChanges ? 'Save changes' : 'No changes to save'}
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
