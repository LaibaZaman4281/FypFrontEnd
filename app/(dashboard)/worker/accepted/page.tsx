'use client';

/**
 * Port of `assets/components/Worker/AcceptedRequestScreen.js`.
 * Same GetAcceptedWorkerRequests call and the same reject payload the RN screen
 * sent for this list (`{ decision: 'Rejected' }` - note it differs from the one
 * on the pending list; both are preserved as-is).
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarCheck } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { JobTypeBadge, ResidenceBadge, SlotTimeLabel } from '@/components/ui/Badge';
import { EmptyState, Loader } from '@/components/ui/States';
import { DashboardService } from '@/lib/api/services';
import NotificationHelper from '@/lib/hooks/useNotification';

export default function WorkerAcceptedRequestsPage() {
  const [acceptedRequests, setAcceptedRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAcceptedRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const data: any = await DashboardService.getAcceptedWorkerRequests();
      setAcceptedRequests(Array.isArray(data) ? data : []);
    } catch {
      NotificationHelper.showError('Failed to load accepted requests.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAcceptedRequests();
  }, [fetchAcceptedRequests]);

  const handleReject = async (id: number) => {
    try {
      await DashboardService.updateWorkerDecision(id, { decision: 'Rejected' });
      NotificationHelper.showSuccess('Request Rejected successfully.');
      setAcceptedRequests((prev) => prev.filter((r) => r.id !== id));
    } catch {
      NotificationHelper.showError('Failed to reject request.');
    }
  };

  return (
    <div>
      <PageHeader title="Accepted Requests" subtitle="Interviews you already accepted." back backHref="/worker/requests" />

      <p className="mb-4 text-sm font-bold text-ink">New Accepted Requests ({acceptedRequests.length})</p>

      {isLoading ? (
        <Loader label="Loading accepted requests…" />
      ) : acceptedRequests.length === 0 ? (
        <EmptyState title="No accepted requests found." icon={<CalendarCheck size={24} />} />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {acceptedRequests.map((item, index) => (
            <Card key={item.id ?? index}>
              <div className="flex items-center gap-3">
                <Avatar src={item.clientPicture} name={item.client} size="md" />
                <div className="min-w-0 flex-1">
                  {item.clientId ? (
                    <Link href={`/client/profile?clientId=${item.clientId}`} className="block truncate text-base font-bold text-ink hover:text-brand">
                      {item.client || 'Customer'}
                    </Link>
                  ) : (
                    <p className="truncate text-base font-bold text-ink">{item.client || 'Customer'}</p>
                  )}
                  <p className="truncate text-xs text-subtle">{item.service || 'General Service'}</p>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                  Accepted
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <JobTypeBadge jobType={item.jobType} />
                <ResidenceBadge isResidenceProvided={item.isResidenceProvided} />
                <SlotTimeLabel startTime={item.slotStartTime} endTime={item.slotEndTime} />
              </div>

              {item.address && <p className="mt-3 text-sm text-subtle">{item.address}</p>}
              {item.time && <p className="mt-1 text-xs text-subtle">{item.time}</p>}

              <Button variant="outline" className="mt-4 text-danger" fullWidth onClick={() => handleReject(item.id)}>
                Reject
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
