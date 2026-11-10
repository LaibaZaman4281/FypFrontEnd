/**
 * Compatibility re-export.
 *
 * The unread-count hook lives in `useWorkerUnreadCount.ts`. This module keeps the
 * older import path working so both of these resolve:
 *
 *   import { useWorkerUnreadCount } from '@/lib/hooks/useWorkerUnreadCount';
 *   import { useWorkerUnreadCount } from '@/lib/hooks/useWorkerNotifications';
 */
export { useWorkerUnreadCount } from './useWorkerUnreadCount';
