'use client';

/**
 * Port of `assets/components/Client/TerminateContractScreen.js`.
 *
 * Unchanged: GetWorkerDetail/{workerId} for the header card, the three
 * validations (reason required, rating required, confirmation checkbox), the
 * TerminateContract body ({ InterviewId, Reason, Remarks, Rating }) and the
 * redirect back to the client dashboard.
 */

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { Input, Textarea } from '@/components/ui/Field';
import { RatingInput } from '@/components/ui/Rating';
import { Loader } from '@/components/ui/States';
import { DashboardService } from '@/lib/api/services';
import NotificationHelper from '@/lib/hooks/useNotification';

function TerminateContract() {
  const router = useRouter();
  const params = useParams<{ workerId: string }>();
  const searchParams = useSearchParams();

  const workerId = params.workerId;
  const interviewId = searchParams.get('interviewId');

  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [rating, setRating] = useState(0);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [worker, setWorker] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchWorkerDetails = useCallback(async () => {
    try {
      const data = await DashboardService.getWorkerDetail(workerId);
      setWorker(data);
    } catch {
      NotificationHelper.showError('Failed to load worker details');
    } finally {
      setIsLoading(false);
    }
  }, [workerId]);

  useEffect(() => {
    fetchWorkerDetails();
  }, [fetchWorkerDetails]);

  const handleTerminate = async () => {
    if (!reason.trim()) {
      NotificationHelper.showError('Please enter a termination reason');
      return;
    }
    if (rating === 0) {
      NotificationHelper.showError('Please provide a rating for the worker');
      return;
    }
    if (!isConfirmed) {
      NotificationHelper.showError('Please confirm termination by checking the box');
      return;
    }

    setIsSubmitting(true);
    try {
      await DashboardService.terminateContract({
        InterviewId: interviewId ? Number(interviewId) : null,
        Reason: reason,
        Remarks: remarks,
        Rating: rating,
      });
      NotificationHelper.showSuccess('Contract terminated successfully');
      router.push('/client/dashboard');
    } catch (error: any) {
      NotificationHelper.showError(error?.message || 'Termination failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <Loader label="Loading contract…" />;
  if (!worker) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Terminate Contract" subtitle="Closing a contract also records your final review." back />

      <Card className="mb-5 flex items-center gap-4">
        <Avatar src={worker.picture} name={worker.name} size="lg" />
        <div className="min-w-0">
          <h2 className="truncate text-lg font-extrabold text-ink">{worker.name}</h2>
          <p className="truncate text-sm text-subtle">{worker.categoryName || worker.role || 'Hired Worker'}</p>
        </div>
      </Card>

      <Card className="space-y-5">
        <Input
          label="Termination reason"
          placeholder="Why are you ending this contract?"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <Textarea
          label="Additional remarks"
          placeholder="Anything else worth recording (optional)…"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />

        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Rate this worker</p>
          <RatingInput value={rating} onChange={setRating} />
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-rose-50 p-4">
          <input
            type="checkbox"
            checked={isConfirmed}
            onChange={(e) => setIsConfirmed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-rose-300 text-danger focus:ring-danger/30"
          />
          <span className="text-sm text-rose-900">
            <span className="flex items-center gap-1.5 font-bold">
              <AlertTriangle size={15} /> I confirm this termination
            </span>
            This closes the contract permanently and publishes your review to the worker&apos;s profile.
          </span>
        </label>

        <Button variant="danger" size="lg" fullWidth loading={isSubmitting} onClick={handleTerminate}>
          Terminate Contract
        </Button>
      </Card>
    </div>
  );
}

export default function TerminateContractPage() {
  return (
    <Suspense fallback={null}>
      <TerminateContract />
    </Suspense>
  );
}
