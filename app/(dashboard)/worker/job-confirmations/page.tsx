'use client';

/**
 * Port of `assets/components/Worker/JobConfirmationScreen.js`.
 *
 * Unchanged: GetWorkerJobConfirmations, PUT WorkerAcceptJobOffer/{hiringId},
 * PUT WorkerRejectJobOffer/{hiringId}, DELETE ClientDismissWorkerRejection/{hiringId},
 * the client-name search, and the full card state machine derived from
 * `type` (offered / accepted / rejected / final / terminated) plus the
 * "unable|sorry|rejected" text test on `status`.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BriefcaseBusiness,
  CalendarRange,
  Check,
  CheckCircle2,
  MapPin,
  MessageSquare,
  RefreshCw,
  Search,
  Star,
  Tag,
  Trash2,
} from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { JobTypeBadge, ResidenceBadge, SlotTimeLabel } from '@/components/ui/Badge';
import { EmptyState, Loader } from '@/components/ui/States';
import { DashboardService } from '@/lib/api/services';
import NotificationHelper from '@/lib/hooks/useNotification';
import { cn } from '@/lib/utils/cn';

export default function JobConfirmationPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchJobConfirmations = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const data: any = await DashboardService.getWorkerJobConfirmations();
      setJobs(Array.isArray(data) ? data : []);
    } catch {
      NotificationHelper.showError('Failed to fetch job offers.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchJobConfirmations();
  }, [fetchJobConfirmations]);

  const handleAcceptJob = async (hiringId: number) => {
    try {
      await DashboardService.workerAcceptJobOffer(hiringId);
      NotificationHelper.showSuccess('Job accepted!');
      fetchJobConfirmations(false);
    } catch {
      NotificationHelper.showError('Error accepting job.');
    }
  };

  const handleRejectJob = async (hiringId: number) => {
    try {
      await DashboardService.workerRejectJobOffer(hiringId);
      NotificationHelper.showSuccess('Job offer rejected.');
      fetchJobConfirmations(false);
    } catch {
      NotificationHelper.showError('Error rejecting job.');
    }
  };

  const handleDeleteJob = async (hiringId: number) => {
    try {
      await DashboardService.clientDismissWorkerRejection(hiringId);
      NotificationHelper.showSuccess('Job request removed.');
      setJobs((prev) => prev.filter((j) => j?.id !== hiringId));
    } catch {
      NotificationHelper.showError('Failed to remove request.');
    }
  };

  const filteredJobs = jobs.filter((job) => job?.clientName?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div>
      <PageHeader
        title="Job Confirmation"
        subtitle="Offers, acceptances and closed contracts."
        action={
          <Button
            variant="outline"
            icon={<RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />}
            onClick={() => {
              setIsRefreshing(true);
              fetchJobConfirmations(false);
            }}
          >
            Refresh
          </Button>
        }
      />

      <Card className="mb-5">
        <label className="relative block">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client name"
            className="h-11 w-full rounded-xl border border-line bg-white pl-11 pr-4 text-[15px] text-ink placeholder:text-muted focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
          />
        </label>
      </Card>

      {loading ? (
        <Loader label="Loading job offers…" />
      ) : filteredJobs.length === 0 ? (
        <EmptyState title="No job offers yet." icon={<BriefcaseBusiness size={24} />} />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredJobs.map((item) => {
            const {
              id: hiringId,
              clientId,
              clientName,
              clientImage,
              clientRating,
              date,
              role,
              address,
              message,
              type,
              status,
              jobType,
              isResidenceProvided,
              slotStartTime,
              slotEndTime,
            } = item;

            const pendingWorker = type === 'offered';
            const statusLower = (status ? status.toString() : '').toLowerCase();
            const rejectedByClient =
              statusLower.includes('unable') || statusLower.includes('sorry') || statusLower.includes('rejected');
            const rejectedWorker = type === 'rejected' || rejectedByClient;
            const acceptedWorker = type === 'accepted' && !rejectedByClient;
            const finalized = type === 'final';
            const terminated = type === 'terminated';

            let accent = 'bg-brand';
            let pill = 'bg-brand-light text-brand';
            let statusHeaderText = 'Job Offer';

            if (rejectedWorker) {
              accent = 'bg-danger'; pill = 'bg-rose-100 text-rose-700'; statusHeaderText = 'Job Rejected';
            } else if (finalized) {
              accent = 'bg-success'; pill = 'bg-emerald-100 text-emerald-700'; statusHeaderText = 'Hired!';
            } else if (pendingWorker) {
              accent = 'bg-amber-500'; pill = 'bg-amber-100 text-amber-800'; statusHeaderText = 'New Job Offer';
            } else if (acceptedWorker) {
              accent = 'bg-slate-400'; pill = 'bg-slate-100 text-slate-600'; statusHeaderText = 'Accepted';
            } else if (terminated) {
              accent = 'bg-danger'; pill = 'bg-rose-100 text-rose-700'; statusHeaderText = 'Contract Terminated';
            }

            const displayStatus = rejectedWorker
              ? 'Rejected'
              : terminated
                ? 'Contract Terminated'
                : acceptedWorker
                  ? 'Accepted'
                  : status || 'Pending';

            const ratingValue = Number(clientRating) || 0;
            const hasRating = ratingValue > 0;

            const detailRows = [
              { icon: CalendarRange, label: 'Interview Date', value: date || 'Not set' },
              { icon: BriefcaseBusiness, label: 'Job Role', value: role || 'Not set' },
              { icon: Tag, label: 'Job Type', value: jobType || 'Full-Time' },
              { icon: MapPin, label: 'Address', value: address || 'Not set' },
            ];

            return (
              <Card key={hiringId} className="relative overflow-hidden pl-6">
                <span className={cn('absolute inset-y-0 left-0 w-1.5', accent)} />

                <div className="flex items-center justify-between gap-2">
                  <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold', pill)}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', accent)} />
                    {statusHeaderText}
                  </span>
                  <JobTypeBadge jobType={jobType} />
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <Avatar src={clientImage} name={clientName} size="md" />
                  <div className="min-w-0 flex-1">
                    {clientId ? (
                      <Link href={`/client/profile?clientId=${clientId}`} className="block truncate text-base font-bold text-ink hover:text-brand">
                        {clientName || 'Client Profile'}
                      </Link>
                    ) : (
                      <p className="truncate text-base font-bold text-ink">{clientName || 'Client Profile'}</p>
                    )}
                    <p className="truncate text-xs text-subtle">{pendingWorker ? 'Sent you a job offer' : displayStatus}</p>
                  </div>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold',
                      hasRating ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-subtle',
                    )}
                  >
                    <Star size={12} className={hasRating ? 'fill-amber-400 text-amber-400' : ''} />
                    {hasRating ? ratingValue.toFixed(1) : 'New'}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <ResidenceBadge isResidenceProvided={isResidenceProvided} />
                  <SlotTimeLabel startTime={slotStartTime} endTime={slotEndTime} />
                  <span className="rounded-full bg-canvas px-2.5 py-1 text-[11px] font-bold text-subtle">{displayStatus}</span>
                </div>

                <div className="my-4 divider" />

                <dl className="space-y-2">
                  {detailRows.map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-2 text-sm">
                      <Icon size={15} className="mt-0.5 shrink-0 text-brand" />
                      <dt className="w-28 shrink-0 font-semibold text-subtle">{label}</dt>
                      <dd className="min-w-0 flex-1 font-medium text-ink">{value}</dd>
                    </div>
                  ))}
                </dl>

                {message && (
                  <p className="mt-3 flex items-start gap-2 rounded-xl bg-canvas p-3 text-sm text-subtle">
                    <MessageSquare size={15} className="mt-0.5 shrink-0" />
                    {message}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-3">
                  {pendingWorker && (
                    <>
                      <Button variant="outline" onClick={() => handleRejectJob(hiringId)}>
                        Reject
                      </Button>
                      <Button variant="success" icon={<Check size={16} />} onClick={() => handleAcceptJob(hiringId)}>
                        Accept
                      </Button>
                    </>
                  )}

                  {acceptedWorker && (
                    <span className="inline-flex items-center gap-2 rounded-xl bg-slate-500 px-4 py-2.5 text-sm font-bold text-white">
                      <CheckCircle2 size={16} /> Accepted — awaiting client
                    </span>
                  )}

                  {finalized && (
                    <span className="inline-flex items-center gap-2 rounded-xl bg-success px-4 py-2.5 text-sm font-bold text-white">
                      <BriefcaseBusiness size={16} /> Hired
                    </span>
                  )}

                  {(rejectedWorker || terminated) && (
                    <Button variant="outline" className="text-danger" icon={<Trash2 size={16} />} onClick={() => handleDeleteJob(hiringId)}>
                      Delete
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
