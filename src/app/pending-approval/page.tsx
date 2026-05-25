'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AuthLayout } from '@/components/auth/auth-layout';
import { Button } from '@/components/ui/button';
import { Clock, LogOut, RefreshCcw } from 'lucide-react';
import type { UserProfile } from '@/lib/case-schema';

export default function PendingApprovalPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc<UserProfile>(userDocRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
    if (userProfile && userProfile.status === 'approved') {
      router.replace('/dashboard');
    }
  }, [user, isUserLoading, userProfile, router]);

  const handleLogout = async () => {
    if (auth) {
      await auth.signOut();
      router.push('/login');
    }
  };

  return (
    <AuthLayout
      title="Cuenta en Revisión"
      description="Tu solicitud ha sido recibida y está siendo procesada."
    >
      <div className="flex flex-col items-center py-6 text-center space-y-6">
        <div className="bg-orange-100 p-4 rounded-full animate-pulse">
            <Clock className="h-12 w-12 text-orange-600" />
        </div>
        
        <div className="space-y-2">
            <p className="text-sm text-muted-foreground leading-relaxed">
                Por motivos de seguridad, un administrador debe validar tu identidad y asignar tus permisos de acceso antes de que puedas ingresar al panel de control.
            </p>
            <p className="text-xs font-medium text-orange-700">
                Este proceso suele tomar menos de 24 horas hábiles.
            </p>
        </div>

        <div className="w-full flex flex-col gap-3">
            <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
                <RefreshCcw className="mr-2 h-4 w-4" /> Verificar Estado
            </Button>
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
            </Button>
        </div>
      </div>
    </AuthLayout>
  );
}
