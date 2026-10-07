'use client';

/**
 * Port of `assets/components/Company/CompanyDashboardScreen.js` (frontend `a26103d`).
 *
 * Same-for-same with the RN screen:
 *  - `GET /api/company/dashboard`, caching `picture` → `userPicture` and
 *    `companyName` → `userName`
 *  - hero: brand icon · "COMPANY DASHBOARD" · logout icon (top row), then the
 *    company picture with a verified tick, name, licence number, address and an
 *    Edit button that hands off to the signup screen in Company edit mode
 *  - "Overview" with exactly TWO stat cards:
 *      Total Courses   → value totalCourses,          hint "{activeCourses} active"
 *      Enrolled Workers→ value uniqueEnrolledWorkers, hint "{totalEnrollments} enrollments"
 *  - a "Training completions" card: completedEnrollments with the sentence
 *    "{n} course enrollments completed and eligible for certification."
 *  - "Manage" with the blue Course Management tile → /company/courses
 *  - failure state: "Unable to load Company dashboard." + a Try again button
 *
 * Note: the RN screen's bottom logout button is commented out in source; logout
 * lives only in the hero row, so that is where it is here too.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Award,
  Building2,
  Check,
  ChevronRight,
  GraduationCap,
  LogOut,
  Pencil,
  Users,
} from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState, Loader } from '@/components/ui/States';
import { CompanyCourseService } from '@/lib/api/courses';
import NotificationHelper from '@/lib/hooks/useNotification';
import { useSession } from '@/lib/hooks/useSession';
import Storage from '@/lib/storage';
import type { CompanyProfile } from '@/types/courses';

export default function CompanyProfilePage() {
  const router = useRouter();
  const { logout } = useSession();

  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await CompanyCourseService.getDashboard();
      setProfile(data);
      if (data.picture) Storage.setItem('userPicture', data.picture);
      if (data.companyName) Storage.setItem('userName', data.companyName);
    } catch (error: any) {
      NotificationHelper.showError(error?.message || 'Unable to load Company dashboard.');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const editProfile = () => {
    if (!profile) return;
    // Same `initialData` shape the RN screen handed to Signup
    window.sessionStorage.setItem(
      'editProfileDraft',
      JSON.stringify({
        role: 'Company',
        initialData: {
          id: profile.id ?? Storage.getItem('companyId'),
          companyName: profile.companyName,
          licenseNumber: profile.licenseNumber,
          companyAddress: profile.companyAddress,
          email: profile.email,
          phoneNo: profile.phoneNo,
          picture: profile.picture,
        },
      }),
    );
    router.push('/signup?edit=1');
  };

  if (loading && !profile) return <Loader label="Loading company dashboard…" />;

  if (!profile) {
    return (
      <EmptyState
        title="Unable to load Company dashboard."
        icon={<Building2 size={24} />}
        action={<Button onClick={load}>Try again</Button>}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* ───── Hero ───── */}
      <Card className="mb-6 border-course-border">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-course-pale text-course">
            <Building2 size={22} />
          </span>
          <p className="flex-1 text-[11px] font-black uppercase tracking-[0.12em] text-course-muted">
            Company Dashboard
          </p>
          <button
            type="button"
            onClick={() => setConfirmLogout(true)}
            className="rounded-xl p-2.5 text-danger transition hover:bg-rose-50"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut size={20} />
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-5">
          <span className="relative">
            <Avatar src={profile.picture} name={profile.companyName} size="xl" className="rounded-2xl" ring={false} />
            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-course-success text-white">
              <Check size={14} />
            </span>
          </span>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-extrabold text-course-ink">{profile.companyName}</h1>
            <p className="text-sm font-semibold text-course">{profile.licenseNumber}</p>
            <p className="mt-1 line-clamp-2 text-sm text-course-muted">{profile.companyAddress}</p>
          </div>

          <Button variant="secondary" icon={<Pencil size={15} />} onClick={editProfile}>
            Edit
          </Button>
        </div>
      </Card>

      {/* ───── Overview — two cards, exactly as RN ───── */}
      <h2 className="mb-3 text-base font-bold text-course-ink">Overview</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-course-border">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-course-pale text-course">
            <GraduationCap size={22} />
          </span>
          <p className="mt-3 text-3xl font-extrabold text-course-ink">{profile.totalCourses ?? 0}</p>
          <p className="text-sm font-bold text-course-ink">Total Courses</p>
          <p className="mt-0.5 text-xs text-course-muted">{profile.activeCourses ?? 0} active</p>
        </Card>

        <Card className="border-course-border">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-course-success">
            <Users size={22} />
          </span>
          <p className="mt-3 text-3xl font-extrabold text-course-ink">{profile.uniqueEnrolledWorkers ?? 0}</p>
          <p className="text-sm font-bold text-course-ink">Enrolled Workers</p>
          <p className="mt-0.5 text-xs text-course-muted">{profile.totalEnrollments ?? 0} enrollments</p>
        </Card>
      </div>

      {/* ───── Training completions ───── */}
      <Card className="mt-4 flex items-center gap-4 border-course-border">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-course-pale text-course">
          <Award size={25} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-course-ink">Training completions</p>
          <p className="mt-0.5 text-sm text-course-muted">
            {profile.completedEnrollments ?? 0} course enrollments completed and eligible for certification.
          </p>
        </div>
        <p className="text-3xl font-extrabold text-course-ink">{profile.completedEnrollments ?? 0}</p>
      </Card>

      {/* ───── Manage ───── */}
      <h2 className="mb-3 mt-6 text-base font-bold text-course-ink">Manage</h2>
      <Link href="/company/courses">
        <Card hoverable className="flex items-center gap-4 border-0 bg-course text-white">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <GraduationCap size={27} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-base font-extrabold">Course Management</p>
            <p className="mt-0.5 text-sm text-white/80">
              Create courses, manage enrolled workers and issue certificates.
            </p>
          </div>
          <ChevronRight size={25} />
        </Card>
      </Link>

      <ConfirmDialog
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={() => {
          setConfirmLogout(false);
          logout();
        }}
        title="Log out"
        message="Are you sure you want to log out?"
        confirmLabel="Log out"
        tone="danger"
      />
    </div>
  );
}
