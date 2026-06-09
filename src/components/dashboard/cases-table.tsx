'use client';

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CaseStatusIndicator } from "./case-status-indicator";
import { MoreHorizontal, Edit, Trash2, Eye, Phone, User, Loader2, CloudUpload, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { useFirestore, useCollection, useUser, deleteDocumentNonBlocking, setDocumentNonBlocking, addDocumentNonBlocking, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { collection, doc, Timestamp, serverTimestamp } from "firebase/firestore";
import type { Case } from "@/lib/case-schema";
import { format, subDays, parseISO, startOfDay, endOfDay, isAfter, isBefore } from "date-fns";
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

  const casesQuery = useMemoFirebase(() => {
    if (!firestore || !authUser || isUserLoading) return null;
    return collection(firestore, 'cases');
  }, [firestore, authUser?.uid, isUserLoading]);

  const { data: cases, isLoading } = useCollection<Case>(casesQuery);
  
  const filteredCases = useMemo(() => {
    if (!cases) return [];
    
    let filtered = [...cases] as WithId<Case>[];

    // Filtrado por municipio
    if (location && location !== 'all') {
        const normalizedLocation = normalize(decodeURIComponent(location));
        filtered = filtered.filter(c => normalize(c.municipality || "") === normalizedLocation);
    }

    // Filtrado por fecha (en cliente para no ocultar documentos sin serverTimestamp)
    let finalStartDate = startDate;
    if (!finalStartDate && period && period !== 'all') {
        const now = new Date();
        switch (period) {
            case '1w': finalStartDate = format(subDays(now, 7), 'yyyy-MM-dd'); break;
            case '1m': finalStartDate = format(subDays(now, 30), 'yyyy-MM-dd'); break;
            case '6m': finalStartDate = format(subDays(now, 180), 'yyyy-MM-dd'); break;
        }
    }

    if (finalStartDate || endDate) {
        filtered = filtered.filter(c => {
            if (!c.createdAt) return true; // Mostrar nuevos sin fecha (offline)
            const date = c.createdAt instanceof Timestamp ? c.createdAt.toDate() : 
                         (typeof c.createdAt === 'string' ? parseISO(c.createdAt) : 
                         (c.createdAt?.toDate ? c.createdAt.toDate() : new Date()));
            
            if (finalStartDate && isBefore(date, startOfDay(parseISO(finalStartDate)))) return false;
            if (endDate && isAfter(date, endOfDay(parseISO(endDate)))) return false;
            return true;
        });
    }

    // Búsqueda por nombre o número de caso
    const searchTerm = query.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(c => 
            `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(searchTerm) || 
            (c.caseNumber || "").toLowerCase().includes(searchTerm)
        );
    }

    // Búsqueda por cédula
    if (docQuery) {
        const normalizedSearch = docQuery.replace(/\D/g, '');
        filtered = filtered.filter(c => (c.documentId || "").replace(/\D/g, '').includes(normalizedSearch));
    }

    // Filtro de pendientes sync (REQ-006)
    if (offlineOnly) {
      filtered = filtered.filter(c => c._hasPendingWrites === true || c.syncStatus === 'error');
    }

    // Ordenamiento por fecha descendente
    filtered.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : Date.now());
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : Date.now());
        return dateB - dateA;
    });

    return filtered;
  }, [cases, query, docQuery, location, offlineOnly, startDate, endDate, period]);

  const selectedCase = useMemo(() => {
    if (!selectedCaseId || !cases) return null;
    return (cases as WithId<Case>[]).find(c => c.id === selectedCaseId);
  }, [selectedCaseId, cases]);

  /**
   * handleRetrySync (REQ-006)
   * Función para recuperación manual de fallos de sincronización.
   */
  const handleRetrySync = (c: WithId<Case>) => {
    if (!firestore || !authUser) return;
    
    toast({ title: "Reintentando sincronización...", description: `Enviando caso ${c.caseNumber}.` });
    
    const docRef = doc(firestore, 'cases', c.id);
    
    // Limpiamos los campos de error para forzar una nueva escritura limpia
    const { id, _hasPendingWrites, syncError, syncStatus, syncAttempts, lastSyncError, lastSyncAt, ...cleanData } = c as any;
    
    const retryData = {
      ...cleanData,
      syncStatus: 'pending',
      syncError: false,
      syncAttempts: (syncAttempts || 0) + 1,
      updatedAt: serverTimestamp()
    };
    
    setDocumentNonBlocking(docRef, retryData, { merge: true });
    
    toast({ title: "Sincronización reenviada", description: "El proceso se ha encolado nuevamente." });
  };

  const confirmDelete = () => {
    if (!caseToDelete || !firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'cases', caseToDelete.id));
    const normalized = caseToDelete.documentId.replace(/\D/g, '');
    if (normalized) deleteDocumentNonBlocking(doc(firestore, 'publicCaseStatus', normalized));
    toast({ title: "Caso Eliminado", description: "El registro ha sido borrado." });
    setIsDeleteAlertOpen(false);
  };
  
  const handleRegisterNovedad = (contacted: boolean) => {
    if (!selectedCase || !firestore || !authUser) return;
    const newStatus = contacted ? "CONTACTADO" : "NO CONTACTADO";
    updateDocumentNonBlocking(doc(firestore, 'cases', selectedCase.id), { status: newStatus });
    addDocumentNonBlocking(collection(firestore, 'cases', selectedCase.id, 'novedades'), {
        mensaje: contacted ? "Llamada efectiva" : "Intento sin éxito",
        tipo: 'llamada',
        createdAt: new Date().toISOString(),
        createdBy: authUser.uid
    });
    addDocumentNonBlocking(collection(firestore, 'notifications'), {
        message: `Caso ${selectedCase.caseNumber} -> ${newStatus}`,
        caseId: selectedCase.id,
        caseNumber: selectedCase.caseNumber,
        type: "status_change",
        createdAt: serverTimestamp(),
        createdBy: authUser.uid,
        read: false,
        userId: selectedCase.userId || authUser.uid || null
    });
    setLocalStatuses(prev => ({ ...prev, [selectedCase.id]: newStatus }));
    setIsCallModalOpen(false);
  };

  if (isLoading) {
    return (
        <div className="border rounded-lg p-6 space-y-4 flex flex-col items-center justify-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground italic">Sincronizando base de datos local...</p>
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
              {filteredCases.length > 0 ? (
                filteredCases.map((c) => (
                  <TableRow key={c.id} className={`hover:bg-primary/5 cursor-pointer ${selectedCaseId === c.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''}`} onClick={() => onSelectCase(c)}>
                    <TableCell className="pl-6">
                        <div className={`w-3 h-3 rounded-full border-2 ${selectedCaseId === c.id ? 'bg-primary border-primary' : 'border-muted-foreground'}`} />
                    </TableCell>
                    <TableCell className="font-mono text-[10px] text-muted-foreground">{c.caseNumber}</TableCell>
                    <TableCell className="font-bold uppercase text-xs">{c.firstName} {c.lastName}</TableCell>
                    <TableCell>
                        <div className="flex flex-col gap-1">
                            {/* Visualización de Estados de Sincronización (REQ-006) */}
                            {c.syncStatus === 'error' || c.syncError ? (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex flex-col gap-1">
                                                <Badge variant="destructive" className="bg-red-600 text-white text-[9px] py-0 h-5 w-fit">
                                                    <AlertCircle className="mr-1 h-3 w-3" /> ERROR_SYNC ({c.syncAttempts || 0})
                                                </Badge>
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    onClick={(e) => { e.stopPropagation(); handleRetrySync(c); }}
                                                    className="h-6 text-[8px] font-black uppercase text-primary hover:bg-primary/10"
                                                >
                                                    <RefreshCw className="mr-1 h-3 w-3" /> Reintentar
                                                </Button>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <div className="space-y-1 text-xs max-w-xs p-1">
                                                <p className="font-bold text-red-500 uppercase text-[10px]">Detalle del Error</p>
                                                <p className="italic text-muted-foreground leading-relaxed">"{c.lastSyncError || "Acceso denegado o fallo de conexión persistente."}"</p>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ) : c._hasPendingWrites ? (
                                <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200 text-[9px] py-0 h-5 w-fit">
                                    <CloudUpload className="mr-1 h-3 w-3" /> PENDIENTE SYNC
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 text-[9px] py-0 h-5 w-fit">
                                    <CheckCircle2 className="mr-1 h-3 w-3" /> SINCRONIZADO
                                </Badge>
                            )}
                        </div>
                    </TableCell>
                    <TableCell className="text-[10px] font-mono">
                        {c.createdAt ? format(c.createdAt instanceof Timestamp ? c.createdAt.toDate() : parseISO(c.createdAt as string), "dd/MM/yy HH:mm", { locale: es }) : 'Pendiente...'}
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
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/cases/${c.id}`)}><Eye className="mr-2 h-4 w-4 text-primary" /> Ver Detalles</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/cases/${c.id}/edit`)}><Edit className="mr-2 h-4 w-4 text-primary" /> Editar</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); setCaseToDelete(c); setIsDeleteAlertOpen(true); }}><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={7} className="text-center h-48 text-muted-foreground">No se encontraron registros.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      {/* ... Diálogos de llamada y eliminación permanecen igual ... */}
    </>
  );
}
