'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getWorkerUnreadCount } from '@/lib/api/workerNotifications';

const POLL_INTERVAL_MS = 30000;

/**
 * Port of the state machine inside `WorkerNotificationBell.js`.
 *
 * Faithful details:
 *  - polls every 30s, but only while the tab is visible (RN gated on AppState)
 *  - refetches immediately when the tab becomes visible again
 *  - keeps the previously loaded count when a refresh fails and flags the error
 *    instead — it never pretends a failure means zero
 *  - a 401 is left to `apiFetch`, which clears the session and redirects
 */
export function useWorkerUnreadCount(enabled: boolean) {
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [refreshFailed, setRefreshFailed] = useState(false);

  const active = useRef(false);
  const busy = useRef(false);

  const refresh = useCallback(async () => {
    if (!active.current || busy.current) return;
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;

    busy.current = true;
    try {
      const data = await getWorkerUnreadCount();
      if (active.current) {
        setUnreadCount(data.unreadCount);
        setRefreshFailed(false);
      }
    } catch {
      // Keep a previously loaded count; never pretend an error is zero.
      if (active.current) setRefreshFailed(true);
    } finally {
      busy.current = false;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setUnreadCount(null);
      setRefreshFailed(false);
      return;
    }

    active.current = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer) clearInterval(timer);
      void refresh();
      if (typeof document === 'undefined' || document.visibilityState !== 'hidden') {
        timer = setInterval(() => void refresh(), POLL_INTERVAL_MS);
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        start();
      } else if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    start();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      active.current = false;
      if (timer) clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled, refresh]);

  return { unreadCount, refreshFailed, refresh };
}
