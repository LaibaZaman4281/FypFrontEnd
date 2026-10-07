'use client';

/**
 * Port of `assets/components/Map/Map.js` (the authenticated save-location mode).
 *
 * Unchanged behaviour:
 *  - Worker role  -> PUT Dashboard/UpdateWorkerLocation { workerId, latitude, longitude }
 *    and caches workerLatitude / workerLongitude
 *  - Client role  -> POST Dashboard/update-location { ClientId, Latitude, Longitude }
 *    and caches clientLatitude / clientLongitude
 *  - missing token -> "Session expired. Please login again."
 *  - missing role id -> "Worker/Client ID missing. Please log in again."
 *  - nearby worker pins when the search screen passes a list
 *
 * The signup picker mode now lives inside the signup page dialog, so this route
 * only handles the logged-in case (the RN screen multiplexed both).
 */

import { Suspense, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { Crosshair, Save } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { DashboardService } from '@/lib/api/services';
import NotificationHelper from '@/lib/hooks/useNotification';
import Storage from '@/lib/storage';
import type { Coords, WorkerPin } from '@/components/features/map/LocationPicker';
import type { UserRole } from '@/types';

const LocationPicker = dynamic(() => import('@/components/features/map/LocationPicker'), { ssr: false });

function MapScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const paramLat = searchParams.get('lat');
  const paramLng = searchParams.get('lng');
  const showWorkers = searchParams.get('showWorkers') === '1';
  const paramRole = searchParams.get('role') as UserRole | null;

  const [userRole, setUserRole] = useState<UserRole>('Client');
  const [position, setPosition] = useState<Coords | null>(
    paramLat && paramLng && !Number.isNaN(parseFloat(paramLat))
      ? { latitude: parseFloat(paramLat), longitude: parseFloat(paramLng) }
      : null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [workers, setWorkers] = useState<WorkerPin[]>([]);

  useEffect(() => {
    setUserRole(paramRole || (Storage.getItem('userRole') as UserRole) || 'Client');

    if (showWorkers && typeof window !== 'undefined') {
      try {
        const raw = window.sessionStorage.getItem('mapWorkers');
        if (raw) setWorkers(JSON.parse(raw));
      } catch {
        /* ignore */
      }
    }
  }, [paramRole, showWorkers]);

  const headerTitle = userRole === 'Worker' ? 'Set Your Work Location' : 'Set Your Location';
  const headerSubtitle = userRole === 'Worker' ? 'Pin your service location' : 'Let the worker find you';

  const saveLocation = async () => {
    if (!position) return;

    const token = Storage.getItem('userToken');
    if (!token) {
      NotificationHelper.showError('Session expired. Please login again.');
      router.replace('/login');
      return;
    }

    setIsSaving(true);
    try {
      if (userRole === 'Worker') {
        const storedWorkerId = Storage.getItem('workerId');
        if (!storedWorkerId) {
          NotificationHelper.showError('Worker ID missing. Please log in again.');
          return;
        }

        await DashboardService.updateWorkerLocation({
          workerId: parseInt(storedWorkerId, 10),
          latitude: position.latitude,
          longitude: position.longitude,
        });

        Storage.setItem('workerLatitude', String(position.latitude));
        Storage.setItem('workerLongitude', String(position.longitude));
        NotificationHelper.showSuccess('Worker location saved successfully!');
        router.push('/worker/dashboard');
      } else {
        const storedClientId = Storage.getItem('clientId');
        if (!storedClientId) {
          NotificationHelper.showError('Client ID missing. Please log in again.');
          return;
        }

        await DashboardService.updateClientLocation({
          ClientId: parseInt(storedClientId, 10),
          Latitude: position.latitude,
          Longitude: position.longitude,
        });

        Storage.setItem('clientLatitude', String(position.latitude));
        Storage.setItem('clientLongitude', String(position.longitude));
        NotificationHelper.showSuccess('Your location has been saved!');
        router.push('/client/find-service');
      }
    } catch (error: any) {
      NotificationHelper.showError(error?.message || 'Network error while saving location.');
    } finally {
      setIsSaving(false);
    }
  };

  const coordsLabel = useMemo(
    () => (position ? `${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}` : '—'),
    [position],
  );

  return (
    <div>
      <PageHeader title={headerTitle} subtitle={headerSubtitle} back />

      <Card padded={false} className="overflow-hidden p-4">
        <LocationPicker value={position} onChange={setPosition} workers={workers} height={520} />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-light px-3 py-1.5 text-xs font-bold text-brand">
            <Crosshair size={13} />
            {coordsLabel}
          </span>

          <p className="text-xs text-subtle">Click the map or drag the blue dot to adjust</p>

          <Button variant="success" icon={<Save size={16} />} loading={isSaving} disabled={!position} onClick={saveLocation}>
            Save Location
          </Button>
        </div>
      </Card>

      {workers.length > 0 && (
        <p className="mt-4 text-sm text-subtle">
          Showing {workers.length} nearby worker{workers.length === 1 ? '' : 's'} in orange.
        </p>
      )}
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={null}>
      <MapScreen />
    </Suspense>
  );
}
