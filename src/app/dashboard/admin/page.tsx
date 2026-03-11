'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * MÓDULO ELIMINADO SEGÚN SOLICITUD DEL USUARIO.
 * Redirige automáticamente al dashboard principal para evitar errores de sintaxis y permisos.
 */
export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return null;
}