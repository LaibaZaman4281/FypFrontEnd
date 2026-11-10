'use client';

import { apiFetch, ApiError } from './client';
import { SERVER_BASE } from '@/lib/config';
import type {
  MarkAllReadResponse,
  MarkReadResponse,
  WorkerNotificationPage,
  WorkerNotificationItem,
  WorkerUnreadCount,
} from '@/types/notifications';

/**
 * Port of `assets/components/helpers/workerNotificationsApi.js`.
 *
 * Same base path, same query parameters, same response validation, same user
 * facing copy. The React Native helper hand-rolled its own fetch because it
 * needed a 15s timeout and very strict payload checks; we keep the checks and
 * let `apiFetch` handle the bearer token and error envelope.
 */

const BASE = `${SERVER_BASE}/api/worker/notifications`;
const TIMEOUT_MS = 15000;

export class WorkerNotificationsError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = 'WorkerNotificationsError';
    this.status = status;
  }
}

const NOT_AVAILABLE = 'Notifications are unavailable. Please try again.';
const INVALID_RESPONSE = 'The notification response was invalid. Please try again.';

async function request<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const data = await apiFetch<T>(`${BASE}${path}`, {
      method: options.method ?? 'GET',
      body: options.body,
      signal: controller.signal,
    });

    const envelope = data as unknown as Record<string, unknown> | null;
    if (!envelope || !Number.isInteger(envelope.unreadCount) || Number(envelope.unreadCount) < 0) {
      throw new WorkerNotificationsError(INVALID_RESPONSE);
    }

    return data;
  } catch (error) {
    if (error instanceof WorkerNotificationsError) throw error;
    if (error instanceof ApiError) {
      throw new WorkerNotificationsError(
        error.status === 401 ? 'Please sign in again.' : error.message || NOT_AVAILABLE,
        error.status,
      );
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new WorkerNotificationsError('The request timed out. Please try again.');
    }
    throw new WorkerNotificationsError('Could not connect. Please check your connection and retry.');
  } finally {
    clearTimeout(timer);
  }
}

export function getWorkerUnreadCount(): Promise<WorkerUnreadCount> {
  return request<WorkerUnreadCount>('/unread-count');
}

export async function getWorkerNotifications(
  { skip = 0, take = 30, snapshotAtUtc }: { skip?: number; take?: number; snapshotAtUtc?: string | null } = {},
): Promise<WorkerNotificationPage> {
  const query = `?skip=${skip}&take=${take}${
    snapshotAtUtc ? `&snapshotAtUtc=${encodeURIComponent(snapshotAtUtc)}` : ''
  }`;

  const data = await request<WorkerNotificationPage>(query);

  if (
    !Array.isArray(data.items) ||
    typeof data.snapshotAtUtc !== 'string' ||
    !Number.isInteger(data.total) ||
    data.total < 0 ||
    typeof data.hasMore !== 'boolean'
  ) {
    throw new WorkerNotificationsError('The notification list was invalid. Please try again.');
  }

  return data;
}

export function markWorkerNotificationRead(key: string): Promise<MarkReadResponse> {
  return request<MarkReadResponse>(`/${encodeURIComponent(key)}/read`, { method: 'POST' });
}

export function markAllWorkerNotificationsRead(snapshotAtUtc: string): Promise<MarkAllReadResponse> {
  return request<MarkAllReadResponse>('/read-all', {
    method: 'POST',
    body: { snapshotAtUtc },
  });
}

export type NotificationDestination = { href: string; label: string };

/**
 * Whitelist destinations and carry the exact source ID, exactly like the RN
 * helper. Tapping an old termination must never open the worker's *latest*
 * contract, so the id always travels in the URL.
 */
export function getWorkerNotificationDestination(item: WorkerNotificationItem): NotificationDestination | null {
  const id = Number(item?.sourceId);
  if (!Number.isSafeInteger(id) || id <= 0) return null;

  switch (item.type) {
    case 'interview':
      return { href: `/worker/requests?interviewId=${id}`, label: 'Open interview' };
    case 'job':
      return { href: `/worker/job-confirmations?hiringId=${id}`, label: 'Open job offer' };
    case 'termination':
      return { href: `/worker/termination?terminationId=${id}`, label: 'Open termination' };
    case 'resignation':
      return { href: `/worker/resignation-review/${id}`, label: 'Review your client' };
    default:
      return null;
  }
}
