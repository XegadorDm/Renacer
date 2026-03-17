'use client';

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CaseStatusIndicator } from "./case-status-indicator";
import { MoreHorizontal, Edit, Trash2, Eye, Phone, User, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "../ui/button";
import { useFirestore, useCollection, useUser, deleteDocumentNonBlocking, addDocumentNonBlocking, useDoc } from "@/firebase";
import { collection, query as firestoreQuery, where, doc, serverTimestamp } from "firebase/firestore";
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
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useMemoFirebase } from "@/firebase/provider";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type WithId<T> = T & { id: string };

interface CasesTableProps {
  query: string;
  location: string;
  onSelectCase: (caseItem: WithId<Case> | null) => void;
  selectedCaseId?: string;
  isCallModalOpen: boolean;
  setIsCallModalOpen: (open: boolean) => void;
}

export function CasesTable({ query, location, onSelectCase, selectedCaseId, isCallModalOpen, setIsCallModalOpen }: CasesTableProps) {
  const firestore = useFirestore();
  const { user: authUser } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<WithId<Case> | null>(null);

  // Consulta de casos
  const casesQuery = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    const casesCollection = collection(firestore, 'cases');
    let queryConstraints = [];
    if (location) {
      queryConstraints.push(where("municipality", "==", location));
    }
    return queryConstraints.length > 0 ? firestoreQuery(casesCollection, ...queryConstraints) : casesCollection;
  }, [firestore, authUser, location]);

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

  // Datos del caso seleccionado para el modal de llamada
  const selectedCase = useMemo(() => 
    cases?.find(c => c.id === selectedCaseId) || null, 
    [cases, selectedCaseId]
  );

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !selectedCase?.userId) return null;
    return doc(firestore, 'users', selectedCase.userId);
  }, [firestore, selectedCase?.userId]);

  const { data: associatedUser, isLoading: isUserLoading } = useDoc<any>(userDocRef);

  const confirmDelete = () => {
    if (!caseToDelete || !firestore) return;
    const caseDocRef = doc(firestore, 'cases', caseToDelete.id);
    deleteDocumentNonBlocking(caseDocRef);
    toast({
        title: "Caso Eliminado",
        description: `El caso N° ${caseToDelete.caseNumber} ha sido eliminado.`,
    });
    setIsDeleteAlertOpen(false);
    setCaseToDelete(null);
  };
  
  const handleRegisterNovedad = (contacted: boolean) => {
    if (!firestore || !selectedCase || !authUser) return;

    const novedadesRef = collection(firestore, 'cases', selectedCase.id, 'novedades');
    const novedadData = {
        mensaje: contacted ? "Usuario contactado por llamada" : "Volver a llamar",
        tipo: "llamada",
        createdAt: serverTimestamp(),
        createdBy: authUser.uid
    };

    addDocumentNonBlocking(novedadesRef, novedadData)
        .then(() => {
            toast({
                title: contacted ? "Llamada Registrada" : "Intento Registrado",
                description: `Se ha guardado la novedad en el historial del caso.`,
            });
            setIsCallModalOpen(false);
        });
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
                <TableHead className="w-[50px]"></TableHead>
                <TableHead className="font-bold text-primary min-w-[100px]">N° Caso</TableHead>
                <TableHead className="font-bold text-primary min-w-[150px]">Nombre Completo</TableHead>
                <TableHead className="font-bold text-primary min-w-[120px]">Documento</TableHead>
                <TableHead className="font-bold text-primary min-w-[120px]">Municipio</TableHead>
                <TableHead className="font-bold text-primary text-center min-w-[180px]">Estado</TableHead>
                <TableHead className="text-right font-bold pr-6 text-primary min-w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCases && filteredCases.length > 0 ? (
                filteredCases.map((c) => (
                  <TableRow 
                    key={c.id} 
                    className={`hover:bg-muted/30 transition-colors cursor-pointer ${selectedCaseId === c.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''}`}
                    onClick={() => onSelectCase(c)}
                  >
                    <TableCell>
                        <div className={`w-4 h-4 rounded-full border-2 ${selectedCaseId === c.id ? 'bg-primary border-primary' : 'border-muted-foreground'}`} />
                    </TableCell>
                    <TableCell className="font-mono text-[10px] text-muted-foreground">{c.caseNumber}</TableCell>
                    <TableCell className="font-bold uppercase text-sm">{c.firstName} {c.lastName}</TableCell>
                    <TableCell className="text-sm">{c.documentId}</TableCell>
                    <TableCell className="text-sm font-medium">{c.municipality}</TableCell>
                    <TableCell className="flex justify-center py-4">
                      <CaseStatusIndicator status={c.status} />
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
                          
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/cases/${c.id}`)} className="cursor-pointer">
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
                            onClick={(e) => {
                                e.stopPropagation();
                                setCaseToDelete(c);
                                setIsDeleteAlertOpen(true);
                            }}
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
                  <TableCell colSpan={7} className="text-center h-32 text-muted-foreground">
                    No se encontraron casos registrados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal de Llamada */}
      <Dialog open={isCallModalOpen} onOpenChange={setIsCallModalOpen}>
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                    <Phone className="h-6 w-6 text-primary" />
                    Llamar al Usuario
                </DialogTitle>
                <DialogDescription>
                    Información de contacto del usuario relacionado con el caso.
                </DialogDescription>
            </DialogHeader>

            <div className="py-6 space-y-6">
                {!selectedCase?.userId ? (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                            Este caso no tiene un usuario (userId) asociado. No se puede realizar la llamada.
                        </AlertDescription>
                    </Alert>
                ) : isUserLoading ? (
                    <div className="flex flex-col items-center gap-4 py-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ) : associatedUser ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                            <div className="bg-primary/20 p-3 rounded-full">
                                <User className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-bold">Nombre del Usuario</p>
                                <p className="text-lg font-bold">{associatedUser.firstName} {associatedUser.lastName}</p>
                            </div>
                        </div>

                        {associatedUser.documentNumber && (
                             <div className="px-4">
                                <p className="text-xs text-muted-foreground uppercase font-bold">Documento</p>
                                <p className="font-medium">{associatedUser.documentNumber}</p>
                             </div>
                        )}

                        <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
                            <p className="text-xs text-accent uppercase font-bold mb-2">Números de Contacto</p>
                            {associatedUser.email && (associatedUser.email.includes('test') || associatedUser.email.includes('example')) ? (
                                <p className="text-sm text-muted-foreground italic mb-2">* Datos de prueba detectados</p>
                            ) : null}
                            
                            <div className="space-y-3">
                                <div className="flex items-center justify-between bg-background p-3 rounded border shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <Phone className="h-5 w-5 text-primary" />
                                        <span className="text-xl font-mono font-bold tracking-widest text-primary">
                                            {selectedCase.phone1 || associatedUser.phone1 || 'SIN TELÉFONO'}
                                        </span>
                                    </div>
                                    <Badge variant="outline" className="bg-primary/5">Principal</Badge>
                                </div>

                                {selectedCase.phone2 && (
                                    <div className="flex items-center justify-between bg-background p-3 rounded border shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <Phone className="h-5 w-5 text-muted-foreground" />
                                            <span className="text-lg font-mono font-medium tracking-wider">
                                                {selectedCase.phone2}
                                            </span>
                                        </div>
                                        <Badge variant="outline">Secundario</Badge>
                                    </div>
                                )}
                            </div>
                            
                            {(!selectedCase.phone1 && !associatedUser.phone1) && (
                                <Alert variant="destructive" className="mt-4">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        Atención: El usuario no tiene un número de teléfono registrado en el sistema.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    </div>
                ) : (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Usuario no encontrado</AlertTitle>
                        <AlertDescription>
                            No se encontraron datos para el ID de usuario: {selectedCase.userId}
                        </AlertDescription>
                    </Alert>
                )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-3 border-t pt-6">
                <Button variant="outline" onClick={() => setIsCallModalOpen(false)} className="w-full sm:w-auto">
                    Cerrar
                </Button>
                <div className="flex-1" />
                <Button 
                    variant="destructive" 
                    onClick={() => handleRegisterNovedad(false)}
                    disabled={!selectedCase || !associatedUser}
                    className="w-full sm:w-auto"
                >
                    <XCircle className="mr-2 h-4 w-4" />
                    No contactado
                </Button>
                <Button 
                    variant="default" 
                    onClick={() => handleRegisterNovedad(true)}
                    disabled={!selectedCase || !associatedUser}
                    className="bg-primary hover:bg-primary/90 text-white w-full sm:w-auto"
                >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Contactado
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el registro de {caseToDelete?.firstName} {caseToDelete?.lastName}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
