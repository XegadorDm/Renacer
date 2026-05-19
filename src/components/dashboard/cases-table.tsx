'use client';

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CaseStatusIndicator } from "./case-status-indicator";
import { MoreHorizontal, Edit, Trash2, Eye, Phone, User, CheckCircle2, XCircle, AlertCircle, Calendar as CalendarIcon, Cloud, CloudOff, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { useFirestore, useCollection, useUser, deleteDocumentNonBlocking, updateDocumentNonBlocking, setDocumentNonBlocking, addDocumentNonBlocking, useMemoFirebase } from "@/firebase";
import { collection, query as firestoreQuery, where, doc, Timestamp, orderBy, serverTimestamp } from "firebase/firestore";
import { Skeleton } from "../ui/skeleton";
import type { Case } from "@/lib/case-schema";
import { format, subDays, parseISO, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
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
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  isApproved: boolean;
  isProfileLoading: boolean;
}

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
  setIsCallModalOpen,
  isApproved,
  isProfileLoading
}: CasesTableProps) {
  const firestore = useFirestore();
  const { user: authUser } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<WithId<Case> | null>(null);
  const [localStatuses, setLocalStatuses] = useState<Record<string, string>>({});

  const casesQuery = useMemoFirebase(() => {
    // ELIMINACIÓN DE BLOQUEO: Si el perfil está cargando pero es un usuario interno, permitimos la query.
    // Solo bloqueamos si de verdad no hay usuario o es un invitado no identificado.
    if (!firestore || !authUser || (!isApproved && !isProfileLoading)) return null;
    
    const casesCollection = collection(firestore, 'cases');
    const constraints: any[] = [];

    if (location && location !== 'all') {
      constraints.push(where("municipality", "==", location));
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

    if (finalStartDate) {
      const start = Timestamp.fromDate(startOfDay(parseISO(finalStartDate)));
      constraints.push(where("createdAt", ">=", start));
    }

    if (endDate) {
      const end = Timestamp.fromDate(endOfDay(parseISO(endDate)));
      constraints.push(where("createdAt", "<=", end));
    }

    constraints.push(orderBy("createdAt", "desc"));

    return firestoreQuery(casesCollection, ...constraints);
  }, [firestore, authUser, location, startDate, endDate, period, isApproved, isProfileLoading]);

  const { data: cases, isLoading } = useCollection<Case>(casesQuery);
  
  const selectedCase = useMemo(() => {
    return (cases as WithId<Case>[])?.find(c => c.id === selectedCaseId) || null;
  }, [cases, selectedCaseId]);

  const filteredCases = useMemo(() => {
    if (!cases) return [];
    
    let filtered = cases;

    if (offlineOnly) {
      filtered = filtered.filter(c => c._hasPendingWrites === true);
    }

    const searchTerm = query.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(c => 
            `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(searchTerm) || 
            c.caseNumber?.toLowerCase().includes(searchTerm)
        );
    }

    if (docQuery) {
        const normalizedSearch = docQuery.replace(/\D/g, '');
        filtered = filtered.filter(c => {
            const normalizedDoc = (c.documentId || "").replace(/\D/g, '');
            return normalizedDoc.includes(normalizedSearch);
        });
    }

    return filtered;
  }, [cases, query, docQuery, offlineOnly]);

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
        description: `El registro ha sido borrado y se sincronizará.`,
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
        title: "Registro Exitoso",
        description: `La gestión se ha guardado localmente (REQ-006).`,
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
                <TableHead className="font-bold text-primary uppercase text-[10px] tracking-widest">Sincronización</TableHead>
                <TableHead className="font-bold text-primary min-w-[120px] uppercase text-[10px] tracking-widest">N° Caso</TableHead>
                <TableHead className="font-bold text-primary min-w-[200px] uppercase text-[10px] tracking-widest">Beneficiario</TableHead>
                <TableHead className="font-bold text-primary min-w-[130px] uppercase text-[10px] tracking-widest">Documento</TableHead>
                <TableHead className="font-bold text-primary min-w-[150px] uppercase text-[10px] tracking-widest">Registro</TableHead>
                <TableHead className="font-bold text-primary text-center min-w-[180px] uppercase text-[10px] tracking-widest">Estado Local</TableHead>
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
                    <TableCell>
                      {c._hasPendingWrites ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 animate-pulse">
                                <CloudOff className="h-3 w-3 mr-1" /> Offline
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent><p>Pendiente de sincronizar (REQ-006)</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <Cloud className="h-3 w-3 mr-1" /> Sincronizado
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-[10px] text-muted-foreground">{c.caseNumber}</TableCell>
                    <TableCell className="font-bold uppercase text-xs">{c.firstName} {c.lastName}</TableCell>
                    <TableCell className="text-xs font-medium text-muted-foreground">{c.documentId}</TableCell>
                    <TableCell className="text-[10px] font-mono">
                        {c.createdAt ? (
                             format(
                                c.createdAt instanceof Timestamp ? c.createdAt.toDate() : 
                                (typeof c.createdAt === 'string' ? parseISO(c.createdAt) : 
                                (c.createdAt.toDate ? c.createdAt.toDate() : new Date())), 
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
                  <TableCell colSpan={8} className="text-center h-48 text-muted-foreground">
                    No se encontraron registros.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isCallModalOpen} onOpenChange={setIsCallModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden shadow-2xl">
            <DialogHeader className="p-6 bg-primary text-primary-foreground">
                <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                    <Phone className="h-7 w-7 animate-bounce" />
                    Gestión de Llamada
                </DialogTitle>
            </DialogHeader>

            <div className="p-6 space-y-6">
                {selectedCase && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-muted/40 rounded-xl border border-primary/10">
                            <User className="h-10 w-10 text-primary bg-primary/10 p-2 rounded-full" />
                            <div>
                                <p className="text-[10px] text-muted-foreground uppercase font-black">Beneficiario</p>
                                <p className="text-xl font-bold">{selectedCase.firstName} {selectedCase.lastName}</p>
                            </div>
                        </div>

                        <div className="p-5 bg-accent/5 border border-accent/20 rounded-xl text-center">
                            <p className="text-[10px] text-accent uppercase font-black mb-3">Línea de Contacto</p>
                            <span className="text-3xl font-mono font-black text-primary tracking-widest">{selectedCase.phone1}</span>
                        </div>
                    </div>
                )}
            </div>

            <DialogFooter className="flex gap-2 p-6 bg-muted/20 border-t">
                <Button variant="outline" onClick={() => setIsCallModalOpen(false)} className="flex-1">CANCELAR</Button>
                <Button variant="destructive" onClick={() => handleRegisterNovedad(false)} className="flex-1">FALLIDO</Button>
                <Button variant="default" onClick={() => handleRegisterNovedad(true)} className="flex-1 bg-green-600 hover:bg-green-700">EXITOSO</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción es permanente y afectará la base de datos central y la vista pública.</AlertDialogDescription>
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