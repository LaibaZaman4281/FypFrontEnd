'use client';

/**
 * Port of `assets/components/Company/WorkerDirectoryScreen.js`.
 * Same GetAllWorkers + GetCompanyProfile calls (including caching the returned
 * companyPicture back into the `userPicture` storage key), the same client-side
 * category + text filtering, and the same navigation to the verification screen.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Search, Star, Users } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import Tabs from '@/components/ui/Tabs';
import { EmptyState, Loader } from '@/components/ui/States';
import { DirectoryService } from '@/lib/api/services';
import NotificationHelper from '@/lib/hooks/useNotification';
import Storage from '@/lib/storage';

const CATEGORIES = ['All Workers', 'Cleaning', 'Driver', 'Cooking', 'Security'];

export default function WorkerDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Workers');
  const [workers, setWorkers] = useState<any[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [companyName, setCompanyName] = useState('Company');

  const loadUserData = useCallback(async () => {
    try {
      const savedName = Storage.getItem('userName');
      const companyId = Storage.getItem('companyId') || Storage.getItem('userId');
      if (savedName) setCompanyName(savedName);

      if (companyId) {
        const data: any = await DirectoryService.getCompanyProfile(companyId);
        if (data?.companyPicture) Storage.setItem('userPicture', data.companyPicture);
      }
    } catch {
      /* same as RN: logged and ignored */
    }
  }, []);

  const fetchWorkers = useCallback(async () => {
    try {
      setIsLoading(true);
      const data: any = await DirectoryService.getAllWorkers();
      setWorkers(Array.isArray(data) ? data : []);
      setFilteredWorkers(Array.isArray(data) ? data : []);
    } catch {
      NotificationHelper.showError('Failed to fetch directory.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
    fetchWorkers();
  }, [loadUserData, fetchWorkers]);

  const handleSearchAndFilter = (text: string, category: string) => {
    let result = workers;

    if (category && category !== 'All Workers') {
      result = result.filter(
        (w) =>
          (w.categories && w.categories.some((c: string) => c.toLowerCase().includes(category.toLowerCase()))) ||
          (w.roleTitle && w.roleTitle.toLowerCase().includes(category.toLowerCase())),
      );
    }

    if (text && text.trim()) {
      result = result.filter(
        (w) =>
          w.name?.toLowerCase().includes(text.toLowerCase()) ||
          w.roleTitle?.toLowerCase().includes(text.toLowerCase()),
      );
    }

    setFilteredWorkers(result);
  };

  const extractCity = (address?: string) => {
    if (!address || address === 'N/A') return 'Rawalpindi';
    const parts = address.split(',');
    return parts.length > 1 ? parts[parts.length - 1].trim() : address.trim();
  };

  return (
    <div>
      <PageHeader title="Worker Directory" subtitle={`Signed in as ${companyName} — issue training certificates to verified personnel.`} />

      <Card className="mb-5">
        <label className="relative block">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearchAndFilter(e.target.value, selectedCategory);
            }}
            placeholder="Search by name or role"
            className="h-11 w-full rounded-xl border border-line bg-white pl-11 pr-4 text-[15px] text-ink placeholder:text-muted focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
          />
        </label>

        <Tabs
          items={CATEGORIES.map((c) => ({ label: c, value: c }))}
          value={selectedCategory}
          onChange={(value) => {
            setSelectedCategory(value);
            handleSearchAndFilter(searchQuery, value);
          }}
          className="mt-4"
        />
      </Card>

      <p className="mb-4 text-sm font-semibold text-subtle">{filteredWorkers.length} workers</p>

      {isLoading ? (
        <Loader label="Loading directory…" />
      ) : filteredWorkers.length === 0 ? (
        <EmptyState title="No workers found" message="Try a different category or search term." icon={<Users size={24} />} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredWorkers.map((item) => (
            <Card key={item.id ?? item.workerId} hoverable className="flex flex-col">
              <div className="flex gap-4">
                <div className="relative">
                  <Avatar src={item.picture} name={item.name} size="lg" className="rounded-2xl" ring={false} />
                  <span className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold text-white">
                    <Star size={10} className="fill-amber-400 text-amber-400" />
                    {item.rating || '4.0'}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="truncate text-base font-bold text-ink">{item.name}</h3>
                    <span className="shrink-0 text-sm font-bold text-brand">{item.salary}</span>
                  </div>
                  <p className="truncate text-sm text-subtle">{item.roleTitle}</p>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {item.categories && item.categories.length > 0 ? (
                      item.categories.slice(0, 2).map((cat: string, index: number) => (
                        <span key={index} className="rounded-full bg-canvas px-2.5 py-1 text-[11px] font-semibold text-subtle">
                          {cat}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full bg-canvas px-2.5 py-1 text-[11px] font-semibold text-subtle">General</span>
                    )}
                  </div>

                  <p className="mt-2 text-xs text-subtle">
                    <span className="label-xs mr-1">City</span> {extractCity(item.location)}
                  </p>
                </div>
              </div>

              <Link
                href={`/company/workers/${item.id ?? item.workerId}`}
                className="mt-5 flex h-11 items-center justify-center gap-1 rounded-xl bg-brand text-sm font-bold text-white transition hover:bg-brand-dark"
              >
                Review &amp; Certify
                <ChevronRight size={18} />
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
