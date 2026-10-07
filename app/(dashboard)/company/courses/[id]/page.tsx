'use client';

/**
 * Port of `assets/components/Company/CompanyCourseDetailScreen.js`
 * (one of the four minified RN files — expanded and formatted here).
 *
 * Unchanged: `GET /api/company/courses/{id}` for the course + its enrollment
 * roster, `POST /api/company/enrollments/{id}/complete` with the server message
 * surfaced and a reload afterwards, the "complete" action only on rows whose
 * status is exactly `Enrolled`, and the pencil shortcut into the edit form.
 */

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CalendarRange, Check, Clock4, Pencil, Users } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { EmptyState, Loader } from '@/components/ui/States';
import { CompanyCourseService } from '@/lib/api/courses';
import NotificationHelper from '@/lib/hooks/useNotification';
import { cn } from '@/lib/utils/cn';
import { formatDate } from '@/lib/utils/format';
import type { CourseDetail, CourseEnrollment } from '@/types/courses';

export default function CompanyCourseDetailPage() {
  const params = useParams<{ id: string }>();
  const courseId = params.id;

  const [data, setData] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await CompanyCourseService.getCourse(courseId));
    } catch (error: any) {
      NotificationHelper.showError(error?.message || 'Could not load the course.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  const complete = async (enrollment: CourseEnrollment) => {
    setCompletingId(enrollment.enrollmentId);
    try {
      const result: any = await CompanyCourseService.completeEnrollment(enrollment.enrollmentId);
      NotificationHelper.showSuccess(result?.message || 'Enrollment completed.');
      load();
    } catch (error: any) {
      NotificationHelper.showError(error?.message || 'Could not complete the enrollment.');
    } finally {
      setCompletingId(null);
    }
  };

  if (loading) return <Loader label="Loading course…" />;
  if (!data) return <EmptyState title="Course not found." />;

  const enrollments = data.enrollments || [];

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Course Details"
        back
        backHref="/company/courses"
        action={
          <Link href={`/company/courses/${courseId}/edit`}>
            <Button variant="outline" icon={<Pencil size={15} />}>
              Edit
            </Button>
          </Link>
        }
      />

      <Card className="mb-5 border-course-border">
        <h2 className="text-2xl font-extrabold text-course-ink">{data.courseName}</h2>
        <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-course">
          <CalendarRange size={15} />
          {data.startDate} — {data.endDate}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-course">
          <Clock4 size={15} />
          {data.classTimings}
        </p>
        {data.description && <p className="mt-4 text-sm leading-relaxed text-course-muted">{data.description}</p>}
        {data.syllabus && (
          <>
            <p className="label-xs mt-5 mb-1">Syllabus</p>
            <p className="whitespace-pre-line text-sm leading-relaxed text-course-muted">{data.syllabus}</p>
          </>
        )}
      </Card>

      <h3 className="mb-3 text-base font-bold text-course-ink">Enrolled workers ({enrollments.length})</h3>

      {enrollments.length === 0 ? (
        <EmptyState title="No workers have enrolled yet." icon={<Users size={24} />} />
      ) : (
        <div className="space-y-3">
          {enrollments.map((item) => {
            const isCompleted = item.status === 'Completed';
            return (
              <Card key={item.enrollmentId} className="flex items-center gap-3 border-course-border py-3">
                <Avatar name={item.workerName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-course-ink">{item.workerName}</p>
                  <p className="truncate text-xs text-course-muted">
                    Enrolled {item.enrolledAtUtc ? formatDate(item.enrolledAtUtc) : '—'}
                  </p>
                </div>

                <span
                  className={cn(
                    'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold',
                    isCompleted ? 'bg-emerald-50 text-course-success' : 'bg-course-pale text-course',
                  )}
                >
                  {item.status}
                </span>

                {item.status === 'Enrolled' && (
                  <Button
                    size="sm"
                    variant="success"
                    icon={<Check size={15} />}
                    loading={completingId === item.enrollmentId}
                    onClick={() => complete(item)}
                  >
                    Complete
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
