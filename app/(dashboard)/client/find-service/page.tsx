'use client';

/**
 * Port of `assets/components/Client/FindServiceScreen.js`.
 *
 * Same flow and logic as the RN screen:
 *   header -> search -> category tabs -> Filter / Map -> results
 * with `Filter` opening the standalone `/client/filters` screen (RN's
 * `FilterationScreen`) and `Map` handing the worker list to `/map`.
 *
 * Unchanged from RN: GetFiltersData category tabs, the exact GetWorkersForClient
 * query-string construction (search, repeated `categories`, gender, city,
 * repeated `subSkills`, `habitIds`), the 300ms debounce, and the 401 -> /login rule.
 *
 * Layout is web-native: a sticky toolbar holds the search + actions, and the
 * single-column FlatList becomes a responsive card grid (1 / 2 / 3 / 4 columns) so
 * a wide desktop window is actually used. Grid items stretch to equal height.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Filter, Map as MapIcon, Search, UserSearch } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Tabs from '@/components/ui/Tabs';
import { EmptyState, SkeletonCard } from '@/components/ui/States';
import WorkerResultCard from '@/components/features/client/WorkerResultCard';
import { DashboardService } from '@/lib/api/services';
import { ApiError } from '@/lib/api/client';
import NotificationHelper from '@/lib/hooks/useNotification';
import { countActiveFilters, useClientFilters, type ClientFilters } from '@/lib/hooks/useClientFilters';
import { useSession } from '@/lib/hooks/useSession';
import Storage from '@/lib/storage';
import type { WorkerCard } from '@/types';

export default function FindServicePage() {
  const router = useRouter();
  const { session } = useSession();
  const { filters, ready } = useClientFilters();

  const [search, setSearch] = useState('');
  const [categoriesList, setCategoriesList] = useState<string[]>(['All']);
  const [categoryLookup, setCategoryLookup] = useState<Record<string, string>>({});
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [workers, setWorkers] = useState<WorkerCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /* ---- categories for the tab row ---- */
  useEffect(() => {
    DashboardService.getFiltersData()
      .then((data: any) => {
        if (!Array.isArray(data)) return;
        setCategoriesList(['All', ...data.map((c: any) => c.categoryName)]);
        const lookup: Record<string, string> = {};
        data.forEach((c: any) => {
          lookup[c.categoryId?.toString()] = c.categoryName;
          lookup[c.categoryName] = c.categoryName;
        });
        setCategoryLookup(lookup);
      })
      .catch(() => undefined);
  }, []);

  const getCategoryName = useCallback(
    (selection: string) => {
      if (!selection) return '';
      const key = selection.toString();
      return categoryLookup[key] || key;
    },
    [categoryLookup],
  );

  /* ---- worker search (same query string as the mobile app) ---- */
  const fetchWorkers = useCallback(
    async (categoryTab: string, searchText: string, currentFilters: ClientFilters) => {
      setIsLoading(true);
      try {
        let query = '';

        if (searchText && searchText.trim()) {
          query += `search=${encodeURIComponent(searchText.trim())}&`;
        }

        const selectedCategoryNames = (currentFilters.categories || [])
          .map(getCategoryName)
          .filter((cat) => cat && cat !== 'All');

        const combinedCategories = [...new Set(selectedCategoryNames)];
        if (categoryTab && categoryTab !== 'All' && !combinedCategories.includes(categoryTab)) {
          combinedCategories.push(categoryTab);
        }

        combinedCategories.forEach((cat) => {
          query += `categories=${encodeURIComponent(cat)}&`;
        });

        if (currentFilters.gender && currentFilters.gender !== 'Both') {
          query += `gender=${encodeURIComponent(currentFilters.gender)}&`;
        }

        if (currentFilters.city && currentFilters.city !== 'All') {
          query += `city=${encodeURIComponent(currentFilters.city)}&`;
        }

        Object.keys(currentFilters.subSkills || {}).forEach((catName) => {
          (currentFilters.subSkills[catName] || []).forEach((skill) => {
            query += `subSkills=${encodeURIComponent(skill)}&`;
          });
        });

        (currentFilters.habits || []).forEach((habitId) => {
          query += `habitIds=${habitId}&`;
        });

        const data = await DashboardService.getWorkersForClient(query);
        setWorkers(Array.isArray(data) ? data : []);
      } catch (error) {
        if (error instanceof ApiError && error.isUnauthorized) {
          NotificationHelper.showError('Session Expired. Please login again.');
          router.replace('/login');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [getCategoryName, router],
  );

  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      fetchWorkers(selectedCategory, search, filters);
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedCategory, search, filters, ready, fetchWorkers]);

  /* ---- map hand-off keeps the same params the RN screen passed ---- */
  const openMap = () => {
    const lat = Storage.getItem('clientLatitude');
    const lng = Storage.getItem('clientLongitude');
    const query = new URLSearchParams();
    if (lat && !Number.isNaN(parseFloat(lat))) query.set('lat', lat);
    if (lng && !Number.isNaN(parseFloat(lng))) query.set('lng', lng);
    query.set('showWorkers', '1');
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('mapWorkers', JSON.stringify(workers));
    }
    router.push(`/map?${query.toString()}`);
  };

  const activeCount = useMemo(() => countActiveFilters(filters), [filters]);

  const openFilters = () => {
    const suffix = filters.city ? `?city=${encodeURIComponent(filters.city)}` : '';
    router.push(`/client/filters${suffix}`);
  };

  const tabItems = categoriesList.map((cat) => ({ label: cat, value: cat }));

  return (
    <div className="mx-auto max-w-[1400px]">
      {/* ---------- Header ---------- */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-brand">Find Service</p>
          <h1 className="mt-1 truncate text-2xl font-extrabold tracking-tight text-ink sm:text-[26px]">
            What would you like to do?
          </h1>
          <p className="mt-1 text-sm text-subtle">
            Welcome back, {session.name || 'Client'} — pick a category or filter to narrow the list.
          </p>
        </div>

        <Link
          href="/client/dashboard"
          aria-label="Open my dashboard"
          className="shrink-0 rounded-full ring-2 ring-transparent transition hover:ring-brand/30"
        >
          <Avatar src={session.picture} name={session.name} size="md" />
        </Link>
      </div>

      {/* ---------- Sticky toolbar: search + actions ---------- */}
      <div className="sticky top-16 z-10 -mx-4 mt-5 bg-canvas/85 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Name"
              className="h-11 w-full rounded-xl border border-line bg-white pl-10 pr-4 text-sm text-ink placeholder:text-muted focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
            />
          </label>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              icon={<Filter size={15} />}
              onClick={openFilters}
              className="flex-1 sm:flex-none"
            >
              Filters{activeCount > 0 ? ` (${activeCount})` : ''}
            </Button>
            <Button
              variant="secondary"
              icon={<MapIcon size={15} />}
              onClick={openMap}
              className="flex-1 sm:flex-none"
            >
              Map
            </Button>
          </div>
        </div>

        {/* category tabs, horizontally scrollable under the toolbar on narrow screens */}
        <div className="mt-2.5 -mx-1 overflow-x-auto px-1">
          <Tabs items={tabItems} value={selectedCategory} onChange={setSelectedCategory} className="pb-1" />
        </div>
      </div>

      {/* ---------- Results header ---------- */}
      <div className="mb-3 mt-1 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink">
          {isLoading ? 'Searching…' : `${workers.length} worker${workers.length === 1 ? '' : 's'} found`}
        </p>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={openFilters}
            className="text-xs font-bold text-brand hover:underline"
          >
            {activeCount} filter{activeCount === 1 ? '' : 's'} active
          </button>
        )}
      </div>

      {/* ---------- Results grid ---------- */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : workers.length === 0 ? (
        <Card>
          <EmptyState
            title="No workers found"
            message="Try clearing a filter or searching a different name."
            icon={<UserSearch size={24} />}
            action={
              <Button variant="secondary" icon={<Filter size={15} />} onClick={openFilters}>
                Open filters
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {workers.map((worker) => (
            <WorkerResultCard key={worker.id} worker={worker} />
          ))}
        </div>
      )}
    </div>
  );
}
