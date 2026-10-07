'use client';

/**
 * Port of `assets/components/Client/WorkerDecisionScreen.js`.
 *
 * Unchanged: GetClientWorkerDecisions, the FinalizeHiringDecision body
 * ({ HiringId, HiringDecision: 'Accepted' }), the refetch after finalising, the
 * name/skill search, and the accepted / rejected / pending card states with the
 * same copy ("Worker Accepted!", "…is excited to start.", etc.).
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCheck, MessageCircleQuestion, Search, UserCheck, UserMinus, UserX } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { JobTypeBadge, SlotTimeLabel } from '@/components/ui/Badge';
import { EmptyState, Loader } from '@/components/ui/States';
import { DashboardService } from '@/lib/api/services';
import NotificationHelper from '@/lib/hooks/useNotification';
import { formatDate } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

export default function WorkerDecisionsPage() {
  const [decisions, setDecisions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  const fetchDecisions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data: any = await DashboardService.getClientWorkerDecisions();
      setDecisions(Array.isArray(data) ? data : []);
    } catch {
      NotificationHelper.showError('Failed to fetch decision tracking records.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDecisions();
  }, [fetchDecisions]);

  const handleFinalizeHiring = async (hiringId: number) => {
    setSubmittingId(hiringId);
    try {
      await DashboardService.finalizeHiringDecision({ HiringId: hiringId, HiringDecision: 'Accepted' });
      NotificationHelper.showSuccess('Hiring decision finalized successfully.');
      await fetchDecisions();
    } catch {
      NotificationHelper.showError('Failed to update final hiring state.');
    } finally {
      setSubmittingId(null);
    }
  };

  const filteredDecisions = decisions.filter(
    (item) =>
      item.workerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.workerSkill?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div>
      <PageHeader title="Worker Decision" subtitle="Job offers your workers have responded to." back backHref="/client/dashboard" />

      <Card className="mb-5">
        <label className="relative block">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Worker name"
            className="h-11 w-full rounded-xl border border-line bg-white pl-11 pr-4 text-[15px] text-ink placeholder:text-muted focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
          />
        </label>
      </Card>

      {isLoading ? (
        <Loader label="Loading decisions…" />
      ) : filteredDecisions.length === 0 ? (
        <EmptyState
          title="No pending active worker job offer decisions located."
          icon={<MessageCircleQuestion size={24} />}
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredDecisions.map((item) => {
            const isAccepted = item.workerDecision === 'Accepted';
            const isRejected = item.workerDecision === 'Rejected';
            const isFinalized = item.hiringDecision === 'Accepted';
            const canFinalize = isAccepted && item.hiringDecision === 'Pending';

            return (
              <Card
                key={item.hiringId}
                className={cn(
                  isAccepted && 'border-emerald-200 bg-emerald-50/40',
                  isRejected && 'border-rose-200 bg-rose-50/40',
                )}
              >
                <p
                  className={cn(
                    'mb-3 text-sm font-extrabold',
                    isAccepted ? 'text-emerald-700' : isRejected ? 'text-danger' : 'text-warn',
                  )}
                >
                  {isAccepted ? 'Worker Accepted!' : isRejected ? 'Worker Rejected!' : 'Offer Pending'}
                </p>

                <div className="flex gap-4">
                  <Avatar src={item.workerImage} name={item.workerName} size="md" />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-bold text-ink">{item.workerName}</h3>

                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <JobTypeBadge jobType={item.jobType} />
                      <SlotTimeLabel startTime={item.slotStartTime} endTime={item.slotEndTime} />
                    </div>

                    <span
                      className={cn(
                        'mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold',
                        isAccepted
                          ? 'bg-emerald-100 text-emerald-800'
                          : isRejected
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800',
                      )}
                    >
                      {isAccepted ? <UserCheck size={13} /> : isRejected ? <UserX size={13} /> : <UserMinus size={13} />}
                      {isAccepted ? 'Acceptance Confirm' : isRejected ? 'Rejected' : 'Offer Pending'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-1 border-t border-line pt-3 text-sm text-subtle">
                  {item.hiringDate && (
                    <p>
                      <span className="font-bold text-ink">Decision Date: </span>
                      {formatDate(item.hiringDate)}
                    </p>
                  )}
                  <p>
                    <span className="font-bold text-ink">Job Role</span>: {item.workerSkill}
                  </p>
                  <p>
                    <span className="font-bold text-ink">Address</span>: {item.address}
                  </p>
                  <p className="pt-1 italic">
                    {isAccepted
                      ? `${item.workerName} is excited to start.`
                      : isRejected
                        ? `${item.workerName} has chosen another offer. Your other workers are below.`
                        : 'Awaiting worker response.'}
                  </p>
                </div>

                {canFinalize && (
                  <div className="mt-4 flex justify-end">
                    <Button loading={submittingId === item.hiringId} onClick={() => handleFinalizeHiring(item.hiringId)}>
                      Confirm
                    </Button>
                  </div>
                )}

                {isFinalized && (
                  <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-800">
                    <CheckCheck size={16} /> Hiring Handshake Finalized
                  </p>
                )}

                {isRejected && (
                  <div className="mt-4 flex justify-end">
                    <Link href="/client/find-service">
                      <Button variant="outline">View Other Worker</Button>
                    </Link>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
