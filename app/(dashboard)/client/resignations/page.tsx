'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Clock3, FileText, ShieldAlert } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { EmptyState, Loader } from '@/components/ui/States';
import { statusTone } from '@/lib/utils/status';
import { DashboardService } from '@/lib/api/services';
import NotificationHelper from '@/lib/hooks/useNotification';
import type { ClientResignationSummary } from '@/types/resignations';

/**
 * Port of `assets/components/Client/ResignationsScreen.js` — the *list*.
 *
 * This route previously held a duplicate of the detail page, so /client/resignations
 * read a `params.id` that cannot exist on a static segment and bounced the user
 * straight back. The backend list endpoint (GetClientResignations) was never called.
 *
 * The accepted/reviewed split is the newer workflow: a resignation can be accepted
 * automatically when its notice period expires, and "accepted" no longer means
 * "reviewed", so each row has to report both — exactly the predicate the RN list
 * uses (`needsReview = !reviewed && (canAccept || accepted)`).
 */
export default function ClientResignationsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<ClientResignationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = (await DashboardService.getClientResignations()) as ClientResignationSummary[];
      setRows(Array.isArray(data) ? data : []);
    } catch (error) {
      NotificationHelper.showError(error instanceof Error ? error.message : 'Failed to load resignations.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (isLoading) return <Loader label="Loading resignations…" />;

  return (
    <div>
      <PageHeader
        title="Resignations"
        subtitle="Notice periods your workers have served, and the reviews still owed."
        back
        backHref="/client/dashboard"
      />

      {rows.length === 0 ? (
        <Card>
          <EmptyState title="No resignations yet." icon={<FileText size={26} />} />
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((item) => {
            const accepted = typeof item.isAccepted === 'boolean' ? item.isAccepted : item.isConfirmed;
            const reviewed = typeof item.reviewSubmitted === 'boolean' ? item.reviewSubmitted : item.isConfirmed;
            const canAccept = typeof item.canAccept === 'boolean' ? item.canAccept : !accepted;
            const needsReview = !reviewed && (canAccept || accepted);

            const badgeLabel = accepted
              ? reviewed
                ? 'Completed'
                : 'Accepted · Review pending'
              : canAccept
                ? 'Needs your review'
                : 'Contract closed';

            const cta = accepted && !reviewed ? 'Review Worker' : canAccept ? 'Review & Confirm' : 'View Detail';

            return (
              <Card key={item.resignationId} className="flex flex-wrap items-center gap-4">
                <Avatar src={null} name={item.workerName} size="md" />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/client/resignations/${item.resignationId}`}
                      className="truncate text-base font-bold text-ink hover:text-brand"
                    >
                      {item.workerName}
                    </Link>
                    <span className="rounded-full bg-canvas px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-subtle">
                      {item.workerRole || 'Worker'}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ring-1 ${statusTone(
                        needsReview ? 'pending' : 'completed',
                      )}`}
                    >
                      {needsReview ? <ShieldAlert size={11} /> : <CheckCircle2 size={11} />}
                      {badgeLabel}
                    </span>
                  </div>

                  <p className="mt-1 line-clamp-2 text-sm text-subtle">{item.reason || 'Reason not provided.'}</p>

                  <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 size={11} />
                      {item.acceptedAtUtc
                        ? `Ended: ${new Date(item.acceptedAtUtc).toLocaleDateString()}`
                        : `Last Day: ${item.lastWorkingDate}`}
                    </span>
                    <span>Submitted: {item.submittedDate}</span>
                    {item.acceptanceMode === 'Automatic' && (
                      <span className="font-bold text-emerald-700">Automatically accepted</span>
                    )}
                    {item.hasWorkerReview && <span>Worker has reviewed you</span>}
                  </p>
                </div>

                <Link
                  href={`/client/resignations/${item.resignationId}`}
                  className="shrink-0 rounded-xl border border-brand-border bg-brand-light px-4 py-2 text-sm font-bold text-brand transition hover:bg-brand-border"
                >
                  {cta}
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
