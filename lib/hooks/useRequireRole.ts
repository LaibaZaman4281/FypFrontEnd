'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Storage from '@/lib/storage';
import type { UserRole } from '@/types';

/**
 * Client-side route guard. Replaces the RN pattern of every screen doing
 *   if (!token) { showError('Session not found'); navigation.replace('Login'); }
 * The rule itself is unchanged: no token (or wrong role) -> back to /login.
 */
export function useRequireRole(role: UserRole | UserRole[]) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const token = Storage.getItem('userToken');
    const current = Storage.getItem('userRole');
    const accepted = Array.isArray(role) ? role : [role];

    if (!token || !current || !accepted.includes(current as UserRole)) {
      router.replace('/login');
      setAllowed(false);
    } else {
      setAllowed(true);
    }
    setChecked(true);
  }, [role, router]);

  return { checked, allowed };
}
