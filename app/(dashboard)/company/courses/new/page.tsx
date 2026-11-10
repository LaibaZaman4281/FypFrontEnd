'use client';

/** Create mode of `CompanyCourseFormScreen` (no `route.params.course`). */

import CourseForm from '@/components/features/courses/CourseForm';
import PageHeader from '@/components/ui/PageHeader';

export default function NewCoursePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Create Course" subtitle="Build skills. Certify achievement." back backHref="/company/courses" />
      <CourseForm />
    </div>
  );
}
