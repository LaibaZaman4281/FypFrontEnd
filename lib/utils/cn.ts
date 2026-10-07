/** Tiny className joiner (keeps the bundle free of extra deps). */
export type ClassValue = string | number | false | null | undefined;

export function cn(...values: ClassValue[]): string {
  return values.filter((value): value is string | number => Boolean(value)).map(String).join(' ');
}
