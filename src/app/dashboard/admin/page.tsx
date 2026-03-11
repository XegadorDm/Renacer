'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Página de administración inactiva.
 * Redirige al dashboard principal para evitar cualquier error de renderizado.
 */
export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Redirigiendo...</p>
    </div>
  );
}