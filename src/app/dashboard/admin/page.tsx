'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir fuera de administración ya que el módulo ha sido desactivado.
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center py-20">
      <p className="text-muted-foreground">Redirigiendo...</p>
    </div>
  );
}
