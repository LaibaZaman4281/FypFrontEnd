'use client';

/**
 * Port of `assets/components/Police/IssueCharacterCertificateScreen.js`.
 * Replaces the retired `FileCriminalRecordScreen` / `/police/file-record` route.
 *
 * Unchanged: `GET /api/Police/GetWorkerDetails/{workerId}` (worker + any
 * existing certificate), the three character statuses, the renewal notice when
 * a certificate already exists, both validations (status required, CNIC
 * confirmation required), the exact POST body, and the success toast that
 * includes the server-returned expiry before navigating back.
 *
 * Note the officer id is NOT sent — the backend reads it from the JWT.
 */

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Check, Hash, Info, ShieldCheck } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { Loader } from '@/components/ui/States';
import { PoliceService } from '@/lib/api/services';
import NotificationHelper from '@/lib/hooks/useNotification';
import { cn } from '@/lib/utils/cn';

const CHARACTER_STATUSES = ['Clear - No Record', 'Good Character', 'Verified - Satisfactory'];

export default function IssueCharacterCertificatePage() {
  const router = useRouter();
  const params = useParams<{ workerId: string }>();
  const workerId = Number(params.workerId);

  const [worker, setWorker] = useState<any>(null);
  const [existingCert, setExistingCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [certificateNo, setCertificateNo] = useState('');
  const [characterStatus, setCharacterStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [cnicVerified, setCnicVerified] = useState(false);

  const load = useCallback(async () => {
    try {
      const data: any = await PoliceService.getWorkerDetails(workerId);
      setWorker(data);
      setExistingCert(data?.existingCertificate ?? null);
    } catch (error: any) {
      NotificationHelper.showError(error?.message || 'Failed to load worker profile details.');
    } finally {
      setLoading(false);
    }
  }, [workerId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async () => {
    if (!characterStatus) {
      NotificationHelper.showError('Please select the character status.');
      return;
    }
    if (!cnicVerified) {
      NotificationHelper.showError("Please confirm you have verified the worker's CNIC.");
      return;
    }

    setSubmitting(true);
    try {
      const result: any = await PoliceService.issueCharacterCertificate({
        workerId,
        certificateNo: certificateNo.trim(), // blank → server auto-generates
        characterStatus,
        remarks: remarks.trim(),
        verifiedCnic: worker?.cnic || '',
        cnicVerified,
      });

      NotificationHelper.showSuccess(`${result?.message} (valid until ${result?.expiryDate})`, () =>
        router.push('/police/portal'),
      );
    } catch (error: any) {
      NotificationHelper.showError(error?.message || 'Failed to issue certificate.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader label="Loading worker profile…" />;

  const isRenewal = existingCert && existingCert.isValid;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={isRenewal ? 'Renew Character Certificate' : 'Issue Character Certificate'}
        back
        backHref="/police/portal"
      />

      <Card className="mb-5 flex items-center gap-4">
        <Avatar src={worker?.picture} name={worker?.name} size="lg" />
        <div className="min-w-0">
          <h2 className="truncate text-lg font-extrabold text-ink">{worker?.name || 'Worker Profile'}</h2>
          <p className="truncate text-sm text-subtle">CNIC: {worker?.cnic || 'N/A'}</p>
        </div>
      </Card>

      {existingCert && (
        <p className="mb-5 flex items-start gap-2 rounded-xl bg-teal-50 p-4 text-sm text-teal-900">
          <Info size={16} className="mt-0.5 shrink-0 text-teal-700" />
          {existingCert.isValid
            ? `A valid certificate exists (until ${existingCert.expiryDate}). Submitting will renew it for another 5 years.`
            : `The previous certificate expired on ${existingCert.expiryDate}. Submitting will issue a fresh 5-year certificate.`}
        </p>
      )}

      <Card className="space-y-5">
        <Input
          label="Certificate Reference No."
          placeholder="Leave blank to auto-generate"
          value={certificateNo}
          onChange={(e) => setCertificateNo(e.target.value)}
          icon={<Hash size={18} />}
        />

        <Select
          label="Character Status *"
          value={characterStatus}
          onChange={(e) => setCharacterStatus(e.target.value)}
        >
          <option value="">Select character status</option>
          {CHARACTER_STATUSES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>

        <Textarea
          label="Remarks / Verification Detail"
          placeholder="Enter background verification detail, references checked, station notes…"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />

        <label
          className={cn(
            'flex cursor-pointer items-start gap-3 rounded-xl p-4 transition',
            cnicVerified ? 'bg-teal-50' : 'bg-canvas',
          )}
        >
          <input
            type="checkbox"
            checked={cnicVerified}
            onChange={(e) => setCnicVerified(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-line text-teal-700 focus:ring-teal-600/30"
          />
          <span className="text-sm text-ink">
            <span className="flex items-center gap-1.5 font-bold">
              <Check size={15} /> CNIC verification confirmed
            </span>
            I confirm I have physically verified this worker&apos;s CNIC ({worker?.cnic || 'N/A'}) at the station.
          </span>
        </label>

        <Button size="lg" fullWidth icon={<ShieldCheck size={18} />} loading={submitting} onClick={handleSubmit}>
          {isRenewal ? 'Renew Certificate' : 'Issue Certificate'}
        </Button>
      </Card>
    </div>
  );
}
