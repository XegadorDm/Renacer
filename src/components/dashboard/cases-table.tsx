
'use client';

import { useState, useMemo } from "react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CaseStatusIndicator } from "./case-status-indicator";
import { MoreHorizontal, Edit, Trash2, Eye, RefreshCcw } from "lucide-react";
import { Button } from "../ui/button";
import { useFirestore, useCollection, useUser, deleteDocumentNonBlocking, updateDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase";
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

export function CasesTable({ query, location }: CasesTableProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<WithId<Case> | null>(null);
  
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
  
  const handleViewDetails = (caseItem: WithId<Case>) => {
    const caseDataString = encodeURIComponent(JSON.stringify(caseItem));
    router.push(`/dashboard/cases/${caseItem.id}?data=${caseDataString}`);
  }

  const handleUpdateStatus = (caseItem: WithId<Case>, newStatus: CaseStatus) => {
    if (!firestore) return;
    
    const caseDocRef = doc(firestore, 'cases', caseItem.id);
    
    // 1. Update Case Status
    updateDocumentNonBlocking(caseDocRef, { status: newStatus });

    // 2. Generate Notification for all owners/members of the case
    // For simplicity in this MVP, we notify the members listed in the case
    if (caseItem.members) {
        Object.keys(caseItem.members).forEach(uid => {
            // We don't notify the person who made the change if we want to be clean, 
            // but for this requirement we notify the "user associated with the case"
            addDocumentNonBlocking(collection(firestore, 'notifications'), {
                userId: uid,
                caseId: caseItem.id,
                message: `El estado de su caso ha sido actualizado a: ${newStatus}`,
                status: newStatus,
                createdAt: new Date().toISOString(),
                read: false
            });
        });
    }

    toast({
        title: "Estado Actualizado",
        description: `El estado se cambió a "${newStatus}" y se notificó al usuario.`,
    });
  }

  if (isLoading) {
    return (
        <div className="border rounded-lg p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
            ))}
        </div>
    )
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden bg-card shadow-md">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-bold text-primary">N° Caso</TableHead>
              <TableHead className="font-bold text-primary">Nombre Completo</TableHead>
              <TableHead className="font-bold text-primary">Documento</TableHead>
              <TableHead className="font-bold text-primary">Municipio</TableHead>
              <TableHead className="font-bold text-primary text-center">Novedad</TableHead>
              <TableHead className="text-right font-bold pr-6 text-primary">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCases && filteredCases.length > 0 ? (
              filteredCases.map((c) => (
                <TableRow key={c.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-[10px] text-muted-foreground">{c.caseNumber}</TableCell>
                  <TableCell className="font-bold uppercase text-sm">{c.firstName} {c.lastName}</TableCell>
                  <TableCell className="text-sm">{c.documentId}</TableCell>
                  <TableCell className="text-sm font-medium">{c.municipality}</TableCell>
                  <TableCell className="flex justify-center py-4">
                    {c.status && <CaseStatusIndicator status={c.status as any} />}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover:bg-primary/10 rounded-full h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-72 shadow-xl">
                        <DropdownMenuLabel>Gestión de Caso</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem onClick={() => handleViewDetails(c)} className="cursor-pointer">
                           <Eye className="mr-2 h-4 w-4 text-muted-foreground" /> Ver Detalles
                        </DropdownMenuItem>
                        
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger className="cursor-pointer">
                            <RefreshCcw className="mr-2 h-4 w-4 text-muted-foreground" /> Cambiar Estado
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="w-64">
                             <DropdownMenuItem onClick={() => handleUpdateStatus(c, "Sin novedad")} className="cursor-pointer">
                                <span className="h-2 w-2 rounded-full bg-red-500 mr-2" /> Sin novedad
                             </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handleUpdateStatus(c, "Respuesta de gobierno en curso")} className="cursor-pointer">
                                <span className="h-2 w-2 rounded-full bg-yellow-500 mr-2" /> Respuesta de gobierno en curso
                             </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handleUpdateStatus(c, "Proceso finalizado con exito")} className="cursor-pointer">
                                <span className="h-2 w-2 rounded-full bg-green-500 mr-2" /> Proceso finalizado con éxito
                             </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>

                        <DropdownMenuItem asChild className="cursor-pointer">
                            <Link href={`/dashboard/cases/${c.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4 text-muted-foreground" /> Editar Datos
                            </Link>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive-foreground focus:bg-destructive cursor-pointer"
                          onClick={() => handleDeleteClick(c)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Eliminar Caso
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                  No se encontraron casos registrados para esta búsqueda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar eliminación del registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará de forma irreversible el caso de <span className="font-bold text-foreground">{caseToDelete?.firstName} {caseToDelete?.lastName}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Eliminar Definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
