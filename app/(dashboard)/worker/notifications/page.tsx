'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  BellOff,
  Briefcase,
  CalendarClock,
  ChevronRight,
  FileCheck2,
  FileX2,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import NotificationHelper from '@/lib/hooks/useNotification';
import {
  getWorkerNotificationDestination,
  getWorkerNotifications,
  markAllWorkerNotificationsRead,
  markWorkerNotificationRead,
} from '@/lib/api/workerNotifications';
import type { NotificationKind, WorkerNotificationItem } from '@/types/notifications';
import { cn } from '@/lib/utils/cn';

/**
 * Port of `assets/components/Worker/WorkerNotificationsScreen.js`.
 *
 * Preserved exactly: the 30-item page size, the `snapshotAtUtc` cursor that keeps
 * pagination stable while new notifications arrive, de-duplication by `key`,
 * "mark read then navigate" (opening a notification never accepts or rejects
 * anything), the whitelisted destinations, the per-item unread styling, and the
 * failure rule that a broken refresh keeps the previous data on screen.
 *
 * Changed only in presentation: a FlatList becomes a list with a Load more button,
 * pull-to-refresh becomes a Refresh button, and SafeAreaView becomes the AppShell.
 */

const PAGE_SIZE = 30;

const KINDS: Record<string, { label: string; Icon: typeof Bell; tone: string }> = {
  interview: { label: 'Interview', Icon: CalendarClock, tone: 'bg-brand-light text-brand' },
  job: { label: 'Job', Icon: Briefcase, tone: 'bg-emerald-50 text-emerald-700' },
  termination: { label: 'Termination', Icon: FileX2, tone: 'bg-rose-50 text-danger' },
  resignation: { label: 'Resignation', Icon: FileCheck2, tone: 'bg-violet-50 text-violet-700' },
};

function kindMeta(type: string | NotificationKind) {
  return KINDS[String(type)] ?? { label: 'Notification', Icon: Bell, tone: 'bg-canvas text-subtle' };
}

function receivedDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
}

export default function WorkerNotificationsPage() {
  const router = useRouter();

  const [items, setItems] = useState<WorkerNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [openingKey, setOpeningKey] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const active = useRef(false);
  const requestVersion = useRef(0);
  const moreBusy = useRef(false);
  const actionBusy = useRef(false);
  const page = useRef<{ skip: number; hasMore: boolean; snapshotAtUtc: string | null }>({
    skip: 0,
    hasMore: false,
    snapshotAtUtc: null,
  });

  const loadFirst = useCallback(async (showSpinner = false) => {
    if (actionBusy.current) return;
    const version = ++requestVersion.current;
    moreBusy.current = false;
    setLoadingMore(false);
    if (showSpinner) setLoading(true);
    else setRefreshing(true);
    setLoadError('');
    setActionError('');

    try {
      const data = await getWorkerNotifications({ take: PAGE_SIZE });
      if (!active.current || requestVersion.current !== version) return;
      setItems(data.items);
      setUnreadCount(data.unreadCount);
      setHasMore(data.hasMore);
      page.current = { skip: data.items.length, hasMore: data.hasMore, snapshotAtUtc: data.snapshotAtUtc };
    } catch (error) {
      if (!active.current || requestVersion.current !== version) return;
      setLoadError(error instanceof Error ? error.message : 'Notifications are unavailable.');
    } finally {
      if (active.current && requestVersion.current === version) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    active.current = true;
    void loadFirst(true);

    /* Returning to the tab refetches, matching RN's AppState listener. */
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void loadFirst(false);
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      active.current = false;
      requestVersion.current++;
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [loadFirst]);

  const loadMore = async () => {
    if (moreBusy.current || actionBusy.current || loading || refreshing || !page.current.hasMore) return;

    const version = requestVersion.current;
    moreBusy.current = true;
    setLoadingMore(true);

    try {
      const data = await getWorkerNotifications({
        skip: page.current.skip,
        take: PAGE_SIZE,
        snapshotAtUtc: page.current.snapshotAtUtc,
      });
      if (!active.current || requestVersion.current !== version) return;

      setItems((previous) => [...new Map([...previous, ...data.items].map((item) => [item.key, item])).values()]);
      setUnreadCount(data.unreadCount);
      setHasMore(data.hasMore);
      page.current = { ...page.current, skip: page.current.skip + data.items.length, hasMore: data.hasMore };
      setLoadError('');
    } catch (error) {
      if (active.current && requestVersion.current === version) {
        setLoadError(error instanceof Error ? error.message : 'Could not load more notifications.');
      }
    } finally {
      moreBusy.current = false;
      if (active.current) setLoadingMore(false);
    }
  };

  const openNotification = async (item: WorkerNotificationItem) => {
    if (actionBusy.current || moreBusy.current || refreshing) return;
    actionBusy.current = true;
    setOpeningKey(item.key);
    setActionError('');

    try {
      // Saving read state is independent of accepting/rejecting a job or interview.
      const data = await markWorkerNotificationRead(item.key);
      if (!active.current) return;

      setItems((previous) =>
        previous.map((entry) => (entry.key === item.key ? { ...entry, isRead: true, readAtUtc: data.readAtUtc } : entry)),
      );
      setUnreadCount(data.unreadCount);

      const destination = getWorkerNotificationDestination(item);
      if (destination) router.push(destination.href);
      else setActionError('This notification has no available linked screen. It remains in your history.');
    } catch (error) {
      if (active.current) setActionError(error instanceof Error ? error.message : 'Could not open the notification.');
    } finally {
      actionBusy.current = false;
      if (active.current) setOpeningKey(null);
    }
  };

  const markAllRead = async () => {
    if (actionBusy.current || moreBusy.current || refreshing || !page.current.snapshotAtUtc) return;
    actionBusy.current = true;
    setMarkingAll(true);
    setActionError('');

    try {
      const data = await markAllWorkerNotificationsRead(page.current.snapshotAtUtc);
      if (!active.current) return;
      setItems((previous) =>
        previous.map((entry) => ({ ...entry, isRead: true, readAtUtc: entry.readAtUtc || data.readAtUtc })),
      );
      setUnreadCount(data.unreadCount);
    } catch (error) {
      if (active.current) setActionError(error instanceof Error ? error.message : 'Could not mark notifications read.');
    } finally {
      actionBusy.current = false;
      if (active.current) setMarkingAll(false);
    }
  };

  const busy = openingKey !== null || markingAll || loadingMore;

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={
          unreadCount === null
            ? 'Interviews, jobs, terminations & resignations'
            : `${unreadCount} unread · Interviews, jobs, terminations & resignations`
        }
        back
        backHref="/worker/dashboard"
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-subtle">All notifications</p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw size={14} />}
            onClick={() => void loadFirst(false)}
            disabled={refreshing || loading}
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </Button>
          <Button
            size="sm"
            onClick={markAllRead}
            disabled={unreadCount === null || unreadCount === 0 || loading || refreshing || loadingMore || markingAll}
          >
            {markingAll ? 'Saving…' : 'Mark all read'}
          </Button>
        </div>
      </div>

      {(loadError || actionError) && (
        <div role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-xs leading-relaxed text-danger">
          {actionError || loadError}
          {loadError && (
            <button type="button" onClick={() => void loadFirst(false)} className="ml-2 font-bold text-brand underline">
              Retry
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-subtle">
          <Loader2 size={18} className="animate-spin" /> Loading notifications…
        </div>
      ) : items.length === 0 && !loadError ? (
        <Card className="py-14 text-center">
          <BellOff size={40} className="mx-auto text-muted" />
          <p className="mt-3 text-base font-bold text-ink">You&apos;re all caught up</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-subtle">
            Interview requests, job updates and termination notices will appear here. Read notifications stay in your
            history.
          </p>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => {
            const kind = kindMeta(item.type);
            const Icon = kind.Icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => void openNotification(item)}
                disabled={busy || refreshing}
                className={cn(
                  'flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition disabled:opacity-70',
                  item.isRead
                    ? 'border-line bg-white hover:bg-canvas'
                    : 'border-brand-border bg-brand-light/50 hover:bg-brand-light',
                )}
                data-testid={`notification-${item.key}`}
                aria-label={`${item.isRead ? 'Read' : 'Unread'} ${kind.label}: ${item.title}. ${item.message}`}
              >
                <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', kind.tone)}>
                  <Icon size={20} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wide text-subtle">{kind.label}</span>
                    {item.isRead ? (
                      <span className="text-[10px] text-muted">Read</span>
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                    )}
                  </span>
                  <span className="mt-1 block text-sm font-bold text-ink">{item.title}</span>
                  <span className="mt-1 line-clamp-3 block text-[13px] leading-relaxed text-subtle">{item.message}</span>
                  <span className="mt-2 block text-[11px] text-muted">{receivedDate(item.createdAtUtc)}</span>
                </span>

                {openingKey === item.key ? (
                  <Loader2 size={16} className="mt-3 shrink-0 animate-spin text-brand" />
                ) : (
                  <ChevronRight size={16} className="mt-3 shrink-0 text-muted" />
                )}
              </button>
            );
          })}

          {hasMore ? (
            <div className="pt-2 text-center">
              <Button variant="outline" loading={loadingMore} onClick={() => void loadMore()} disabled={busy || refreshing}>
                Load more
              </Button>
            </div>
          ) : (
            <p className="pt-3 text-center text-[11px] leading-relaxed text-muted">
              Opening a notification marks it read, not accepted or rejected.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
