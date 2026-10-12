// 'use client';

// import AppShell from '@/components/features/shell/AppShell';
// import { Loader } from '@/components/ui/States';
// import { useRequireRole } from '@/lib/hooks/useRequireRole';

// export default function PoliceLayout({ children }: { children: React.ReactNode }) {
//   const { checked, allowed } = useRequireRole('Police');
//   if (!checked) return <Loader label="Checking your session…" />;
//   if (!allowed) return null;
//   return <AppShell role="Police">{children}</AppShell>;
// }
'use client';

import AppShell from '@/components/features/shell/AppShell';
import { Loader } from '@/components/ui/States';
import { useRequireRole } from '@/lib/hooks/useRequireRole';

export default function PoliceLayout({ children }: { children: React.ReactNode }) {
  const { checked, allowed } = useRequireRole('Police');
  if (!checked) return <Loader label="Checking your session…" />;
  if (!allowed) return null;
  return <AppShell role="Police">{children}</AppShell>;
}
