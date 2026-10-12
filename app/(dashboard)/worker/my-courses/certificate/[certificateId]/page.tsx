'use client';

/**
 * Port of `assets/components/Worker/CourseCertificateScreen.js`.
 *
 * Same-for-same with the RN screen: GET /api/course-certificates/{certificateId},
 * the "CERTIFICATE OF COMPLETION" card (seal, presented-to, course, issuer,
 * monospace verification code, issued date) and the validity chip —
 * "Verified certificate" (green) or "Certificate revoked" (red).
 */

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AlertCircle, Award, BadgeCheck } from 'lucide-react';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { Loader } from '@/components/ui/States';
import { CertificateService } from '@/lib/api/courses';
import NotificationHelper from '@/lib/hooks/useNotification';
import type { CourseCertificate } from '@/types/courses';

export default function WorkerCourseCertificatePage() {
  const params = useParams<{ certificateId: string }>();
  const certificateId = params.certificateId;

  const [data, setData] = useState<CourseCertificate | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const result = await CertificateService.getCourseCertificate(certificateId);
      setData(result);
    } catch (error: any) {
      NotificationHelper.showError(error?.message || 'Failed to load the certificate.');
    } finally {
      setLoading(false);
    }
  }, [certificateId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Digital Certificate" back backHref="/worker/my-courses" />

      {loading ? (
        <Loader label="Loading certificate…" />
      ) : data ? (
        <Card className="border-2 border-brand text-center">
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-light text-brand">
            <Award size={44} />
          </span>

          <p className="mt-4 text-sm font-extrabold tracking-[0.18em] text-brand">CERTIFICATE OF COMPLETION</p>
          <p className="mt-4 text-sm text-subtle">This certificate is proudly presented to</p>
          <p className="mt-2 break-words text-3xl font-extrabold text-ink">{data.workerName}</p>
          <p className="mt-4 text-sm text-subtle">for successfully completing</p>
          <p className="mt-2 break-words text-xl font-extrabold text-brand">{data.courseName}</p>
          <p className="mt-5 text-sm font-bold text-ink">Issued by {data.companyName}</p>

          <div className="my-6 h-px w-full bg-line" />

          <p className="font-mono text-sm font-bold text-ink">{data.certificateCode}</p>
          <p className="mt-2 text-xs text-subtle">
            Issued {data.issuedDateUtc ? new Date(data.issuedDateUtc).toLocaleDateString() : '—'}
          </p>

          <span
            className={`mt-5 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold ${
              data.isValid ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
            }`}
          >
            {data.isValid ? <BadgeCheck size={18} /> : <AlertCircle size={18} />}
            {data.isValid ? 'Verified certificate' : 'Certificate revoked'}
          </span>
        </Card>
      ) : null}
    </div>
  );
}
