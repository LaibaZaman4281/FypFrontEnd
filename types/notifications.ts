/**
 * Worker notification shapes.
 *
 * These mirror `WorkerNotificationsController` exactly (ASP.NET Core serialises
 * camelCase): GET /api/worker/notifications, /unread-count, POST /{key}/read,
 * POST /read-all.
 */

export type NotificationKind = 'interview' | 'job' | 'termination' | 'resignation';

export interface WorkerNotificationItem {
  key: string;
  type: NotificationKind | string;
  sourceId: number;
  interviewId: number | null;
  title: string;
  message: string;
  createdAtUtc: string;
  readAtUtc: string | null;
  isRead: boolean;
}

export interface WorkerNotificationPage {
  items: WorkerNotificationItem[];
  unreadCount: number;
  total: number;
  hasMore: boolean;
  snapshotAtUtc: string;
}

export interface WorkerUnreadCount {
  unreadCount: number;
}

export interface MarkReadResponse {
  unreadCount: number;
  readAtUtc: string | null;
}

export interface MarkAllReadResponse {
  unreadCount: number;
  readAtUtc: string | null;
}
