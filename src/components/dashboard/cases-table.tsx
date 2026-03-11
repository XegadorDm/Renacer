'use client';

import { useState, useMemo } from "react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CaseStatusIndicator } from "./case-status-indicator";
import { MoreHorizontal, Edit, Trash2, Eye, Phone } from "lucide-react";
import { Button } from "../ui/button";
import { useFirestore, useCollection, useUser, deleteDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
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
import { Badge } from "@/components/ui/badge";

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
  const [activeCaseForCall, setActiveCaseForCall] = useState<WithId<Case> | null>(null);

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

  const handleCallAction = (caseItem: WithId<Case>) => {
    setActiveCaseForCall(caseItem);
    setIsCallDialogOpen(true);
  };

  const confirmCall = () => {
    if (!activeCaseForCall || !firestore) return;
    
    const caseDocRef = doc(firestore, 'cases', activeCaseForCall.id);
    
    // USAMOS setDocumentNonBlocking con merge: true para asegurar la persistencia sin errores de permisos de update.
    setDocumentNonBlocking(caseDocRef, {
      status: "Usuario contactado por llamada"
    }, { merge: true });

    toast({
      title: "Registro de Llamada",
      description: "Se ha registrado la novedad: Usuario contactado por llamada.",
    });

    setIsCallDialogOpen(false);
    setActiveCaseForCall(null);
  };

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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-bold text-primary min-w-[100px]">N° Caso</TableHead>
                <TableHead className="font-bold text-primary min-w-[150px]">Nombre Completo</TableHead>
                <TableHead className="font-bold text-primary min-w-[120px]">Documento</TableHead>
                <TableHead className="font-bold text-primary min-w-[120px]">Municipio</TableHead>
                <TableHead className="font-bold text-primary text-center min-w-[180px]">Novedad</TableHead>
                <TableHead className="text-right font-bold pr-6 text-primary min-w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCases && filteredCases.length > 0 ? (
                filteredCases.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-[10px] text-muted-foreground whitespace-nowrap">{c.caseNumber}</TableCell>
                    <TableCell className="font-bold uppercase text-sm whitespace-nowrap">{c.firstName} {c.lastName}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{c.documentId}</TableCell>
                    <TableCell className="text-sm font-medium whitespace-nowrap">{c.municipality}</TableCell>
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
                        <DropdownMenuContent align="end" className="w-64 shadow-xl">
                          <DropdownMenuLabel>Gestión de Caso</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem onClick={() => handleCallAction(c)} className="cursor-pointer text-primary font-bold bg-primary/5">
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
      </div>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md rounded-lg">
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

      <Dialog open={isCallDialogOpen} onOpenChange={setIsCallDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md rounded-lg overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              Contacto de Usuario
            </DialogTitle>
            <DialogDescription>
              Datos registrados para <span className="font-bold">{activeCaseForCall?.firstName} {activeCaseForCall?.lastName}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Teléfono Principal</label>
              <div className="flex items-center justify-between p-3 rounded-md border bg-muted/30">
                <span className="text-lg font-mono font-bold">{activeCaseForCall?.phone1}</span>
                <Badge variant="secondary">Principal</Badge>
              </div>
            </div>
            {activeCaseForCall?.phone2 && (
              <div className="grid gap-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Teléfono Secundario</label>
                <div className="flex items-center justify-between p-3 rounded-md border bg-muted/30">
                  <span className="text-lg font-mono font-bold">{activeCaseForCall?.phone2}</span>
                  <Badge variant="outline">Opcional</Badge>
                </div>
              </div>
            )}
            <div className="p-3 rounded-md bg-blue-50 border border-blue-100 text-blue-800 text-sm">
              Al presionar <strong>"Registrar Llamada"</strong>, el sistema registrará que el usuario fue contactado.
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsCallDialogOpen(false)}>
              Cerrar
            </Button>
            <Button 
              type="button" 
              className="w-full sm:w-auto bg-primary hover:bg-primary/90"
              onClick={confirmCall}
            >
              <Phone className="mr-2 h-4 w-4" /> Registrar Llamada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}