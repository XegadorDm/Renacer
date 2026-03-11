'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Este módulo ha sido desactivado permanentemente para evitar errores de permisos
 * y permitir que el equipo se enfoque exclusivamente en la gestión de casos.
 */
export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir inmediatamente al dashboard principal
    router.replace('/dashboard');
  }, [router]);

  return null;
}