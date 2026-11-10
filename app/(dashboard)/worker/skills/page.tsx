'use client';

/**
 * Standalone route for `assets/components/Worker/AddSkillScreen.js`
 * (rewritten upstream in `a26103d`).
 *
 * Posts through the same `AccountCreation/UpdateWorker` multipart endpoint the
 * mobile app uses, now carrying BOTH payloads:
 *   skillsJson      → [{ CategoryId, SkillsId }]
 *   experiencesJson → [{ WorkAt, ExpDetail, Duration }]
 *
 * Existing skills/experience are pre-loaded from `GetWorkerDetail` so a save
 * never silently wipes them (the backend replaces both sets on update).
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { Loader } from '@/components/ui/States';
import SkillsBuilder, {
  type ExperienceRecord,
  type SkillRecord,
} from '@/components/features/skills/SkillsBuilder';
import { AccountService, DashboardService } from '@/lib/api/services';
import NotificationHelper from '@/lib/hooks/useNotification';
import Storage from '@/lib/storage';

export default function WorkerSkillsPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState<SkillRecord[]>([]);
  const [experiences, setExperiences] = useState<ExperienceRecord[]>([]);
  /* UpdateWorker assigns every scalar unconditionally, so anything omitted here is
     written as null/0. The detail we already load carries the real values. */
  const [profile, setProfile] = useState<any>(null);

  const load = useCallback(async () => {
    const workerId = Storage.getItem('workerId');
    if (!workerId) {
      router.replace('/login');
      return;
    }

    try {
      const data: any = await DashboardService.getWorkerDetail(workerId);
      setProfile(data);

      if (Array.isArray(data?.rawWorkerCategories)) {
        setSkills(
          data.rawWorkerCategories.map((wc: any) => ({
            CategoryId: Number(wc.CategoryId ?? wc.categoryId),
            SkillsId: Number(wc.SkillsId ?? wc.skillsId),
          })),
        );
      }

      if (Array.isArray(data?.rawExperiences)) {
        setExperiences(
          data.rawExperiences.map((e: any) => ({
            WorkAt: e.WorkAt || e.workAt || '',
            ExpDetail: e.ExpDetail || e.expDetail || '',
            Duration: e.Duration || e.duration || '',
          })),
        );
      }
    } catch {
      /* a fresh builder is still usable if the profile fails to load */
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (nextSkills: SkillRecord[], nextExperiences: ExperienceRecord[]) => {
    const workerId = Storage.getItem('workerId');
    if (!workerId) {
      NotificationHelper.showError('Session not found. Please login again.');
      router.replace('/login');
      return;
    }

    setBusy(true);
    try {
      const form = new FormData();
      form.append('WorkerId', workerId);
      /* Prefer the freshly loaded profile over localStorage: the stored identity is
         only written at login, so using it here used to revert a saved profile edit. */
      form.append('Name', profile?.name ?? Storage.getItem('userName') ?? '');
      form.append('Phone', profile?.phone ?? Storage.getItem('userPhone') ?? '');
      form.append('Address', profile?.address ?? Storage.getItem('userAddress') ?? '');
      form.append('Email', profile?.email ?? Storage.getItem('userEmail') ?? '');
      form.append('Password', '');
      form.append('Cnic', String(profile?.cnic ?? ''));
      form.append('Age', String(profile?.age ?? 0));
      form.append('Salary', String(profile?.salary ?? 0));
      form.append('Gender', String(profile?.gender ?? 'Male'));
      form.append('Bio', String(profile?.bio ?? ''));
      form.append('skillsJson', JSON.stringify(nextSkills));
      form.append('experiencesJson', JSON.stringify(nextExperiences));

      await AccountService.updateWorker(form);
      NotificationHelper.showSuccess('Skills saved successfully!');
      router.push('/worker/dashboard');
    } catch (error: any) {
      NotificationHelper.showError(error?.message || 'Could not save your skills.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loader label="Loading your skills…" />;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Skills & Experience"
        subtitle="Pick the categories and sub-skills clients search for, then log any work history."
        back
        backHref="/worker/dashboard"
      />

      <Card>
        <SkillsBuilder
          initialSkills={skills}
          initialExperiences={experiences}
          onSave={handleSave}
          saveLabel="Save Skills"
          busy={busy}
        />
      </Card>
    </div>
  );
}
