'use client';

import { useState, useMemo } from "react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CaseStatusIndicator } from "./case-status-indicator";
import { MoreHorizontal, Edit, Trash2, Eye, Phone, User } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "@/components/ui/badge";
import { useFirestore, useCollection, useUser, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase";
import { collection, query as firestoreQuery, where, doc } from "firebase/firestore";
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
import { useMemoFirebase } from "@/firebase/provider";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
  
  const [isCallDialogOpen, setIsCallDialogOpen] = useState(false);
  const [activeCase, setActiveCase] = useState<WithId<Case> | null>(null);

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

  const handleCallClick = (caseItem: WithId<Case>) => {
    setActiveCase(caseItem);
    setIsCallDialogOpen(true);
  }

  const handleExecuteCall = () => {
    if (!activeCase || !firestore) return;
    
    const caseDocRef = doc(firestore, 'cases', activeCase.id);
    
    // Actualización de estado directa
    updateDocumentNonBlocking(caseDocRef, {
      status: "Usuario contactado por llamada"
    });

    toast({
      title: "Llamada Registrada",
      description: `Se ha registrado el contacto telefónico para ${activeCase.firstName} ${activeCase.lastName}.`,
    });

    setIsCallDialogOpen(false);
    setActiveCase(null);
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
                      <DropdownMenuContent align="end" className="w-56 shadow-xl">
                        <DropdownMenuLabel>Gestión de Caso</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem onClick={() => handleCallClick(c)} className="cursor-pointer font-bold text-primary focus:bg-primary/10">
                           <Phone className="mr-2 h-4 w-4" /> LLAMAR AL USUARIO
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem onClick={() => handleViewDetails(c)} className="cursor-pointer">
                           <Eye className="mr-2 h-4 w-4 text-muted-foreground" /> Ver Detalles
                        </DropdownMenuItem>
                        
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

      {/* Dialog para Llamada */}
      <Dialog open={isCallDialogOpen} onOpenChange={setIsCallDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" /> Contactar Usuario
            </DialogTitle>
            <DialogDescription>
              Información de contacto para la gestión del caso.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold uppercase">{activeCase?.firstName} {activeCase?.lastName}</p>
                <p className="text-xs text-muted-foreground">Documento: {activeCase?.documentId}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Números de contacto:</label>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center justify-between p-3 rounded-md border bg-background">
                  <span className="text-sm font-mono">{activeCase?.phone1}</span>
                  <Badge variant="outline">Principal</Badge>
                </div>
                {activeCase?.phone2 && (
                  <div className="flex items-center justify-between p-3 rounded-md border bg-background">
                    <span className="text-sm font-mono">{activeCase?.phone2}</span>
                    <Badge variant="outline">Alternativo</Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCallDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              className="bg-primary hover:bg-primary/90"
              onClick={handleExecuteCall}
            >
              <Phone className="mr-2 h-4 w-4" /> Llamar y Registrar Novedad
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
