'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  BellRing,
  Briefcase,
  CalendarClock,
  ChevronRight,
  FileCheck2,
  FileX2,
  Loader2,
} from 'lucide-react';
import NotificationHelper from '@/lib/hooks/useNotification';
import { useWorkerUnreadCount } from '@/lib/hooks/useWorkerUnreadCount';
import {
  getWorkerNotificationDestination,
  getWorkerNotifications,
  markAllWorkerNotificationsRead,
  markWorkerNotificationRead,
} from '@/lib/api/workerNotifications';
import type { NotificationKind, WorkerNotificationItem } from '@/types/notifications';
import { cn } from '@/lib/utils/cn';

const PREVIEW_SIZE = 6;

const KINDS: Record<string, { label: string; Icon: typeof Bell; tone: string }> = {
  interview: { label: 'Interview', Icon: CalendarClock, tone: 'bg-brand-light text-brand' },
  job: { label: 'Job', Icon: Briefcase, tone: 'bg-emerald-50 text-emerald-700' },
  termination: { label: 'Termination', Icon: FileX2, tone: 'bg-rose-50 text-danger' },
  resignation: { label: 'Resignation', Icon: FileCheck2, tone: 'bg-violet-50 text-violet-700' },
};

function kindMeta(type: string | NotificationKind) {
  return KINDS[String(type)] ?? { label: 'Notification', Icon: Bell, tone: 'bg-canvas text-subtle' };
}

function receivedLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const diffMinutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffMinutes < 60 * 24) return `${Math.round(diffMinutes / 60)}h ago`;

  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

/**
 * Web presentation of `helpers/WorkerNotificationBell.js` + `WorkerNotificationsScreen.js`.
 *
 * The React Native app put a bell in the worker dashboard header that opened a
 * full screen. On the web a full screen for a glance is heavy, so the bell opens
 * a panel with the newest few and a "View all" link to /worker/notifications —
 * which is the faithful port of the screen itself.
 *
 * The *logic* is unchanged: 30s unread polling tied to tab visibility, keeping a
 * stale count on failure, marking read before navigating, and the same
 * type → destination whitelist.
 */
export default function NotificationBell() {
  const router = useRouter();
  const { unreadCount, refreshFailed, refresh } = useWorkerUnreadCount(true);

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<WorkerNotificationItem[]>([]);
  const [snapshotAtUtc, setSnapshotAtUtc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openingKey, setOpeningKey] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const version = useRef(0);

  const loadPreview = useCallback(async () => {
    const current = ++version.current;
    setLoading(true);
    setError('');
    try {
      const data = await getWorkerNotifications({ take: PREVIEW_SIZE });
      if (version.current !== current) return;
      setItems(data.items);
      setSnapshotAtUtc(data.snapshotAtUtc);
    } catch (err) {
      if (version.current !== current) return;
      setError(err instanceof Error ? err.message : 'Notifications are unavailable.');
    } finally {
      if (version.current === current) setLoading(false);
    }
  }, []);

  /* Open -> fetch the newest page. Close -> drop it so the next open is fresh. */
  useEffect(() => {
    if (!open) {
      version.current++;
      return;
    }
    void loadPreview();
  }, [open, loadPreview]);

  /* Click outside + Escape, the same affordances as the app's drawer/modal. */
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const openNotification = async (item: WorkerNotificationItem) => {
    if (openingKey || markingAll) return;
    setOpeningKey(item.key);
    try {
      // Saving read state is independent of accepting/rejecting anything.
      const result = await markWorkerNotificationRead(item.key);
      setItems((previous) =>
        previous.map((entry) =>
          entry.key === item.key ? { ...entry, isRead: true, readAtUtc: result.readAtUtc } : entry,
        ),
      );
      void refresh();

      const destination = getWorkerNotificationDestination(item);
      if (destination) {
        setOpen(false);
        router.push(destination.href);
      } else {
        NotificationHelper.showError('This notification has no available linked screen.');
      }
    } catch (error) {
      NotificationHelper.showError(error instanceof Error ? error.message : 'Could not open the notification.');
    } finally {
      setOpeningKey(null);
    }
  };

  const markAllRead = async () => {
    if (!snapshotAtUtc || markingAll) return;
    setMarkingAll(true);
    try {
      const result = await markAllWorkerNotificationsRead(snapshotAtUtc);
      setItems((previous) => previous.map((entry) => ({ ...entry, isRead: true, readAtUtc: entry.readAtUtc ?? result.readAtUtc })));
      void refresh();
    } catch (error) {
      NotificationHelper.showError(error instanceof Error ? error.message : 'Could not mark notifications read.');
    } finally {
      setMarkingAll(false);
    }
  };

  const hasUnread = (unreadCount ?? 0) > 0;
  const label = `Notifications${unreadCount === null ? '' : `, ${unreadCount} unread`}${
    refreshFailed ? '. Could not refresh' : ''
  }`;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'relative flex h-10 w-10 items-center justify-center rounded-xl transition',
          refreshFailed ? 'bg-amber-50 text-amber-700' : 'bg-brand-light text-brand hover:bg-brand-border',
        )}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        data-testid="worker-notification-bell"
      >
        {refreshFailed ? <BellRing size={19} /> : <Bell size={19} />}
        {hasUnread && (
          <span className="absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-full border-[1.5px] border-white bg-danger px-1 text-[10px] font-extrabold leading-[15px] text-white">
            {unreadCount && unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 z-40 mt-2 w-[min(92vw,384px)] overflow-hidden rounded-2xl border border-line bg-white shadow-pop"
        >
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-ink">Notifications</p>
              <p className="truncate text-[11px] text-subtle">
                {unreadCount === null ? 'Interviews, jobs, terminations & resignations' : `${unreadCount} unread`}
              </p>
            </div>
            <button
              type="button"
              onClick={markAllRead}
              disabled={!hasUnread || markingAll || loading}
              className="rounded-lg px-2 py-1 text-[11px] font-bold text-brand transition hover:bg-brand-light disabled:text-muted"
            >
              {markingAll ? 'Saving…' : 'Mark all read'}
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-subtle">
                <Loader2 size={16} className="animate-spin" /> Loading…
              </div>
            )}

            {!loading && error && (
              <div className="m-3 rounded-xl bg-rose-50 p-3 text-xs leading-relaxed text-danger">
                {error}
                <button type="button" onClick={() => void loadPreview()} className="mt-2 block font-bold text-brand">
                  Retry
                </button>
              </div>
            )}

            {!loading && !error && items.length === 0 && (
              <div className="px-6 py-10 text-center">
                <Bell size={28} className="mx-auto text-muted" />
                <p className="mt-2 text-sm font-bold text-ink">You&apos;re all caught up</p>
                <p className="mt-1 text-xs leading-relaxed text-subtle">
                  Interview requests, job updates and termination notices will appear here.
                </p>
              </div>
            )}

            {!loading &&
              !error &&
              items.map((item) => {
                const kind = kindMeta(item.type);
                const Icon = kind.Icon;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => void openNotification(item)}
                    disabled={openingKey !== null}
                    className={cn(
                      'flex w-full items-start gap-3 border-b border-line/70 px-4 py-3 text-left transition last:border-b-0 hover:bg-canvas disabled:opacity-70',
                      !item.isRead && 'bg-brand-light/40',
                    )}
                    data-testid={`notification-${item.key}`}
                  >
                    <span className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', kind.tone)}>
                      <Icon size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wide text-subtle">{kind.label}</span>
                        {!item.isRead && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
                        <span className="ml-auto text-[10px] text-muted">{receivedLabel(item.createdAtUtc)}</span>
                      </span>
                      <span className="mt-0.5 block truncate text-[13px] font-bold text-ink">{item.title}</span>
                      <span className="mt-0.5 line-clamp-2 block text-[12px] leading-snug text-subtle">{item.message}</span>
                    </span>
                    {openingKey === item.key ? (
                      <Loader2 size={15} className="mt-2 shrink-0 animate-spin text-brand" />
                    ) : (
                      <ChevronRight size={15} className="mt-2 shrink-0 text-muted" />
                    )}
                  </button>
                );
              })}
          </div>

          <Link
            href="/worker/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-line px-4 py-3 text-center text-xs font-bold text-brand transition hover:bg-brand-light"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
