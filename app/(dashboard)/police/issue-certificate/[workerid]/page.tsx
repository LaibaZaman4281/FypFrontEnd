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
import { AlertTriangle, Check, Hash, Info, ShieldCheck } from 'lucide-react';
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

/**
 * Mirrors RN's `${result.message} (${result.detail})` formatting. `ApiError.body`
 * keeps the raw response, so the server's diagnostic text survives intact even
 * though `ApiError.message` is capped at 300 chars.
 */
function withDetail(error: any, fallback: string) {
  const base = error?.message || fallback;
  const body = error?.body;
  const detail =
    body && typeof body === 'object' && typeof (body as any).detail === 'string'
      ? (body as any).detail.trim()
      : '';
  return detail ? `${base} (${detail})` : base;
}

export default function IssueCharacterCertificatePage() {
  const router = useRouter();

  /*
   * The route folder is `[workerid]` (all lower-case). `useParams()` is keyed by
   * the EXACT folder name, so reading only `params.workerId` produced `undefined`
   * → `Number(undefined)` → `NaN` → `GET api/Police/GetWorkerDetails/NaN`, which
   * ASP.NET Core cannot bind to `int workerId` and rejects with 400. That is the
   * "Request failed (400)" toast: the officer id never reached the request.
   * Accept every spelling so the page works whatever case the folder uses.
   */
  const params = useParams<Record<string, string | string[]>>();
  const rawWorkerId = params?.workerId ?? params?.workerid ?? params?.workerID ?? params?.id;
  const workerId = Number(Array.isArray(rawWorkerId) ? rawWorkerId[0] : rawWorkerId);
  const isValidWorkerId = Number.isInteger(workerId) && workerId > 0;

  const [worker, setWorker] = useState<any>(null);
  const [existingCert, setExistingCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [certificateNo, setCertificateNo] = useState('');
  const [characterStatus, setCharacterStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [cnicVerified, setCnicVerified] = useState(false);

  const load = useCallback(async () => {
    // Never call the API with a missing id — a NaN/blank segment is a 400 from
    // model binding, not a meaningful server answer.
    if (!isValidWorkerId) {
      setLoadError('This screen needs a worker id in the address, e.g. /police/issue-certificate/1010.');
      setLoading(false);
      return;
    }

    setLoadError('');
    setLoading(true);
    try {
      const data: any = await PoliceService.getWorkerDetails(workerId);
      setWorker(data);
      const cert = data?.existingCertificate ?? null;
      setExistingCert(cert);

      // RN (`IssueCharacterCertificateScreen.js:53-58`) pre-fills the renewal
      // form from the existing certificate. Only fill blank fields so a retry
      // never overwrites what the officer already typed.
      if (cert) {
        setCertificateNo((prev) => prev || cert.certificateNo || '');
        setCharacterStatus((prev) => prev || cert.characterStatus || '');
        setRemarks((prev) => prev || cert.remarks || '');
      }
    } catch (error: any) {
      setLoadError(withDetail(error, 'Failed to load worker profile details.'));
      NotificationHelper.showError(withDetail(error, 'Failed to load worker profile details.'));
    } finally {
      setLoading(false);
    }
  }, [workerId, isValidWorkerId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async () => {
    if (!isValidWorkerId || !worker) {
      NotificationHelper.showError('Worker details are not loaded yet. Go back and open the worker again.');
      return;
    }
    if (!characterStatus) {
      NotificationHelper.showError('Please select the character status.');
      return;
    }
    if (!cnicVerified) {
      NotificationHelper.showError("Please confirm you have verified the worker's CNIC.");
      return;
    }

    setSubmitError('');
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
      // RN does the same: `result.detail ? `${result.message} (${result.detail})` : ...`
      // (`IssueCharacterCertificateScreen.js:106`). The backend puts the real SQL
      // / constraint error in `detail`; dropping it leaves only the useless
      // "Could not issue the certificate. Please try again." toast.
      const message = withDetail(error, 'Failed to issue certificate.');
      setSubmitError(message);
      NotificationHelper.showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader label="Loading worker profile…" />;

  // The failure used to be swallowed by a toast, leaving a phantom "Worker
  // Profile / CNIC: N/A" card. Show what actually happened instead.
  if (loadError || !worker) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Issue Character Certificate" back backHref="/police/portal" />
        <Card className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <AlertTriangle size={22} />
          </div>
          <h2 className="text-lg font-extrabold text-ink">Could not load this worker</h2>
          <p className="mx-auto max-w-md text-sm text-subtle">
            {loadError || 'The worker profile could not be loaded.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <Button variant="outline" onClick={load}>
              Try again
            </Button>
            <Button onClick={() => router.push('/police/portal')}>Back to verification portal</Button>
          </div>
        </Card>
      </div>
    );
  }

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

        {submitError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
            <p className="flex items-start gap-2 text-xs font-bold text-rose-700">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" /> The certificate was not issued
            </p>
            <p className="mt-1 select-all break-words font-mono text-[11px] leading-relaxed text-rose-700">
              {submitError}
            </p>
            <p className="mt-1 text-[11px] text-rose-600/80">
              This is the server&apos;s own message — copy it if you need to report the problem.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
