'use client';

import Storage from '@/lib/storage';

/**
 * Thin fetch wrapper that reproduces what every screen of the React Native app
 * did by hand:
 *   - Bearer token from storage under the `userToken` key
 *   - JSON Content-Type for bodies (multipart is left untouched)
 *   - 401 on an authenticated call -> session cleared and bounced to /login
 *   - error message read from `message`/`error` in the JSON body, else raw text
 *   - the machine-readable `code` (e.g. ACTIVE_FULL_TIME_JOB) is preserved so
 *     callers can branch on a specific failure instead of matching strings
 *
 * No endpoint, verb, payload shape or response contract is changed anywhere.
 */

export class ApiError extends Error {
  status: number;
  body: unknown;
  /** `code` from the JSON error body, when the backend supplies one. */
  code: string | null;

  constructor(message: string, status: number, body?: unknown, code: string | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
    this.code = code;
  }

  get isUnauthorized() {
    return this.status === 401;
  }
}

export interface ApiOptions extends Omit<RequestInit, 'body'> {
  /** Plain object -> JSON.stringify, FormData -> sent as-is (multipart signup). */
  body?: unknown;
  /** Skip the Authorization header (login, signup, public habit list, verify). */
  anonymous?: boolean;
}

/** Where an expired/invalid session is sent. */
const LOGIN_PATH = '/login';

/**
 * A 401 on an *authenticated* request means the stored token is dead. Clearing
 * storage here is the single place that knows that, so the redirect lives here
 * too — the alternative was 28 pages each forgetting to handle it.
 *
 * Anonymous calls (login with wrong credentials, certificate verification) never
 * redirect: a 401 there is a normal, expected answer.
 */
function handleUnauthorized() {
  Storage.clearSession();
  if (typeof window === 'undefined') return;
  const { pathname, search } = window.location;
  if (pathname === LOGIN_PATH) return;
  const next = encodeURIComponent(`${pathname}${search}`);
  window.location.replace(`${LOGIN_PATH}?next=${next}`);
}

export async function apiFetch<T = unknown>(url: string, options: ApiOptions = {}): Promise<T> {
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
    finalBody = body; // the browser sets the multipart boundary itself
  } else if (body !== undefined && body !== null) {
    finalHeaders['Content-Type'] = 'application/json';
    finalBody = JSON.stringify(body);
  }

  const response = await fetch(url, { ...rest, headers: finalHeaders, body: finalBody });

  const raw = await response.text();
  let parsed: unknown = null;
  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = raw;
    }
  }

  if (!response.ok) {
    if (response.status === 401 && !anonymous) handleUnauthorized();

    const record = (parsed && typeof parsed === 'object' ? parsed : {}) as Record<string, unknown>;
    const message =
      record.message ||
      record.error ||
      (typeof parsed === 'string' && parsed) ||
      `Request failed (${response.status})`;
    const code = typeof record.code === 'string' ? record.code : null;

    throw new ApiError(String(message).substring(0, 300), response.status, parsed, code);
  }

  return parsed as T;
}

export const api = {
  get: <T = unknown>(url: string, options: ApiOptions = {}) => apiFetch<T>(url, { ...options, method: 'GET' }),
  post: <T = unknown>(url: string, body?: unknown, options: ApiOptions = {}) =>
    apiFetch<T>(url, { ...options, method: 'POST', body }),
  put: <T = unknown>(url: string, body?: unknown, options: ApiOptions = {}) =>
    apiFetch<T>(url, { ...options, method: 'PUT', body }),
  del: <T = unknown>(url: string, options: ApiOptions = {}) => apiFetch<T>(url, { ...options, method: 'DELETE' }),
};

/** Mirrors the "Cannot reach the server." copy the RN screens showed. */
export function errorMessage(error: unknown, fallback = 'Cannot reach the server.') {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
