/**
 * Direct port of the React Native app's `AsyncStorage` usage.
 *
 * AsyncStorage is async in RN, localStorage is sync in the browser. The async
 * call sites had already been wrapped in `await`, which is harmless on a promise
 * returning immediately — so the shapes are preserved one-for-one and the keys are
 * byte-identical to the mobile app's (`userToken`, `userRole`, `clientId`, ...).
 *
 * Everything is guarded with `typeof window` so importing this module from a
 * server component never throws.
 */

const isBrowser = () => typeof window !== 'undefined' && !!window.localStorage;

/** Every key this app writes. Used by clearSession so logout is exhaustive. */
export const SESSION_KEYS = [
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
] as const;

/**
 * Keys that describe *this* browser's working state rather than the identity.
 * They are cleared on logout too: leaving a stale worker array or a half-filled
 * profile draft behind would leak the previous user's session into the next one.
 */
export const SCRATCH_KEYS = ['rememberMe', 'editProfileDraft', 'mapWorkers', 'clientFilters', 'userId'] as const;

export interface LoginSessionPayload {
  token?: string | null;
  role?: string | null;
  name?: string | null;
  picture?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  clientId?: number | string | null;
  workerId?: number | string | null;
  companyId?: number | string | null;
  policeId?: number | string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

const Storage = {
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
      /* quota / private mode — matches AsyncStorage's silent failure */
    }
  },

  removeItem(key: string): void {
    if (!isBrowser()) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },

  multiSet(pairs: [string, string][]): void {
    pairs.forEach(([key, value]) => Storage.setItem(key, value));
  },

  multiRemove(keys: string[]): void {
    keys.forEach((key) => Storage.removeItem(key));
  },

  /** Clears the identity, the cached coordinates and this browser's scratch state. */
  clearSession(): void {
    Storage.multiRemove([...SESSION_KEYS, ...SCRATCH_KEYS]);
  },

  /**
   * Writes the whole session in one place. Before this existed the same eleven
   * `setItem` calls were inlined in the login screen, so nothing else in the app
   * could ever refresh them — which is how a saved profile edit used to be
   * silently reverted by the next screen that read `userName`.
   */
  saveLoginSession(result: LoginSessionPayload, rememberMe = false): void {
    const pairs: [string, string][] = [
      ['userToken', result.token || ''],
      ['userRole', result.role || ''],
      ['userName', result.name || ''],
      ['userPicture', result.picture || ''],
      ['userAddress', result.address || ''],
      ['userPhone', result.phone || ''],
      ['userEmail', result.email || ''],
    ];

    if (result.clientId != null) pairs.push(['clientId', String(result.clientId)]);
    if (result.workerId != null) pairs.push(['workerId', String(result.workerId)]);
    if (result.companyId != null) pairs.push(['companyId', String(result.companyId)]);
    if (result.policeId != null) pairs.push(['policeId', String(result.policeId)]);

    // The backend only projects coordinates for Clients, so this is a no-op for
    // the other roles rather than a wrong write.
    if (result.latitude != null) pairs.push(['clientLatitude', String(result.latitude)]);
    if (result.longitude != null) pairs.push(['clientLongitude', String(result.longitude)]);

    Storage.multiSet(pairs);
    Storage.setItem('rememberMe', rememberMe ? 'true' : 'false');
  },

  /**
   * Refreshes the display identity after a profile edit. Only touches the keys
   * that came back, so a partial projection cannot blank the others.
   */
  applyProfileToSession(profile: {
    name?: string | null;
    phone?: string | null;
    address?: string | null;
    email?: string | null;
    picture?: string | null;
  }): void {
    const pairs: [string, string][] = [];
    if (profile.name) pairs.push(['userName', profile.name]);
    if (profile.phone) pairs.push(['userPhone', profile.phone]);
    if (profile.address) pairs.push(['userAddress', profile.address]);
    if (profile.email) pairs.push(['userEmail', profile.email]);
    if (profile.picture) pairs.push(['userPicture', profile.picture]);
    if (pairs.length) Storage.multiSet(pairs);
  },
};

/**
 * Async-shaped aliases, so ported `await AsyncStorage.getItem(...)` code stays literal.
 */
export const AsyncStorage = {
  getItem: async (key: string) => Storage.getItem(key),
  setItem: async (key: string, value: string) => Storage.setItem(key, value),
  multiSet: async (pairs: [string, string][]) => Storage.multiSet(pairs),
  removeItem: async (key: string) => Storage.removeItem(key),
  multiRemove: async (keys: string[]) => Storage.multiRemove(keys),
  clear: async () => Storage.clearSession(),
};

export default Storage;
