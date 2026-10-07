'use client';

/**
 * Port of `assets/components/Client/UserDashboardScreen.js`.
 *
 * Unchanged: GetClientDashboard, the newest-first sort by interviewId, the
 * Overview / Active / Past segmentation with the same "terminate|resign"
 * status test, the hired + pending counters, the Edit Profile hand-off into
 * the signup screen in edit mode, and the quick links to Services, Interviews,
 * Job Reqs and Resignations.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  CalendarDays,
  FileText,
  MapPin,
  Pencil,
  Phone,
  ShoppingBag,
  UserMinus,
  Users,
} from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Tabs from '@/components/ui/Tabs';
import { JobTypeBadge, SlotTimeLabel } from '@/components/ui/Badge';
import { EmptyState, Loader } from '@/components/ui/States';
import { DashboardService } from '@/lib/api/services';
import { ApiError } from '@/lib/api/client';
import NotificationHelper from '@/lib/hooks/useNotification';
import { useSession } from '@/lib/hooks/useSession';
import { cn } from '@/lib/utils/cn';

const QUICK_LINKS = [
  { label: 'Services', href: '/client/find-service', icon: ShoppingBag, tone: 'bg-sky-50 text-sky-600' },
  { label: 'Interviews', href: '/client/requests', icon: CalendarDays, tone: 'bg-amber-50 text-amber-600' },
  { label: 'Job Reqs', href: '/client/decisions', icon: Briefcase, tone: 'bg-teal-50 text-teal-600' },
  { label: 'Resignations', href: '/client/resignations', icon: FileText, tone: 'bg-rose-50 text-rose-600' },
];

export default function ClientDashboardPage() {
  const router = useRouter();
  const { session } = useSession();

  const [workers, setWorkers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [hiredCount, setHiredCount] = useState(0);
  const [pendingInterviewsCount, setPendingInterviewsCount] = useState(0);

  const sortWorkersByInterviewIdDesc = (list: any[] = []) =>
    [...list].sort((a, b) => Number(b.interviewId || b.id || 0) - Number(a.interviewId || a.id || 0));

  const fetchWorkers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data: any = await DashboardService.getClientDashboard();
      const list = sortWorkersByInterviewIdDesc(data.hiredWorkers || []);
      const activeWorkers = list.filter((w) => {
        const s = (w.status || '').toString().toLowerCase();
        return !s.includes('terminate') && !s.includes('resign');
      });
      setWorkers(list);
      setHiredCount(activeWorkers.length);
      setPendingInterviewsCount(data.pendingInterviewsCount || 0);
    } catch (error) {
      if (error instanceof ApiError && error.isUnauthorized) {
        NotificationHelper.showError('Session Expired. Please login again.');
        router.replace('/login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const handleEditProfile = () => {
    // Same payload the RN screen passed to Signup as `initialData`
    window.sessionStorage.setItem(
      'editProfileDraft',
      JSON.stringify({
        role: 'Client',
        initialData: {
          id: session.clientId,
          name: session.name,
          email: session.email,
          phone: session.phone,
          location: session.address,
          picture: session.picture,
        },
      }),
    );
    router.push('/signup?edit=1');
  };

  const isTerminatedWorker = (item: any) => {
    const s = (item.status || '').toString().trim().toLowerCase();
    return s.includes('terminate') || s.includes('resign');
  };

  const activeWorkersList = workers.filter((w) => !isTerminatedWorker(w));
  const pastWorkersList = workers.filter((w) => isTerminatedWorker(w));
  const displayed = activeTab === 'Active' ? activeWorkersList : activeTab === 'Past' ? pastWorkersList : [];

  if (isLoading) return <Loader label="Loading your dashboard…" />;

  return (
    <div>
      {/* ---------- Profile band ---------- */}
      <Card className="mb-6 border-0 bg-gradient-to-br from-brand to-brand-dark text-white">
        <div className="flex flex-wrap items-center gap-5">
          <Avatar src={session.picture} name={session.name} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/70">Good morning</p>
            <h1 className="truncate text-2xl font-extrabold">{session.name || 'Client User'}</h1>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/85">
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={14} /> {session.address || 'Your Address'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Phone size={14} /> {session.phone || '03XXXXXXX'}
              </span>
            </div>
          </div>
          <Button variant="outline" icon={<Pencil size={15} />} onClick={handleEditProfile}>
            Edit Profile
          </Button>
        </div>
      </Card>

      {/* ---------- Quick links ---------- */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {QUICK_LINKS.map(({ label, href, icon: Icon, tone }) => (
          <Link
            key={label}
            href={href}
            className="relative flex flex-col items-center gap-2 rounded-2xl border border-line bg-white px-3 py-5 text-sm font-bold text-ink shadow-card transition hover:-translate-y-0.5 hover:shadow-pop"
          >
            <span className={cn('flex h-11 w-11 items-center justify-center rounded-xl', tone)}>
              <Icon size={20} />
            </span>
            {label}
            {label === 'Interviews' && pendingInterviewsCount > 0 && (
              <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-amber-500" />
            )}
          </Link>
        ))}
      </div>

      <Tabs
        items={[
          { label: 'Overview', value: 'Overview' },
          { label: 'Active', value: 'Active', count: activeWorkersList.length },
          { label: 'Past', value: 'Past', count: pastWorkersList.length },
        ]}
        value={activeTab}
        onChange={setActiveTab}
        className="mb-5"
      />

      {activeTab === 'Overview' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
              <Users size={22} />
            </span>
            <div className="flex-1">
              <p className="label-xs">Workers</p>
              <p className="text-2xl font-extrabold text-ink">{hiredCount}</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">Live</span>
          </Card>

          <Card className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <CalendarDays size={22} />
            </span>
            <div className="flex-1">
              <p className="label-xs">Interview</p>
              <p className="text-2xl font-extrabold text-ink">{pendingInterviewsCount}</p>
            </div>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">Pending</span>
          </Card>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm font-semibold text-subtle">
            Showing {displayed.length} {activeTab === 'Past' ? 'historical worker records' : 'active worker records'}
          </p>

          {displayed.length === 0 ? (
            <EmptyState
              title={activeTab === 'Past' ? 'No closed contracts yet' : 'No workers hired yet'}
              message={activeTab === 'Past' ? 'Terminated and resigned contracts appear here.' : 'Find a worker and book an interview to get started.'}
              icon={<Users size={24} />}
              action={
                activeTab === 'Active' ? (
                  <Link href="/client/find-service">
                    <Button>Find a worker</Button>
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {displayed.map((item) => {
                const statusNorm = (item.status || '').toString().trim().toLowerCase();
                const displayStatus = statusNorm.includes('resign')
                  ? 'Resigned'
                  : statusNorm.includes('terminate')
                    ? 'Terminated'
                    : 'On Work';
                const isPast = isTerminatedWorker(item);

                return (
                  <Card key={(item.interviewId || item.id || '').toString()} hoverable>
                    <div className="flex items-center gap-3">
                      <Link href={`/client/workers/${item.id}`}>
                        <Avatar src={item.picture} name={item.name} size="md" />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link href={`/client/workers/${item.id}`} className="block truncate text-base font-bold text-ink hover:text-brand">
                          {item.name}
                        </Link>
                        <p className="truncate text-xs text-subtle">{isPast ? 'Contract closed' : 'Working with you'}</p>
                      </div>
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold',
                          isPast ? 'bg-rose-50 text-danger' : 'bg-emerald-50 text-emerald-700',
                        )}
                      >
                        {displayStatus}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <JobTypeBadge jobType={item.jobType} />
                      <SlotTimeLabel startTime={item.slotStartTime} endTime={item.slotEndTime} />
                    </div>

                    <p className="mt-3 flex items-center gap-1.5 text-sm text-subtle">
                      <MapPin size={14} className="text-rose-500" />
                      <span className="truncate">{item.location || 'Location not set'}</span>
                    </p>

                    <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted">
                        <FileText size={13} /> Record ID: #{item.interviewId || item.id || 'N/A'}
                      </span>

                      {!isPast && (
                        <Link
                          href={`/client/terminate/${item.id}?interviewId=${item.interviewId ?? ''}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-bold text-danger transition hover:bg-rose-100"
                        >
                          <UserMinus size={14} /> Terminate
                        </Link>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
