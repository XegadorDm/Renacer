'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Página de administración inactiva.
 * Redirige al dashboard principal para evitar conflictos de acceso.
 */
export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return null;
}