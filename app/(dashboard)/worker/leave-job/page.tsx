'use client';

/**
 * Port of `assets/components/Worker/LeaveJobScreen.js`.
 *
 * Unchanged: GetActiveJob/{workerId} (no active job -> bounce back), the two
 * validations (reason + rating), the SubmitResignation body
 * ({ InterviewId, ResignationReason, LastWorkingDate: 'YYYY-MM-DD' }), the
 * follow-up SubmitWorkerReviewToClient call whose failure is swallowed exactly
 * like the RN version, and the redirect to the worker dashboard.
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarClock } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { Input, Textarea } from '@/components/ui/Field';
import { RatingInput } from '@/components/ui/Rating';
import { Loader } from '@/components/ui/States';
import { DashboardService } from '@/lib/api/services';
import NotificationHelper from '@/lib/hooks/useNotification';
import Storage from '@/lib/storage';
import { toInputDate } from '@/lib/utils/format';

export default function LeaveJobPage() {
  const router = useRouter();

  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [jobData, setJobData] = useState<any>(null);
  const [lastWorkingDay, setLastWorkingDay] = useState(toInputDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)));
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchActiveJob = useCallback(async () => {
    try {
      const workerId = Storage.getItem('workerId');
      if (!workerId) {
        NotificationHelper.showError('Worker identity not found. Please re-login.');
        router.back();
        return;
      }

      const data = await DashboardService.getActiveJob(workerId);
      setJobData(data);
    } catch (error: any) {
      NotificationHelper.showError(error?.message || 'No active job found to resign from.');
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchActiveJob();
  }, [fetchActiveJob]);

  const handleResign = async () => {
    if (!reason.trim()) {
      NotificationHelper.showError('Please provide a reason for resignation.');
      return;
    }
    if (rating === 0) {
      NotificationHelper.showError('Please provide a rating for the client.');
      return;
    }
    if (!jobData || !jobData.interviewId) {
      NotificationHelper.showError('Process error: Job data missing.');
      return;
    }

    setSubmitting(true);
    try {
      await DashboardService.submitResignation({
        InterviewId: jobData.interviewId,
        ResignationReason: reason,
        LastWorkingDate: lastWorkingDay,
      });

      // Review is best-effort, exactly like the mobile flow
      try {
        await DashboardService.submitWorkerReviewToClient({
          InterviewId: jobData.interviewId,
          Rating: rating,
          Comment: reviewComment,
        });
      } catch {
        /* ignored */
      }

      NotificationHelper.showSuccess('Resignation submitted successfully.');
      router.push('/worker/dashboard');
    } catch (error: any) {
      NotificationHelper.showError(error?.message || 'Failed to submit resignation.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return <Loader label="Loading your active job…" />;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Resign from Job" subtitle="Give notice and leave a review for your client." back backHref="/worker/dashboard" />

      {jobData && (
        <Card className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-extrabold text-ink">{jobData.employerName}</h2>
            <p className="truncate text-sm text-subtle">{jobData.employerAddress}</p>
          </div>
          <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-warn">Standard 1-Week Notice</span>
        </Card>
      )}

      <Card className="space-y-5">
        <Textarea
          label="Reason for resignation"
          placeholder="Tell your client why you are leaving…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <Input
          label="Last working day"
          type="date"
          value={lastWorkingDay}
          min={toInputDate(new Date())}
          onChange={(e) => setLastWorkingDay(e.target.value)}
          icon={<CalendarClock size={18} />}
        />

        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Rate this client</p>
          <RatingInput value={rating} onChange={setRating} />
        </div>

        <Textarea
          label="Review comment"
          placeholder="How was working with this client? (optional)"
          value={reviewComment}
          onChange={(e) => setReviewComment(e.target.value)}
        />

        <Button variant="danger" size="lg" fullWidth loading={submitting} onClick={handleResign}>
          Submit Resignation
        </Button>
      </Card>
    </div>
  );
}
