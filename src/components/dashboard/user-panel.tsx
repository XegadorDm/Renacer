'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, collection, getDocs } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, Download, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
    firstName: string;
    lastName: string;
    role: string;
}

export function UserPanel() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const savedBackup = localStorage.getItem('renacer_last_backup');
    if (savedBackup) setLastBackup(savedBackup);
    return () => clearInterval(timer);
  }, []);

  const handleExportBackup = async () => {
    if (!firestore) return;
    setIsExporting(true);
    try {
      const casesRef = collection(firestore, 'cases');
      const snapshot = await getDocs(casesRef);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = format(new Date(), "yyyy-MM-dd_HHmm");
      
      link.href = url;
      link.download = `respaldo_casos_renacer_${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      const now = new Date().toISOString();
      localStorage.setItem('renacer_last_backup', now);
      setLastBackup(now);

      toast({
        title: "Respaldo Generado",
        description: "Los datos de los casos han sido exportados exitosamente.",
      });
    } catch (error) {
      console.error("Backup failed:", error);
      toast({
        variant: "destructive",
        title: "Error al exportar",
        description: "No se pudieron obtener los datos de la base de datos.",
      });
    } finally {
      setIsExporting(false);
    }
  };

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

  const isAdmin = userProfile?.role === 'admin';
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
              </CardContent>
          </Card>
      )
  }

  return (
    <Card className="h-full shadow-md border-primary/10">
      <CardHeader>
        <CardTitle className="text-xl">Información de Usuario</CardTitle>
        <CardDescription>Resumen de tu sesión actual.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/20">
            <AvatarImage src={user?.photoURL || `https://picsum.photos/seed/${user?.uid}/100/100`} alt="Avatar" />
            <AvatarFallback>{getInitials(userProfile?.firstName, userProfile?.lastName)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-bold">{userProfile?.firstName} {userProfile?.lastName}</h3>
            <p className="text-sm text-muted-foreground truncate max-w-[180px]">{user?.email}</p>
            <Badge variant="secondary" className="mt-1 bg-primary/10 text-primary border-primary/20">{displayRole}</Badge>
          </div>
        </div>

        {isAdmin && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Database className="h-4 w-4" /> Respaldo de Seguridad
            </h4>
            <Button 
              onClick={handleExportBackup} 
              disabled={isExporting}
              className="w-full bg-accent hover:bg-accent/90 text-white font-bold"
            >
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? "GENERANDO..." : "GENERAR RESPALDO"}
            </Button>
            <p className="text-[10px] text-muted-foreground text-center italic">
              Último respaldo: {lastBackup ? format(new Date(lastBackup), "d/MM/yyyy HH:mm", { locale: es }) : "Nunca"}
            </p>
          </div>
        )}

        <Alert className="bg-primary/5 border-primary/20 text-foreground py-3">
            <ShieldAlert className="h-4 w-4 text-primary" />
            <AlertTitle className="text-[10px] font-bold uppercase tracking-tighter">Debug de Permisos</AlertTitle>
            <AlertDescription className="text-[10px] font-mono mt-1">
                UID: <span className="text-primary font-bold">{user?.uid}</span><br/>
                ROL: "<span className="text-accent font-bold underline">{userProfile?.role || 'null'}</span>"
            </AlertDescription>
        </Alert>

        <div className="space-y-2 text-sm pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="font-medium text-muted-foreground">Fecha:</span>
            <span className="font-mono text-foreground capitalize text-[10px] bg-muted px-2 py-0.5 rounded">{formattedDate}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-muted-foreground">Hora:</span>
            <span className="font-mono text-foreground text-[10px] bg-muted px-2 py-0.5 rounded">{formattedTime}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
