/**
 * Closing-review (criteria) contracts. Port of the shape returned by
 * `Dashboard/GetReviewCriteria` and consumed by `assets/components/helpers/CriteriaReviewSection.js`.
 */

export interface ReviewCriterion {
  criteriaId: number;
  name: string;
}

export interface ReviewCriteriaGroup {
  categoryId: number;
  categoryName: string;
  criteria: ReviewCriterion[];
}

export interface ReviewCriteriaResponse {
  interviewId: number;
  workerId: number;
  /** Criteria that apply to every worker (the "Basics" group). */
  common: ReviewCriterion[];
  /** One group per profession the worker holds. */
  professions: ReviewCriteriaGroup[];
  totalCriteria: number;
}

/** Body item for `CriteriaScores` in TerminateContract / ConfirmResignation. */
export interface CriteriaScorePayload {
  CriteriaId: number;
  Score: number;
}
