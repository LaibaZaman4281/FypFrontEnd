'use client';

/**
 * Port of `assets/components/Worker/WorkerMyCoursesScreen.js`.
 *
 * Same-for-same with the RN screen:
 *  - tabs All · Enrolled · Completed · Withdrawn (status query on
 *    GET /api/worker/enrollments?status=)
 *  - card: course name, status badge (green when Completed), company,
 *    "start — end · timings"
 *  - "View certificate" when a certificateId exists, otherwise "Withdraw"
 *    for Enrolled rows → POST /api/worker/enrollments/{id}/withdraw
 *  - toast "Enrollment withdrawn." then reload; empty copy matches the RN screen
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Award, CalendarRange, Clock4 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Tabs from '@/components/ui/Tabs';
import PageHeader from '@/components/ui/PageHeader';
import { EmptyState, Loader } from '@/components/ui/States';
import { WorkerCourseService } from '@/lib/api/courses';
import NotificationHelper from '@/lib/hooks/useNotification';
import { cn } from '@/lib/utils/cn';
import type { WorkerEnrollment } from '@/types/courses';

const TABS = ['', 'Enrolled', 'Completed', 'Withdrawn'];

export default function WorkerMyCoursesPage() {
  const [status, setStatus] = useState('');
  const [rows, setRows] = useState<WorkerEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState<number | string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const result = await WorkerCourseService.myEnrollments(status);
      setRows(Array.isArray(result) ? result : []);
    } catch (error: any) {
      NotificationHelper.showError(error?.message || 'Failed to load your courses.');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const withdraw = async (enrollmentId: number | string) => {
    try {
      setWithdrawingId(enrollmentId);
      await WorkerCourseService.withdraw(enrollmentId);
      NotificationHelper.showSuccess('Enrollment withdrawn.');
      load();
    } catch (error: any) {
      NotificationHelper.showError(error?.message || 'Failed to withdraw.');
    } finally {
      setWithdrawingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="My Courses" subtitle="Courses and certificates" back backHref="/worker/dashboard" />

      <Tabs
        items={TABS.map((t) => ({ label: t || 'All', value: t }))}
        value={status}
        onChange={setStatus}
        className="mb-5"
      />

      {loading ? (
        <Loader label="Loading your courses…" />
      ) : rows.length === 0 ? (
        <EmptyState title="No courses in this section." icon={<Award size={24} />} />
      ) : (
        <div className="space-y-4">
          {rows.map((item) => (
            <Card key={item.enrollmentId}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="min-w-0 truncate text-base font-extrabold text-ink">{item.courseName}</h3>
                <span
                  className={cn(
                    'shrink-0 text-[11px] font-extrabold',
                    item.status === 'Completed' ? 'text-emerald-600' : 'text-brand',
                  )}
                >
                  {item.status}
                </span>
              </div>
              <p className="mt-1 truncate text-sm font-semibold text-brand">{item.companyName}</p>
              <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-subtle">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarRange size={13} /> {item.startDate} — {item.endDate}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock4 size={13} /> {item.classTimings}
                </span>
              </p>

              {item.certificateId ? (
                <Link
                  href={`/worker/my-courses/certificate/${item.certificateId}`}
                  className="mt-4 flex h-11 items-center justify-center gap-2 rounded-xl bg-brand text-sm font-bold text-white transition hover:bg-brand-dark"
                >
                  <Award size={18} />
                  View certificate
                </Link>
              ) : item.status === 'Enrolled' ? (
                <Button
                  className="mt-4 border-rose-200 text-danger hover:bg-rose-50"
                  variant="outline"
                  fullWidth
                  loading={withdrawingId === item.enrollmentId}
                  onClick={() => withdraw(item.enrollmentId)}
                >
                  Withdraw
                </Button>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
