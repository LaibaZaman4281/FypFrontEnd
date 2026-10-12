/**
 * Direct port of `assets/config.js` from the React Native app.
 *
 * The only change is that the base URL now comes from an environment variable
 * instead of being hardcoded, so the same build runs against a LAN IP in
 * development and a real host in production. Every endpoint constant below keeps
 * the exact same name and the exact same path as the mobile app used.
 */
/**
 * Base URL of the shared ASP.NET backend.
 *
 * Preferred: set NEXT_PUBLIC_SERVER_BASE in .env.local / the deployment
 * environment (see .env.example). Fallback is localhost:5150, which matches
 * the backend's local `http` profile (0.0.0.0:5150) out of the box.
 * Trailing slashes are stripped so every constant below joins cleanly.
 */
export const SERVER_BASE =
  (process.env.NEXT_PUBLIC_SERVER_BASE?.replace(/\/+$/, '') as string | undefined) ||
  'http://localhost:5150';


export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export const API_DASHBOARD = `${SERVER_BASE}/api/Dashboard`;
export const API_AUTH = `${SERVER_BASE}/api/Auth`;
export const API_ACCOUNT = `${SERVER_BASE}/api/AccountCreation`;
export const API_DIRECTORY = `${SERVER_BASE}/api/CompanyDirectory`;
export const API_POLICE = `${SERVER_BASE}/api/Police`;

/**
 * These two were rebuilt inline inside screens in the RN app
 * (WorkerDashboardScreen / MyHabitsScreen / SignupScreen). Centralised here.
 */
export const API_HABITS = `${SERVER_BASE}/api/Habits`;
export const API_WORKER_SLOTS = `${SERVER_BASE}/api/WorkerSlots`;

/**
 * Builds a fully-qualified URL for an image path returned by the backend.
 * The API returns relative paths such as "/Images/foo.jpg"; a few rows contain
 * absolute URLs, so both are handled (the RN app did this inconsistently).
 */
export function resolveImage(path?: string | null): string | null {
  if (!path) return null;
  const value = String(path).trim();
  if (!value) return null;
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.startsWith('/')) return `${SERVER_BASE}${value}`;
  return `${SERVER_BASE}/Images/${value}`;
}
