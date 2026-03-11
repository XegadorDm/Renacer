'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * MÓDULO REMOVIDO DEFINITIVAMENTE.
 * Redirige automáticamente al dashboard principal.
 */
export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-pulse text-muted-foreground">
        Redirigiendo al Dashboard...
      </div>
    </div>
  );
}