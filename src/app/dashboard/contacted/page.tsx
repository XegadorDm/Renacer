'use client';

import { useMemo, useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser, updateDocumentNonBlocking, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PhoneCall, IdCard, MapPin, Calendar, Eye, PhoneOff, CheckCircle2, AlertCircle, History, PhoneForwarded, User, Clock, ChevronRight, XCircle, Phone } from 'lucide-react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Case, Novedad, UserProfile } from '@/lib/case-schema';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

function HistoryModal({ caseId, open, onOpenChange }: { caseId: string, open: boolean, onOpenChange: (open: boolean) => void }) {
  const firestore = useFirestore();
  const novedadesQuery = useMemoFirebase(() => {
    if (!firestore || !caseId) return null;
    return query(collection(firestore, 'cases', caseId, 'novedades'), orderBy('createdAt', 'desc'));
  }, [firestore, caseId]);

  const { data: novedades, isLoading } = useCollection<Novedad>(novedadesQuery);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Historial de Gestión
          </DialogTitle>
          <DialogDescription>Registro de todos los intentos y novedades del caso.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : novedades && novedades.length > 0 ? (
            <div className="space-y-4">
              {novedades.map((nov, idx) => (
                <div key={idx} className="p-3 bg-muted/30 rounded-lg border text-xs relative">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="text-[9px] uppercase font-bold">
                      {nov.tipo === 'llamada' ? 'Llamada' : 'Nota'}
                    </Badge>
                    <span className="text-[9px] text-muted-foreground font-mono">
                      {nov.createdAt ? format(new Date(nov.createdAt), "dd/MM/yy HH:mm", { locale: es }) : 'Sin fecha'}
                    </span>
                  </div>
                  <p className="font-medium text-foreground/80 italic">"{nov.mensaje}"</p>
                  <div className="mt-2 pt-2 border-t flex items-center gap-1 text-[9px] text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>ID Asesor: {nov.createdBy.substring(0, 8)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground italic text-sm">
              No hay novedades registradas.
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function ContactCard({ item, onRetry, onShowHistory }: { item: Case & { id: string }, onRetry: () => void, onShowHistory: () => void }) {
  const firestore = useFirestore();
  const novedadesQuery = useMemoFirebase(() => {
    if (!firestore || !item.id) return null;
    return query(collection(firestore, 'cases', item.id, 'novedades'), orderBy('createdAt', 'desc'));
  }, [firestore, item.id]);
  const { data: novedades } = useCollection<Novedad>(novedadesQuery);

  const lastAttemptDate = useMemo(() => {
    if (!novedades || novedades.length === 0) return 'Nunca';
    const last = novedades[0];
    return format(new Date(last.createdAt), "dd MMM, HH:mm", { locale: es });
  }, [novedades]);

  const totalAttempts = novedades?.length || 0;

  const formattedRegDate = useMemo(() => {
    if (!item.createdAt) return 'Sin fecha';
    try {
        const dateObj = item.createdAt instanceof Timestamp ? item.createdAt.toDate() : 
                       (typeof item.createdAt === 'string' ? parseISO(item.createdAt) : 
                       (item.createdAt.toDate ? item.createdAt.toDate() : new Date()));
        return format(dateObj, "dd/MM/yyyy", { locale: es });
    } catch (e) {
        return 'Fecha inválida';
    }
  }, [item.createdAt]);

  return (
    <Card className="hover:shadow-md transition-all border-primary/10 overflow-hidden group">
      <CardHeader className="pb-2 space-y-1">
        <div className="flex justify-between items-start">
          <CardTitle className="text-sm font-bold uppercase truncate pr-2 group-hover:text-primary transition-colors">
            {item.firstName} {item.lastName}
          </CardTitle>
          <Badge 
            variant={item.status === 'CONTACTADO' ? 'default' : 'destructive'} 
            className={`text-[8px] h-4 font-black px-1.5 ${item.status === 'CONTACTADO' ? 'bg-green-600' : 'bg-destructive'}`}
          >
            {item.status}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-1.5 text-[10px] font-medium">
          <IdCard className="h-3 w-3 text-muted-foreground" />
          C.C. {item.documentId}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-3 space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 text-primary shrink-0" />
          <span className="truncate">{item.municipality}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t">
          <div className="space-y-0.5">
            <p className="text-[8px] uppercase font-black text-muted-foreground/60 tracking-tighter">Intentos</p>
            <p className="text-xs font-bold text-primary">{totalAttempts}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[8px] uppercase font-black text-muted-foreground/60 tracking-tighter">Último</p>
            <p className="text-xs font-bold text-foreground/70">{lastAttemptDate}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2 border-t p-1 grid grid-cols-2 gap-1 bg-muted/5">
        <Button variant="ghost" size="sm" onClick={onShowHistory} className="text-[9px] font-bold h-7">
          <History className="mr-1.5 h-3 w-3" /> HISTORIAL
        </Button>
        <Button variant="ghost" size="sm" onClick={onRetry} className="text-[9px] font-bold h-7 hover:bg-primary/10 hover:text-primary">
          <PhoneForwarded className="mr-1.5 h-3 w-3" /> REINTENTAR
        </Button>
        <Button asChild variant="ghost" size="sm" className="col-span-2 text-[9px] font-bold h-7 border-t rounded-none">
          <Link href={`/dashboard/cases/${item.id}`}>
            <Eye className="mr-1.5 h-3 w-3" /> VER FICHA COMPLETA
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function ContactedUsersPage() {
  const firestore = useFirestore();
  const { user: authUser } = useUser();
  const { toast } = useToast();

  const [selectedCase, setSelectedCase] = useState<(Case & { id: string }) | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCallOpen, setIsCallOpen] = useState(false);

  const casesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'cases');
  }, [firestore]);

  const { data: cases, isLoading } = useCollection<Case>(casesQuery);

  const contactedCases = useMemo(() => {
    return (cases || []).filter(c => c.status === 'CONTACTADO');
  }, [cases]);

  const notContactedCases = useMemo(() => {
    return (cases || []).filter(c => c.status === 'NO CONTACTADO');
  }, [cases]);

  const handleRegisterNovedad = (contacted: boolean) => {
    if (!selectedCase || !firestore || !authUser) return;

    const newStatus = contacted ? "CONTACTADO" : "NO CONTACTADO";
    
    // 1. Actualizar caso principal
    const caseRef = doc(firestore, 'cases', selectedCase.id);
    updateDocumentNonBlocking(caseRef, { status: newStatus });

    // 2. Registrar Trazabilidad (REQ-008: Historial)
    const novedadesRef = collection(firestore, 'cases', selectedCase.id, 'novedades');
    addDocumentNonBlocking(novedadesRef, {
        mensaje: contacted ? "Llamada efectiva realizada (reintento)" : "Intento de llamada sin éxito (reintento)",
        tipo: 'llamada',
        createdAt: new Date().toISOString(),
        createdBy: authUser.uid
    });

    // 3. Crear Notificación Interna (REQ-008)
    const notificationsRef = collection(firestore, 'notifications');
    addDocumentNonBlocking(notificationsRef, {
        userId: authUser.uid,
        caseId: selectedCase.id,
        message: `Se registró un nuevo intento de contacto (${newStatus}) para ${selectedCase.firstName}`,
        createdAt: new Date().toISOString(),
        read: false
    });

    // 4. Actualizar vista pública segura (REQ-007)
    const normalized = selectedCase.documentId.replace(/\D/g, '');
    if (normalized) {
        const publicDocRef = doc(firestore, 'publicCaseStatus', normalized);
        setDocumentNonBlocking(publicDocRef, { 
            status: newStatus,
            updatedAt: serverTimestamp()
        }, { merge: true });
    }

    toast({
        title: contacted ? "Contacto Exitoso" : "Intento Fallido",
        description: `La trazabilidad del caso ha sido actualizada.`,
    });
    setIsCallOpen(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 py-4">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2].map(i => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-10 w-full" />
              {Array.from({ length: 3 }).map((_, j) => <Skeleton key={j} className="h-40 w-full rounded-xl" />)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-primary font-headline flex items-center gap-2">
          <PhoneCall className="h-8 w-8" />
          Seguimiento de Contacto
        </h1>
        <p className="text-muted-foreground text-sm">Gestiona y reintenta la comunicación con los beneficiarios registrados.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Columna Contactados */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-green-600 pb-2">
            <h2 className="text-lg font-bold text-green-700 flex items-center gap-2 uppercase tracking-tight">
              <CheckCircle2 className="h-5 w-5" />
              Contactados
            </h2>
            <Badge className="bg-green-600 text-white hover:bg-green-700">{contactedCases.length}</Badge>
          </div>
          
          <div className="grid gap-4">
            {contactedCases.length > 0 ? (
              contactedCases.map((c) => (
                <ContactCard 
                  key={c.id} 
                  item={c as Case & { id: string }} 
                  onRetry={() => { setSelectedCase(c as Case & { id: string }); setIsCallOpen(true); }}
                  onShowHistory={() => { setSelectedCase(c as Case & { id: string }); setIsHistoryOpen(true); }}
                />
              ))
            ) : (
              <Card className="bg-muted/30 border-dashed"><CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground italic text-sm">No hay usuarios contactados.</CardContent></Card>
            )}
          </div>
        </div>

        {/* Columna No Contactados */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-destructive pb-2">
            <h2 className="text-lg font-bold text-destructive flex items-center gap-2 uppercase tracking-tight">
              <PhoneOff className="h-5 w-5" />
              No Contactados
            </h2>
            <Badge variant="destructive" className="bg-destructive text-destructive-foreground">{notContactedCases.length}</Badge>
          </div>

          <div className="grid gap-4">
            {notContactedCases.length > 0 ? (
              notContactedCases.map((c) => (
                <ContactCard 
                  key={c.id} 
                  item={c as Case & { id: string }} 
                  onRetry={() => { setSelectedCase(c as Case & { id: string }); setIsCallOpen(true); }}
                  onShowHistory={() => { setSelectedCase(c as Case & { id: string }); setIsHistoryOpen(true); }}
                />
              ))
            ) : (
              <Card className="bg-muted/30 border-dashed"><CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground italic text-sm">No se registran intentos fallidos.</CardContent></Card>
            )}
          </div>
        </div>
      </div>

      {selectedCase && (
        <>
          <HistoryModal 
            caseId={selectedCase.id} 
            open={isHistoryOpen} 
            onOpenChange={setIsHistoryOpen} 
          />

          <Dialog open={isCallOpen} onOpenChange={setIsCallOpen}>
            <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-6 bg-primary text-primary-foreground">
                    <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                        <Phone className="h-7 w-7 animate-bounce" />
                        Reintentar Llamada
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
                    <Button variant="outline" onClick={() => setIsCallOpen(false)} className="w-full sm:flex-1 font-bold">
                        CANCELAR
                    </Button>
                    <Button variant="destructive" onClick={() => handleRegisterNovedad(false)} className="w-full sm:flex-1 font-bold">
                        <XCircle className="mr-2 h-4 w-4" /> FALLIDO
                    </Button>
                    <Button variant="default" onClick={() => handleRegisterNovedad(true)} className="w-full sm:flex-1 bg-green-600 hover:bg-green-700 font-bold">
                        <CheckCircle2 className="mr-2 h-4 w-4" /> EXITOSO
                    </Button>
                </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
