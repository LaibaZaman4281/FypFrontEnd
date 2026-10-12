/**
 * Shared TypeScript contracts.
 *
 * These describe the payloads the ASP.NET backend already returns - nothing here
 * changes the API. Most fields are optional because several endpoints return
 * slightly different projections of the same entity.
 */

export type UserRole = 'Client' | 'Worker' | 'Company' | 'Police';

export interface LoginResponse {
  token?: string;
  role?: UserRole;
  name?: string;
  picture?: string;
  address?: string;
  phone?: string;
  email?: string;
  clientId?: number;
  workerId?: number;
  companyId?: number;
  policeId?: number;
  latitude?: number;
  longitude?: number;
  message?: string;
}

export interface Session {
  token: string | null;
  role: UserRole | null;
  name: string | null;
  picture: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  clientId: string | null;
  workerId: string | null;
  companyId: string | null;
  policeId: string | null;
}

export interface Habit {
  habitId: number;
  habitName: string;
  [key: string]: any;
}

export interface Category {
  categoryId: number;
  categoryName: string;
}

export interface Skill {
  skillsId: number;
  skillName: string;
}

export interface FiltersData {
  categories?: any[];
  cities?: string[];
  subSkills?: any[];
  habits?: Habit[];
  [key: string]: any;
}

export interface WorkerCard {
  id: string;
  name?: string;
  role?: string;
  city?: string;
  salary?: string;
  phone?: string;
  picture?: string | null;
  rating?: string;
  gender?: string;
  categories?: string[];
  availableStatus?: boolean;
  isFlagged?: boolean;
  isBlocked?: boolean;
  distance?: number | string;
  [key: string]: any;
}

export interface WorkerDetail extends WorkerCard {
  age?: number;
  bio?: string;
  address?: string;
  cnic?: string;
  experiences?: any[];
  habits?: any[];
  skills?: any[];
  reviews?: Review[];
  averageRating?: number | string;
  radius?: number;
  latitude?: number | string;
  longitude?: number | string;
  isCertified?: boolean;
  [key: string]: any;
}

export interface Review {
  reviewId?: number;
  rating?: number;
  comment?: string;
  reviewerRole?: string;
  reviewerName?: string;
  reviewerImage?: string | null;
  reviewDate?: string;
  /** Per-criterion breakdown ({ name, score }) when the backend returns it. */
  criteria?: CriteriaDisplay[];
  /** Formatted contract window (e.g. "2 m 3 d") on closing reviews. */
  workedPeriod?: string;
  endType?: string;
  [key: string]: any;
}

export interface ReviewsResponse {
  averageRating?: number | string;
  totalReviews?: number;
  reviews?: Review[];
  [key: string]: any;
}

export interface TimeSlot {
  id: number;
  workerId: number;
  startTime: string;
  endTime: string;
  rawStartTime?: string;
  rawEndTime?: string;
  [key: string]: any;
}

export interface ActiveRequest {
  interviewId?: number;
  requestId?: number;
  workerId?: number;
  workerName?: string;
  workerImage?: string | null;
  status?: string;
  workerDecision?: string;
  interviewDate?: string;
  address?: string;
  jobType?: string;
  isResidenceProvided?: boolean;
  slotStartTime?: string;
  slotEndTime?: string;
  [key: string]: any;
}

export interface ClientDashboard {
  hiredWorkers?: any[];
  activeContracts?: any[];
  stats?: Record<string, any>;
  [key: string]: any;
}

export interface ResignationSummary {
  resignationId?: number;
  interviewId?: number;
  workerName?: string;
  workerAvatar?: string | null;
  lastWorkingDate?: string;
  submittedDate?: string;
  reason?: string;
  [key: string]: any;
}

export interface ResignationDetail extends ResignationSummary {
  workerId?: number;
  resignationReason?: string;
  [key: string]: any;
}

/* ------------------------------------------------------------------ */
/* Closing reviews (criteria-based) — matches DashboardController's    */
/* ClosingReviewRequest / TerminationRequest / GetReviewCriteria and   */
/* the shapes returned by GetResignationDetail.                        */
/* ------------------------------------------------------------------ */

/** One criterion score in a closing-review submission ({ CriteriaId, Score }). */
export interface CriteriaScore {
  CriteriaId: number;
  Score: number;
}

/** A criterion as returned by GET GetReviewCriteria ({ criteriaId, name }). */
export interface ReviewCriteriaItem {
  criteriaId: number;
  name: string;
}

/** Per-category group of criteria returned by GetReviewCriteria. */
export interface ReviewCriteriaGroup {
  categoryId: number | null;
  categoryName: string;
  criteria: ReviewCriteriaItem[];
}

/** GET /api/Dashboard/GetReviewCriteria?interviewId= response. */
export interface ReviewCriteriaData {
  interviewId: number;
  workerId: number;
  common: ReviewCriteriaItem[];
  professions: ReviewCriteriaGroup[];
  totalCriteria: number;
  allMandatory: boolean;
}

/** POST /api/Dashboard/ConfirmResignation body (backend: ClosingReviewRequest). */
export interface ClosingReviewRequest {
  InterviewId: number;
  Comment?: string | null;
  CriteriaScores: CriteriaScore[];
}

/** POST /api/Dashboard/TerminateContract body (backend: TerminationRequest). */
export interface TerminationRequest {
  InterviewId: number;
  Reason: string;
  Remarks?: string | null;
  CriteriaScores: CriteriaScore[];
}

/** A displayed criteria breakdown entry ({ name, score }). */
export interface CriteriaDisplay {
  name?: string;
  score?: number;
}

/** Review payload as returned inside GetResignationDetail / review lists. */
export interface ClosingReviewDisplay {
  rating?: number;
  comment?: string;
  date?: string;
  workedPeriod?: string;
  criteria?: CriteriaDisplay[];
}
