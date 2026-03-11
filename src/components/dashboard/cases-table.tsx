'use client';

import { useState, useMemo } from "react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CaseStatusIndicator } from "./case-status-indicator";
import { MoreHorizontal, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import { useFirestore, useCollection, useUser, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase";
import { collection, query as firestoreQuery, where, doc } from "firebase/firestore";
import { Skeleton } from "../ui/skeleton";
import type { Case, CaseStatus } from "@/lib/case-schema";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useMemoFirebase } from "@/firebase/provider";
import { useRouter } from "next/navigation";

type WithId<T> = T & { id: string };

interface CasesTableProps {
  query: string;
  location: string;
  userRole?: string;
}

export function CasesTable({ query, location, userRole }: CasesTableProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<WithId<Case> | null>(null);
  
  const isAdmin = userRole === 'admin' || 
                  user?.email === 'aleksimbachi@gmail.com' || 
                  user?.email === 'diegomauriciopastusano@gmail.com';

  const casesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    
    const casesCollection = collection(firestore, 'cases');
    let queryConstraints = [];

    if (location) {
      queryConstraints.push(where("municipality", "==", location));
    }

    return queryConstraints.length > 0 ? firestoreQuery(casesCollection, ...queryConstraints) : casesCollection;

  }, [firestore, user, location]);

  const { data: cases, isLoading } = useCollection<Case>(casesQuery);
  
  const filteredCases = useMemo(() => {
    if (!cases) return [];
    if (!query) return cases;

    const searchTerm = query.toLowerCase();
    return cases.filter(c => 
      c && (
        `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(searchTerm) || 
        c.caseNumber?.toLowerCase().includes(searchTerm) ||
        c.documentId?.toLowerCase().includes(searchTerm)
      )
    );
  }, [cases, query]);

  const handleDeleteClick = (caseItem: WithId<Case>) => {
    setCaseToDelete(caseItem);
    setIsAlertOpen(true);
  };

  const confirmDelete = () => {
    if (!caseToDelete || !firestore) return;
    
    const caseDocRef = doc(firestore, 'cases', caseToDelete.id);
    deleteDocumentNonBlocking(caseDocRef);
    
    toast({
        title: "Caso Eliminado",
        description: `El caso N° ${caseToDelete.caseNumber} ha sido eliminado.`,
    });

    setIsAlertOpen(false);
    setCaseToDelete(null);
  };

  const handleUpdateStatus = (caseItem: WithId<Case>, newStatus: CaseStatus) => {
    if (!firestore) return;
    const caseDocRef = doc(firestore, 'cases', caseItem.id);
    
    updateDocumentNonBlocking(caseDocRef, { status: newStatus });
    
    toast({
      title: "Estado Actualizado",
      description: `El estado del caso ha cambiado a: ${newStatus}`,
    });
  };
  
  const canPerformAction = (caseItem: WithId<Case>, action: 'edit' | 'delete' | 'status') => {
      if (!user) return false;
      if (isAdmin) return true;
      if (!caseItem.members) return false;
      const userRoleInCase = caseItem.members[user.uid];
      
      if (action === 'edit' || action === 'status') {
          return userRoleInCase === 'owner' || userRoleInCase === 'editor';
      }
      if (action === 'delete') {
          return userRoleInCase === 'owner';
      }
      return false;
  }
  
  const handleViewDetails = (caseItem: WithId<Case>) => {
    const caseDataString = encodeURIComponent(JSON.stringify(caseItem));
    router.push(`/dashboard/cases/${caseItem.id}?data=${caseDataString}`);
  }

  if (isLoading) {
    return (
        <div className="border rounded-lg p-4 space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
            ))}
        </div>
    )
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° Caso</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Municipio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead><span className="sr-only">Acciones</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCases && filteredCases.length > 0 ? (
              filteredCases.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.caseNumber}</TableCell>
                  <TableCell>{c.firstName} {c.lastName}</TableCell>
                  <TableCell>{c.documentId}</TableCell>
                  <TableCell>{c.municipality}</TableCell>
                  <TableCell>
                    {c.status && <CaseStatusIndicator status={c.status as any} />}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Abrir menú</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleViewDetails(c)}>
                           Ver Detalles
                        </DropdownMenuItem>
                        
                        {canPerformAction(c, 'status') && (
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="flex items-center">
                              Cambiar estado
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(c, "Sin novedad")}>
                                <span className="flex items-center gap-2">
                                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                                  Sin novedad
                                </span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(c, "Respuesta Gobierno en curso")}>
                                <span className="flex items-center gap-2">
                                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                                  Respuesta Gobierno en curso
                                </span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(c, "Proceso finalizado con exito")}>
                                <span className="flex items-center gap-2">
                                  <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                                  Proceso finalizado con exito
                                </span>
                              </DropdownMenuItem>
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        )}

                        {canPerformAction(c, 'edit') && (
                          <DropdownMenuItem asChild>
                              <Link href={`/dashboard/cases/${c.id}/edit`}>Editar Caso</Link>
                          </DropdownMenuItem>
                        )}
                        
                        {canPerformAction(c, 'delete') && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive-foreground focus:bg-destructive"
                              onClick={() => handleDeleteClick(c)}
                            >
                              Eliminar Caso
                            </DropdownMenuItem>
                          </>
                         )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  No se encontraron casos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el caso de <span className="font-bold">{caseToDelete?.firstName} {caseToDelete?.lastName}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}