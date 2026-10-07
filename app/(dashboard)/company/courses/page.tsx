'use client';

/**
 * Port of `assets/components/Company/CompanyCourseDashboardScreen.js`
 * (frontend `a26103d`) — the company landing page, matching `LoginScreen.js:121`.
 *
 * Same-for-same with the RN screen:
 *  - header: worker-directory icon (left) · "Course Management" +
 *    "Build skills. Certify achievement." (centre) · "+" and the company avatar
 *    (right, avatar → company dashboard)
 *  - THREE scope tabs: Active · Past · Archived (`?scope=` drives the query)
 *  - parallel load of `/api/company/courses?scope=` and `/api/company/dashboard`,
 *    where the dashboard call is used ONLY for the header picture (which is also
 *    cached back into storage) — no statistics are shown on this screen
 *  - course card: school icon, name, date range, class timings, chevron, then a
 *    footer with "{n} enrolled · {n} completed" and a delete button
 *  - delete fires immediately with the server's message in the toast (no
 *    confirmation step, exactly like the mobile screen)
 *  - empty state: "No {scope} courses" + "Create a professional training course
 *    to get started."
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  CalendarRange,
  ChevronRight,
  Clock4,
  GraduationCap,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Tabs from '@/components/ui/Tabs';
import { Loader } from '@/components/ui/States';
import { CompanyCourseService } from '@/lib/api/courses';
import NotificationHelper from '@/lib/hooks/useNotification';
import Storage from '@/lib/storage';
import type { CourseSummary } from '@/types/courses';

type Scope = 'active' | 'past' | 'archived';
const SCOPES: Scope[] = ['active', 'past', 'archived'];

export default function CompanyCoursesPage() {
  const router = useRouter();

  const [scope, setScope] = useState<Scope>('active');
  const [items, setItems] = useState<CourseSummary[]>([]);
  const [companyPicture, setCompanyPicture] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [result, company] = await Promise.all([
        CompanyCourseService.listCourses(scope),
        CompanyCourseService.getDashboard().catch(() => null),
      ]);

      setItems(Array.isArray(result) ? result : []);

      const freshPicture = company?.picture || Storage.getItem('userPicture');
      setCompanyPicture(freshPicture ?? null);
      if (freshPicture) Storage.setItem('userPicture', freshPicture);
      if (company?.companyName) Storage.setItem('userName', company.companyName);
    } catch (error: any) {
      NotificationHelper.showError(error?.message || 'Could not load courses.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    load();
  }, [load]);

  /** RN removes the course straight away — no confirmation dialog. */
  const removeCourse = async (courseId: number) => {
    try {
      const result: any = await CompanyCourseService.deleteCourse(courseId);
      NotificationHelper.showSuccess(result?.message || 'Course removed.');
      load();
    } catch (error: any) {
      NotificationHelper.showError(error?.message || 'Could not remove the course.');
    }
  };

  return (
    <div>
      {/* ───── Header band (mirrors the RN blue header bar) ───── */}
      <header className="mb-6 flex flex-wrap items-center gap-4 rounded-3xl bg-course px-6 py-5 text-white">
        <Link
          href="/company/directory"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 transition hover:bg-white/25"
          aria-label="Worker directory"
          title="Worker Directory"
        >
          <Users size={22} />
        </Link>

        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Course Management</h1>
          <p className="text-sm text-white/80">Build skills. Certify achievement.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/company/courses/new')}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-course transition hover:bg-white/90"
            aria-label="Create course"
            title="Create course"
          >
            <Plus size={21} />
          </button>

          <Link href="/company/profile" aria-label="Company dashboard" title="Company Dashboard">
            <Avatar src={companyPicture} name={Storage.getItem('userName')} size="md" className="rounded-xl" ring={false} />
          </Link>
        </div>
      </header>

      {/* ───── Scope tabs: Active · Past · Archived ───── */}
      <Tabs
        items={SCOPES.map((value) => ({ label: value.charAt(0).toUpperCase() + value.slice(1), value }))}
        value={scope}
        onChange={(value) => setScope(value as Scope)}
        className="mb-5"
      />

      {loading ? (
        <Loader label="Loading courses…" />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-course-border bg-white/60 px-6 py-16 text-center">
          <BookOpen size={44} className="text-course" />
          <h3 className="mt-4 text-base font-bold text-course-ink">No {scope} courses</h3>
          <p className="mt-1 max-w-sm text-sm text-course-muted">
            Create a professional training course to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Card key={item.courseId} className="flex flex-col border-course-border" hoverable>
              <Link href={`/company/courses/${item.courseId}`} className="flex gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-course-pale text-course">
                  <GraduationCap size={24} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-bold text-course-ink">{item.courseName}</span>
                  <span className="mt-1.5 flex items-center gap-1.5 text-xs text-course-muted">
                    <CalendarRange size={13} />
                    {item.startDate} — {item.endDate}
                  </span>
                  <span className="mt-1 flex items-center gap-1.5 text-xs text-course-muted">
                    <Clock4 size={13} />
                    {item.classTimings}
                  </span>
                </span>
                <ChevronRight size={22} className="shrink-0 self-center text-course-muted" />
              </Link>

              <div className="mt-4 flex items-center justify-between border-t border-course-border pt-3">
                <span className="text-xs font-semibold text-course-muted">
                  {item.enrollmentCount ?? 0} enrolled · {item.completedCount ?? 0} completed
                </span>
                <button
                  type="button"
                  onClick={() => removeCourse(item.courseId)}
                  className="rounded-lg p-2 text-course-danger transition hover:bg-rose-50"
                  aria-label="Delete course"
                >
                  <Trash2 size={19} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
