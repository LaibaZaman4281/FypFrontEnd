'use client';

/**
 * Port of the current `assets/components/Worker/LeaveJobScreen.js` (resignation
 * workflow v2).
 *
 * What changed versus the first web port: the old screen collected a rating and
 * sent a `SubmitWorkerReviewToClient` call alongside `SubmitResignation`. In v2
 * the review is *not* part of resigning — it only becomes possible after the
 * client accepts (or the seven-day notice expires), and it is then submitted
 * from `/worker/resignation-review/[id]`. Sending it here fails and is silently
 * swallowed, so the worker believed a review had been filed when it had not.
 *
 * Unchanged from RN: `getActiveResignationJob` (which also refuses an older
 * backend), the seven-day notice copy, the pending state with the automatic
 * acceptance date, and returning to the dashboard after a successful submit.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CalendarClock, Clock3, Info } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { Textarea } from '@/components/ui/Field';
import { Loader } from '@/components/ui/States';
import { getActiveResignationJob, submitResignation } from '@/lib/api/workerResignations';
import NotificationHelper from '@/lib/hooks/useNotification';
import Storage from '@/lib/storage';

interface ActiveJob {
  interviewId?: number;
  employerName?: string;
  employerAddress?: string;
  isResignationPending?: boolean;
  noticeEndsAtUtc?: string | null;
  resignationWorkflowVersion?: number;
}

function formatWhen(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
}

export default function LeaveJobPage() {
  const router = useRouter();

  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [job, setJob] = useState<ActiveJob | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const busy = useRef(false);
  const active = useRef(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const workerId = Storage.getItem('workerId');
      if (!workerId) {
        NotificationHelper.showError('Worker identity not found. Please re-login.');
        return;
      }

      const data = await getActiveResignationJob(workerId);
      if (!active.current) return;
      setJob(data as ActiveJob);
    } catch (err: any) {
      if (!active.current) return;
      /* apiFetch already cleared the session and redirected on a 401. */
      setError(err?.message || 'No active job found to resign from.');
    } finally {
      if (active.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    active.current = true;
    void load();
    return () => {
      active.current = false;
    };
  }, [load]);

  const pending = job?.isResignationPending === true;

  const handleResign = async () => {
    if (busy.current || pending || !job?.interviewId) return;

    if (!reason.trim()) {
      setError('Please provide a reason for resignation.');
      return;
    }

    busy.current = true;
    setSubmitting(true);
    setError('');

    try {
      await submitResignation(job.interviewId, reason);
      if (!active.current) return;
      NotificationHelper.showSuccess('Resignation submitted. You can review your client after acceptance.');
      setJob((prev) => ({ ...prev, isResignationPending: true }));
      router.push('/worker/dashboard');
    } catch (err: any) {
      if (!active.current) return;
      setError(err?.message || 'Failed to submit resignation.');
    } finally {
      busy.current = false;
      if (active.current) setSubmitting(false);
    }
  };

  if (isLoading) return <Loader label="Loading your active job…" />;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Resign from Job" subtitle="Give notice and leave on good terms." back backHref="/worker/dashboard" />

      {error && (
        <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
          <p className="text-sm font-semibold text-danger">{error}</p>
          {!job && (
            <Button size="sm" variant="ghost" onClick={() => void load()}>
              Retry
            </Button>
          )}
        </div>
      )}

      {job && (
        <Card className="mb-5">
          <h2 className="truncate text-lg font-extrabold text-ink">{job.employerName}</h2>
          <p className="truncate text-sm text-subtle">{job.employerAddress}</p>

          <span className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-light px-3 py-1.5 text-xs font-bold text-brand">
            <CalendarClock size={13} /> 7-Day Notice
          </span>
          <p className="mt-2 text-sm text-subtle">
            Your notice starts when you submit. You stay on this job until the Client accepts your
            resignation or the seven days expire.
          </p>
        </Card>
      )}

      {job && pending && (
        <Card>
          <p className="flex items-center gap-2 text-base font-extrabold text-ink">
            <Clock3 size={17} className="text-warn" /> Resignation already pending
          </p>
          <p className="mt-2 text-sm text-subtle">
            You are still working during the notice period. Your review becomes available after
            acceptance.
          </p>
          {job.noticeEndsAtUtc ? (
            <p className="mt-1.5 text-sm text-subtle">Automatic acceptance: {formatWhen(job.noticeEndsAtUtc)}</p>
          ) : (
            <p className="mt-1.5 text-sm text-subtle">This older resignation requires the Client’s manual acceptance.</p>
          )}
          <Link
            href="/worker/notifications"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:underline"
          >
            Open notifications
          </Link>
        </Card>
      )}

      {job && !pending && (
        <Card className="space-y-5">
          <Textarea
            label="Reason for Leaving"
            placeholder="Please explain why you are leaving…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={submitting}
          />

          <p className="flex items-start gap-2 rounded-xl bg-canvas px-3 py-2.5 text-[13px] leading-relaxed text-subtle">
            <Info size={15} className="mt-0.5 shrink-0 text-brand" />
            No rating or review is required now. After acceptance, your notification bell will let
            you review your Client.
          </p>

          <Button variant="danger" size="lg" fullWidth loading={submitting} onClick={handleResign}>
            Submit Resignation
          </Button>
        </Card>
      )}
    </div>
  );
}
