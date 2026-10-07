'use client';

/** Create mode of `CompanyCourseFormScreen` (no `route.params.course`). */

import CourseForm from '@/components/features/courses/CourseForm';
import PageHeader from '@/components/ui/PageHeader';

export default function NewCoursePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="New Course" subtitle="Publish a training course for workers to enroll in." back backHref="/company/courses" />
      <CourseForm />
    </div>
  );
}
