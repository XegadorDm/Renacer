'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Esta página ya no es necesaria dado que se han eliminado las restricciones de aprobación,
 * pero redirigimos al dashboard por seguridad si alguien accede por URL.
 */
export default function PendingApprovalPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return null;
}