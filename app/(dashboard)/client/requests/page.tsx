'use client';

/**
 * Port of `assets/components/Client/ActiveRequestScreen.js` ("Interview List").
 *
 * Unchanged: GetActiveRequests/{clientId}, newest-first ordering, the
 * All / Pending / Approved tabs with the same predicate, the CreateHiring body
 * ({ InterviewId, WorkerDecision:'Pending', HiringDecision:'Pending', Address }),
 * DeleteInterviewRequest, the per-row lock while a call is in flight, and the
 * full badge/subtext/action state machine.
 *
 * Bug fixed while porting: the RN file read `norm` one line before it was
 * declared (`const offerSent = norm === 'approved'` above `const norm = ...`),
 * which throws a TDZ ReferenceError as soon as a card renders. The declaration
 * order is corrected here; the logic is otherwise identical.
 */

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, FolderOpen, Search } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import Tabs from '@/components/ui/Tabs';
import { JobTypeBadge, SlotTimeLabel } from '@/components/ui/Badge';
import { EmptyState, Loader } from '@/components/ui/States';
import { DashboardService } from '@/lib/api/services';
import NotificationHelper from '@/lib/hooks/useNotification';
import Storage from '@/lib/storage';
import { cn } from '@/lib/utils/cn';

export default function ClientActiveRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [interactingIds, setInteractingIds] = useState<number[]>([]);

  const sortRequestsByInterviewIdDesc = (list: any[] = []) =>
    [...list].sort((a, b) => Number(b.interviewId || b.id || 0) - Number(a.interviewId || a.id || 0));

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const clientId = Storage.getItem('clientId');
      const data = await DashboardService.getActiveRequests(clientId ?? '');
      setRequests(sortRequestsByInterviewIdDesc(Array.isArray(data) ? data : []));
    } catch {
      NotificationHelper.showError('Failed to load requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (requestId: number, addressPayload?: string) => {
    if (interactingIds.includes(requestId)) return;
    setInteractingIds((prev) => [...prev, requestId]);

    try {
      await DashboardService.createHiring({
        InterviewId: requestId,
        WorkerDecision: 'Pending',
        HiringDecision: 'Pending',
        Address: addressPayload || '',
      });

      NotificationHelper.showSuccess('Interview Approved! Job Offer sent to worker.');
      setRequests((prev) =>
        sortRequestsByInterviewIdDesc(
          prev.map((r) => (r.interviewId === requestId ? { ...r, status: 'Approved', hiringStatus: 'Pending' } : r)),
        ),
      );
    } catch (error: any) {
      NotificationHelper.showError(error?.message || 'Failed to approve request.');
    } finally {
      setInteractingIds((prev) => prev.filter((id) => id !== requestId));
    }
  };

  const handleDelete = async (requestId: number) => {
    if (interactingIds.includes(requestId)) return;
    setInteractingIds((prev) => [...prev, requestId]);

    try {
      await DashboardService.deleteInterviewRequest(requestId);
      NotificationHelper.showSuccess('Request removed successfully.');
      setRequests((prev) => prev.filter((req) => req.interviewId !== requestId));
    } catch {
      NotificationHelper.showError('Failed to delete request.');
    } finally {
      setInteractingIds((prev) => prev.filter((id) => id !== requestId));
    }
  };

  const filteredRequests = requests.filter((item) => {
    const searchValue = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !searchValue ||
      item.workerName?.toLowerCase().includes(searchValue) ||
      item.workerSkill?.toLowerCase().includes(searchValue);
    if (!matchesSearch) return false;

    const itemStatus = (item.status || item.workerDecision || '').toString().toLowerCase().trim();
    const isResigned = itemStatus.includes('resign');
    const isTerminated = itemStatus.includes('terminate');
    const isRejected = itemStatus.includes('reject');
    const isApproved = (item.hiring?.hiringDecision ?? item.hiringStatus) === 'Accepted';
    const isFinalRecord = isApproved || isResigned || isTerminated || isRejected;

    if (activeTab === 'Pending') return !isFinalRecord;
    if (activeTab === 'Approved') return isApproved;
    return true;
  });

  return (
    <div>
      <PageHeader title="Interview List" subtitle="Requests you sent, and where each one stands." back backHref="/client/dashboard" />

      <Card className="mb-5">
        <label className="relative block">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or skills"
            className="h-11 w-full rounded-xl border border-line bg-white pl-11 pr-4 text-[15px] text-ink placeholder:text-muted focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
          />
        </label>

        <Tabs
          items={['All', 'Pending', 'Approved'].map((t) => ({ label: t, value: t }))}
          value={activeTab}
          onChange={setActiveTab}
          className="mt-4"
        />
      </Card>

      {loading ? (
        <Loader label="Loading requests…" />
      ) : filteredRequests.length === 0 ? (
        <EmptyState title="No active requests found." icon={<FolderOpen size={24} />} />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredRequests.map((item) => {
            const isProcessing = interactingIds.includes(item.interviewId);
            const workerDecision = item.workerDecision;
            const hiringDecision = item.hiring?.hiringDecision ?? item.hiringStatus;

            const rawStatus = (item.status || workerDecision || '').toString().trim();
            const norm = rawStatus.toLowerCase();
            const offerSent = norm === 'approved';

            const isResigned = norm.includes('resign');
            const isTerminated = norm.includes('terminate');
            const isRejected = norm.includes('reject');
            const isApproved = hiringDecision === 'Accepted';
            const isFinalCard = isApproved || isResigned || isTerminated;

            let badgeLabel = 'Pending';
            let badgeTone = 'bg-amber-500';
            let topTag: string | null = null;
            let topTagTone = 'text-ink';
            let subtext = 'Worker response pending';
            let subtextTone = 'text-danger';
            let canApprove = false;
            let showDelete = true;

            if (isResigned) {
              badgeLabel = 'Resigned'; badgeTone = 'bg-violet-500';
              subtext = 'Contract Resigned'; subtextTone = 'text-violet-600';
              showDelete = false;
            } else if (isTerminated) {
              badgeLabel = 'Terminated'; badgeTone = 'bg-danger';
              subtext = 'Contract Terminated'; subtextTone = 'text-danger';
              showDelete = false;
            } else if (isRejected) {
              badgeLabel = 'Cancel'; badgeTone = 'bg-slate-400';
              topTag = 'Interview Rejected';
              subtext = 'Not Available right now'; subtextTone = 'text-danger';
              showDelete = true; canApprove = false;
            } else if (isApproved) {
              badgeLabel = 'Accepted'; badgeTone = 'bg-emerald-500';
              topTag = 'Interview Accepted';
              subtext = 'Verified'; subtextTone = 'text-emerald-600';
              showDelete = false; canApprove = false;
            } else if (workerDecision === 'Accepted' && !offerSent) {
              badgeLabel = 'Pending'; badgeTone = 'bg-amber-500';
              topTag = 'Inprocess'; topTagTone = 'text-emerald-600';
              subtext = 'Awaiting your approval'; subtextTone = 'text-danger';
              canApprove = true; showDelete = true;
            } else if (workerDecision === 'Accepted' && offerSent) {
              badgeLabel = 'Approved'; badgeTone = 'bg-emerald-500';
              topTag = 'Job Offer Sent'; topTagTone = 'text-emerald-600';
              subtext = 'Waiting for worker to accept'; subtextTone = 'text-brand';
              canApprove = false; showDelete = false;
            } else {
              topTag = 'Inprocess'; topTagTone = 'text-emerald-600';
              subtext = 'Worker response pending'; subtextTone = 'text-danger';
              showDelete = true;
            }

            return (
              <Card key={item.interviewId}>
                {topTag && (
                  <p className={cn('mb-3 flex items-center gap-1.5 text-xs font-bold', topTagTone)}>
                    {topTagTone.includes('emerald') && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                    {topTag}
                  </p>
                )}

                <div className="flex gap-4">
                  <Avatar src={item.workerImage} name={item.workerName} size="md" />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-base font-bold text-ink">{item.workerName || 'Worker Profile'}</h3>
                      <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white', badgeTone)}>
                        {badgeLabel}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <JobTypeBadge jobType={item.jobType} />
                      <SlotTimeLabel startTime={item.slotStartTime} endTime={item.slotEndTime} />
                    </div>

                    <p className="mt-2 text-sm font-semibold text-subtle">{item.workerSkill || 'General'}</p>
                    <p className={cn('text-xs font-bold', subtextTone)}>{subtext}</p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {isProcessing ? (
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                    ) : (
                      <>
                        {isFinalCard ? null : workerDecision === 'Accepted' && offerSent ? (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-white">
                            <CheckCircle2 size={14} /> Accepted
                          </span>
                        ) : canApprove ? (
                          <Button size="sm" onClick={() => handleApprove(item.interviewId, item.address)}>
                            Approve
                          </Button>
                        ) : (
                          <Button size="sm" disabled>
                            Approve
                          </Button>
                        )}

                        {showDelete && (
                          <Button size="sm" variant="danger" onClick={() => handleDelete(item.interviewId)}>
                            Delete
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
