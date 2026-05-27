'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, getDocs, doc, collectionGroup, query } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Download, Loader2, ShieldCheck, CheckCircle2, History, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { isCoreAdmin } from '@/lib/core-admins';
import type { UserProfile } from '@/lib/case-schema';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function BackupsPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  useEffect(() => {
    if (!isUserLoading && !isProfileLoading && userProfile) {
      const isAdmin = userProfile.role === 'admin' || isCoreAdmin(user?.email);
      if (!isAdmin) {
        router.replace('/dashboard');
      }
    }
  }, [isUserLoading, isProfileLoading, userProfile, user, router]);

  const handleGenerateBackup = async () => {
    if (!firestore || !user) return;
    setIsExporting(true);

    try {
      // 1. Obtener todas las colecciones principales en paralelo
      const [casesSnap, notificationsSnap, usersSnap, novedadesSnap] = await Promise.all([
        getDocs(collection(firestore, 'cases')),
        getDocs(collection(firestore, 'notifications')),
        getDocs(collection(firestore, 'users')),
        getDocs(query(collectionGroup(firestore, 'novedades')))
      ]);

      const casesData = casesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const notificationsData = notificationsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const usersData = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const novedadesData = novedadesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 2. Estructurar el objeto de respaldo según REQ010
      const backupObject = {
        generatedAt: new Date().toISOString(),
        generatedBy: user.email || 'unknown',
        collections: {
          cases: casesData,
          notifications: notificationsData,
          novedades: novedadesData,
          users: usersData
        },
        metadata: {
          totalCases: casesData.length,
          totalNotifications: notificationsData.length,
          totalUsers: usersData.length,
          totalNovedades: novedadesData.length
        }
      };

      // 3. Crear el archivo para descarga
      const jsonString = JSON.stringify(backupObject, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = format(new Date(), "yyyy-MM-dd_HHmm");
      
      link.href = url;
      link.download = `renacer-backup-${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Respaldo Generado",
        description: "Se han exportado satisfactoriamente todas las colecciones del sistema.",
      });
    } catch (error) {
      console.error("Backup failed:", error);
      toast({
        variant: "destructive",
        title: "Error de Exportación",
        description: "No se pudieron obtener los datos de Firestore. Verifique los permisos.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Verificando nivel de acceso...</p>
      </div>
    );
  }

  const isAdmin = userProfile?.role === 'admin' || isCoreAdmin(user?.email);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
          <ShieldCheck className="h-16 w-16 text-destructive opacity-20" />
          <h1 className="text-2xl font-bold font-headline">Acceso Denegado</h1>
          <p className="text-muted-foreground max-w-md">Solo el personal administrativo de nivel 1 puede gestionar las copias de seguridad del sistema.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-primary font-headline flex items-center gap-2">
          <Database className="h-8 w-8" />
          Copias de Seguridad
        </h1>
        <p className="text-muted-foreground">Gestión de integridad y portabilidad de datos institucionales.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-primary/10 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Exportación Completa
            </CardTitle>
            <CardDescription>
              Genera un archivo JSON con todos los casos, usuarios, novedades y notificaciones registrados hasta el momento.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/30 p-6 rounded-2xl border border-dashed border-primary/20 flex flex-col items-center text-center gap-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <Database className="h-12 w-12 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold uppercase tracking-widest text-primary">Base de Datos Central</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Esta operación descargará un archivo confidencial con la información de todos los beneficiarios.
                </p>
              </div>
              <Button 
                size="lg" 
                onClick={handleGenerateBackup}
                disabled={isExporting}
                className="bg-primary hover:bg-primary/90 text-white font-bold h-12 px-8 mt-4"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    EXTRAYENDO DATOS...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-5 w-5" />
                    GENERAR RESPALDO AHORA
                  </>
                )}
              </Button>
            </div>

            <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-xl border border-orange-200">
              <AlertCircle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-orange-800 uppercase tracking-tight">Aviso de Seguridad</p>
                <p className="text-[11px] text-orange-700 leading-relaxed">
                  Los respaldos contienen datos personales protegidos por ley. El uso indebido de esta información es responsabilidad del administrador. Guarde el archivo en un lugar seguro y cifrado.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-primary/10 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <History className="h-4 w-4" /> Resumen Técnico
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-muted-foreground/60">Entidades Incluidas</p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-[9px]">CASOS</Badge>
                  <Badge variant="outline" className="text-[9px]">USUARIOS</Badge>
                  <Badge variant="outline" className="text-[9px]">NOVEDADES</Badge>
                  <Badge variant="outline" className="text-[9px]">NOTIFICACIONES</Badge>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-muted-foreground/60">Formato de Salida</p>
                <p className="text-sm font-mono font-bold text-primary">.JSON (UTF-8)</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6 text-center space-y-3">
              <CheckCircle2 className="h-8 w-8 text-primary mx-auto" />
              <p className="text-xs font-medium text-primary">
                Sistema de integridad verificado para exportaciones de gran escala.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
