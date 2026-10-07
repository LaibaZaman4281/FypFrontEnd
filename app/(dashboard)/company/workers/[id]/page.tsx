'use client';

/**
 * Port of `assets/components/Company/WorkerDetailsVerificationScreen.js`.
 * Same GetWorkerDetails/{workerId} load, the same certificate-title validation,
 * the same companyId resolution from storage, and the same IssueCertificate
 * body ({ workerId, companyId, certificateTitle, trainingEvaluationNotes }).
 */

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Award, MapPin, Phone } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { Input, Textarea } from '@/components/ui/Field';
import { Loader } from '@/components/ui/States';
import { DirectoryService } from '@/lib/api/services';
import NotificationHelper from '@/lib/hooks/useNotification';
import Storage from '@/lib/storage';

export default function WorkerVerificationPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const workerId = params.id;

  const [worker, setWorker] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [certificateTitle, setCertificateTitle] = useState('');
  const [trainingNotes, setTrainingNotes] = useState('');

  const fetchWorkerDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await DirectoryService.getWorkerDetails(workerId);
      setWorker(data);
    } catch (error: any) {
      NotificationHelper.showError(error?.message || 'Could not load worker details.');
    } finally {
      setIsLoading(false);
    }
  }, [workerId]);

  useEffect(() => {
    if (workerId) fetchWorkerDetails();
  }, [workerId, fetchWorkerDetails]);

  const handleIssueCertificate = async () => {
    if (!certificateTitle.trim()) {
      NotificationHelper.showError('Please enter a certificate title.');
      return;
    }

    try {
      setIsSubmitting(true);
      const companyIdRaw = Storage.getItem('companyId') || Storage.getItem('userId');
      const companyId = parseInt(companyIdRaw ?? '', 10);

      if (!companyId || Number.isNaN(companyId)) {
        NotificationHelper.showError('Session expired: Please log out and log in again.');
        setIsSubmitting(false);
        return;
      }

      await DirectoryService.issueCertificate({
        workerId: parseInt(workerId, 10),
        companyId,
        certificateTitle: certificateTitle.trim(),
        trainingEvaluationNotes: trainingNotes.trim(),
      });

      NotificationHelper.showSuccess('Certificate issued successfully.', () => router.push('/company/directory'));
    } catch (error: any) {
      NotificationHelper.showError(error?.message || 'Failed to issue certificate.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <Loader label="Loading worker details…" />;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Worker Verification" subtitle="Review the profile, then issue a training certificate." back backHref="/company/directory" />

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <Card>
          <div className="flex flex-col items-center text-center">
            <Avatar src={worker?.picture} name={worker?.name} size="xl" />
            <h2 className="mt-3 text-lg font-extrabold text-ink">{worker?.name}</h2>
            <p className="text-sm text-subtle">{worker?.roleTitle || worker?.role}</p>
          </div>

          <div className="mt-5 space-y-2 text-sm text-subtle">
            {worker?.cnic && (
              <p>
                <span className="label-xs mr-1">CNIC</span> {worker.cnic}
              </p>
            )}
            {worker?.phone && (
              <p className="flex items-center gap-2">
                <Phone size={15} className="text-brand" /> {worker.phone}
              </p>
            )}
            {(worker?.location || worker?.address) && (
              <p className="flex items-start gap-2">
                <MapPin size={15} className="mt-0.5 text-rose-500" /> {worker.location || worker.address}
              </p>
            )}
          </div>

          {worker?.categories?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {worker.categories.map((cat: string, index: number) => (
                <span key={index} className="rounded-full bg-canvas px-2.5 py-1 text-[11px] font-semibold text-subtle">
                  {cat}
                </span>
              ))}
            </div>
          )}
        </Card>

        <div className="space-y-5">
          {worker?.experiences?.length > 0 && (
            <Card>
              <h3 className="mb-3 text-base font-bold text-ink">Work history</h3>
              <ul className="space-y-3">
                {worker.experiences.map((exp: any, index: number) => (
                  <li key={index} className="rounded-xl bg-canvas p-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-bold text-ink">{exp.title || exp.workAt}</p>
                      <p className="text-xs font-semibold text-subtle">{exp.period || exp.duration}</p>
                    </div>
                    <p className="mt-1 text-sm text-subtle">{exp.details || exp.expDetail}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Award size={20} className="text-brand" />
              <h3 className="text-base font-bold text-ink">Issue training certificate</h3>
            </div>

            <div className="space-y-4">
              <Input
                label="Certificate title"
                placeholder="e.g. Professional Driver Training"
                value={certificateTitle}
                onChange={(e) => setCertificateTitle(e.target.value)}
              />
              <Textarea
                label="Training & evaluation notes"
                placeholder="What was covered and how the worker performed…"
                value={trainingNotes}
                onChange={(e) => setTrainingNotes(e.target.value)}
              />
              <Button size="lg" fullWidth loading={isSubmitting} onClick={handleIssueCertificate}>
                Issue Certificate
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
