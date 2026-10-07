'use client';

/**
 * Public certificate verification — no login required.
 *
 * Backs onto `GET /api/course-certificates/verify/{code}`, the only endpoint in
 * the backend marked `[AllowAnonymous]` (added in backend `7eac93e`). There is
 * no React Native screen for it; this page exists so the certificate code
 * printed on a worker's certificate is actually checkable by an employer.
 *
 * Deliberately outside the (dashboard) route group: no session, no app shell.
 */

import { Suspense, useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BadgeCheck, CircleAlert, Search, ShieldQuestion } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Input } from '@/components/ui/Field';
import { CertificateService } from '@/lib/api/courses';
import { cn } from '@/lib/utils/cn';
import { formatDate } from '@/lib/utils/format';
import type { CourseCertificate } from '@/types/courses';

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <span className="text-sm font-semibold text-subtle">{label}</span>
      <span className="text-right text-sm font-bold text-ink">{value || '—'}</span>
    </div>
  );
}

function VerifyCertificate() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code') || '';

  const [code, setCode] = useState(initialCode);
  const [result, setResult] = useState<CourseCertificate | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const lookup = useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    setLoading(true);
    setNotFound(false);
    setResult(null);

    try {
      const data = await CertificateService.verifyByCode(trimmed);
      setResult(data);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, []);

  // Deep link: /verify?code=FYP-COURSE-XXXXXXXXXXXX resolves immediately
  useEffect(() => {
    if (initialCode) lookup(initialCode);
  }, [initialCode, lookup]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    router.replace(`/verify?code=${encodeURIComponent(code.trim())}`);
    lookup(code);
  };

  const valid = result?.isValid;

  return (
    <main className="min-h-screen bg-canvas px-4 py-12 sm:px-6">
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-8 flex flex-col items-center text-center">
          <Image src="/images/logo.png" alt="" width={56} height={56} className="rounded-2xl" priority />
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-ink">Verify a Training Certificate</h1>
          <p className="mt-1 max-w-md text-sm text-subtle">
            Enter the certificate code printed on a worker&apos;s certificate to confirm it was issued by a
            registered company and is still valid.
          </p>
        </header>

        <Card className="mb-6">
          <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                label="Certificate code"
                placeholder="FYP-COURSE-XXXXXXXXXXXX"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                icon={<Search size={18} />}
              />
            </div>
            <Button type="submit" size="lg" loading={loading} disabled={!code.trim()}>
              Verify
            </Button>
          </form>
        </Card>

        {searched && notFound && (
          <Card className="flex flex-col items-center py-10 text-center">
            <ShieldQuestion size={44} className="text-muted" />
            <p className="mt-3 text-base font-bold text-ink">Certificate not found</p>
            <p className="mt-1 max-w-sm text-sm text-subtle">
              No certificate matches that code. Check for typos — codes look like
              <span className="font-mono"> FYP-COURSE-A1B2C3D4E5F6</span>.
            </p>
          </Card>
        )}

        {result && (
          <Card className={cn('border-2', valid ? 'border-course' : 'border-rose-300')}>
            <div
              className={cn(
                'mb-5 flex flex-col items-center rounded-xl px-6 py-6 text-center',
                valid ? 'bg-emerald-50' : 'bg-rose-50',
              )}
            >
              {valid ? (
                <BadgeCheck size={44} className="text-course-success" />
              ) : (
                <CircleAlert size={44} className="text-course-danger" />
              )}
              <p className={cn('mt-2 text-sm font-black uppercase tracking-wide', valid ? 'text-course-success' : 'text-course-danger')}>
                {valid ? 'Verified certificate' : 'Certificate revoked'}
              </p>
            </div>

            <Row label="Certificate code" value={result.certificateCode} />
            <Row label="Issued to" value={result.workerName} />
            <Row label="Course" value={result.courseName} />
            <Row label="Issued by" value={result.companyName} />
            <Row label="Issued on" value={result.issuedDateUtc ? formatDate(result.issuedDateUtc) : null} />
            {result.completionDateUtc && (
              <Row label="Completed on" value={formatDate(result.completionDateUtc)} />
            )}
          </Card>
        )}

        <p className="mt-8 text-center text-sm text-subtle">
          Have an account?{' '}
          <Link href="/login" className="font-bold text-brand hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyCertificate />
    </Suspense>
  );
}
