'use client';

/**
 * Port of `assets/components/Worker/WorkerCourseCatalogueScreen.js`.
 *
 * Same-for-same with the RN screen:
 *  - live search against GET /api/worker/courses?search=
 *  - course card: name, company, enrollment-status badge, date range,
 *    class timings, short description
 *  - "Enroll now" button (disabled with "Already enrolled" when the
 *    `enrollmentStatus` field is present) → POST /api/worker/courses/{id}/enroll
 *  - the server's message is shown in the success toast, then the list reloads
 */

import { useCallback, useEffect, useState } from 'react';
import { GraduationCap, CalendarRange, Clock4, Search } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Input } from '@/components/ui/Field';
import PageHeader from '@/components/ui/PageHeader';
import { EmptyState, Loader } from '@/components/ui/States';
import { WorkerCourseService } from '@/lib/api/courses';
import NotificationHelper from '@/lib/hooks/useNotification';
import type { CatalogueCourse } from '@/types/courses';

export default function WorkerCourseCataloguePage() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<CatalogueCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<number | string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const result = await WorkerCourseService.catalogue(q);
      setRows(Array.isArray(result) ? result : []);
    } catch (error: any) {
      NotificationHelper.showError(error?.message || 'Failed to load courses.');
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    load();
  }, [load]);

  const enroll = async (courseId: number | string) => {
    try {
      setEnrollingId(courseId);
      const result: any = await WorkerCourseService.enroll(courseId);
      NotificationHelper.showSuccess(result?.message || 'Enrolled successfully.');
      load();
    } catch (error: any) {
      NotificationHelper.showError(error?.message || 'Failed to enroll.');
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Browse Courses" subtitle="Enroll in company training" back backHref="/worker/dashboard" />

      <div className="mb-5">
        <Input
          placeholder="Search courses…"
          icon={<Search size={17} />}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {loading ? (
        <Loader label="Loading courses…" />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No courses available"
          message="Check back later — agencies publish training courses regularly."
          icon={<GraduationCap size={24} />}
        />
      ) : (
        <div className="space-y-4">
          {rows.map((item) => (
            <Card key={item.courseId}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
                    <GraduationCap size={22} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-extrabold text-ink">{item.courseName}</h3>
                    <p className="truncate text-sm font-semibold text-brand">{item.companyName}</p>
                  </div>
                </div>
                {item.enrollmentStatus && (
                  <span className="shrink-0 rounded-full bg-brand-light px-2.5 py-1 text-[11px] font-bold text-brand">
                    {item.enrollmentStatus}
                  </span>
                )}
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-subtle">
                <p className="flex items-center gap-1.5">
                  <CalendarRange size={13} /> {item.startDate} — {item.endDate}
                </p>
                <p className="flex items-center gap-1.5">
                  <Clock4 size={13} /> {item.classTimings}
                </p>
              </div>

              {item.description && <p className="mt-2 line-clamp-2 text-sm text-subtle">{item.description}</p>}

              <Button
                className="mt-4"
                fullWidth
                disabled={!!item.enrollmentStatus}
                loading={enrollingId === item.courseId}
                onClick={() => enroll(item.courseId)}
              >
                {item.enrollmentStatus ? 'Already enrolled' : 'Enroll now'}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
