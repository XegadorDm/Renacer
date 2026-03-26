
'use client';

import { useFirestore, useCollection, useUser, updateDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ShieldCheck, UserCog, Mail, IdCard, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/lib/case-schema';
import { cn } from '@/lib/utils';

export default function UsersManagementPage() {
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: users, isLoading } = useCollection<UserProfile>(usersQuery);

  const handleUpdateStatus = (userId: string, newStatus: string) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', userId);
    updateDocumentNonBlocking(userRef, { status: newStatus });
    toast({
      title: "Estado Actualizado",
      description: `El usuario ahora está ${newStatus === 'approved' ? 'aprobado' : 'rechazado'}.`,
    });
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', userId);
    updateDocumentNonBlocking(userRef, { role: newRole });
    toast({
      title: "Rol Actualizado",
      description: `El rol ha sido cambiado a ${newRole === 'admin' ? 'Administrador' : 'Asesor'}.`,
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

  // Ordenar para mostrar pendientes primero
  const sortedUsers = [...(users || [])].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return 0;
  });

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary font-headline flex items-center gap-2">
            <UserCog className="h-8 w-8" />
            Gestión de Personal
          </h1>
          <p className="text-muted-foreground">Activa cuentas y asigna permisos de acceso al sistema Renacer.</p>
        </div>
      </div>

      <Card className="border-primary/10 shadow-lg overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="text-lg">Solicitudes y Miembros</CardTitle>
          <CardDescription>Gestiona el acceso de nuevos asesores y administradores.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-bold text-primary uppercase text-[10px] tracking-widest pl-6">Usuario</TableHead>
                  <TableHead className="font-bold text-primary uppercase text-[10px] tracking-widest">Identificación</TableHead>
                  <TableHead className="font-bold text-primary uppercase text-[10px] tracking-widest">Estado</TableHead>
                  <TableHead className="font-bold text-primary uppercase text-[10px] tracking-widest">Rol</TableHead>
                  <TableHead className="font-bold text-primary uppercase text-[10px] tracking-widest text-right pr-6">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.map((user) => (
                  <TableRow 
                    key={user.id} 
                    className={cn(
                        "hover:bg-primary/5 transition-colors",
                        user.status === 'pending' && "bg-orange-50/50"
                    )}
                  >
                    <TableCell className="pl-6 py-4">
                      <div className="flex flex-col">
                          <span className="font-bold text-sm uppercase flex items-center gap-2">
                              {user.firstName} {user.lastName}
                              {user.id === authUser?.uid && <Badge variant="outline" className="text-[8px] h-4">Tú</Badge>}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                          <IdCard className="h-3 w-3" />
                          <span>{user.documentType?.toUpperCase()} {user.documentNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.status === 'approved' ? 'default' : user.status === 'pending' ? 'secondary' : 'destructive'}
                        className={cn(
                            "text-[9px] uppercase font-black py-0 h-5",
                            user.status === 'approved' && "bg-green-600",
                            user.status === 'pending' && "bg-orange-100 text-orange-700 animate-pulse border-orange-200"
                        )}
                      >
                        {user.status === 'approved' ? 'Aprobado' : user.status === 'pending' ? 'Pendiente' : 'Rechazado'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select 
                        defaultValue={user.role} 
                        onValueChange={(val) => handleRoleChange(user.id, val)}
                        disabled={user.id === authUser?.uid || user.status !== 'approved'}
                      >
                        <SelectTrigger className="w-[140px] h-8 text-[10px] font-bold border-primary/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="case-worker" className="text-xs">Asesor</SelectItem>
                          <SelectItem value="admin" className="text-xs text-accent font-bold">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right pr-6 space-x-2">
                      {user.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            className="h-7 px-3 text-[10px] font-black uppercase"
                            onClick={() => handleUpdateStatus(user.id, 'rejected')}
                          >
                            <XCircle className="h-3 w-3 mr-1" /> Rechazar
                          </Button>
                          <Button 
                            size="sm" 
                            className="h-7 px-3 text-[10px] font-black uppercase bg-green-600 hover:bg-green-700"
                            onClick={() => handleUpdateStatus(user.id, 'approved')}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" /> Aprobar
                          </Button>
                        </div>
                      ) : (
                        user.id !== authUser?.uid && (
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-7 text-[9px] opacity-50 hover:opacity-100"
                                onClick={() => handleUpdateStatus(user.id, user.status === 'approved' ? 'rejected' : 'approved')}
                            >
                                {user.status === 'approved' ? 'Inactivar' : 'Re-activar'}
                            </Button>
                        )
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {sortedUsers.filter(u => u.status === 'pending').length > 0 && (
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
              <AlertCircle className="h-6 w-6 text-orange-500" />
              <div>
                  <p className="text-sm font-bold text-orange-800">Hay solicitudes pendientes de revisión</p>
                  <p className="text-xs text-orange-700">Revisa la lista superior para activar las cuentas de los nuevos asesores.</p>
              </div>
          </div>
      )}
    </div>
  );
}
