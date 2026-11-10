/**
 * Port of the helper half of `assets/components/helpers/ReviewEndReason.js`.
 *
 * Kept logic-only so screens can use the label without rendering the component
 * (e.g. inside a detail row or a document title).
 */

export interface ReviewReasonDetails {
  label: string;
  text: string;
  isTermination: boolean;
}

export function getReviewReasonDetails(endType: unknown, reason: unknown): ReviewReasonDetails {
  const type = String(endType ?? '').trim().toLowerCase();
  let label = 'Contract end reason';
  let isTermination = false;

  if (type === 'terminated' || type === 'termination') {
    label = 'Termination reason';
    isTermination = true;
  } else if (type === 'resigned' || type === 'resignation' || type === 'resignationpending') {
    label = 'Resignation reason';
  }

  const text = typeof reason === 'string' ? reason.trim() : '';

  return { label, text: text || 'Reason not provided.', isTermination };
}
