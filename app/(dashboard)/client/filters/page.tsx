'use client';

/**
 * Standalone route for `assets/components/Client/FilterationScreen.js`.
 *
 * The same panel is embedded in the search page sidebar on desktop; this page
 * keeps the dedicated route the mobile app had (and is what the mobile web
 * layout links to). Applying or resetting stores the filter object and returns
 * to the search results, exactly like the RN navigate-with-params did.
 */

import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import FiltersPanel from '@/components/features/client/FiltersPanel';
import { useClientFilters } from '@/lib/hooks/useClientFilters';

export default function FiltersPage() {
  const router = useRouter();
  const { filters, ready, update, reset } = useClientFilters();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Filteration" subtitle="Narrow the worker list down to exactly what you need." back backHref="/client/find-service" />

      <Card>
        {ready && (
          <FiltersPanel
            value={filters}
            onApply={(next) => {
              update(next);
              router.push('/client/find-service');
            }}
            onReset={() => {
              reset();
              router.push('/client/find-service');
            }}
          />
        )}
      </Card>
    </div>
  );
}
