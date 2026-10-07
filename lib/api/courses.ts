'use client';

import { api } from './client';
import { SERVER_BASE } from '@/lib/config';
import type {
  CatalogueCourse,
  CompanyProfile,
  CourseCertificate,
  CourseDetail,
  CourseSummary,
  WorkerEnrollment,
} from '@/types/courses';

/**
 * Training-course API — port of `assets/components/helpers/courseApi.js`.
 *
 * The RN helper is a thin fetch wrapper with a bearer token and uniform error
 * extraction; our `lib/api/client.ts` already does exactly that, so these are
 * just the twelve routes it calls, with identical paths, verbs and bodies.
 *
 * ⚠️ As of backend `eb952df` NONE of these endpoints exist server-side yet
 *    (see FYP_Backend_Deep_Review_v2.md §2). Every screen below therefore
 *    renders its error/empty state until the C# CoursesController is added —
 *    no frontend change will be needed when it is.
 */

/* ---------------- Company side ---------------- */
export const CompanyCourseService = {
  /** Company profile + counters shown on the dashboard. */
  getDashboard: () => api.get<CompanyProfile>(`${SERVER_BASE}/api/company/dashboard`),

  /** scope: active | past | archived (the backend also accepts "all"). */
  listCourses: (scope: 'active' | 'past' | 'archived' | 'all' = 'active') =>
    api.get<CourseSummary[]>(`${SERVER_BASE}/api/company/courses?scope=${scope}`),

  getCourse: (courseId: number | string) =>
    api.get<CourseDetail>(`${SERVER_BASE}/api/company/courses/${courseId}`),

  createCourse: (body: unknown) => api.post(`${SERVER_BASE}/api/company/courses`, body),

  updateCourse: (courseId: number | string, body: unknown) =>
    api.put(`${SERVER_BASE}/api/company/courses/${courseId}`, body),

  deleteCourse: (courseId: number | string) => api.del(`${SERVER_BASE}/api/company/courses/${courseId}`),

  /** Marks an enrollment complete, which issues the course certificate. */
  completeEnrollment: (enrollmentId: number | string) =>
    api.post(`${SERVER_BASE}/api/company/enrollments/${enrollmentId}/complete`),
};

/* ---------------- Worker side ---------------- */
export const WorkerCourseService = {
  catalogue: (search = '') =>
    api.get<CatalogueCourse[]>(`${SERVER_BASE}/api/worker/courses?search=${encodeURIComponent(search)}`),

  enroll: (courseId: number | string) => api.post(`${SERVER_BASE}/api/worker/courses/${courseId}/enroll`),

  myEnrollments: (status = '') =>
    api.get<WorkerEnrollment[]>(`${SERVER_BASE}/api/worker/enrollments${status ? `?status=${status}` : ''}`),

  withdraw: (enrollmentId: number | string) =>
    api.post(`${SERVER_BASE}/api/worker/enrollments/${enrollmentId}/withdraw`),
};

/* ---------------- Shared ---------------- */
export const CertificateService = {
  getCourseCertificate: (certificateId: number | string) =>
    api.get<CourseCertificate>(`${SERVER_BASE}/api/course-certificates/${certificateId}`),

  /**
   * Public certificate lookup — the one backend endpoint marked
   * `[AllowAnonymous]`. Lets an employer verify a code without an account.
   */
  verifyByCode: (code: string) =>
    api.get<CourseCertificate>(`${SERVER_BASE}/api/course-certificates/verify/${encodeURIComponent(code)}`, {
      anonymous: true,
    }),
};
