/**
 * Training-course + certificate contracts.
 *
 * Field-for-field ports of the payloads returned by:
 *   GET  /api/company/dashboard                 → CompanyProfile
 *   GET  /api/company/courses?scope=            → CourseSummary[]
 *   GET  /api/company/courses/{id}              → CourseDetail (+ enrollments)
 *   GET  /api/worker/courses?search=            → CatalogueCourse[]
 *   GET  /api/worker/enrollments?status=        → WorkerEnrollment[]
 *   GET  /api/course-certificates/{id}          → CourseCertificate
 *   GET  /api/course-certificates/verify/{code} → CourseCertificate
 *   GET  /api/Police/GetWorkerCharacterCertificate/{id} → CharacterCertificateResponse
 *
 * `types/index.ts` re-exports everything here, so `@/types` keeps working.
 */

/* ------------------------------------------------------------------ *
 * Training courses (company ⇄ worker) — frontend `bcd4115`
 * ------------------------------------------------------------------ */

export interface CourseSummary {
  courseId: number;
  courseName: string;
  startDate?: string;
  endDate?: string;
  classTimings?: string;
  enrollmentCount?: number;
  completedCount?: number;
  isPublished?: boolean;
  [key: string]: any;
}

export interface CourseDetail extends CourseSummary {
  description?: string | null;
  syllabus?: string | null;
  enrollments?: CourseEnrollment[];
  [key: string]: any;
}

export interface CourseEnrollment {
  enrollmentId: number;
  workerName?: string;
  workerId?: number;
  status?: 'Enrolled' | 'Completed' | 'Withdrawn' | string;
  enrolledAtUtc?: string;
  [key: string]: any;
}

/** A row of the worker-facing catalogue. */
export interface CatalogueCourse extends CourseSummary {
  companyName?: string;
  description?: string | null;
  /** Present when this worker already has an enrollment. */
  enrollmentStatus?: string | null;
  [key: string]: any;
}

/** A row of the worker's "My Courses" list. */
export interface WorkerEnrollment extends CourseEnrollment {
  courseName?: string;
  companyName?: string;
  startDate?: string;
  endDate?: string;
  classTimings?: string;
  certificateId?: number | null;
  [key: string]: any;
}

export interface CourseCertificate {
  certificateId?: number;
  certificateCode?: string;
  workerName?: string;
  courseName?: string;
  companyName?: string;
  issuedDateUtc?: string;
  /** Returned by the public verify endpoint. */
  completionDateUtc?: string | null;
  isRevoked?: boolean;
  isValid?: boolean;
  [key: string]: any;
}

export interface CompanyProfile {
  companyName?: string;
  licenseNumber?: string;
  companyAddress?: string;
  email?: string;
  phoneNo?: string;
  picture?: string | null;
  totalCourses?: number;
  activeCourses?: number;
  totalEnrollments?: number;
  completedEnrollments?: number;
  uniqueEnrolledWorkers?: number;
  [key: string]: any;
}

/* ------------------------------------------------------------------ *
 * Police character certificate — replaces the old FIR/criminal record
 * ------------------------------------------------------------------ */

export type CertificateStatus = 'Verified' | 'Expired' | 'NotIssued';

export interface CharacterCertificate {
  certificateNo?: string;
  characterStatus?: string;
  remarks?: string;
  issuingStation?: string | null;
  issuingBadge?: string | null;
  issuedDate?: string;
  expiryDate?: string;
  isValid?: boolean;
}

export interface CharacterCertificateResponse {
  workerId?: number;
  workerName?: string;
  workerCnic?: string;
  workerPicture?: string | null;
  isCertified?: boolean;
  status?: CertificateStatus;
  certificate?: CharacterCertificate | null;
}
