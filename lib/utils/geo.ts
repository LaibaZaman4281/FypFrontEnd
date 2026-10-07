'use client';

import Storage from '@/lib/storage';
import { DashboardService } from '@/lib/api/services';

/**
 * Browser port of `assets/components/helpers/locationHelper.js`.
 *
 * RN used @react-native-community/geolocation + PermissionsAndroid; the web uses
 * navigator.geolocation, where permission is handled by the browser itself.
 *
 * NOTE: the mobile helper posted the worker position to `Dashboard/update-worker-location`,
 * a route that does not exist on the backend (it 404s). We call the real route,
 * `PUT Dashboard/UpdateWorkerLocation`, which is what the map screen already used.
 */

export function getCurrentPosition(options?: PositionOptions): Promise<GeolocationPosition | null> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000, ...options },
    );
  });
}

export async function detectAndUpdateWorkerLocation(): Promise<boolean> {
  const workerIdStr = Storage.getItem('workerId');
  if (!workerIdStr) return false;

  const position = await getCurrentPosition();
  if (!position) return false;

  const { latitude, longitude } = position.coords;
  Storage.setItem('workerLatitude', String(latitude));
  Storage.setItem('workerLongitude', String(longitude));

  try {
    await DashboardService.updateWorkerLocation({
      workerId: parseInt(workerIdStr, 10),
      latitude,
      longitude,
    });
    return true;
  } catch {
    return false;
  }
}

export async function detectAndUpdateLocation(): Promise<boolean> {
  const clientIdStr = Storage.getItem('clientId');
  if (!clientIdStr) return false;

  const position = await getCurrentPosition();
  if (!position) return false;

  const { latitude, longitude } = position.coords;
  Storage.setItem('clientLatitude', String(latitude));
  Storage.setItem('clientLongitude', String(longitude));

  try {
    await DashboardService.updateClientLocation({
      ClientId: parseInt(clientIdStr, 10),
      Latitude: latitude,
      Longitude: longitude,
    });
    return true;
  } catch {
    return false;
  }
}

/** Same Haversine the backend uses for Part-Time / Full-Time classification. */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Fallback map centre used by the RN map screen. */
export const FALLBACK_CENTER = { latitude: 33.6844, longitude: 73.0479 };
