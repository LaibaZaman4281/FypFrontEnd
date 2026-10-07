'use client';

/**
 * Port of `assets/components/Client/ResignationsScreen.js`.
 * Same GetClientResignations call, refresh-on-focus behaviour (re-run on mount
 * and via the Refresh button), and the "Completed" vs "Needs your review" state.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CalendarClock, CheckCircle2, ChevronRight, FileText, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { EmptyState, Loader } from '@/components/ui/States';
import { DashboardService } from '@/lib/api/services';
import { cn } from '@/lib/utils/cn';

export default function ResignationsPage() {
  const [resignations, setResignations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchResignations = useCallback(async () => {
    try {
      const data: any = await DashboardService.getClientResignations();
      setResignations(Array.isArray(data) ? data : []);
    } catch {
      /* same as RN: logged and ignored */
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchResignations();
  }, [fetchResignations]);

  return (
    <div>
      <PageHeader
        title="Worker Resignations"
        subtitle="Notices your workers submitted, and the ones waiting on you."
        back
        backHref="/client/dashboard"
        action={
          <Button
            variant="outline"
            icon={<RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />}
            onClick={() => {
              setIsRefreshing(true);
              fetchResignations();
            }}
          >
            Refresh
          </Button>
        }
      />

      {isLoading ? (
        <Loader label="Loading resignations…" />
      ) : resignations.length === 0 ? (
        <EmptyState title="No resignations submitted" message="When a worker resigns, their notice will appear here." icon={<FileText size={24} />} />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {resignations.map((item) => (
            <Card key={item.resignationId}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-bold text-ink">{item.workerName}</h3>
                  <p className="truncate text-sm text-subtle">{item.workerRole}</p>
                </div>
                <span className="shrink-0 rounded-full bg-canvas px-2.5 py-1 text-[11px] font-bold text-subtle">
                  {item.submittedDate}
                </span>
              </div>

              <div className="mt-4">
                <p className="label-xs mb-1">Reason for leaving</p>
                <p className="line-clamp-2 text-sm text-subtle">{item.reason}</p>
              </div>

              <span
                className={cn(
                  'mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold',
                  item.isConfirmed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-warn',
                )}
              >
                {item.isConfirmed ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                {item.isConfirmed ? 'Completed' : 'Needs your review'}
              </span>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-subtle">
                  <CalendarClock size={16} className="text-rose-500" />
                  Last Day: {item.lastWorkingDate}
                </span>

                <Link href={`/client/resignations/${item.resignationId}`}>
                  <Button size="sm" icon={<ChevronRight size={16} />}>
                    {item.isConfirmed ? 'View Detail' : 'Review & Confirm'}
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
