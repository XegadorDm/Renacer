'use client';

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CaseStatusIndicator } from "./case-status-indicator";
import { MoreHorizontal, Edit, Trash2, Eye, Phone, User, Loader2, CloudUpload, CheckCircle2, AlertCircle, RefreshCw, XCircle } from "lucide-react";
import { Button } from "../ui/button";
import { useFirestore, useCollection, useUser, deleteDocumentNonBlocking, setDocumentNonBlocking, addDocumentNonBlocking, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { collection, query as firestoreQuery, where, doc, Timestamp, serverTimestamp } from "firebase/firestore";
import type { Case } from "@/lib/case-schema";
import { format, subDays, parseISO, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

type WithId<T> = T & { id: string; _hasPendingWrites?: boolean };

interface CasesTableProps {
  query: string;
  docQuery?: string;
  period?: string;
  startDate?: string;
  endDate?: string;
  location: string;
  offlineOnly?: boolean;
  onSelectCase: (caseItem: WithId<Case> | null) => void;
  selectedCaseId?: string;
  isCallModalOpen: boolean;
  setIsCallModalOpen: (open: boolean) => void;
}

// Normalización robusta para comparaciones de texto
const normalize = (str: string) => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

export function CasesTable({ 
  query, 
  docQuery, 
  period, 
  startDate, 
  endDate, 
  location, 
  offlineOnly,
  onSelectCase, 
  selectedCaseId, 
  isCallModalOpen, 
  setIsCallModalOpen
}: CasesTableProps) {
  const firestore = useFirestore();
  const { user: authUser, isUserLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<WithId<Case> | null>(null);
  const [localStatuses, setLocalStatuses] = useState<Record<string, string>>({});

  // Query de Firestore mínima absoluta para evitar exclusión de registros antiguos
  const casesQuery = useMemoFirebase(() => {
    if (!firestore || !authUser || isUserLoading) return null;
    
    const casesCollection = collection(firestore, 'cases');
    const constraints: any[] = [];

    // Filtros de fecha básicos (si existen)
    let finalStartDate = startDate;
    if (!finalStartDate && period && period !== 'all') {
        const now = new Date();
        switch (period) {
            case '1w': finalStartDate = format(subDays(now, 7), 'yyyy-MM-dd'); break;
            case '1m': finalStartDate = format(subDays(now, 30), 'yyyy-MM-dd'); break;
            case '6m': finalStartDate = format(subDays(now, 180), 'yyyy-MM-dd'); break;
        }
    }

    if (finalStartDate) {
      try {
        const start = Timestamp.fromDate(startOfDay(parseISO(finalStartDate)));
        constraints.push(where("createdAt", ">=", start));
      } catch (e) {}
    }

    if (endDate) {
      try {
        const end = Timestamp.fromDate(endOfDay(parseISO(endDate)));
        constraints.push(where("createdAt", "<=", end));
      } catch (e) {}
    }

    // IMPORTANTE: No usamos orderBy ni where sobre campos que puedan faltar en registros antiguos
    // El ordenamiento y filtrado por ubicación se hace en memoria.
    return firestoreQuery(casesCollection, ...constraints);
  }, [firestore, authUser?.uid, isUserLoading, startDate, endDate, period]);

  const { data: cases, isLoading } = useCollection<Case>(casesQuery);
  
  const filteredCases = useMemo(() => {
    if (!cases) return [];
    
    // Clonamos para no mutar el array original
    let filtered = [...cases] as WithId<Case>[];

    // 1. Filtrado por Municipio (Normalizado y Robusto)
    if (location && location !== 'all') {
        const normalizedLocation = normalize(decodeURIComponent(location));
        filtered = filtered.filter(c => normalize(c.municipality || "") === normalizedLocation);
    }

    // 2. Filtrado por Búsqueda General
    const searchTerm = query.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(c => 
            `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(searchTerm) || 
            (c.caseNumber || "").toLowerCase().includes(searchTerm)
        );
    }

    // 3. Filtrado por Cédula (Solo números)
    if (docQuery) {
        const normalizedSearch = docQuery.replace(/\D/g, '');
        filtered = filtered.filter(c => {
            const normalizedDoc = (c.documentId || "").replace(/\D/g, '');
            return normalizedDoc.includes(normalizedSearch);
        });
    }

    // 4. Filtrado Offline / Errores (En memoria) - Tratamos undefined como synced
    if (offlineOnly) {
      filtered = filtered.filter(c => 
        c._hasPendingWrites === true || 
        c.syncStatus === 'error' || 
        c.syncError === true
      );
    }

    // 5. Ordenamiento en memoria (Más robusto para datos inconsistentes)
    filtered.sort((a, b) => {
        const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toDate().getTime() : 
                     (typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : 
                     (a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0));
        const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toDate().getTime() : 
                     (typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : 
                     (b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0));
        return dateB - dateA;
    });

    return filtered;
  }, [cases, query, docQuery, location, offlineOnly]);

  const selectedCase = useMemo(() => {
    if (!selectedCaseId || !cases) return null;
    return (cases as WithId<Case>[]).find(c => c.id === selectedCaseId);
  }, [selectedCaseId, cases]);

  const handleRetrySync = (c: WithId<Case>) => {
    if (!firestore || !authUser) return;
    const docRef = doc(firestore, 'cases', c.id);
    
    // Limpiamos estados de error y reintentamos
    const retryData = {
        ...c,
        syncStatus: 'pending',
        syncError: false,
        updatedAt: serverTimestamp()
    };
    // Eliminamos campos internos de UI antes de enviar
    delete (retryData as any).id;
    delete (retryData as any)._hasPendingWrites;

    setDocumentNonBlocking(docRef, retryData as any, { merge: true });
    
    toast({
        title: "Reintentando sincronización",
        description: `Enviando nuevamente el caso ${c.caseNumber}...`,
    });
  };

  const confirmDelete = () => {
    if (!caseToDelete || !firestore) return;
    const caseDocRef = doc(firestore, 'cases', caseToDelete.id);
    deleteDocumentNonBlocking(caseDocRef);

    const normalized = caseToDelete.documentId.replace(/\D/g, '');
    if (normalized) {
        const publicDocRef = doc(firestore, 'publicCaseStatus', normalized);
        deleteDocumentNonBlocking(publicDocRef);
    }

    toast({
        title: "Caso Eliminado",
        description: `El registro ha sido borrado.`,
    });
    setIsDeleteAlertOpen(false);
    setCaseToDelete(null);
  };
  
  const handleRegisterNovedad = (contacted: boolean) => {
    if (!selectedCase || !firestore || !authUser) return;

    const newStatus = contacted ? "CONTACTADO" : "NO CONTACTADO";
    const caseRef = doc(firestore, 'cases', selectedCase.id);
    updateDocumentNonBlocking(caseRef, { status: newStatus });

    const novedadesRef = collection(firestore, 'cases', selectedCase.id, 'novedades');
    addDocumentNonBlocking(novedadesRef, {
        mensaje: contacted ? "Llamada efectiva realizada" : "Intento de llamada sin éxito",
        tipo: 'llamada',
        createdAt: new Date().toISOString(),
        createdBy: authUser.uid
    });

    const notificationsRef = collection(firestore, 'notifications');
    addDocumentNonBlocking(notificationsRef, {
        message: `El caso ${selectedCase.caseNumber} cambió de estado a ${newStatus}`,
        caseId: selectedCase.id,
        caseNumber: selectedCase.caseNumber,
        type: "status_change",
        createdAt: serverTimestamp(),
        createdBy: authUser.uid || 'system',
        read: false,
        userId: selectedCase.userId || authUser.uid || null
    });

    const normalized = selectedCase.documentId.replace(/\D/g, '');
    if (normalized) {
        const publicDocRef = doc(firestore, 'publicCaseStatus', normalized);
        setDocumentNonBlocking(publicDocRef, { 
            status: newStatus,
            updatedAt: serverTimestamp()
        }, { merge: true });
    }

    setLocalStatuses(prev => ({
      ...prev,
      [selectedCase.id]: newStatus
    }));

    toast({
        title: "Gestión Registrada",
        description: contacted ? "El usuario ha sido contactado." : "Se registró el intento fallido.",
    });
    setIsCallModalOpen(false);
  };

  if (isLoading) {
    return (
        <div className="border rounded-lg p-6 space-y-4 flex flex-col items-center justify-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground italic">Cargando base de datos de casos...</p>
        </div>
    )
  }

  return (
    <>
      <div className="border rounded-xl overflow-hidden bg-card shadow-lg border-primary/10">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-[60px]"></TableHead>
                <TableHead className="font-bold text-primary min-w-[120px] uppercase text-[10px] tracking-widest">N° Caso</TableHead>
                <TableHead className="font-bold text-primary min-w-[200px] uppercase text-[10px] tracking-widest">Beneficiario</TableHead>
                <TableHead className="font-bold text-primary min-w-[160px] uppercase text-[10px] tracking-widest">Estado Sync</TableHead>
                <TableHead className="font-bold text-primary min-w-[150px] uppercase text-[10px] tracking-widest">Registro</TableHead>
                <TableHead className="font-bold text-primary text-center min-w-[180px] uppercase text-[10px] tracking-widest">Seguimiento</TableHead>
                <TableHead className="text-right font-bold pr-6 text-primary uppercase text-[10px] tracking-widest">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCases && filteredCases.length > 0 ? (
                filteredCases.map((c) => (
                  <TableRow 
                    key={c.id} 
                    className={`hover:bg-primary/5 transition-all cursor-pointer ${selectedCaseId === c.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''}`}
                    onClick={() => onSelectCase(c as WithId<Case>)}
                  >
                    <TableCell className="pl-6">
                        <div className={`w-3 h-3 rounded-full border-2 ${selectedCaseId === c.id ? 'bg-primary border-primary' : 'border-muted-foreground'}`} />
                    </TableCell>
                    <TableCell className="font-mono text-[10px] text-muted-foreground">{c.caseNumber}</TableCell>
                    <TableCell className="font-bold uppercase text-xs">{c.firstName} {c.lastName}</TableCell>
                    <TableCell>
                        <div className="flex flex-col gap-1">
                            {c.syncStatus === 'error' || c.syncError ? (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex flex-col gap-1 cursor-help">
                                                <Badge variant="destructive" className="bg-red-600 text-white text-[9px] font-bold py-0 h-5 w-fit animate-pulse">
                                                    <AlertCircle className="mr-1 h-3 w-3" /> ERROR_SYNC
                                                </Badge>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    className="h-6 text-[8px] font-black border-red-600 text-red-600 hover:bg-red-50 w-fit"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRetrySync(c as WithId<Case>);
                                                    }}
                                                >
                                                    <RefreshCw className="mr-1 h-2 w-2" /> REINTENTAR
                                                </Button>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-[250px] p-3 text-[10px]">
                                            <div className="flex items-start gap-2 text-destructive font-bold mb-1">
                                                <XCircle className="h-4 w-4" />
                                                <span>ERROR DE CARGA</span>
                                            </div>
                                            <p className="mb-2">No fue posible sincronizar el registro. Verifique la conexión e intente nuevamente.</p>
                                            <div className="pt-2 border-t opacity-70">
                                                <strong>Causa:</strong> {c.lastSyncError || "Error desconocido"}
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ) : c._hasPendingWrites ? (
                                <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200 text-[9px] font-bold py-0 h-5 w-fit">
                                    <CloudUpload className="mr-1 h-3 w-3" /> PENDIENTE SYNC
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 text-[9px] font-bold py-0 h-5 w-fit">
                                    <CheckCircle2 className="mr-1 h-3 w-3" /> SINCRONIZADO
                                </Badge>
                            )}
                        </div>
                    </TableCell>
                    <TableCell className="text-[10px] font-mono">
                        {c.createdAt ? (
                             format(
                                c.createdAt instanceof Timestamp ? c.createdAt.toDate() : 
                                (typeof c.createdAt === 'string' ? parseISO(c.createdAt) : 
                                (c.createdAt?.toDate ? c.createdAt.toDate() : new Date())), 
                                "dd/MM/yyyy HH:mm", 
                                { locale: es }
                            )
                        ) : 'Sin fecha'}
                    </TableCell>
                    <TableCell className="flex justify-center py-4">
                      <CaseStatusIndicator status={localStatuses[c.id] || c.status} />
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/cases/${c.id}`)}>
                             <Eye className="mr-2 h-4 w-4 text-primary" /> Ver Detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                              <Link href={`/dashboard/cases/${c.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4 text-primary" /> Editar
                              </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={(e) => {
                                e.stopPropagation();
                                setCaseToDelete(c as WithId<Case>);
                                setIsDeleteAlertOpen(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-48 text-muted-foreground">
                    No se encontraron registros en {location && location !== 'all' ? location : 'la base de datos'}.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isCallModalOpen} onOpenChange={setIsCallModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden shadow-2xl border-none">
            {selectedCase && (
                <>
                    <DialogHeader className="p-6 bg-primary text-primary-foreground">
                        <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                            <Phone className="h-7 w-7 animate-bounce" />
                            Gestión de Llamada
                        </DialogTitle>
                    </DialogHeader>

                    <div className="p-6 space-y-6">
                        <div className="flex items-center gap-4 p-4 bg-muted/40 rounded-xl border border-primary/10">
                            <div className="bg-primary/10 p-3 rounded-full border border-primary/20">
                                <User className="h-10 w-10 text-primary" />
                            </div>
                            <div>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Beneficiario</p>
                                <p className="text-xl font-bold text-foreground leading-tight">{selectedCase.firstName} {selectedCase.lastName}</p>
                                <p className="text-xs text-muted-foreground">C.C. {selectedCase.documentId} - {selectedCase.municipality}</p>
                            </div>
                        </div>

                        <div className="p-5 bg-accent/5 border border-accent/20 rounded-xl space-y-4">
                            <p className="text-[10px] text-accent uppercase font-black tracking-widest text-center">Números de Contacto</p>
                            <div className="grid gap-3">
                                <div className="flex flex-col items-center justify-center bg-background p-4 rounded-lg border shadow-sm">
                                    <span className="text-3xl font-mono font-black tracking-[0.2em] text-primary">{selectedCase.phone1}</span>
                                    <Badge variant="outline" className="mt-2 text-[9px] uppercase font-bold">Línea Principal</Badge>
                                </div>
                                {selectedCase.phone2 && (
                                    <div className="flex flex-col items-center justify-center bg-background p-3 rounded-lg border border-dashed shadow-sm">
                                        <span className="text-xl font-mono font-bold tracking-widest text-muted-foreground">{selectedCase.phone2}</span>
                                        <Badge variant="outline" className="mt-2 text-[8px] uppercase">Línea Alternativa</Badge>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex flex-col sm:flex-row gap-2 p-6 bg-muted/20 border-t">
                        <Button variant="outline" onClick={() => setIsCallModalOpen(false)} className="w-full sm:flex-1 font-bold h-12">
                            CANCELAR
                        </Button>
                        <Button variant="destructive" onClick={() => handleRegisterNovedad(false)} className="w-full sm:flex-1 font-bold h-12">
                            <XCircle className="mr-2 h-4 w-4" /> FALLIDO
                        </Button>
                        <Button variant="default" onClick={() => handleRegisterNovedad(true)} className="w-full sm:flex-1 bg-green-600 hover:bg-green-700 font-bold h-12 text-white">
                            <CheckCircle2 className="mr-2 h-4 w-4" /> EXITOSO
                        </Button>
                    </DialogFooter>
                </>
            )}
            {!selectedCase && (
                <div className="p-12 text-center text-muted-foreground italic">
                    Seleccione un caso para gestionar la llamada.
                </div>
            )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción es permanente y afectará la base de datos central.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>CANCELAR</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">SÍ, ELIMINAR</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
