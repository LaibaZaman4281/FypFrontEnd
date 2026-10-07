'use client';

import Storage from '@/lib/storage';

/**
 * Thin fetch wrapper that reproduces EXACTLY what every RN screen did by hand:
 *   - Bearer token from storage under the `userToken` key
 *   - JSON Content-Type for bodies (multipart is left untouched)
 *   - 401 -> session cleared and caller told to bounce to /login
 *   - error message read from `message` in the JSON body, else raw text
 *
 * No endpoint, verb, payload shape or response contract is changed anywhere.
 */

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }

  get isUnauthorized() {
    return this.status === 401;
  }
}

export interface ApiOptions extends Omit<RequestInit, 'body'> {
  /** Plain object -> JSON.stringify, FormData -> sent as-is (multipart signup). */
  body?: unknown;
  /** Skip the Authorization header (login, signup, public habit list). */
  anonymous?: boolean;
}

export async function apiFetch<T = any>(url: string, options: ApiOptions = {}): Promise<T> {
  const { body, anonymous, headers, ...rest } = options;

  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...((headers as Record<string, string>) || {}),
  };

  if (!anonymous) {
    const token = Storage.getItem('userToken');
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  let finalBody: BodyInit | undefined;
  if (body instanceof FormData) {
    finalBody = body; // browser sets the multipart boundary itself
  } else if (body !== undefined && body !== null) {
    finalHeaders['Content-Type'] = 'application/json';
    finalBody = JSON.stringify(body);
  }

  const response = await fetch(url, { ...rest, headers: finalHeaders, body: finalBody });

  const raw = await response.text();
  let parsed: any = null;
  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = raw;
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      Storage.clearSession();
    }
    const message =
      (parsed && typeof parsed === 'object' && (parsed.message || parsed.error)) ||
      (typeof parsed === 'string' && parsed) ||
      `Request failed (${response.status})`;
    throw new ApiError(String(message).substring(0, 300), response.status, parsed);
  }

  return parsed as T;
}

export const api = {
  get: <T = any>(url: string, options: ApiOptions = {}) => apiFetch<T>(url, { ...options, method: 'GET' }),
  post: <T = any>(url: string, body?: unknown, options: ApiOptions = {}) =>
    apiFetch<T>(url, { ...options, method: 'POST', body }),
  put: <T = any>(url: string, body?: unknown, options: ApiOptions = {}) =>
    apiFetch<T>(url, { ...options, method: 'PUT', body }),
  del: <T = any>(url: string, options: ApiOptions = {}) => apiFetch<T>(url, { ...options, method: 'DELETE' }),
};

/** Mirrors the "Cannot reach the server." copy the RN screens showed. */
export function errorMessage(error: unknown, fallback = 'Cannot reach the server.') {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
