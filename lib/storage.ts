'use client';

/**
 * Browser replacement for `@react-native-async-storage/async-storage`.
 *
 * The key names are IDENTICAL to the mobile app so the session shape, the
 * role-based IDs and every consumer screen keep working unchanged:
 *   userToken, userRole, userName, userPicture, userAddress, userPhone, userEmail,
 *   clientId, workerId, companyId, policeId,
 *   clientLatitude, clientLongitude, workerLatitude, workerLongitude
 *
 * AsyncStorage is async in RN, localStorage is sync in the browser. The async
 * signatures are kept so ported screen code reads the same as the original.
 */

const isBrowser = () => typeof window !== 'undefined';

export const Storage = {
  getItem(key: string): string | null {
    if (!isBrowser()) return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  setItem(key: string, value: string): void {
    if (!isBrowser()) return;
    try {
      window.localStorage.setItem(key, value ?? '');
    } catch {
      /* quota / private mode - ignore, same as AsyncStorage failing silently */
    }
  },

  multiSet(pairs: [string, string][]): void {
    pairs.forEach(([k, v]) => Storage.setItem(k, v));
  },

  removeItem(key: string): void {
    if (!isBrowser()) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },

  multiRemove(keys: string[]): void {
    keys.forEach((k) => Storage.removeItem(k));
  },

  clearSession(): void {
    Storage.multiRemove([
      'userToken',
      'userRole',
      'userName',
      'userPicture',
      'userAddress',
      'userPhone',
      'userEmail',
      'clientId',
      'workerId',
      'companyId',
      'policeId',
      'clientLatitude',
      'clientLongitude',
      'workerLatitude',
      'workerLongitude',
    ]);
  },
};

/** Async-shaped aliases, so ported `await AsyncStorage.getItem(...)` code stays literal. */
export const AsyncStorage = {
  getItem: async (key: string) => Storage.getItem(key),
  setItem: async (key: string, value: string) => Storage.setItem(key, value),
  multiSet: async (pairs: [string, string][]) => Storage.multiSet(pairs),
  removeItem: async (key: string) => Storage.removeItem(key),
  multiRemove: async (keys: string[]) => Storage.multiRemove(keys),
};

export default Storage;
