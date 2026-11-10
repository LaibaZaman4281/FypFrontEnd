'use client';

/**
 * Port of `assets/components/Client/FilterationScreen.js` as a standalone route.
 *
 * The RN app has no filter sidebar — `FindServiceScreen` pushes a dedicated
 * "FILTERATION" screen carrying `initialFilters`, and that screen returns the
 * edited object with `appliedFilters`. This route is that screen:
 *
 *   /client/find-service  --Filter-->  /client/filters  --Apply/Reset-->  /client/find-service
 *
 * The filter object travels through `useClientFilters` (sessionStorage), which is
 * the web equivalent of the RN route params, so nothing else had to change.
 *
 * Faithful details: the back circle, the centred "FILTERATION" title, the active
 * tag row (gender, city, every category, every habit), section icons, the city
 * dropdown **including "All"**, the radio-vs-checkbox habit chips, the sub-category
 * block that appears per selected category, and the Reset / Apply footer.
 *
 * `?city=` behaves like RN's `defaultCity` route param: it preselects a city and is
 * prepended to the dropdown when it is not one of the recommended ones.
 */

import { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Card from '@/components/ui/Card';
import FiltersPanel from '@/components/features/client/FiltersPanel';
import { useClientFilters, type ClientFilters } from '@/lib/hooks/useClientFilters';

const RECOMMENDED_CITIES = [
  'Islamabad', 'Rawalpindi', 'Lahore', 'Karachi',
  'Faisalabad', 'Peshawar', 'Multan', 'Quetta',
  'Gujranwala', 'Sialkot',
];

function FilterationScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { filters, ready, update, reset } = useClientFilters();

  const defaultCity = (searchParams.get('city') || '').trim();
  const hasRecommendedDefault = RECOMMENDED_CITIES.some((city) => city.toLowerCase() === defaultCity.toLowerCase());

  const cityOptions = useMemo(() => {
    // Same rule as RN: a custom default city is inserted after "All" so it can be
    // picked again after being cleared.
    if (defaultCity && defaultCity.toLowerCase() !== 'all' && !hasRecommendedDefault) {
      return ['All', defaultCity, ...RECOMMENDED_CITIES];
    }
    return ['All', ...RECOMMENDED_CITIES];
  }, [defaultCity, hasRecommendedDefault]);

  const startValue: ClientFilters = useMemo(
    () => (defaultCity && !filters.city ? { ...filters, city: defaultCity } : filters),
    [filters, defaultCity],
  );

  const close = () => router.push('/client/find-service');

  return (
    <div className="mx-auto max-w-3xl pb-28">
      {/* ---------- Header: back circle + centred title ---------- */}
      <div className="mb-5 grid grid-cols-[40px_1fr_40px] items-center">
        <Link
          href="/client/find-service"
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-canvas text-subtle transition hover:bg-line"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-center text-xl font-extrabold tracking-tight text-ink">FILTERATION</h1>
        <span aria-hidden />
      </div>

      <Card className="space-y-4">
        {ready && (
          <FiltersPanel
            value={startValue}
            cityOptions={cityOptions}
            onApply={(next) => {
              update(next);
              close();
            }}
            onReset={() => {
              reset();
              close();
            }}
          />
        )}
      </Card>
    </div>
  );
}

export default function FiltersPage() {
  // useSearchParams needs a Suspense boundary during prerender.
  return (
    <Suspense fallback={<p className="py-10 text-center text-sm text-subtle">Loading filters…</p>}>
      <FilterationScreen />
    </Suspense>
  );
}
