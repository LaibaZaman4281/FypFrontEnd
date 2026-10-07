'use client';

import AppShell from '@/components/features/shell/AppShell';
import { Loader } from '@/components/ui/States';
import { useRequireRole } from '@/lib/hooks/useRequireRole';

/** Client portal guard - equivalent to the RN "no token -> replace('Login')" rule. */
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { checked, allowed } = useRequireRole('Client');

  if (!checked) return <Loader label="Checking your session…" />;
  if (!allowed) return null;

  return <AppShell role="Client">{children}</AppShell>;
}
