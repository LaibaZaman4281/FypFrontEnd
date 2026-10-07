'use client';

/**
 * Port of `assets/components/Police/PoliceVerificationPortal.js` (updated for
 * frontend `bcd4115` / backend `eb952df`).
 *
 * Changed with upstream: the request now carries the bearer token, the response
 * is read as `{ workers, certifiedCount, uncertifiedCount }`, the list is split
 * into **Uncertified / Certified** tabs filtered on `w.isCertified`, rows link
 * to the character-certificate issuance screen (the FIR flow is gone), and the
 * list refreshes when you come back so a freshly issued certificate moves the
 * worker across immediately.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, RefreshCw, Search, ShieldAlert, ShieldCheck } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import Tabs from '@/components/ui/Tabs';
import { EmptyState, Loader } from '@/components/ui/States';
import { PoliceService } from '@/lib/api/services';
import { cn } from '@/lib/utils/cn';

export default function PoliceVerificationPortalPage() {
  const [searchCnic, setSearchCnic] = useState('');
  const [workers, setWorkers] = useState<any[]>([]);
  const [counts, setCounts] = useState({ certified: 0, uncertified: 0 });
  const [isLoading, setIsLoading] = useState(false);
  // Tab 1 = Uncertified (default), Tab 2 = Certified — same as the RN screen
  const [activeTab, setActiveTab] = useState<'Uncertified' | 'Certified'>('Uncertified');

  const fetchWorkers = useCallback(async (cnicQuery = '') => {
    setIsLoading(true);
    try {
      const data: any = await PoliceService.getWorkersForVerification(cnicQuery);
      setWorkers(data?.workers || []);
      setCounts({
        certified: data?.certifiedCount || 0,
        uncertified: data?.uncertifiedCount || 0,
      });
    } catch {
      /* same as RN: logged and ignored */
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchWorkers(searchCnic), 300);
    return () => clearTimeout(timer);
  }, [searchCnic, fetchWorkers]);

  const visibleWorkers = workers.filter((w) => (activeTab === 'Certified' ? w.isCertified : !w.isCertified));

  return (
    <div>
      <PageHeader
        title="Police Verification Portal"
        subtitle="Character certificate database"
        action={
          <Button variant="outline" icon={<RefreshCw size={15} />} onClick={() => fetchWorkers(searchCnic)}>
            Refresh
          </Button>
        }
      />

      <Card className="mb-5">
        <label className="relative block">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={searchCnic}
            onChange={(e) => setSearchCnic(e.target.value)}
            placeholder="Search worker by CNIC…"
            className="h-11 w-full rounded-xl border border-line bg-white pl-11 pr-4 text-[15px] text-ink placeholder:text-muted focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
          />
        </label>

        <Tabs
          items={[
            { label: 'Uncertified', value: 'Uncertified', count: counts.uncertified },
            { label: 'Certified', value: 'Certified', count: counts.certified },
          ]}
          value={activeTab}
          onChange={(value) => setActiveTab(value as 'Uncertified' | 'Certified')}
          className="mt-4"
        />
      </Card>

      {isLoading ? (
        <Loader label="Searching records…" />
      ) : visibleWorkers.length === 0 ? (
        <EmptyState
          title={activeTab === 'Certified' ? 'No certified workers yet' : 'No uncertified workers'}
          message="Search by full or partial CNIC."
          icon={<ShieldAlert size={24} />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleWorkers.map((item) => (
            <Card key={item.id} hoverable className="flex flex-col">
              <div className="flex items-center gap-3">
                <Avatar src={item.picture} name={item.name} size="md" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-bold text-ink">{item.name}</h3>
                  <p className="truncate text-sm text-subtle">{item.category}</p>
                  <p className="truncate text-xs font-semibold text-muted">CNIC: {item.cnic}</p>
                </div>
              </div>

              <span
                className={cn(
                  'mt-3 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold',
                  item.isCertified ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-subtle',
                )}
              >
                {item.isCertified ? <BadgeCheck size={13} /> : <ShieldAlert size={13} />}
                {item.isCertified ? `Valid until ${item.certExpiry}` : 'No certificate'}
              </span>

              <div className="mt-4 flex gap-2">
                <Link href={`/police/issue-certificate/${item.id}`} className="flex-1">
                  <Button fullWidth size="sm" icon={<ShieldCheck size={15} />}>
                    {item.isCertified ? 'Renew' : 'Issue'}
                  </Button>
                </Link>
                {item.isCertified && (
                  <Link href={`/certificate/${item.id}`}>
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
