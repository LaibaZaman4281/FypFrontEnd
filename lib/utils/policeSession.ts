'use client';

export interface SelectedWorker {
  id: number;
  name: string;
  cnic: string;
  profileImage?: string | null;
}

const STORAGE_KEY_SELECTED_WORKER = 'police_selected_worker';
const STORAGE_KEY_ISSUED_CERTIFICATES = 'police_issued_certificates';

const readJson = <T>(key: string): T | null => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

const writeJson = (key: string, value: unknown) => {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota / browser privacy failures.
  }
};

export function writeSelectedWorker(worker: SelectedWorker): void {
  writeJson(STORAGE_KEY_SELECTED_WORKER, worker);
}

export function readSelectedWorker(): SelectedWorker | null {
  return readJson<SelectedWorker>(STORAGE_KEY_SELECTED_WORKER);
}

export function clearSelectedWorker(): void {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.removeItem(STORAGE_KEY_SELECTED_WORKER);
  } catch {
    // Ignore cleanup failures.
  }
}

export function getIssuedCertificateIds(): number[] {
  const ids = readJson<number[]>(STORAGE_KEY_ISSUED_CERTIFICATES);
  if (!Array.isArray(ids)) return [];

  return ids.filter((id): id is number => Number.isFinite(id));
}

export function markCertificateIssued(workerId: number): void {
  const existing = getIssuedCertificateIds();
  const next = Array.from(new Set([...existing, Number(workerId)])).filter((id) => Number.isFinite(id));
  writeJson(STORAGE_KEY_ISSUED_CERTIFICATES, next);
}

export function clearIssuedCertificateIds(): void {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.removeItem(STORAGE_KEY_ISSUED_CERTIFICATES);
  } catch {
    // Ignore cleanup failures.
  }
}
