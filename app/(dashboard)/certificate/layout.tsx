'use client';

import AppShell from '@/components/features/shell/AppShell';
import { Loader } from '@/components/ui/States';
import { useRequireRole } from '@/lib/hooks/useRequireRole';
import Storage from '@/lib/storage';
import type { UserRole } from '@/types';

/**
 * `CharacterCertificateScreen` is shared in the RN app: a client opens it from
 * the worker profile (`viewerRole: 'Client'`), the worker sees their own, and
 * police open it from the portal. The guard therefore accepts all three.
 */
export default function CertificateLayout({ children }: { children: React.ReactNode }) {
  const { checked, allowed } = useRequireRole(['Client', 'Worker', 'Police']);
  const role = (Storage.getItem('userRole') as UserRole) || 'Client';

  if (!checked) return <Loader label="Checking your session…" />;
  if (!allowed) return null;

  return <AppShell role={role}>{children}</AppShell>;
}