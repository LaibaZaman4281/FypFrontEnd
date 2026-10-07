'use client';

/**
 * Port of `assets/components/Client/FindServiceScreen.js`.
 *
 * Unchanged: the GetFiltersData category tabs, the exact GetWorkersForClient
 * query-string construction (search, repeated `categories`, gender, city,
 * repeated `subSkills`, plus `habitIds` the backend already supports), the 300ms
 * debounce, and the 401 -> /login rule.
 *
 * Web-first layout: sticky filter sidebar on desktop, drawer on mobile, and a
 * responsive card grid instead of a single-column FlatList.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Map as MapIcon, Search, SlidersHorizontal, UserSearch } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import Tabs from '@/components/ui/Tabs';
import { EmptyState, SkeletonCard } from '@/components/ui/States';
import FiltersPanel from '@/components/features/client/FiltersPanel';
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
  const { filters, ready, update, reset } = useClientFilters();

  const [search, setSearch] = useState('');
  const [categoriesList, setCategoriesList] = useState<string[]>(['All']);
  const [categoryLookup, setCategoryLookup] = useState<Record<string, string>>({});
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [workers, setWorkers] = useState<WorkerCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

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

        if (currentFilters.city) {
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

  const tabItems = categoriesList.map((cat) => ({ label: cat, value: cat }));

  return (
    <div>
      {/* ---------- Hero ---------- */}
      <section className="mb-6 overflow-hidden rounded-3xl bg-brand px-6 py-8 text-white sm:px-10">
        <p className="text-sm font-semibold text-white/75">Welcome, {session.name || 'Client'}</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">What would you like to do?</h1>
        <p className="mt-2 max-w-xl text-sm text-white/80">
          Search verified domestic workers by category, skills, habits and city — then book an interview
          against their published time slots.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Name"
              className="h-12 w-full rounded-xl border-0 pl-11 pr-4 text-[15px] text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-white/30"
            />
          </label>

          <div className="flex gap-3">
            <Button variant="outline" size="lg" className="lg:hidden" icon={<SlidersHorizontal size={16} />} onClick={() => setFiltersOpen(true)}>
              Filters{activeCount > 0 ? ` (${activeCount})` : ''}
            </Button>
            <Button variant="outline" size="lg" icon={<MapIcon size={16} />} onClick={openMap}>
              Map
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* ---------- Desktop filter rail ---------- */}
        <aside className="hidden lg:block">
          <Card className="sticky top-24">
            <h2 className="mb-4 text-base font-bold text-ink">Filters</h2>
            {ready && (
              <FiltersPanel
                value={filters}
                onApply={update}
                onReset={reset}
              />
            )}
          </Card>
        </aside>

        {/* ---------- Results ---------- */}
        <section>
          <Tabs items={tabItems} value={selectedCategory} onChange={setSelectedCategory} className="mb-4" />

          <p className="mb-4 text-sm font-semibold text-subtle">{workers.length} Total Results</p>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : workers.length === 0 ? (
            <EmptyState
              title="No workers found"
              message="Try clearing a filter or searching a different name."
              icon={<UserSearch size={24} />}
              action={
                <Button variant="secondary" onClick={reset}>
                  Reset filters
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {workers.map((worker) => (
                <WorkerResultCard key={worker.id} worker={worker} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ---------- Mobile filter drawer ---------- */}
      <Modal open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filteration" size="md">
        {ready && (
          <FiltersPanel
            value={filters}
            onApply={update}
            onReset={reset}
            onClose={() => setFiltersOpen(false)}
            compact
          />
        )}
      </Modal>
    </div>
  );
}
