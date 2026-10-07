'use client';

/**
 * Port of `assets/components/Client/WorkerDetailScreen.js`.
 *
 * Same request (`GetWorkerDetail/{id}?clientIdParam=...`), the same tab set
 * (Overview, Experience, Reviews, + Time Slots when part-time is available,
 * + Habits when declared), the same trust/verification cards, and the same
 * footer CTA state machine:
 *   hired/finalized/accepted -> "Worker Hired"
 *   availability NOT AVAILABLE -> "Worker Not Available"
 *   hasActiveInterview -> "Interview Request Pending"
 *   otherwise -> "Call For Interview" (goes to the interview selection screen)
 *
 * Updated for frontend `a26103d`: the "Verified Training" card no longer trusts
 * a flag — it calls `GetWorkerCertificateDetail/{workerId}` directly (the same
 * endpoint the certification page uses, so the two can never disagree) and
 * renders a "No Verified Training" placeholder on 404. The
 * background-check card opens the worker's police **character certificate**
 * (upstream replaced the dead `workerPoliceRecord` route with
 * `CharacterCertificateScreen`, carrying `viewerRole: 'Client'`).
 */

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Award,
  Clock4,
  CheckCircle2,
  MapPin,
  MessageSquare,
  ShieldQuestion,
  Star,
} from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import Tabs from '@/components/ui/Tabs';
import { RatingStars } from '@/components/ui/Rating';
import { EmptyState, Loader } from '@/components/ui/States';
import { API_DASHBOARD } from '@/lib/config';
import { apiFetch } from '@/lib/api/client';
import { DirectoryService } from '@/lib/api/services';
import NotificationHelper from '@/lib/hooks/useNotification';
import Storage from '@/lib/storage';
import { cn } from '@/lib/utils/cn';
import type { WorkerDetail } from '@/types';

export default function WorkerDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const workerId = params.id;

  const [worker, setWorker] = useState<WorkerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  // Company training certificate — null means "none on record", not an error.
  const [certification, setCertification] = useState<any>(null);

  const fetchWorkerDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const clientId = Storage.getItem('clientId');
      const data = await apiFetch<WorkerDetail>(
        `${API_DASHBOARD}/GetWorkerDetail/${workerId}?clientIdParam=${clientId || ''}`,
      );
      setWorker(data);
    } catch {
      NotificationHelper.showError('Failed to fetch worker details.');
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [workerId, router]);

  /**
   * Same endpoint `WorkerCertificationDetail` uses. A 404 simply means the
   * worker has no certificate; a network hiccup degrades to "not certified"
   * rather than blocking the whole profile behind a toast.
   */
  const fetchCertification = useCallback(async () => {
    try {
      setCertification(await DirectoryService.getWorkerCertificateDetail(workerId));
    } catch {
      setCertification(null);
    }
  }, [workerId]);

  useEffect(() => {
    fetchWorkerDetails();
    fetchCertification();
  }, [fetchWorkerDetails, fetchCertification]);

  if (isLoading) return <Loader label="Loading worker profile…" />;
  if (!worker) return null;

  const w: any = worker;

  const tabs = [
    'Overview',
    'Experience',
    'Reviews',
    ...(w.isPartTimeAvailable ? ['Time Slots'] : []),
    ...(w.habits && w.habits.length > 0 ? ['Habits'] : []),
  ];

  const unavailable = w.availability === 'NOT AVAILABLE';
  const hiredStates = ['finalized', 'hired', 'accepted'];
  const isHired = hiredStates.includes((w.activeInterviewStatus || '').toString().toLowerCase());

  const ctaLabel = isHired
    ? 'Worker Hired'
    : unavailable
      ? 'Worker Not Available'
      : w.hasActiveInterview
        ? 'Interview Request Pending'
        : 'Call For Interview';

  const ctaDisabled = !!w.hasActiveInterview || unavailable;

  return (
    <div>
      <PageHeader title="Worker Profile" back backHref="/client/find-service" />

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* ---------------- Profile rail ---------------- */}
        <aside className="space-y-4">
          <Card className="lg:sticky lg:top-24">
            <div className="flex flex-col items-center text-center">
              <Avatar src={w.picture} name={w.name} size="xl" />
              <h2 className="mt-3 text-xl font-extrabold text-ink">{w.name}</h2>
              <p className="text-sm font-semibold text-subtle">{w.role}</p>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase',
                    unavailable || w.availability === 'Currently Booked'
                      ? 'bg-rose-50 text-danger'
                      : 'bg-emerald-50 text-emerald-700',
                  )}
                >
                  <span className={cn('h-1.5 w-1.5 rounded-full', unavailable ? 'bg-danger' : 'bg-emerald-500')} />
                  {w.availability === 'Available 24/7' ? 'AVAILABLE' : w.availability || 'AVAILABLE'}
                </span>

                {w.isPartTimeAvailable && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase text-amber-900">
                    <Clock4 size={12} /> Part-time available
                  </span>
                )}
              </div>

              <p className="mt-2 text-xs font-bold uppercase tracking-wide text-muted">
                {w.gender ? String(w.gender).toUpperCase() : ''} {w.age ? `• ${w.age} Y/O` : ''}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-3 divide-x divide-line rounded-2xl bg-canvas py-3 text-center">
              <div className="px-2">
                <p className="label-xs">Rating</p>
                <p className="text-sm font-bold text-ink">★ {w.rating || '0.0'}</p>
                <p className="text-[11px] text-subtle">({w.reviewCount || 0})</p>
              </div>
              <div className="px-2">
                <p className="label-xs">Location</p>
                <p className="truncate text-sm font-bold text-ink">{w.location ? String(w.location).toUpperCase() : 'N/A'}</p>
              </div>
              <div className="px-2">
                <p className="label-xs">Salary</p>
                <p className="text-sm font-bold text-ink">Rs.{w.salary}</p>
              </div>
            </div>

            <Button
              size="lg"
              fullWidth
              className="mt-5"
              disabled={ctaDisabled}
              onClick={() => {
                if (!workerId) {
                  NotificationHelper.showError('Worker details are still loading. Please try again.');
                  return;
                }
                router.push(`/client/workers/${workerId}/interview?name=${encodeURIComponent(w.name || 'this worker')}`);
              }}
            >
              {ctaLabel}
            </Button>
          </Card>
        </aside>

        {/* ---------------- Tabbed content ---------------- */}
        <section>
          <Tabs items={tabs.map((t) => ({ label: t, value: t }))} value={activeTab} onChange={setActiveTab} className="mb-5" />

          {activeTab === 'Overview' && (
            <div className="space-y-5">
              <Card>
                <h3 className="mb-3 text-base font-bold text-ink">Trust &amp; Verification</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {certification ? (
                    <Link
                      href={`/client/workers/${workerId}/certification`}
                      className="flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 transition hover:bg-sky-100"
                    >
                      <Award size={22} className="text-sky-700" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-sky-900">Verified Training</span>
                        <span className="block truncate text-xs text-sky-700">
                          {certification.certificateTitle ? `${certification.certificateTitle} · ` : ''}
                          Certified by {certification.companyName || 'Verified Company'}
                        </span>
                      </span>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 rounded-xl border border-line bg-canvas p-4">
                      <Award size={22} className="text-muted" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-subtle">No Verified Training</span>
                        <span className="block truncate text-xs text-muted">
                          This worker has no company training certificate yet
                        </span>
                      </span>
                    </div>
                  )}

                  <Link
                    href={`/certificate/${workerId}?viewerRole=Client`}
                    className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 transition hover:bg-rose-100"
                  >
                    <ShieldQuestion size={22} className="text-rose-700" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-rose-900">Criminal Background Check</span>
                      <span className="block truncate text-xs text-rose-700">
                        View the worker&apos;s police character certificate
                      </span>
                    </span>
                  </Link>
                </div>
              </Card>

              <Card>
                <h3 className="mb-2 text-base font-bold text-ink">About Worker</h3>
                <p className="text-sm leading-relaxed text-subtle">{w.bio || 'No description provided.'}</p>
              </Card>

              <Card>
                <h3 className="mb-3 text-base font-bold text-ink">Primary Skills</h3>
                {w.primarySkills && w.primarySkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {w.primarySkills.map((skill: string, index: number) => (
                      <span key={index} className="rounded-full bg-brand-light px-3 py-1.5 text-xs font-bold text-brand">
                        {String(skill).toUpperCase()}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-subtle">No primary skills listed.</p>
                )}
              </Card>

              <Card>
                <h3 className="mb-3 text-base font-bold text-ink">Part-Time Services</h3>
                {w.partTimeSkills && w.partTimeSkills.length > 0 ? (
                  <div className="space-y-4">
                    {w.partTimeSkills.map((item: any, index: number) => (
                      <div key={index}>
                        <p className="label-xs mb-1.5">{String(item.categoryName).toUpperCase()}</p>
                        <div className="flex flex-wrap gap-2">
                          {(item.skills || []).map((skill: string, sIndex: number) => (
                            <span key={sIndex} className="rounded-full bg-canvas px-3 py-1.5 text-xs font-semibold text-subtle">
                              {String(skill).toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-subtle">No part-time skills added.</p>
                )}
              </Card>
            </div>
          )}

          {activeTab === 'Experience' && (
            <div className="space-y-5">
              <Card>
                <h3 className="mb-4 text-base font-bold text-ink">Work History</h3>
                {w.experiences && w.experiences.length > 0 ? (
                  <ol className="relative space-y-5 border-l border-line pl-5">
                    {w.experiences.map((exp: any, index: number) => (
                      <li key={index} className="relative">
                        <span
                          className={cn(
                            'absolute -left-[26px] top-1.5 h-3 w-3 rounded-full ring-4 ring-white',
                            index === 0 ? 'bg-brand' : 'bg-line',
                          )}
                        />
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="text-sm font-bold text-ink">{exp.title}</p>
                          <p className="text-xs font-semibold text-subtle">{exp.period}</p>
                        </div>
                        <p className="mt-1 text-sm text-subtle">{exp.details}</p>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-subtle">No experience history available.</p>
                )}
              </Card>

              <Card>
                <h3 className="mb-3 text-base font-bold text-ink">Booking Procedure</h3>
                <ol className="space-y-3">
                  {[
                    'Send an interview request with preferred timings.',
                    'Wait for status confirmation or callback.',
                    'Finalize details & start service.',
                  ].map((text, index) => (
                    <li key={text} className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white">
                        {index + 1}
                      </span>
                      <span className="text-sm text-subtle">{text}</span>
                    </li>
                  ))}
                </ol>
              </Card>
            </div>
          )}

          {activeTab === 'Reviews' && (
            <div className="space-y-4">
              <Card className="flex items-center gap-4">
                <p className="text-4xl font-extrabold text-ink">{w.rating || '0.0'}</p>
                <div>
                  <RatingStars value={w.rating} size={18} />
                  <p className="mt-1 text-xs text-subtle">Based on {w.reviewCount || 0} reviews</p>
                </div>
              </Card>

              {w.reviews && w.reviews.length > 0 ? (
                w.reviews.map((rev: any, index: number) => (
                  <Card key={index}>
                    <div className="flex items-start justify-between gap-3">
                      {rev.clientId ? (
                        <Link href={`/client/profile?clientId=${rev.clientId}`} className="text-sm font-bold text-brand underline">
                          {rev.reviewerName}
                        </Link>
                      ) : (
                        <span className="text-sm font-bold text-ink">{rev.reviewerName}</span>
                      )}
                      <RatingStars value={rev.rating} />
                    </div>
                    <p className="mt-1 text-xs text-subtle">{rev.date}</p>
                    {rev.workedPeriod && (
                      <p className="mt-1 text-xs font-semibold text-brand">Worked: {rev.workedPeriod}</p>
                    )}
                    <p className="mt-2 text-sm italic text-subtle">&ldquo;{rev.comment}&rdquo;</p>
                  </Card>
                ))
              ) : (
                <EmptyState title="No reviews submitted yet." icon={<MessageSquare size={24} />} />
              )}
            </div>
          )}

          {activeTab === 'Time Slots' && (
            <Card>
              <h3 className="text-base font-bold text-ink">Part-Time Available Slots</h3>
              <p className="mb-4 mt-1 text-xs text-subtle">
                This worker is within your radius ({w.distanceKm} km away).
              </p>
              {w.timeSlots && w.timeSlots.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {w.timeSlots.map((slot: any) => (
                    <div key={slot.id} className="flex items-center gap-3 rounded-xl border border-line bg-canvas px-4 py-3">
                      <Clock4 size={18} className="text-brand" />
                      <span className="text-sm font-bold text-ink">
                        {slot.startTime} - {slot.endTime}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No active time slots defined for this worker." icon={<Clock4 size={24} />} />
              )}
            </Card>
          )}

          {activeTab === 'Habits' && (
            <Card>
              <h3 className="text-base font-bold text-ink">Habits</h3>
              <p className="mb-4 mt-1 text-sm text-subtle">
                Declared by the worker — worth knowing before they work in your home.
              </p>
              <div className="flex flex-wrap gap-2">
                {(w.habits || []).map((habit: any) => (
                  <span
                    key={habit.id ?? habit.name}
                    className="inline-flex items-center gap-1.5 rounded-full bg-brand-light px-3 py-1.5 text-xs font-bold text-brand"
                  >
                    <CheckCircle2 size={14} />
                    {habit.name}
                  </span>
                ))}
              </div>
              <p className="mt-5 text-sm text-subtle">
                The filter on the search screen lets you show only workers who match the habits you need — for example a
                non-smoker who is comfortable with pets.
              </p>
            </Card>
          )}
        </section>
      </div>

    </div>
  );
}
