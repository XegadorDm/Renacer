
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFirestore, useCollection, useUser, addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc, query, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, UserCheck } from "lucide-react";
import { useMemoFirebase } from '@/firebase/provider';

export default function AdminPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [newEmail, setNewEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const authEmailsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'authorized_emails'), orderBy('addedAt', 'desc'));
  }, [firestore]);

  const { data: authorizedEmails, isLoading } = useCollection(authEmailsQuery);

  const handleAddEmail = () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast({ variant: 'destructive', title: 'Error', description: 'Ingrese un correo válido.' });
      return;
    }

    if (authorizedEmails?.some(e => e.email === newEmail.toLowerCase())) {
      toast({ variant: 'destructive', title: 'Error', description: 'Este correo ya está en la lista.' });
      return;
    }

    setIsAdding(true);
    const emailsRef = collection(firestore!, 'authorized_emails');
    
    addDocumentNonBlocking(emailsRef, {
      email: newEmail.toLowerCase(),
      addedBy: user?.email,
      addedAt: new Date().toISOString(),
    }).then(() => {
      setNewEmail('');
      setIsAdding(false);
      toast({ title: 'Éxito', description: 'Correo autorizado correctamente.' });
    });
  };

  const handleDeleteEmail = (id: string) => {
    const docRef = doc(firestore!, 'authorized_emails', id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: 'Eliminado', description: 'El correo ha sido removido de la lista.' });
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="text-primary" />
            Gestión de Aspirantes Autorizados
          </CardTitle>
          <CardDescription>
            Solo los correos electrónicos registrados aquí podrán solicitar códigos para crear una cuenta de Asesor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            <Input 
              placeholder="correo@ejemplo.com" 
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddEmail()}
            />
            <Button onClick={handleAddEmail} disabled={isAdding}>
              {isAdding ? <Loader2 className="animate-spin h-4 w-4" /> : <Plus className="h-4 w-4 mr-2" />}
              Autorizar Correo
            </Button>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Correo Autorizado</TableHead>
                  <TableHead>Autorizado Por</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-4">Cargando...</TableCell></TableRow>
                ) : authorizedEmails?.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground">No hay correos autorizados.</TableCell></TableRow>
                ) : (
                  authorizedEmails?.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.email}</TableCell>
                      <TableCell>{item.addedBy}</TableCell>
                      <TableCell>{new Date(item.addedAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteEmail(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
