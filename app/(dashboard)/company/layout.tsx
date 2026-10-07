'use client';

import AppShell from '@/components/features/shell/AppShell';
import { Loader } from '@/components/ui/States';
import { useRequireRole } from '@/lib/hooks/useRequireRole';

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  const { checked, allowed } = useRequireRole('Company');
  if (!checked) return <Loader label="Checking your session…" />;
  if (!allowed) return null;
  return <AppShell role="Company">{children}</AppShell>;
}
