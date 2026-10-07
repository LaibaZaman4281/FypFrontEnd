'use client';

import toast from 'react-hot-toast';

/**
 * Web port of `assets/components/Notification/NotificationHelper.js`.
 * Same two methods, same copy, same optional onHide callback.
 */
const NotificationHelper = {
  showSuccess: (message = 'Task Completed Successfully!', onHide?: (() => void) | null) => {
    toast.success(message, { duration: 3000 });
    if (onHide) setTimeout(onHide, 350);
  },
  showError: (message = 'Something went wrong. Please try again.', onHide?: (() => void) | null) => {
    toast.error(message, { duration: 4000 });
    if (onHide) setTimeout(onHide, 350);
  },
};

export default NotificationHelper;
export const useNotification = () => NotificationHelper;
