/**
 * Resignation shapes — client list/detail and the worker's closing review.
 *
 * Field-for-field ports of:
 *   GET  /api/Dashboard/GetClientResignations
 *   GET  /api/Dashboard/GetResignationDetail/{id}
 *   GET  /api/Dashboard/GetWorkerResignationReview/{id}
 *   POST /api/Dashboard/ConfirmResignation
 *   POST /api/Dashboard/SubmitResignation
 *   POST /api/Dashboard/SubmitWorkerReviewToClient
 *
 * The acceptance/review split (`isAccepted`, `reviewSubmitted`, `canAccept`,
 * `acceptanceMode`) is the newer resignation workflow: a seven-day notice period
 * can expire on its own (`acceptanceMode: "Automatic"`), and acceptance no longer
 * implies that either side has left a review.
 */

export type ResignationAcceptanceMode = 'Automatic' | 'Manual' | string | null;

/** One row of the client's resignation list. */
export interface ClientResignationSummary {
  resignationId: number;
  interviewId: number;
  status: string;
  isConfirmed: boolean;
  isAccepted: boolean;
  reviewSubmitted: boolean;
  canAccept: boolean;
  acceptanceMode: ResignationAcceptanceMode;
  acceptedAtUtc: string | null;
  noticeEndsAtUtc: string | null;
  hasWorkerReview: boolean;
  workerName: string;
  workerRole: string;
  reason: string;
  lastWorkingDate: string;
  submittedDate: string;
}

export interface ReviewCriteriaEntry {
  name: string;
  score: number;
}

export interface ContractReview {
  rating: number;
  comment: string;
  date: string;
  workedPeriod?: string;
  endReasonType?: string | null;
  endReason?: string | null;
  criteria?: ReviewCriteriaEntry[];
}

/** GET /api/Dashboard/GetResignationDetail/{id} */
export interface ResignationDetail {
  resignationId?: number;
  interviewId: number;
  workerName: string;
  workerRole?: string;
  workerPicture?: string | null;
  status: string;
  reason: string;
  submittedDate?: string;
  lastWorkingDate: string;
  remainingDays: number;
  totalNoticeDays?: number;
  progress: number;
  isConfirmed: boolean;
  isAccepted: boolean;
  reviewSubmitted: boolean;
  canAccept: boolean;
  acceptanceMode: ResignationAcceptanceMode;
  acceptedAtUtc: string | null;
  noticeEndsAtUtc: string | null;
  clientReview: ContractReview | null;
  workerReview: (ContractReview & { endType?: string }) | null;
}

/** GET /api/Dashboard/GetWorkerResignationReview/{id} */
export interface WorkerResignationReview {
  resignationId: number;
  interviewId: number;
  clientName: string;
  clientPicture: string | null;
  reason: string;
  status: string;
  isAccepted: boolean;
  canReview: boolean;
  acceptedAtUtc: string | null;
  acceptanceMode: ResignationAcceptanceMode;
  noticeEndsAtUtc: string | null;
  workerReview: ContractReview | null;
}

/** GET /api/Dashboard/GetActiveJob/{workerId} — resignation workflow v2. */
export interface ActiveJobForResignation {
  interviewId: number;
  workerId?: number;
  clientName?: string;
  employerAddress?: string;
  hireDate?: string;
  resignationWorkflowVersion: number;
  noticeDays?: number;
  isResignationPending?: boolean;
  [key: string]: unknown;
}
