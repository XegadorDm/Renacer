'use client';

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CaseStatusIndicator } from "./case-status-indicator";
import { MoreHorizontal, Edit, Trash2, Eye, Phone, User, CheckCircle2, XCircle, AlertCircle, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "../ui/button";
import { useFirestore, useCollection, useUser, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query as firestoreQuery, where, doc } from "firebase/firestore";
import { Skeleton } from "../ui/skeleton";
import type { Case } from "@/lib/case-schema";
import { format, subDays, isBefore, isAfter, parseISO, startOfDay } from "date-fns";
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
import { useMemoFirebase } from "@/firebase/provider";
import { Badge } from "@/components/ui/badge";

type WithId<T> = T & { id: string };

interface CasesTableProps {
  query: string;
  docQuery?: string;
  period?: string;
  location: string;
  onSelectCase: (caseItem: WithId<Case> | null) => void;
  selectedCaseId?: string;
  isCallModalOpen: boolean;
  setIsCallModalOpen: (open: boolean) => void;
}

export function CasesTable({ query, docQuery, period, location, onSelectCase, selectedCaseId, isCallModalOpen, setIsCallModalOpen }: CasesTableProps) {
  const firestore = useFirestore();
  const { user: authUser } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<WithId<Case> | null>(null);
  
  const [localStatuses, setLocalStatuses] = useState<Record<string, string>>({});

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
  
  const selectedCase = useMemo(() => {
    return (cases as WithId<Case>[])?.find(c => c.id === selectedCaseId) || null;
  }, [cases, selectedCaseId]);

  const filteredCases = useMemo(() => {
    if (!cases) return [];
    
    let filtered = cases;
    const now = new Date();

    // Filtro de Periodo
    if (period && period !== 'all') {
      filtered = filtered.filter(c => {
        // Los demás filtros solo aplican a casos que tengan createdAt válido
        if (!c.createdAt) return false; 
        
        try {
            const createdAtDate = parseISO(c.createdAt);
            // Comparamos contra el inicio del día del periodo seleccionado para ser más inclusivos
            switch (period) {
              case '1w': return isAfter(createdAtDate, startOfDay(subDays(now, 7)));
              case '15d': return isAfter(createdAtDate, startOfDay(subDays(now, 15)));
              case '1m': return isAfter(createdAtDate, startOfDay(subDays(now, 30)));
              case '3m': return isAfter(createdAtDate, startOfDay(subDays(now, 90)));
              case '6m': return isAfter(createdAtDate, startOfDay(subDays(now, 180)));
              case '1y': return isBefore(createdAtDate, startOfDay(subDays(now, 365)));
              default: return true;
            }
        } catch (e) {
            return false;
        }
      });
    }

    // Filtro por Cédula
    if (docQuery) {
        filtered = filtered.filter(c => c.documentId?.includes(docQuery));
    }

    // Filtro General (Nombre o N° de caso)
    const searchTerm = query.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(c => 
            `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(searchTerm) || 
            c.caseNumber?.toLowerCase().includes(searchTerm)
        );
    }

    return filtered;
  }, [cases, query, docQuery, period]);

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
    if (!selectedCase) return;

    const newStatus = contacted ? "CONTACTADO" : "NO CONTACTADO";
    setLocalStatuses(prev => ({
      ...prev,
      [selectedCase.id]: newStatus
    }));

    toast({
        title: contacted ? "Llamada Registrada" : "Intento Registrado",
        description: contacted 
          ? `Se ha marcado a ${selectedCase?.firstName} como contactado.` 
          : `Se ha registrado el intento de llamada.`,
    });
    setIsCallModalOpen(false);
  };

  if (isLoading) {
    return (
        <div className="border rounded-lg p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton className="h-14 w-full rounded-md" key={i} />
            ))}
        </div>
    )
  }

  return (
    <>
      <div className="border rounded-xl overflow-hidden bg-card shadow-lg border-primary/10">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-primary/20">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-[60px]"></TableHead>
                <TableHead className="font-bold text-primary min-w-[120px] uppercase text-[10px] tracking-widest">N° Caso</TableHead>
                <TableHead className="font-bold text-primary min-w-[200px] uppercase text-[10px] tracking-widest">Beneficiario</TableHead>
                <TableHead className="font-bold text-primary min-w-[130px] uppercase text-[10px] tracking-widest">Documento</TableHead>
                <TableHead className="font-bold text-primary min-w-[150px] uppercase text-[10px] tracking-widest">
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" /> Registro
                    </div>
                </TableHead>
                <TableHead className="font-bold text-primary min-w-[120px] uppercase text-[10px] tracking-widest">Municipio</TableHead>
                <TableHead className="font-bold text-primary text-center min-w-[180px] uppercase text-[10px] tracking-widest">Estado Local</TableHead>
                <TableHead className="text-right font-bold pr-6 text-primary min-w-[100px] uppercase text-[10px] tracking-widest">Gestión</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCases && filteredCases.length > 0 ? (
                filteredCases.map((c) => (
                  <TableRow 
                    key={c.id} 
                    className={`hover:bg-primary/5 transition-all duration-200 cursor-pointer border-b last:border-0 ${selectedCaseId === c.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''}`}
                    onClick={() => onSelectCase(c as WithId<Case>)}
                  >
                    <TableCell className="pl-6">
                        <div className={`w-3 h-3 rounded-full border-2 transition-all ${selectedCaseId === c.id ? 'bg-primary border-primary scale-125' : 'border-muted-foreground'}`} />
                    </TableCell>
                    <TableCell className="font-mono text-[10px] text-muted-foreground font-semibold">{c.caseNumber}</TableCell>
                    <TableCell className="font-bold uppercase text-xs tracking-tight">{c.firstName} {c.lastName}</TableCell>
                    <TableCell className="text-xs font-medium text-muted-foreground">{c.documentId}</TableCell>
                    <TableCell className="text-[10px] font-mono whitespace-nowrap">
                        {c.createdAt ? format(parseISO(c.createdAt), "dd/MM/yyyy HH:mm", { locale: es }) : (
                            <span className="text-muted-foreground italic text-[9px] opacity-60 font-sans">Sin fecha</span>
                        )}
                    </TableCell>
                    <TableCell className="text-xs font-semibold">{c.municipality}</TableCell>
                    <TableCell className="flex justify-center py-4">
                      <CaseStatusIndicator status={localStatuses[c.id] || c.status} />
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="hover:bg-primary/10 rounded-full h-9 w-9">
                            <MoreHorizontal className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-2xl border-primary/20">
                          <DropdownMenuLabel className="text-[10px] font-bold uppercase text-muted-foreground tracking-tighter mb-1">Acciones Disponibles</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/cases/${c.id}`)} className="cursor-pointer rounded-lg py-2">
                             <Eye className="mr-3 h-4 w-4 text-primary" /> <span className="text-sm font-medium">Ver Detalles</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="cursor-pointer rounded-lg py-2">
                              <Link href={`/dashboard/cases/${c.id}/edit`}>
                                <Edit className="mr-3 h-4 w-4 text-primary" /> <span className="text-sm font-medium">Editar Datos</span>
                              </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive-foreground focus:bg-destructive cursor-pointer rounded-lg py-2"
                            onClick={(e) => {
                                e.stopPropagation();
                                setCaseToDelete(c as WithId<Case>);
                                setIsDeleteAlertOpen(true);
                            }}
                          >
                            <Trash2 className="mr-3 h-4 w-4" /> <span className="text-sm font-bold">Eliminar Caso</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-48">
                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                        <AlertCircle className="h-8 w-8 opacity-20" />
                        <p className="font-medium">No se encontraron casos registrados para esta búsqueda.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isCallModalOpen} onOpenChange={setIsCallModalOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-6 bg-primary text-primary-foreground">
                <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                    <Phone className="h-7 w-7 animate-bounce" />
                    Llamar al Usuario
                </DialogTitle>
                <DialogDescription className="text-primary-foreground/80 mt-1">
                    Gestión de contacto directo con el beneficiario.
                </DialogDescription>
            </DialogHeader>

            <div className="p-6 space-y-6 bg-background">
                {selectedCase ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-muted/40 rounded-xl border border-primary/10">
                            <div className="bg-primary/10 p-3 rounded-full border border-primary/20">
                                <User className="h-10 w-10 text-primary" />
                            </div>
                            <div>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Beneficiario</p>
                                <p className="text-xl font-bold text-foreground leading-tight">{selectedCase.firstName} {selectedCase.lastName}</p>
                            </div>
                        </div>

                        <div className="p-5 bg-accent/5 border border-accent/20 rounded-xl space-y-4">
                            <p className="text-[10px] text-accent uppercase font-black tracking-widest text-center">Números Autorizados</p>
                            
                            <div className="grid gap-3">
                                <div className="flex flex-col items-center justify-center bg-background p-4 rounded-lg border shadow-sm ring-1 ring-primary/5">
                                    <span className="text-3xl font-mono font-black tracking-[0.2em] text-primary mb-1">
                                        {selectedCase.phone1 || 'SIN NÚMERO'}
                                    </span>
                                    <Badge variant="outline" className="bg-primary/5 text-[9px] uppercase font-bold px-3">Línea Principal</Badge>
                                </div>
                                
                                {selectedCase.phone2 && (
                                    <div className="flex flex-col items-center justify-center bg-background p-3 rounded-lg border border-dashed shadow-sm">
                                        <span className="text-xl font-mono font-bold tracking-widest text-muted-foreground mb-1">
                                            {selectedCase.phone2}
                                        </span>
                                        <Badge variant="outline" className="text-[8px] uppercase">Línea Alternativa</Badge>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center p-10 text-muted-foreground">
                        No hay un caso seleccionado.
                    </div>
                )}
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 p-6 bg-muted/20 border-t">
                <Button variant="outline" onClick={() => setIsCallModalOpen(false)} className="w-full sm:flex-1 order-3 sm:order-1 font-bold">
                    CANCELAR
                </Button>
                <Button 
                    variant="destructive" 
                    onClick={() => handleRegisterNovedad(false)}
                    disabled={!selectedCase}
                    className="w-full sm:flex-1 order-2 font-bold shadow-lg"
                >
                    <XCircle className="mr-2 h-4 w-4" />
                    NO CONTACTO
                </Button>
                <Button 
                    variant="default" 
                    onClick={() => handleRegisterNovedad(true)}
                    disabled={!selectedCase}
                    className="w-full sm:flex-1 order-1 bg-primary hover:bg-primary/90 text-white font-bold shadow-lg"
                >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    CONTACTADO
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-2xl max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
                <Trash2 className="h-5 w-5" /> ¿Confirmar eliminación?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Esta acción eliminará de forma permanente el registro de <strong>{caseToDelete?.firstName} {caseToDelete?.lastName}</strong>. Esta operación no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-xl font-bold">CANCELAR</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 rounded-xl font-bold shadow-lg">
              SÍ, ELIMINAR
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}