'use client';

import AppShell from '@/components/features/shell/AppShell';
import { Loader } from '@/components/ui/States';
import { useRequireRole } from '@/lib/hooks/useRequireRole';
import Storage from '@/lib/storage';
import type { UserRole } from '@/types';

/** The map is shared by Clients and Workers, exactly like MapScreen was. */
export default function MapLayout({ children }: { children: React.ReactNode }) {
  const { checked, allowed } = useRequireRole(['Client', 'Worker']);
  const role = (Storage.getItem('userRole') as UserRole) || 'Client';

  if (!checked) return <Loader label="Checking your session…" />;
  if (!allowed) return null;

  return <AppShell role={role}>{children}</AppShell>;
}
