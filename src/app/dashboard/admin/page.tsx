'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * MÓDULO DESACTIVADO PERMANENTEMENTE.
 * Se redirige al dashboard para evitar errores de permisos y sintaxis.
 */
export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground italic">Redirigiendo...</p>
    </div>
  );
}