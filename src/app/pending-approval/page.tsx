
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/logo';
import { Loader2, ShieldAlert, LogOut, RefreshCcw } from 'lucide-react';
import type { UserProfile } from '@/lib/case-schema';

export default function PendingApprovalPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [isUserLoading, user, router]);

  useEffect(() => {
    if (userProfile && userProfile.status === 'approved') {
      router.replace('/dashboard');
    }
  }, [userProfile, router]);

  const handleLogout = async () => {
    if (auth) {
      await auth.signOut();
      router.push('/login');
    }
  };

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-muted/30 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-2xl border-primary/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
            <Logo className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-headline">Acceso Restringido</CardTitle>
          <CardDescription>
            {userProfile?.status === 'rejected' 
              ? "Tu solicitud ha sido rechazada." 
              : "Tu cuenta está pendiente de aprobación administrativa."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          {userProfile?.status === 'rejected' ? (
            <div className="p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 space-y-2">
              <ShieldAlert className="h-8 w-8 mx-auto" />
              <p className="text-sm font-medium">
                Lo sentimos, tu solicitud de registro ha sido rechazada. Contacta con el equipo administrativo para más información.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-primary/5 text-foreground rounded-xl border border-primary/10 space-y-4">
              <RefreshCcw className="h-8 w-8 mx-auto text-primary animate-spin-slow" />
              <p className="text-sm">
                Un administrador debe revisar y aprobar tu cuenta antes de que puedas acceder al sistema.
              </p>
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            <Button variant="outline" onClick={() => window.location.reload()} className="w-full font-bold">
               VERIFICAR ESTADO
            </Button>
            <Button variant="ghost" onClick={handleLogout} className="w-full text-muted-foreground hover:text-destructive">
               <LogOut className="mr-2 h-4 w-4" /> CERRAR SESIÓN
            </Button>
          </div>
        </CardContent>
      </Card>
      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
}
