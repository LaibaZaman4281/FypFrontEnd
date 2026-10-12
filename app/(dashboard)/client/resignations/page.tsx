'use client';

/**
 * Port of `assets/components/Client/ResignationScreen.js`.
 *
 * Unchanged: GetResignationDetail/{id}, the notice-period progress bar, the
 * worker's review of the client, and the "remarks are required" rule.
 *
 * Closing review is criteria-based (matches the current backend):
 *   POST ConfirmResignation { InterviewId, Comment, CriteriaScores: [{CriteriaId, Score}] }
 * The overall rating is derived server-side from the criteria scores — the old
 * single-star `Rating` field is gone from the form and the payload. Every
 * criterion returned by GetReviewCriteria must be rated before submit.
 * Confirmed resignations become read-only with the saved review, exactly like
 * the mobile screen.
 */

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Briefcase, CalendarCheck, CheckCircle2, FileText, Lock, Quote } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { Textarea } from '@/components/ui/Field';
import { RatingStars } from '@/components/ui/Rating';
import { Loader } from '@/components/ui/States';
import CriteriaBreakdown from '@/components/features/reviews/CriteriaBreakdown';
import CriteriaReviewSection from '@/components/features/reviews/CriteriaReviewsSection';
import { DashboardService } from '@/lib/api/services';
import NotificationHelper from '@/lib/hooks/useNotification';

export default function ResignationDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const resignationId = params.id;

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [requiredTotal, setRequiredTotal] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isConfirmed = data?.isConfirmed === true;
  const shownRating = data?.clientReview?.rating ?? 0;
  const ratedCount = Object.values(scores).filter((v) => v > 0).length;

  const fetchResignationDetail = useCallback(async () => {
    try {
      const json = await DashboardService.getResignationDetail(resignationId);
      setData(json);
    } catch {
      NotificationHelper.showError('Failed to load details.');
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [resignationId, router]);

  useEffect(() => {
    if (!resignationId) {
      NotificationHelper.showError('This resignation could not be opened.');
      router.back();
      return;
    }
    fetchResignationDetail();
  }, [resignationId, fetchResignationDetail, router]);

  const handleScoreChange = (criteriaId: number, score: number) =>
    setScores((prev) => ({ ...prev, [criteriaId]: score }));

  const handleConfirmResignation = async () => {
    if (!remarks.trim()) {
      NotificationHelper.showError('Please enter some remarks before confirming.');
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

    setIsSubmitting(true);
    try {
      await DashboardService.confirmResignation({
        InterviewId: data.interviewId,
        Comment: remarks,
        CriteriaScores: Object.entries(scores).map(([criteriaId, score]) => ({
          CriteriaId: Number(criteriaId),
          Score: score,
        })),
      });
      NotificationHelper.showSuccess('Resignation confirmed. Your review of the worker was saved.');
      router.push('/client/resignations');
    } catch (error: any) {
      NotificationHelper.showError(error?.message || 'Failed to confirm.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <Loader label="Loading resignation…" />;
  if (!data) return null;

  const progressPercent = Math.min(Math.max((data.progress || 0) * 100, 0), 100);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Resignation" back backHref="/client/resignations" />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* ---- Who is resigning ---- */}
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-4">
            <Avatar src={data.workerAvatar} name={data.workerName} size="lg" />
            <div className="min-w-0">
              <h2 className="truncate text-lg font-extrabold text-ink">{data.workerName}</h2>
              <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-brand-light px-2.5 py-1 text-xs font-bold text-brand">
                <Briefcase size={13} />
                {data.workerRole}
              </span>
            </div>
          </div>
        </Card>

        {/* ---- Notice period ---- */}
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between bg-brand px-5 py-4 text-white">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-white/75">Official Notice Period</p>
              <p className="text-lg font-extrabold">{data.totalNoticeDays} Days Total</p>
            </div>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold">{data.remainingDays} left</span>
          </div>
          <div className="px-5 py-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-semibold text-subtle">Notice Period Status</span>
              <span className="text-subtle">
                Remaining Days: <span className="font-bold text-brand">{data.remainingDays}</span>
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-brand" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </Card>

        {/* ---- Dates & reason ---- */}
        <Card>
          <div className="flex gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
              <CalendarCheck size={17} />
            </span>
            <div>
              <p className="label-xs">Last Working Day</p>
              <p className="text-sm font-bold text-ink">{data.lastWorkingDate}</p>
            </div>
          </div>

          <div className="my-4 divider" />

          <div className="flex gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
              <FileText size={17} />
            </span>
            <div>
              <p className="label-xs">Reason for Leaving</p>
              <p className="text-sm text-subtle">{data.reason}</p>
            </div>
          </div>
        </Card>

        {/* ---- Worker's review of the client ---- */}
        {data.workerReview && (
          <Card className="lg:col-span-2">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-light text-brand">
                <Quote size={14} />
              </span>
              <h3 className="truncate text-sm font-bold text-ink">{data.workerName}&apos;s review of you</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <RatingStars value={data.workerReview.rating} size={16} />
              <span className="text-sm font-bold text-ink">{Number(data.workerReview.rating || 0).toFixed(1)}</span>
              <span className="text-xs text-subtle">· {data.workerReview.date}</span>
            </div>
            {data.workerReview.comment && (
              <p className="mt-2 text-sm italic text-subtle">&quot;{data.workerReview.comment}&quot;</p>
            )}
            <CriteriaBreakdown criteria={data.workerReview.criteria} />
            {data.workerReview.workedPeriod && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand">
                <Briefcase size={12} /> Worked: {data.workerReview.workedPeriod}
              </p>
            )}
          </Card>
        )}

        {/* ---- Your review ---- */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-ink">Your Review</h3>
            {isConfirmed && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                <CheckCircle2 size={13} /> Saved
              </span>
            )}
          </div>

          {isConfirmed ? (
            <div>
              <div className="flex items-center gap-2">
                <RatingStars value={shownRating} size={18} />
                <span className="text-sm font-bold text-ink">{Number(shownRating || 0).toFixed(1)}</span>
                {data.clientReview?.date && (
                  <span className="text-xs text-subtle">· {data.clientReview.date}</span>
                )}
              </div>
              {data.clientReview?.comment && (
                <p className="mt-3 text-sm italic text-subtle">&quot;{data.clientReview.comment}&quot;</p>
              )}
              <CriteriaBreakdown criteria={data.clientReview?.criteria} />
              <p className="mt-3 inline-flex items-start gap-1.5 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">
                <Lock size={13} className="mt-0.5 shrink-0" />
                <span>
                  You confirmed this resignation
                  {data.clientReview?.date ? ` on ${data.clientReview.date}` : ''}. Your rating of {data.workerName} is
                  saved and can no longer be changed.
                </span>
              </p>
            </div>
          ) : (
            <>
              <p className="mb-3 text-sm text-subtle">
                Rate each criterion for {data.workerName}, then write your remarks.
              </p>
              <CriteriaReviewSection
                interviewId={data.interviewId}
                scores={scores}
                onScoreChange={handleScoreChange}
                onLoaded={setRequiredTotal}
              />
              <Textarea
                className="mt-4"
                label="Remarks"
                placeholder="Enter your remarks here"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
              <Button className="mt-4" size="lg" loading={isSubmitting} onClick={handleConfirmResignation}>
                Confirm Resignation
              </Button>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
