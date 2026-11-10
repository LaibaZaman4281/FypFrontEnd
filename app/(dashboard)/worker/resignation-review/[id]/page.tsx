'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CalendarClock, CheckCircle2, Hourglass, Star } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { Textarea } from '@/components/ui/Field';
import { RatingStars } from '@/components/ui/Rating';
import { Loader } from '@/components/ui/States';
import ReviewEndReason from '@/components/features/reviews/ReviewEndReason';
import NotificationHelper from '@/lib/hooks/useNotification';
import { getWorkerResignationReview, submitWorkerClientReview } from '@/lib/api/workerResignations';
import type { WorkerResignationReview } from '@/types/resignations';
import { cn } from '@/lib/utils/cn';

/**
 * Port of `assets/components/Worker/WorkerResignationReviewScreen.js`.
 *
 * The worker's side of a resignation: once the client accepts (or the seven-day
 * notice expires and the server accepts automatically), the worker can rate and
 * review that client. Exactly one review per contract — the saved review is
 * rendered read-only and the form disappears.
 *
 * Reached from a `resignation` notification, which carries the resignation id, so
 * an old resignation can never open the worker's current contract.
 */
export default function WorkerResignationReviewPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const resignationId = params?.id;

  const [data, setData] = useState<WorkerResignationReview | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const active = useRef(false);
  const version = useRef(0);
  const busy = useRef(false);

  const load = useCallback(
    async (spinner = true) => {
      if (!resignationId) return;
      const current = ++version.current;
      if (spinner) setLoading(true);
      setError('');

      try {
        const result = await getWorkerResignationReview(resignationId);
        if (!active.current || version.current !== current) return;
        setData(result);
      } catch (err) {
        if (!active.current || version.current !== current) return;
        setError(err instanceof Error ? err.message : 'This resignation could not be opened.');
      } finally {
        if (active.current && version.current === current) setLoading(false);
      }
    },
    [resignationId],
  );

  useEffect(() => {
    active.current = true;
    if (!resignationId) {
      setError('This resignation could not be opened.');
      setLoading(false);
      return () => {
        active.current = false;
      };
    }
    void load(true);

    return () => {
      active.current = false;
      version.current++;
    };
  }, [resignationId, load]);

  const submit = async () => {
    if (busy.current || !data?.canReview || data.workerReview) return;

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setError('Please choose a star rating from 1 to 5.');
      return;
    }

    busy.current = true;
    setSaving(true);
    setError('');
    const current = version.current;

    try {
      await submitWorkerClientReview(data.interviewId, rating, comment);
      if (!active.current || version.current !== current) return;

      setSaved(true);
      // The successful POST establishes these values. Lock immediately, even if
      // the follow-up refresh loses its connection.
      setData((previous) =>
        previous
          ? {
              ...previous,
              canReview: false,
              workerReview: {
                rating,
                comment: comment.trim(),
                date: new Date().toLocaleDateString(),
                endReasonType: 'Resigned',
                endReason: previous.reason,
              },
            }
          : previous,
      );
      await load(false);
    } catch (err) {
      if (!active.current || version.current !== current) return;
      setError(err instanceof Error ? err.message : 'Failed to submit your review.');
    } finally {
      busy.current = false;
      if (active.current) setSaving(false);
    }
  };

  if (loading) return <Loader label="Loading resignation…" />;

  const review = data?.workerReview;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Review Your Client" back backHref="/worker/notifications" />

      {error && (
        <div role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-xs leading-relaxed text-danger">
          {error}
          {resignationId && (
            <button type="button" onClick={() => void load(true)} className="ml-2 font-bold text-brand underline">
              Retry
            </button>
          )}
        </div>
      )}

      {saved && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
          <CheckCircle2 size={16} /> Your review has been saved.
        </div>
      )}

      {data && (
        <div className="space-y-4">
          {/* ---------- Status + who ---------- */}
          <Card>
            <p
              className={cn(
                'flex items-center gap-1.5 text-sm font-bold',
                data.isAccepted ? 'text-emerald-700' : 'text-warn',
              )}
            >
              {data.isAccepted ? <CheckCircle2 size={15} /> : <Hourglass size={15} />}
              {data.isAccepted
                ? data.acceptanceMode === 'Automatic'
                  ? 'Resignation automatically accepted'
                  : 'Resignation accepted'
                : 'Waiting for resignation acceptance'}
            </p>

            <div className="mt-4 flex items-center gap-3">
              <Avatar src={data.clientPicture} name={data.clientName} size="md" />
              <p className="min-w-0 flex-1 truncate text-lg font-bold text-ink">{data.clientName}</p>
            </div>

            {data.acceptedAtUtc && (
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-subtle">
                <CalendarClock size={12} /> Job ended: {new Date(data.acceptedAtUtc).toLocaleString()}
              </p>
            )}

            <p className="mt-4 text-xs font-semibold text-subtle">Resignation reason</p>
            <p className="mt-1 text-sm leading-relaxed text-ink">{data.reason || 'Reason not provided.'}</p>
          </Card>

          {/* ---------- Saved review ---------- */}
          {review ? (
            <Card data-testid="saved-worker-client-review">
              <h3 className="text-base font-bold text-ink">Your saved review</h3>
              <div className="mt-3 flex items-center gap-2">
                <RatingStars value={Number(review.rating) || 0} size={18} />
                <span className="text-sm font-bold text-ink">{Number(review.rating || 0).toFixed(1)}</span>
              </div>
              {review.date && <p className="mt-1 text-xs text-subtle">{review.date}</p>}
              <ReviewEndReason endType={review.endReasonType || 'Resigned'} reason={review.endReason || data.reason} />
              {review.comment && <p className="mt-3 text-sm italic text-subtle">&quot;{review.comment}&quot;</p>}
              {review.workedPeriod && <p className="mt-2 text-xs font-semibold text-brand">Worked: {review.workedPeriod}</p>}
              <p className="mt-3 text-xs text-muted">This review is saved and cannot be submitted again.</p>
            </Card>
          ) : data.canReview ? (
            /* ---------- Review form ---------- */
            <Card>
              <h3 className="text-base font-bold text-ink">How was your experience?</h3>
              <p className="mt-1 text-sm leading-relaxed text-subtle">
                Your resignation is accepted. You can review now or return to this notification later.
              </p>

              <div className="mt-4 flex items-center gap-1.5" role="group" aria-label="Rate your client from 1 to 5 stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    disabled={saving}
                    aria-label={`${star} star${star > 1 ? 's' : ''}`}
                    aria-pressed={rating === star}
                    data-testid={`client-rating-${star}`}
                    className="rounded-lg p-1 transition hover:bg-amber-50 disabled:opacity-60"
                  >
                    <Star
                      size={30}
                      className={star <= rating ? 'text-amber-500' : 'text-line'}
                      fill={star <= rating ? 'currentColor' : 'none'}
                    />
                  </button>
                ))}
              </div>

              <Textarea
                className="mt-4"
                label="Your review (optional)"
                placeholder="Write your review (optional)"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                disabled={saving}
                maxLength={4000}
                data-testid="worker-client-review-comment"
              />

              <Button className="mt-4" size="lg" fullWidth loading={saving} onClick={submit} data-testid="submit-worker-client-review">
                Submit Review
              </Button>
            </Card>
          ) : (
            <Card>
              <p className="text-sm text-subtle">You can submit your review only after this resignation is accepted.</p>
            </Card>
          )}
        </div>
      )}

      {!data && !loading && !error && (
        <Card>
          <p className="text-sm text-subtle">Nothing to review on this resignation.</p>
        </Card>
      )}

      {!data && !loading && error && (
        <Button variant="outline" onClick={() => router.push('/worker/notifications')}>
          Back to notifications
        </Button>
      )}
    </div>
  );
}
