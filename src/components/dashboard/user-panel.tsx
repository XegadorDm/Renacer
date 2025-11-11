'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';

interface UserProfile {
    firstName: string;
    lastName: string;
    role: string;
}

export function UserPanel() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = format(currentTime, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
  const formattedTime = format(currentTime, 'HH:mm:ss');

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return '...';
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }

  const roleTranslations: { [key: string]: string } = {
    'admin': 'Administrador',
    'case-worker': 'Trabajador Social'
  };

  const displayRole = userProfile?.role ? roleTranslations[userProfile.role] || userProfile.role : 'Cargando rol...';

  if (isUserLoading || isProfileLoading) {
      return (
          <Card>
              <CardHeader>
                  <CardTitle>Información de Usuario</CardTitle>
                  <CardDescription>Resumen de tu sesión actual.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                      <Skeleton className="h-16 w-16 rounded-full" />
                      <div className='space-y-2'>
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-40" />
                          <Skeleton className="h-5 w-24" />
                      </div>
                  </div>
                  <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="font-medium text-muted-foreground">Fecha de visita:</span>
                            <span className="font-mono text-foreground capitalize">{formattedDate}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium text-muted-foreground">Hora exacta:</span>
                            <span className="font-mono text-foreground">{formattedTime}</span>
                        </div>
                    </div>
              </CardContent>
          </Card>
      )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Información de Usuario</CardTitle>
        <CardDescription>Resumen de tu sesión actual.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user?.photoURL || `https://picsum.photos/seed/${user?.uid}/100/100`} alt="Avatar" />
            <AvatarFallback>{getInitials(userProfile?.firstName, userProfile?.lastName)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold">{userProfile?.firstName} {userProfile?.lastName}</h3>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <Badge variant="secondary" className="mt-1">{displayRole}</Badge>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="font-medium text-muted-foreground">Fecha de visita:</span>
            <span className="font-mono text-foreground capitalize">{formattedDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-muted-foreground">Hora exacta:</span>
            <span className="font-mono text-foreground">{formattedTime}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
