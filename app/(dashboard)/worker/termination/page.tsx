'use client';

/**
 * Port of `assets/components/Worker/WorkerTerminationScreen.js`.
 * Same GetLatestTermination/{workerId} call, the same "rating required" rule,
 * the same SubmitWorkerReviewToClient body ({ InterviewId, Rating, Comment }),
 * and the same one-shot lock once a review exists.
 */

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, FileWarning } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { Textarea } from '@/components/ui/Field';
import { RatingInput } from '@/components/ui/Rating';
import { EmptyState, Loader } from '@/components/ui/States';
import { DashboardService } from '@/lib/api/services';
import NotificationHelper from '@/lib/hooks/useNotification';
import Storage from '@/lib/storage';

export default function WorkerTerminationPage() {
  const [termination, setTermination] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchTerminationStatus = useCallback(async () => {
    try {
      const workerId = Storage.getItem('workerId');
      const data: any = await DashboardService.getLatestTermination(workerId ?? '');
      setTermination(data);
      setReviewSubmitted(!!data?.workerReviewSubmitted);
    } catch {
      /* same as RN: logged and ignored */
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTerminationStatus();
  }, [fetchTerminationStatus]);

  const handleSubmitReview = async () => {
    if (rating === 0) {
      NotificationHelper.showError('Please provide a star rating for the client.');
      return;
    }

    setSubmitting(true);
    try {
      await DashboardService.submitWorkerReviewToClient({
        InterviewId: termination?.interviewId,
        Rating: rating,
        Comment: reviewComment,
      });
      NotificationHelper.showSuccess('Your review has been submitted successfully!');
      setReviewSubmitted(true);
    } catch (error: any) {
      NotificationHelper.showError(error?.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return <Loader label="Loading termination status…" />;

  if (!termination) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Termination Status" back backHref="/worker/dashboard" />
        <EmptyState title="No termination on record" message="Your contracts are all in good standing." icon={<FileWarning size={24} />} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Termination Status" back backHref="/worker/dashboard" />

      <Card className="mb-5 border-rose-200 bg-rose-50/50">
        <div className="flex items-center gap-4">
          <Avatar src={termination.clientPicture} name={termination.clientName} size="md" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-bold text-ink">{termination.clientName}</h2>
            <p className="truncate text-sm text-subtle">{termination.clientAddress || termination.address}</p>
          </div>
          <span className="shrink-0 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
            {termination.status || 'Terminated'}
          </span>
        </div>

        <dl className="mt-4 space-y-1 border-t border-rose-200/70 pt-3 text-sm">
          {termination.date && (
            <div className="flex gap-2">
              <dt className="font-bold text-ink">Date:</dt>
              <dd className="text-subtle">{termination.date}</dd>
            </div>
          )}
          {termination.reason && (
            <div className="flex gap-2">
              <dt className="font-bold text-ink">Reason:</dt>
              <dd className="text-subtle">{termination.reason}</dd>
            </div>
          )}
        </dl>
      </Card>

      <Card>
        <h2 className="text-base font-bold text-ink">Review this client</h2>

        {reviewSubmitted ? (
          <p className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
            <CheckCircle2 size={16} /> Your review has already been submitted.
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-subtle">Your feedback appears on the client&apos;s public profile.</p>
            <div className="mt-4">
              <RatingInput value={rating} onChange={setRating} />
            </div>
            <Textarea
              className="mt-4"
              label="Comment"
              placeholder="How was working with this client? (optional)"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
            />
            <Button className="mt-4" size="lg" loading={submitting} onClick={handleSubmitReview}>
              Submit Review
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
