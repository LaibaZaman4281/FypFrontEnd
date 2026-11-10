/**
 * Shared rules for the "exclusive full-time" engagement introduced in RN commit
 * `a70d626` ("Worker Exclusive Job").
 *
 * The backend stores the flag on `Interview.IsExclusive` but only ever treats it
 * as meaningful for full-time work:
 *     isExclusive = h.Interview.IsExclusive && h.Interview.JobType == "Full-Time"
 * so every projection of a job/interview already narrows it the same way. These
 * helpers keep the client-side checks identical in all five places that render it.
 */

export interface ExclusiveAwareItem {
  isExclusive?: boolean | null;
  jobType?: string | null;
}

/** True only for a full-time engagement the client asked to be exclusive. */
export function isExclusiveFullTime(item: ExclusiveAwareItem | null | undefined): boolean {
  if (!item) return false;
  return item.isExclusive === true && String(item.jobType ?? '').trim().toLowerCase() === 'full-time';
}

/** The 409 body code returned by POST /Dashboard/BookInterview. */
export const ACTIVE_FULL_TIME_JOB = 'ACTIVE_FULL_TIME_JOB';

export const EXCLUSIVE_COPY = {
  /** Interview selection screen — the toggle's explanatory line. */
  toggleOn: 'Worker will not accept other full-time work after you confirm hiring.',
  toggleOff: 'Worker may accept other work.',
  /** Accepted-request card (client already sent an offer). */
  requestNotice:
    'If the client confirms hiring, you agree not to accept other full-time work until you submit a resignation or the contract is terminated. Accepting this interview request alone does not activate the restriction.',
  /** Job-offer card (client confirmed; accepting activates it). */
  offerNotice:
    'If you accept and the client confirms this offer, you agree not to accept other full-time work until you submit a resignation or the contract is terminated. Your profile will go offline on client confirmation.',
  /** Client-side commitment badge on a hired worker. */
  commitmentLabel: 'Exclusive full-time commitment',
  conflictTitle: 'Worker already has a full-time job',
  conflictMessage: 'You can continue with this worker without exclusivity, or find another worker.',
} as const;
