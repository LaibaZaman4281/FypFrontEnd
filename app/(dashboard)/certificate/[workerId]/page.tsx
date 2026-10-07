'use client';

/**
 * Port of `assets/components/Police/CharacterCertificateScreen.js`.
 *
 * Shared read-only view: the client reaches it from the worker profile's
 * background-check card, the worker from their own dashboard, police from the
 * portal. Unchanged: `GET /api/Police/GetWorkerCharacterCertificate/{workerId}`
 * and the three themes derived from the server's `status` field
 * (Verified / Expired / NotIssued), including the expiry warning box.
 */

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ShieldAlert, ShieldCheck, ShieldOff, TriangleAlert } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { Loader } from '@/components/ui/States';
import { PoliceService } from '@/lib/api/services';
import { cn } from '@/lib/utils/cn';
import type { CharacterCertificateResponse, CertificateStatus } from '@/types/courses';

const THEMES: Record<CertificateStatus, { text: string; bg: string; border: string; label: string; Icon: typeof ShieldCheck }> = {
  Verified: { text: 'text-green-800', bg: 'bg-green-100', border: 'border-green-300', label: 'POLICE VERIFIED', Icon: ShieldCheck },
  Expired: { text: 'text-amber-800', bg: 'bg-amber-100', border: 'border-amber-300', label: 'CERTIFICATE EXPIRED', Icon: ShieldAlert },
  NotIssued: { text: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200', label: 'NOT CERTIFIED', Icon: ShieldOff },
};

function DetailRow({ label, value, highlight }: { label: string; value?: string | null; highlight?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <span className="text-sm font-semibold text-subtle">{label}</span>
      <span className={cn('text-right text-sm font-bold', highlight ? 'text-success' : 'text-ink')}>{value || 'N/A'}</span>
    </div>
  );
}

function CharacterCertificate() {
  const params = useParams<{ workerId: string }>();
  const searchParams = useSearchParams();
  const viewerRole = searchParams.get('viewerRole');

  const [data, setData] = useState<CharacterCertificateResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setData(await PoliceService.getWorkerCharacterCertificate(params.workerId));
    } catch {
      /* same as RN: logged and ignored, the empty state covers it */
    } finally {
      setLoading(false);
    }
  }, [params.workerId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Loader label="Loading certificate…" />;

  const status = (data?.status || 'NotIssued') as CertificateStatus;
  const cert = data?.certificate;
  const theme = THEMES[status];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Character Certificate"
        subtitle={viewerRole === 'Client' ? 'Police background check for this worker' : undefined}
        back
      />

      <Card className="mb-5 flex items-center gap-4">
        <Avatar src={data?.workerPicture} name={data?.workerName} size="lg" />
        <div className="min-w-0">
          <h2 className="truncate text-lg font-extrabold text-ink">{data?.workerName || 'Worker'}</h2>
          <p className="truncate text-sm text-subtle">CNIC: {data?.workerCnic || 'N/A'}</p>
        </div>
      </Card>

      <div className={cn('mb-5 flex flex-col items-center rounded-2xl border px-6 py-8', theme.bg, theme.border)}>
        <theme.Icon size={44} className={theme.text} />
        <p className={cn('mt-3 text-sm font-black tracking-wide', theme.text)}>{theme.label}</p>
      </div>

      {cert ? (
        <Card>
          <h3 className="text-base font-bold text-ink">Police Character Certificate</h3>
          <div className="my-4 divider" />

          <DetailRow label="Certificate No." value={cert.certificateNo} />
          <DetailRow label="Character Status" value={cert.characterStatus} />
          <DetailRow label="Issued Date" value={cert.issuedDate} />
          <DetailRow label="Valid Until" value={cert.expiryDate} highlight={status === 'Verified'} />
          <DetailRow label="Issuing Station" value={cert.issuingStation} />
          <DetailRow label="Officer Badge" value={cert.issuingBadge} />

          {cert.remarks && (
            <>
              <p className="label-xs mt-4 mb-1">Remarks</p>
              <p className="text-sm leading-relaxed text-subtle">{cert.remarks}</p>
            </>
          )}

          {status === 'Expired' && (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              <TriangleAlert size={16} className="mt-0.5 shrink-0" />
              This certificate has expired and is no longer valid. Ask the worker to get it renewed.
            </p>
          )}
        </Card>
      ) : (
        <Card className="flex flex-col items-center py-12 text-center">
          <ShieldOff size={48} className="text-slate-300" />
          <p className="mt-3 max-w-sm text-sm text-subtle">
            This worker has not been issued a police character certificate yet.
          </p>
        </Card>
      )}
    </div>
  );
}

export default function CharacterCertificatePage() {
  return (
    <Suspense fallback={null}>
      <CharacterCertificate />
    </Suspense>
  );
}