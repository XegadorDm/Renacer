'use client';
import Link from "next/link";
import { Suspense, useState, useMemo } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, Search, ArrowLeft, Phone, Calendar as CalendarIcon, FileSearch, FilterX, Loader2, CloudOff, User, CheckCircle2, XCircle } from "lucide-react";
import { CasesTable } from "@/components/dashboard/cases-table";
import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import type { Case } from "@/lib/case-schema";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { collection, doc, serverTimestamp, addDoc } from "firebase/firestore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function CasesPage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const queryParam = searchParams.get('query') || '';
  const docQuery = searchParams.get('doc') || '';
  const period = searchParams.get('period') || 'all';
  const location = searchParams.get('location') || '';
  const startDate = searchParams.get('from') || '';
  const endDate = searchParams.get('to') || '';
  const offlineOnly = searchParams.get('offline') === 'true';
  
  const [selectedCase, setSelectedCase] = useState<(Case & { id: string }) | null>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);

  // Consulta ligera para contar pendientes sync en tiempo real
  const baseCasesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'cases');
  }, [firestore, user]);

  const { data: allCases } = useCollection<Case>(baseCasesQuery);

  const pendingCount = useMemo(() => {
    if (!allCases) return 0;
    return allCases.filter(c => c._hasPendingWrites === true).length;
  }, [allCases]);

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`/dashboard/cases?${params.toString()}`);
  };

  const toggleOfflineFilter = () => {
    const params = new URLSearchParams(searchParams);
    if (offlineOnly) {
      params.delete('offline');
    } else {
      params.set('offline', 'true');
    }
    router.replace(`/dashboard/cases?${params.toString()}`);
  };

  const clearFilters = () => {
    router.replace('/dashboard/cases');
  };

  const handleSearch = useDebouncedCallback((term: string) => updateFilters('query', term), 300);
  const handleDocSearch = useDebouncedCallback((term: string) => updateFilters('doc', term), 300);

  const handleRegisterNovedad = async (contacted: boolean) => {
    if (!selectedCase || !firestore || !user) return;

    const newStatus = contacted ? "CONTACTADO" : "NO CONTACTADO";
    const isOnlineNow = typeof navigator !== 'undefined' ? navigator.onLine : true;

    const logDerivedOp = async (operation: string, result: 'success' | 'error' | 'pending', detail: string) => {
      try {
        const syncLogsRef = collection(firestore, 'cases', selectedCase.id, 'syncLogs');
        await addDoc(syncLogsRef, {
          timestamp: new Date().toISOString(),
          operation,
          result,
          error: null,
          attempt: 1,
          online: isOnlineNow,
          userId: user.uid,
          detail,
        });
      } catch (e) {
        console.warn(`syncLog falló para ${operation}:`, e);
      }
    };

    const caseRef = doc(firestore, 'cases', selectedCase.id);
    updateDocumentNonBlocking(caseRef, {
      status: newStatus,
      syncStatus: 'pending',
      lastSyncAt: null,
    });
    await logDerivedOp('case_status_update', isOnlineNow ? 'success' : 'pending', `Estado del caso cambiado a ${newStatus}`);

    const novedadesRef = collection(firestore, 'cases', selectedCase.id, 'novedades');
    addDocumentNonBlocking(novedadesRef, {
        mensaje: contacted ? "Llamada efectiva realizada" : "Intento de llamada sin éxito",
        tipo: 'llamada',
        createdAt: new Date().toISOString(),
        createdBy: user.uid
    });
    await logDerivedOp('novedad_create', isOnlineNow ? 'success' : 'pending', 'Novedad de gestión registrada');

    const normalized = selectedCase.documentId.replace(/\D/g, '');
    if (normalized) {
        const publicDocRef = doc(firestore, 'publicCaseStatus', normalized);
        setDocumentNonBlocking(publicDocRef, {
            status: newStatus,
            updatedAt: serverTimestamp()
        }, { merge: true });
        await logDerivedOp('public_status_update', isOnlineNow ? 'success' : 'pending', 'Estado público del caso actualizado');
    }

    toast({
        title: contacted ? "✅ Contacto Exitoso" : "📵 Intento Fallido",
        description: isOnlineNow
          ? 'La gestión quedó registrada correctamente.'
          : 'Guardado localmente. Se sincronizará al recuperar conexión.',
    });
    setIsCallModalOpen(false);
  };

  if (!user) return null;

  return (
    <div className="flex justify-center w-full py-4">
        <Card className="w-full">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <CardTitle className="text-2xl font-bold text-primary">Gestión de Casos {location && `- ${location}`}</CardTitle>
                    <CardDescription>Busca, visualiza y gestiona los casos de la comunidad.</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button 
                      variant={offlineOnly ? "destructive" : "outline"} 
                      size="sm" 
                      onClick={toggleOfflineFilter}
                      className="relative"
                    >
                        <CloudOff className="mr-2 h-4 w-4" />
                        {offlineOnly ? "Viendo Pendientes" : "Ver Pendientes Sync"}
                        {pendingCount > 0 && (
                          <Badge className="ml-2 bg-orange-600 hover:bg-orange-700 animate-pulse">
                            {pendingCount}
                          </Badge>
                        )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                        <FilterX className="mr-2 h-4 w-4" />
                        Limpiar Filtros
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-muted/30 rounded-lg border border-primary/20">
                    <Button 
                        onClick={() => setIsCallModalOpen(true)}
                        disabled={!selectedCase}
                        className="bg-primary hover:bg-primary/90 text-white font-bold h-12 px-6"
                    >
                        <Phone className="mr-2 h-5 w-5" />
                        LLAMAR AL USUARIO
                    </Button>
                    {!selectedCase && (
                        <p className="text-sm text-muted-foreground italic">
                            * Selecciona un caso en la tabla para habilitar la gestión de llamadas.
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Búsqueda General</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Nombre o N° de caso..." 
                                className="pl-9 h-10"
                                onChange={(e) => handleSearch(e.target.value)}
                                defaultValue={queryParam}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Cédula</Label>
                        <div className="relative">
                            <FileSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Buscar por Cédula..." 
                                className="pl-9 h-10"
                                onChange={(e) => handleDocSearch(e.target.value)}
                                defaultValue={docQuery}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Fecha Inicio</Label>
                        <Input 
                            type="date"
                            className="h-10"
                            value={startDate}
                            onChange={(e) => updateFilters('from', e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Fecha Fin</Label>
                        <Input 
                            type="date"
                            className="h-10"
                            value={endDate}
                            onChange={(e) => updateFilters('to', e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Select value={period} onValueChange={(val) => updateFilters('period', val)}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Periodo rápido" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los tiempos</SelectItem>
                                <SelectItem value="1w">Última semana</SelectItem>
                                <SelectItem value="1m">Último mes</SelectItem>
                                <SelectItem value="6m">Últimos 6 meses</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="lg:col-span-2"></div>
                    <Button asChild style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }} className="h-10">
                        <Link href={`/dashboard/cases/new${location ? `?location=${encodeURIComponent(location)}` : ''}`}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Nuevo Registro
                        </Link>
                    </Button>
                </div>
                
                <Suspense fallback={<div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Cargando casos...</div>}>
                    <CasesTable 
                        query={queryParam} 
                        docQuery={docQuery}
                        period={period}
                        startDate={startDate}
                        endDate={endDate}
                        location={location} 
                        offlineOnly={offlineOnly}
                        onSelectCase={setSelectedCase}
                        selectedCaseId={selectedCase?.id}
                        isCallModalOpen={isCallModalOpen}
                        setIsCallModalOpen={setIsCallModalOpen}
                    />
                </Suspense>
            </CardContent>
        </Card>

        {selectedCase && (
          <Dialog open={isCallModalOpen} onOpenChange={setIsCallModalOpen}>
            <DialogContent className="max-w-md w-[92vw] rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-6 bg-primary text-primary-foreground">
                    <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                        <Phone className="h-7 w-7 animate-bounce" />
                        Llamar al Usuario
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
                        <p className="text-[10px] text-accent uppercase font-black tracking-widest text-center">Números Autorizados</p>
                        <div className="grid gap-3">
                            <div className="flex flex-col items-center justify-center bg-background p-4 rounded-lg border shadow-sm">
                                <span className="text-2xl sm:text-3xl font-mono font-black tracking-[0.2em] text-primary">{selectedCase.phone1}</span>
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

                <DialogFooter className="flex flex-col gap-2 p-4 bg-muted/20 border-t">
                    <div className="grid grid-cols-2 gap-2 w-full">
                        <Button variant="destructive" onClick={() => handleRegisterNovedad(false)} className="font-bold text-xs sm:text-sm px-2">
                            <XCircle className="mr-1.5 h-4 w-4 shrink-0" /> NO CONTACTADO
                        </Button>
                        <Button variant="default" onClick={() => handleRegisterNovedad(true)} className="bg-green-600 hover:bg-green-700 font-bold text-xs sm:text-sm px-2">
                            <CheckCircle2 className="mr-1.5 h-4 w-4 shrink-0" /> CONTACTADO
                        </Button>
                    </div>
                    <Button variant="outline" onClick={() => setIsCallModalOpen(false)} className="w-full font-bold">
                        CANCELAR
                    </Button>
                </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
    </div>
  );
}
