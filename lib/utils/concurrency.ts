/**
 * Bounded-concurrency `map` for the review screens.
 *
 * Both review pages resolve a reviewer profile per row via GetClientDetail. The
 * ids are already de-duplicated, but a worker with 60 reviews would still fire 60
 * requests at once, which the backend (and the browser's per-host connection cap)
 * handle badly. This keeps a small, predictable number in flight while preserving
 * input order in the result array.
 */
export async function mapLimit<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  const width = Math.max(1, Math.min(limit, items.length));
  const runners = Array.from({ length: width }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  });

  await Promise.all(runners);
  return results;
}
