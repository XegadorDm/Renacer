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
import { useSyncEngine } from '@/hooks/use-sync-engine';

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
  const { retryCase } = useSyncEngine();

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

    if (location && location !== 'all') {
        const normalizedLocation = normalize(decodeURIComponent(location));
        filtered = filtered.filter(c => normalize(c.municipality || "") === normalizedLocation);
    }

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
            if (!c.createdAt) return true;
            const date = c.createdAt instanceof Timestamp ? c.createdAt.toDate() : 
                         (typeof c.createdAt === 'string' ? parseISO(c.createdAt) : 
                         (c.createdAt?.toDate ? c.createdAt.toDate() : new Date()));
            
            if (finalStartDate && isBefore(date, startOfDay(parseISO(finalStartDate)))) return false;
            if (endDate && isAfter(date, endOfDay(parseISO(endDate)))) return false;
            return true;
        });
    }

    const searchTerm = query.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(c => 
            `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(searchTerm) || 
            (c.caseNumber || "").toLowerCase().includes(searchTerm)
        );
    }

    if (docQuery) {
        const normalizedSearch = docQuery.replace(/\D/g, '');
        filtered = filtered.filter(c => (c.documentId || "").replace(/\D/g, '').includes(normalizedSearch));
    }

    if (offlineOnly) {
      filtered = filtered.filter(c => c.syncStatus === 'pending' || c.syncStatus === 'error' || c._hasPendingWrites === true);
    }

    filtered.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : Date.now());
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : Date.now());
        return dateB - dateA;
    });

    return filtered;
  }, [cases, query, docQuery, location, offlineOnly, startDate, endDate, period]);

  const handleRetrySync = async (c: WithId<Case>) => {
    const { id, _hasPendingWrites, ...caseData } = c as any;
    await retryCase({ id, ...caseData });
  };

  const confirmDelete = () => {
    if (!caseToDelete || !firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'cases', caseToDelete.id));
    const normalized = caseToDelete.documentId.replace(/\D/g, '');
    if (normalized) deleteDocumentNonBlocking(doc(firestore, 'publicCaseStatus', normalized));
    toast({ title: "Caso Eliminado", description: "El registro ha sido borrado satisfactoriamente." });
    setIsDeleteAlertOpen(false);
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
                            {c.syncStatus === 'error' || c.syncError ? (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex flex-col gap-1">
                                                <Badge variant="destructive" className="bg-red-600 text-white text-[9px] py-0 h-5 w-fit">
                                                    <AlertCircle className="mr-1 h-3 w-3" /> FALLA SYNC ({c.syncAttempts || 0})
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
                                        <TooltipContent className="bg-destructive text-destructive-foreground">
                                            <div className="space-y-1 text-[10px] max-w-xs p-1">
                                                <p className="font-bold uppercase tracking-widest">Detalle del Error</p>
                                                <p className="italic leading-relaxed">{c.lastSyncError || "Acceso denegado o fallo de conexión persistente."}</p>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ) : c.syncStatus === 'pending' || c._hasPendingWrites ? (
                                <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200 text-[9px] py-0 h-5 w-fit">
                                    <CloudUpload className="mr-1 h-3 w-3" /> PENDIENTE
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 text-[9px] py-0 h-5 w-fit">
                                    <CheckCircle2 className="mr-1 h-3 w-3" /> SINCRONIZADO
                                </Badge>
                            )}
                        </div>
                    </TableCell>
                    <TableCell className="text-[10px] font-mono">
                        {c.createdAt ? format(c.createdAt instanceof Timestamp ? c.createdAt.toDate() : parseISO(c.createdAt as string), "dd/MM/yy HH:mm", { locale: es }) : '...'}
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
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/cases/${c.id}`)}><Eye className="mr-2 h-4 w-4 text-primary" /> Ver Ficha</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/cases/${c.id}/edit`)}><Edit className="mr-2 h-4 w-4 text-primary" /> Editar</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive font-bold" onClick={(e) => { e.stopPropagation(); setCaseToDelete(c); setIsDeleteAlertOpen(true); }}><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={7} className="text-center h-48 text-muted-foreground italic">No se encontraron registros que coincidan con los filtros.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">¿Eliminar registro permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se borrarán todos los datos asociados a este caso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">CANCELAR</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 rounded-xl font-bold">
              SÍ, ELIMINAR CASO
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}