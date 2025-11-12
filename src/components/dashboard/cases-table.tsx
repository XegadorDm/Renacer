
'use client';

import { useState, useMemo } from "react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CaseStatusIndicator } from "./case-status-indicator";
import { MoreHorizontal } from "lucide-react";
import { Button } from "../ui/button";
import { useFirestore, useCollection, useMemoFirebase, useUser, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query as firestoreQuery, where, doc, or } from "firebase/firestore";
import { Skeleton } from "../ui/skeleton";
import type { Case } from "@/lib/case-schema";
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
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

type WithId<T> = T & { id: string };

export function CasesTable({ query, location }: { query: string; location: string }) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<WithId<Case> | null>(null);

  const casesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    
    let q = collection(firestore, 'cases');

    const filters = [];
    if (location) {
        filters.push(where("municipality", "==", location));
    }
    
    // All users can only see cases where they are a member
    filters.push(where(`members.${user.uid}`, "in", ['owner', 'editor', 'viewer']));

    if (query) {
        const searchTerm = query.toLowerCase();
        // This is a client-side filter approximation.
        // For a full-text search solution, a dedicated service like Algolia or Elasticsearch would be better.
        // We're filtering client-side after the initial fetch based on location and membership.
    }
    
    return firestoreQuery(collection(firestore, 'cases'), ...filters);

  }, [firestore, user, location]);

  const { data: cases, isLoading } = useCollection<Case>(casesQuery);
  
  const filteredCases = useMemo(() => {
    if (!cases) return [];
    if (!query) return cases;

    const searchTerm = query.toLowerCase();
    return cases.filter(c => 
      `${c.firstName.toLowerCase()} ${c.lastName.toLowerCase()}`.includes(searchTerm) || 
      c.caseNumber.toLowerCase().includes(searchTerm) ||
      c.documentId.toLowerCase().includes(searchTerm)
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

  const canDelete = (caseItem: WithId<Case>) => {
      if (!user) return false;
      return caseItem.members?.[user.uid] === 'owner';
  }

  if (isLoading) {
    return (
        <div className="border rounded-lg p-4 space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    )
  }

  return (
    <>
      <div className="border rounded-lg">
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
                    <CaseStatusIndicator status={c.status} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Abrir menú</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                           <Link href={`/dashboard/cases/${c.id}`}>Ver Detalles</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/cases/${c.id}/edit`}>Editar</Link>
                        </DropdownMenuItem>
                         {canDelete(c) && (
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive-foreground focus:bg-destructive"
                            onClick={() => handleDeleteClick(c)}
                          >
                            Eliminar
                          </DropdownMenuItem>
                         )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  No se encontraron casos que coincidan con tu búsqueda.
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
              Esta acción no se puede deshacer. Se eliminará permanentemente el caso
               de <span className="font-bold">{caseToDelete?.firstName} {caseToDelete?.lastName}</span> (N° {caseToDelete?.caseNumber}).
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
