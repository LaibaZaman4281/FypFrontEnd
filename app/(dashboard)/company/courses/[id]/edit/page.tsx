'use client';

/** Edit mode of `CompanyCourseFormScreen` (RN passed the whole course object). */

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import CourseForm from '@/components/features/courses/CourseForm';
import PageHeader from '@/components/ui/PageHeader';
import { EmptyState, Loader } from '@/components/ui/States';
import { CompanyCourseService } from '@/lib/api/courses';
import NotificationHelper from '@/lib/hooks/useNotification';
import type { CourseDetail } from '@/types/courses';

export default function EditCoursePage() {
  const params = useParams<{ id: string }>();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setCourse(await CompanyCourseService.getCourse(params.id));
    } catch (error: any) {
      NotificationHelper.showError(error?.message || 'Could not load the course.');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Loader label="Loading course…" />;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Edit Course" back backHref={`/company/courses/${params.id}`} />
      {course ? <CourseForm course={course} /> : <EmptyState title="Course not found." />}
    </div>
  );
}
