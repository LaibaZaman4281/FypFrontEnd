'use client';

import { apiFetch, ApiError } from './client';
import { API_DASHBOARD } from '@/lib/config';
import type { ActiveJobForResignation, WorkerResignationReview } from '@/types/resignations';

/**
 * Port of `assets/components/helpers/workerResignationsApi.js`.
 *
 * Same endpoints, same validation, same copy — including the workflow-version
 * gate: v2 moved resignation onto a seven-day notice period with automatic
 * acceptance, so an older backend must be reported clearly instead of silently
 * producing a different flow.
 */

const BASE = API_DASHBOARD;

export class ResignationApiError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = 'ResignationApiError';
    this.status = status;
  }
}

const validId = (value: unknown) => Number.isSafeInteger(Number(value)) && Number(value) > 0;

function mapError(error: unknown): ResignationApiError {
  if (error instanceof ResignationApiError) return error;
  if (error instanceof ApiError) {
    const fallback =
      error.status === 401
        ? 'Please sign in again.'
        : error.status === 403
          ? 'Please use your Worker login.'
          : `The resignation request failed (HTTP ${error.status}). Check the backend update and retry.`;
    return new ResignationApiError(error.message || fallback, error.status);
  }
  if (error instanceof Error && error.name === 'AbortError') {
    return new ResignationApiError('The request was cancelled or timed out. Please retry.');
  }
  return new ResignationApiError('Could not connect. Check your connection and retry.');
}

async function request<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    return await apiFetch<T>(`${BASE}${path}`, {
      method: options.method ?? 'GET',
      body: options.body,
      signal: controller.signal,
    });
  } catch (error) {
    throw mapError(error);
  } finally {
    clearTimeout(timer);
  }
}

/** The active contract, guaranteed to be on resignation workflow v2. */
export async function getActiveResignationJob(workerId: number | string): Promise<ActiveJobForResignation> {
  if (!validId(workerId)) {
    throw new ResignationApiError('Worker identity is missing. Please sign in again.', 401);
  }

  const data = await request<ActiveJobForResignation>(`/GetActiveJob/${Number(workerId)}`);

  if (data.resignationWorkflowVersion !== 2) {
    throw new ResignationApiError('Update and restart the backend before using the new resignation flow.');
  }

  return data;
}

export function submitResignation(interviewId: number | string, reason: string) {
  if (!validId(interviewId)) throw new ResignationApiError('The job could not be selected.');

  return request('/SubmitResignation', {
    method: 'POST',
    body: { InterviewId: Number(interviewId), ResignationReason: reason.trim() },
  });
}

export async function getWorkerResignationReview(resignationId: number | string): Promise<WorkerResignationReview> {
  if (!validId(resignationId)) throw new ResignationApiError('This resignation could not be opened.');

  const data = await request<WorkerResignationReview>(`/GetWorkerResignationReview/${Number(resignationId)}`);

  if (
    data.resignationId !== Number(resignationId) ||
    !validId(data.interviewId) ||
    typeof data.canReview !== 'boolean' ||
    typeof data.isAccepted !== 'boolean'
  ) {
    throw new ResignationApiError('The review response did not match this resignation. Please retry.');
  }

  return data;
}

export function submitWorkerClientReview(interviewId: number | string, rating: number, comment: string) {
  if (!validId(interviewId)) throw new ResignationApiError('The review contract could not be selected.');

  return request('/SubmitWorkerReviewToClient', {
    method: 'POST',
    body: { InterviewId: Number(interviewId), Rating: rating, Comment: comment.trim() },
  });
}
