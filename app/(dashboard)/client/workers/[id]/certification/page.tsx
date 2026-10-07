'use client';

/**
 * Port of `assets/components/Client/WorkerCertificationDetail.js`.
 * Same GetWorkerCertificateDetail/{workerId} call, the same fallback evaluation
 * copy when the record has no notes, and the same "CERT-{id}" verification line.
 */

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Award, Building2, CalendarDays, ShieldCheck } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { EmptyState, Loader } from '@/components/ui/States';
import { DirectoryService } from '@/lib/api/services';

const FALLBACK_NOTES =
  'Completed an accredited driver training program covering theoretical traffic regulations, highway maneuvering, ' +
  'reverse parking, and emergency braking procedures. Certified with a practical understanding of vehicle dynamics ' +
  'and modern road safety standards.';

export default function WorkerCertificationPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const workerId = params.id;

  const [certData, setCertData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCertificate = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await DirectoryService.getWorkerCertificateDetail(workerId);
      setCertData(data);
    } catch {
      setCertData(null);
    } finally {
      setIsLoading(false);
    }
  }, [workerId]);

  useEffect(() => {
    fetchCertificate();
  }, [fetchCertificate]);

  if (isLoading) return <Loader label="Loading certificate…" />;

  if (!certData) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title="Verified Training Certificate" back />
        <EmptyState
          title="No Certificate Record Found"
          icon={<Award size={24} />}
          action={<Button onClick={() => router.back()}>Go Back</Button>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Verified Training Certificate" back />

      <div className="space-y-5">
        <Card className="flex items-center gap-4">
          <span className="relative">
            <Avatar src={certData.workerPicture} name={certData.workerName} size="lg" />
            <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white bg-success" />
          </span>
          <div>
            <h2 className="text-lg font-extrabold text-ink">{certData.workerName}</h2>
            <p className="label-xs">Verified personnel</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-white">
            <Building2 size={20} />
          </span>
          <div>
            <p className="label-xs">Issuing authority</p>
            <p className="text-base font-bold text-ink">{certData.companyName}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-subtle">
              <CalendarDays size={13} /> Issued Date: {certData.issuedDate}
            </p>
          </div>
        </Card>

        <Card className="text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand text-white">
            <ShieldCheck size={32} />
          </span>
          <h3 className="mt-4 text-xl font-extrabold text-ink">{certData.certificateTitle}</h3>

          <div className="my-5 divider" />

          <p className="label-xs">Evaluation &amp; training notes</p>
          <p className="mx-auto mt-2 max-w-xl text-sm italic leading-relaxed text-subtle">
            &quot;
            {certData.evaluationNotes && certData.evaluationNotes.trim().length > 0
              ? certData.evaluationNotes
              : FALLBACK_NOTES}
            &quot;
          </p>

          <div className="mt-8">
            <p className="font-[cursive] text-lg text-ink">Digital Signature</p>
            <span className="mx-auto mt-1 block h-px w-48 bg-line" />
            <p className="mt-2 text-xs font-semibold text-muted">
              Verification ID: CERT-{certData.certificateId || '1'}
            </p>
          </div>
        </Card>

        <Button variant="outline" fullWidth onClick={() => router.back()}>
          Close Details
        </Button>
      </div>
    </div>
  );
}
