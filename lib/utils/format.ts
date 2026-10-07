/** Formatting helpers shared by every screen (ported from inline RN helpers). */

export function formatDate(value?: string | Date | null, fallback = 'Not set'): string {
  if (!value) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return typeof value === 'string' ? value : fallback;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(value?: string | Date | null, fallback = 'Not set'): string {
  if (!value) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return typeof value === 'string' ? value : fallback;
  return `${formatDate(date)} · ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

/** "14:30:00" | "02:30 PM" -> "14:30" (same logic as helpers/SlotTimeLabel.js). */
export function toHHMM(value?: string | null): string | null {
  if (!value || typeof value !== 'string') return null;
  const match = value.match(/(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : null;
}

export function toInputDate(value?: string | Date | null): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
}

export function initials(name?: string | null): string {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function currency(value?: string | number | null): string {
  if (value === null || value === undefined || value === '') return 'Not Set';
  const text = String(value);
  return text.startsWith('Rs') ? text : `Rs. ${text}`;
}
