'use client';

/**
 * Port of `assets/components/Client/TerminateContractScreen.js`.
 *
 * Unchanged: GetWorkerDetail/{workerId} for the header card and the
 * confirmation checkbox.
 *
 * Closing review is criteria-based (matches the current backend):
 *   POST TerminateContract { InterviewId, Reason, Remarks, CriteriaScores: [{CriteriaId, Score}] }
 * The overall rating is derived server-side from the criteria scores — the old
 * single-star `Rating` field is gone from the form and the payload. Validation
 * order matches the RN screen: reason -> criteria still loading -> every
 * criterion rated -> confirmation checkbox.
 */

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { Input, Textarea } from '@/components/ui/Field';
import { Loader } from '@/components/ui/States';
import CriteriaReviewSection from '@/components/features/reviews/CriteriaReviewsSection';
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
  const [scores, setScores] = useState<Record<number, number>>({});
  const [requiredTotal, setRequiredTotal] = useState(0);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [worker, setWorker] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ratedCount = Object.values(scores).filter((v) => v > 0).length;

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

  const handleScoreChange = (criteriaId: number, score: number) =>
    setScores((prev) => ({ ...prev, [criteriaId]: score }));

  const handleTerminate = async () => {
    if (!interviewId) {
      NotificationHelper.showError(
        'Missing contract reference (interviewId). Please open this page from your active contract on the dashboard.',
      );
      return;
    }
    if (!reason.trim()) {
      NotificationHelper.showError('Please enter a termination reason');
      return;
    }
    if (requiredTotal === 0) {
      NotificationHelper.showError('Review criteria are still loading. Please wait a moment.');
      return;
    }
    if (ratedCount < requiredTotal) {
      NotificationHelper.showError(`Please rate every criterion (${ratedCount}/${requiredTotal} rated).`);
      return;
    }
    if (!isConfirmed) {
      NotificationHelper.showError('Please confirm termination by checking the box');
      return;
    }

    setIsSubmitting(true);
    try {
      await DashboardService.terminateContract({
        InterviewId: Number(interviewId),
        Reason: reason,
        Remarks: remarks,
        CriteriaScores: Object.entries(scores).map(([criteriaId, score]) => ({
          CriteriaId: Number(criteriaId),
          Score: score,
        })),
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

      {!interviewId && (
        <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          This page was opened without a contract reference. Open it from your active contract on the dashboard so the
          termination can be linked to the right interview.
        </p>
      )}

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

        {interviewId ? (
          <CriteriaReviewSection
            interviewId={Number(interviewId)}
            scores={scores}
            onScoreChange={handleScoreChange}
            onLoaded={setRequiredTotal}
          />
        ) : (
          <p className="text-sm text-subtle">Review criteria load once the page is opened with a contract reference.</p>
        )}

        <Textarea
          label="Additional remarks"
          placeholder="Add additional remarks/feedback"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />

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
    <Suspense fallback={<Loader label="Loading…" />}>
      <TerminateContract />
    </Suspense>
  );
}
