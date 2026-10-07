'use client';

import AppShell from '@/components/features/shell/AppShell';
import { Loader } from '@/components/ui/States';
import { useRequireRole } from '@/lib/hooks/useRequireRole';

/** Worker portal guard - same rule as the RN "Session not found" redirect. */
export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  const { checked, allowed } = useRequireRole('Worker');

  if (!checked) return <Loader label="Checking your session…" />;
  if (!allowed) return null;

  return <AppShell role="Worker">{children}</AppShell>;
}
