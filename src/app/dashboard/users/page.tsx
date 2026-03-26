'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useUser, updateDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldCheck, UserCog, Mail, IdCard, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/lib/case-schema';

export default function UsersManagementPage() {
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: users, isLoading } = useCollection<UserProfile>(usersQuery);

  const handleRoleChange = (userId: string, newRole: string) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', userId);
    updateDocumentNonBlocking(userRef, { role: newRole });
    toast({
      title: "Rol Actualizado",
      description: `El rol del usuario ha sido cambiado a ${newRole === 'admin' ? 'Administrador' : 'Asesor'}.`,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 py-4">
        <Skeleton className="h-10 w-64" />
        <Card>
            <CardHeader><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-full mt-2" /></CardHeader>
            <CardContent><Skeleton className="h-96 w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  // Verificar si es admin (ya se hace en el layout para el menú, pero aquí por seguridad visual)
  const isAdmin = users?.find(u => u.id === authUser?.uid)?.role === 'admin';

  if (!isAdmin && users) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
              <ShieldCheck className="h-16 w-16 text-destructive opacity-20" />
              <h1 className="text-2xl font-bold">Acceso Denegado</h1>
              <p className="text-muted-foreground max-w-md">Solo los administradores pueden gestionar las solicitudes de cuentas y roles de usuario.</p>
          </div>
      )
  }

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary font-headline flex items-center gap-2">
            <UserCog className="h-8 w-8" />
            Solicitudes de Cuentas
          </h1>
          <p className="text-muted-foreground">Gestiona el acceso y los roles del personal de Renacer.</p>
        </div>
        <Badge variant="outline" className="h-8 px-4 font-bold border-primary/20 bg-primary/5 text-primary uppercase">
            {users?.length || 0} Usuarios Registrados
        </Badge>
      </div>

      <Card className="border-primary/10 shadow-lg overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="text-lg">Personal del Sistema</CardTitle>
          <CardDescription>Activa cuentas y asigna permisos de administrador o asesor.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-bold text-primary uppercase text-[10px] tracking-widest pl-6">Usuario</TableHead>
                  <TableHead className="font-bold text-primary uppercase text-[10px] tracking-widest">Identificación</TableHead>
                  <TableHead className="font-bold text-primary uppercase text-[10px] tracking-widest">Contacto</TableHead>
                  <TableHead className="font-bold text-primary uppercase text-[10px] tracking-widest">Género</TableHead>
                  <TableHead className="font-bold text-primary uppercase text-[10px] tracking-widest pr-6">Rol / Permisos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users && users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id} className="hover:bg-primary/5 transition-colors">
                      <TableCell className="pl-6">
                        <div className="flex flex-col">
                            <span className="font-bold text-sm uppercase">{user.firstName} {user.lastName}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{user.id}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs">
                            <IdCard className="h-3 w-3 text-muted-foreground" />
                            <span className="font-semibold uppercase">{user.documentType} {user.documentNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span>{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[9px] uppercase font-bold py-0 h-5">
                            {user.gender === 'male' ? 'Masculino' : user.gender === 'female' ? 'Femenino' : 'Otro'}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-6">
                        <Select 
                            defaultValue={user.role} 
                            onValueChange={(val) => handleRoleChange(user.id, val)}
                            disabled={user.id === authUser?.uid} // No auto-cambiarse el rol
                        >
                          <SelectTrigger className="w-[160px] h-9 text-xs font-bold border-primary/20 bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="case-worker" className="text-xs font-medium">Asesor (Case Worker)</SelectItem>
                            <SelectItem value="admin" className="text-xs font-medium">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                        {user.id === authUser?.uid && (
                            <p className="text-[9px] text-muted-foreground mt-1 italic">Tu propia cuenta</p>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-32 text-muted-foreground italic">
                      No hay usuarios registrados en el sistema.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
