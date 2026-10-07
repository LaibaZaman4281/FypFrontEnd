'use client';

/**
 * Port of `assets/components/Client/InterviewSelectionScreen.js`.
 *
 * Preserved: the `GetWorkerAvailableSlots/{workerId}?date=YYYY-MM-DD` call on
 * every date change, the part-time banner (radius + distance), the residence
 * toggle for full-time bookings, the slot requirement for part-time bookings,
 * the exact BookInterview body (WorkerId, InterviewDate as local ISO without
 * timezone, Address, Status 'Pending', SlotId, IsResidenceProvided) and the
 * redirect to the client dashboard on success.
 */

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { CalendarDays, Clock4, Home, MapPin } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import Toggle from '@/components/ui/Toggle';
import { Input } from '@/components/ui/Field';
import { API_DASHBOARD } from '@/lib/config';
import { apiFetch } from '@/lib/api/client';
import NotificationHelper from '@/lib/hooks/useNotification';
import Storage from '@/lib/storage';
import { cn } from '@/lib/utils/cn';
import { jobTypeLabel } from '@/lib/utils/status';

const toDateKey = (value: Date) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface Slot {
  id: number;
  startTime: string;
  endTime: string;
}

function InterviewSelection() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const workerId = params.id;
  const workerName = searchParams.get('name') || 'this worker';

  const now = new Date();
  const [dateKey, setDateKey] = useState(toDateKey(now));
  const [timeValue, setTimeValue] = useState(
    `${`${now.getHours()}`.padStart(2, '0')}:${`${now.getMinutes()}`.padStart(2, '0')}`,
  );

  const [isLoading, setIsLoading] = useState(false);
  const [clientAddress, setClientAddress] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [hasSlots, setHasSlots] = useState(true);
  const [isPartTime, setIsPartTime] = useState(false);
  const [isResidenceProvided, setIsResidenceProvided] = useState(false);
  const [radius, setRadius] = useState<number | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);

  const submittingRef = useRef(false);

  useEffect(() => {
    const addr = Storage.getItem('userAddress');
    if (addr) setClientAddress(addr);
  }, []);

  const fetchSlots = useCallback(async () => {
    try {
      setSlotsLoading(true);
      const data: any = await apiFetch(`${API_DASHBOARD}/GetWorkerAvailableSlots/${workerId}?date=${dateKey}`);
      setSlots(Array.isArray(data?.slots) ? data.slots : []);
      setHasSlots(!!data?.hasSlots);
      setIsPartTime(!!data?.isPartTimeAvailable);
      setRadius(data?.radius ?? null);
      setDistanceKm(data?.distanceKm ?? null);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [workerId, dateKey]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  useEffect(() => {
    setSelectedSlotId(null);
  }, [dateKey]);

  const selectedSlot = slots.find((slot) => slot.id === selectedSlotId) || null;
  const bookingBlockedBySlots = isPartTime && !slotsLoading && (!hasSlots || slots.length === 0);
  const needsSlot = isPartTime && !bookingBlockedBySlots;
  const canConfirm = !isLoading && !slotsLoading && !bookingBlockedBySlots && (!needsSlot || !!selectedSlot);

  const handleConfirmInterview = async () => {
    if (submittingRef.current) return;

    if (bookingBlockedBySlots) {
      NotificationHelper.showError('This worker has not published any time slots yet.');
      return;
    }
    if (needsSlot && !selectedSlot) {
      NotificationHelper.showError("Please pick one of the worker's time slots.");
      return;
    }

    submittingRef.current = true;
    setIsLoading(true);

    try {
      // Same local-ISO (no timezone suffix) format the mobile app sent
      const [hours, minutes] = timeValue.split(':').map(Number);
      const composed = new Date(`${dateKey}T00:00:00`);
      composed.setHours(hours || 0, minutes || 0, 0, 0);
      const offset = composed.getTimezoneOffset() * 60000;
      const localISOTime = new Date(composed.getTime() - offset).toISOString().slice(0, 19);

      const data: any = await apiFetch(`${API_DASHBOARD}/BookInterview`, {
        method: 'POST',
        body: {
          WorkerId: workerId,
          InterviewDate: localISOTime,
          Address: clientAddress,
          Status: 'Pending',
          SlotId: isPartTime && selectedSlot ? selectedSlot.id : null,
          IsResidenceProvided: !isPartTime ? isResidenceProvided : false,
        },
      });

      const typeLabel = data?.jobType ? jobTypeLabel(data.jobType) : '';
      const slotLabel = isPartTime && selectedSlot ? ` (${selectedSlot.startTime} - ${selectedSlot.endTime})` : '';

      NotificationHelper.showSuccess(`${typeLabel} interview request sent to ${workerName}${slotLabel}!`);
      router.replace('/client/dashboard');
    } catch (error: any) {
      NotificationHelper.showError(error?.message || 'Failed to book interview.');
    } finally {
      submittingRef.current = false;
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Select Date & Time" subtitle={`When do you need to interview ${workerName}?`} back />

      {isPartTime && (
        <Card className="mb-5 border-amber-200 bg-amber-50">
          <div className="flex flex-wrap items-center gap-2">
            <MapPin size={16} className="text-warn" />
            <span className="text-xs font-extrabold uppercase tracking-wide text-warn">Part-time booking</span>
            {distanceKm !== null && <span className="text-xs font-semibold text-amber-800">{distanceKm} km away</span>}
          </div>
          <p className="mt-2 text-sm text-amber-900">
            You are inside this worker&apos;s {radius ?? 5} km radius.
            {hasSlots
              ? ' Pick the time window you need the worker for from the list below.'
              : ' This worker has not published time slots yet.'}
          </p>
        </Card>
      )}

      <div className="space-y-5">
        <Card>
          <h2 className="mb-4 text-base font-bold text-ink">Interview schedule</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Interview Date"
              type="date"
              value={dateKey}
              min={toDateKey(new Date())}
              onChange={(e) => setDateKey(e.target.value)}
              icon={<CalendarDays size={18} />}
            />
            <Input
              label="Preferred Time"
              type="time"
              value={timeValue}
              onChange={(e) => setTimeValue(e.target.value)}
              icon={<Clock4 size={18} />}
              disabled={isPartTime}
              hint={isPartTime ? 'Part-time bookings use the worker’s published slot' : undefined}
            />
          </div>

          <Input
            label="Interview Address"
            value={clientAddress}
            onChange={(e) => setClientAddress(e.target.value)}
            icon={<Home size={18} />}
            className="mt-4"
            hint="Defaults to the address on your profile."
          />
        </Card>

        {isPartTime ? (
          <Card>
            <h2 className="mb-1 text-base font-bold text-ink">Available time slots</h2>
            <p className="mb-4 text-sm text-subtle">Slots are checked against this date — booked windows disappear.</p>

            {slotsLoading ? (
              <p className="text-sm text-subtle">Loading slots…</p>
            ) : slots.length === 0 ? (
              <p className="rounded-xl bg-rose-50 p-4 text-sm font-semibold text-danger">
                This worker has not published any time slots yet.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {slots.map((slot) => {
                  const active = selectedSlotId === slot.id;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedSlotId(slot.id)}
                      className={cn(
                        'flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition',
                        active ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink hover:border-brand-border',
                      )}
                    >
                      <Clock4 size={16} className={active ? 'text-white' : 'text-brand'} />
                      {slot.startTime} - {slot.endTime}
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        ) : (
          <Card>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-ink">Residence provided</h2>
                <p className="mt-0.5 text-sm text-subtle">
                  Turn this on if the worker will live at your residence (full-time hiring only).
                </p>
              </div>
              <Toggle checked={isResidenceProvided} onChange={setIsResidenceProvided} label="Residence provided" />
            </div>
          </Card>
        )}

        <Button size="lg" fullWidth loading={isLoading} disabled={!canConfirm} onClick={handleConfirmInterview}>
          Confirm Interview Request
        </Button>
      </div>
    </div>
  );
}

export default function InterviewSelectionPage() {
  return (
    <Suspense fallback={null}>
      <InterviewSelection />
    </Suspense>
  );
}
