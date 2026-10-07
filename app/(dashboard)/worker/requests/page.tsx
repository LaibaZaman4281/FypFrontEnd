'use client';

/**
 * Port of `assets/components/Worker/ActiveRequestsScreen.js`.
 * Same GetWorkerRequests call, the same PUT UpdateWorkerDecision/{id} with
 * `{ workerDecision }`, optimistic removal of the row, pull-to-refresh replaced
 * by a Refresh button, and the link across to the accepted list.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Inbox, RefreshCw, Star } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { JobTypeBadge, ResidenceBadge, SlotTimeLabel } from '@/components/ui/Badge';
import { EmptyState, Loader } from '@/components/ui/States';
import { DashboardService } from '@/lib/api/services';
import NotificationHelper from '@/lib/hooks/useNotification';
import { cn } from '@/lib/utils/cn';

export default function WorkerActiveRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchRequests = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const data: any = await DashboardService.getWorkerRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      NotificationHelper.showError('Failed to load requests.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleStatusUpdate = async (id: number, decision: 'Accepted' | 'Rejected') => {
    try {
      await DashboardService.updateWorkerDecision(id, { workerDecision: decision });
      NotificationHelper.showSuccess(`Request ${decision}!`);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch {
      NotificationHelper.showError('Failed to update status.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Active Requests"
        subtitle="Clients who want to interview you."
        action={
          <>
            <Button
              variant="outline"
              icon={<RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />}
              onClick={() => {
                setIsRefreshing(true);
                fetchRequests(false);
              }}
            >
              Refresh
            </Button>
            <Link href="/worker/accepted">
              <Button variant="secondary">Goto Accepted</Button>
            </Link>
          </>
        }
      />

      <p className="mb-4 text-sm font-bold text-ink">New Booking Requests ({requests.length})</p>

      {isLoading ? (
        <Loader label="Loading requests…" />
      ) : requests.length === 0 ? (
        <EmptyState title="No pending requests." icon={<Inbox size={24} />} />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {requests.map((item, index) => {
            const ratingValue = Number(item.clientRating) || 0;
            const hasRating = ratingValue > 0;

            return (
              <Card key={item.id ?? index}>
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-brand-light px-3 py-1 text-xs font-bold text-brand">
                    {item.service || 'General Service'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-subtle">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" />
                    {item.time || 'Just now'}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <Avatar src={item.clientPicture} name={item.client} size="md" />
                  <div className="min-w-0 flex-1">
                    {item.clientId ? (
                      <Link
                        href={`/client/profile?clientId=${item.clientId}`}
                        className="block truncate text-base font-bold text-ink hover:text-brand"
                      >
                        {item.client || 'Customer'}
                      </Link>
                    ) : (
                      <p className="truncate text-base font-bold text-ink">{item.client || 'Customer'}</p>
                    )}
                    <p className="truncate text-xs text-subtle">Wants to interview you</p>
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
                  <JobTypeBadge jobType={item.jobType} />
                  <ResidenceBadge isResidenceProvided={item.isResidenceProvided} />
                  <SlotTimeLabel startTime={item.slotStartTime} endTime={item.slotEndTime} />
                </div>

                {item.address && <p className="mt-3 text-sm text-subtle">{item.address}</p>}

                <div className="mt-4 flex gap-3">
                  <Button variant="success" fullWidth onClick={() => handleStatusUpdate(item.id, 'Accepted')}>
                    Accept
                  </Button>
                  <Button variant="outline" fullWidth className="text-danger" onClick={() => handleStatusUpdate(item.id, 'Rejected')}>
                    Reject
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
