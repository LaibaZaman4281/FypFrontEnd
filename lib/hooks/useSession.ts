'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Storage from '@/lib/storage';
import type { Session, UserRole } from '@/types';

function read(): Session {
  return {
    token: Storage.getItem('userToken'),
    role: (Storage.getItem('userRole') as UserRole | null) ?? null,
    name: Storage.getItem('userName'),
    picture: Storage.getItem('userPicture'),
    address: Storage.getItem('userAddress'),
    phone: Storage.getItem('userPhone'),
    email: Storage.getItem('userEmail'),
    clientId: Storage.getItem('clientId'),
    workerId: Storage.getItem('workerId'),
    companyId: Storage.getItem('companyId'),
    policeId: Storage.getItem('policeId'),
  };
}

const EMPTY: Session = {
  token: null, role: null, name: null, picture: null, address: null,
  phone: null, email: null, clientId: null, workerId: null, companyId: null, policeId: null,
};

/**
 * Reads the same AsyncStorage keys the RN app wrote at login.
 * `ready` guards against SSR/hydration mismatches (localStorage is client-only).
 */
export function useSession() {
  const router = useRouter();
  const [session, setSession] = useState<Session>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(read());
    setReady(true);
  }, []);

  const refresh = useCallback(() => setSession(read()), []);

  const logout = useCallback(() => {
    Storage.clearSession();
    setSession(EMPTY);
    router.replace('/login');
  }, [router]);

  return { session, ready, refresh, logout };
}
