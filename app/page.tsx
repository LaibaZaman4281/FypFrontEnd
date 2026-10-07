'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Storage from '@/lib/storage';
import { ROLE_HOME } from '@/components/features/shell/navigation';
import type { UserRole } from '@/types';

/**
 * Entry point.
 *
 * The RN app had `initialRouteName="Login"` and routed by role right after a
 * successful login. This preserves that exactly: an existing session lands on
 * its role home, everyone else goes to /login. No new landing-page feature.
 */
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = Storage.getItem('userToken');
    const role = Storage.getItem('userRole') as UserRole | null;

    if (token && role && ROLE_HOME[role]) {
      router.replace(ROLE_HOME[role]);
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas">
      <Image src="/images/logo.png" alt="Maid & Servant Online" width={72} height={72} className="rounded-2xl" priority />
      <p className="text-sm font-semibold text-subtle">Loading your workspace…</p>
    </main>
  );
}
