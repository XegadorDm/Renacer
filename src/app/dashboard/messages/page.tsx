
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFirestore, useCollection, useDoc, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, User, Calendar, ExternalLink, AlertCircle, CheckCircle2, Phone, ChevronUp, UserCheck, Inbox, Trash2, CheckCircle, Search } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Mensaje } from '@/lib/mensaje-schema';
import type { Case, UserProfile } from '@/lib/case-schema';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

function CaseContactDetails({ caseData }: { caseData: Case }) {
  const firestore = useFirestore();
  
  const workerDocRef = useMemoFirebase(() => {
    if (!firestore || !caseData.userId) return null;
    return doc(firestore, 'users', caseData.userId);
  }, [firestore, caseData.userId]);

  const { data: workerProfile, isLoading } = useDoc<UserProfile>(workerDocRef);

  return (
    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300 w-full text-left">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-green-200 text-green-800">
        <UserCheck className="h-4 w-4" />
        <span className="text-[10px] font-black uppercase tracking-widest">Ficha de Contacto Rápido</span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
        <div className="space-y-0.5">
          <p className="text-[9px] text-green-600 uppercase font-black tracking-tighter">Nombre Beneficiario</p>
          <p className="text-sm font-bold text-foreground leading-none">{caseData.firstName} {caseData.lastName}</p>
        </div>
        
        <div className="space-y-0.5">
          <p className="text-[9px] text-green-600 uppercase font-black tracking-tighter">Registrado Por</p>
          <p className="text-sm font-medium text-foreground italic leading-none">
            {isLoading ? (
              <Skeleton className="h-4 w-24" />
            ) : workerProfile ? (
              `${workerProfile.firstName} ${workerProfile.lastName}`
            ) : (
              "Asesor no encontrado"
            )}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-[9px] text-green-600 uppercase font-black tracking-tighter">Celular Principal</p>
          <div className="flex items-center gap-2">
            <div className="p-1 bg-green-600 rounded text-white">
              <Phone className="h-3 w-3" />
            </div>
            <p className="text-sm font-mono font-black text-green-700">{caseData.phone1}</p>
          </div>
        </div>

        {caseData.phone2 && (
          <div className="space-y-1">
            <p className="text-[9px] text-green-600 uppercase font-black tracking-tighter">Celular Alternativo</p>
            <div className="flex items-center gap-2">
              <div className="p-1 bg-green-400 rounded text-white">
                <Phone className="h-3 w-3" />
              </div>
              <p className="text-sm font-mono font-bold text-green-600">{caseData.phone2}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MessageCard({ msg, linkedCase }: { msg: Mensaje, linkedCase?: Case }) {
  const [showContact, setShowContact] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleToggleResolved = () => {
    if (!firestore) return;
    const msgRef = doc(firestore, 'mensajes', msg.id);
    updateDocumentNonBlocking(msgRef, { resolved: !msg.resolved });
    toast({
      title: !msg.resolved ? "Marcado como resuelto" : "Marcado como pendiente",
      description: `El mensaje de ${msg.nombre} ha sido actualizado.`,
    });
  };

  const handleDelete = () => {
    if (!firestore) return;
    const msgRef = doc(firestore, 'mensajes', msg.id);
    deleteDocumentNonBlocking(msgRef);
    toast({
      variant: "destructive",
      title: "Mensaje eliminado",
      description: "El mensaje ha sido borrado del buzón permanentemente.",
    });
  };

  return (
    <Card className={cn(
      "overflow-hidden border-primary/10 hover:shadow-md transition-all duration-300",
      msg.resolved && "bg-green-50/60 border-green-200"
    )}>
      <CardHeader className="pb-3 bg-muted/5 p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-full">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold uppercase tracking-tight">{msg.nombre}</CardTitle>
                <p className="text-[10px] text-muted-foreground font-mono">{msg.email}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="text-[9px] text-muted-foreground uppercase font-bold whitespace-nowrap bg-background border px-2 py-0.5 rounded">
                {format(new Date(msg.createdAt), "d MMM, HH:mm", { locale: es })}
              </div>
              {msg.resolved && (
                <Badge className="bg-green-600 text-white text-[8px] h-4 py-0 uppercase font-black">Resuelto</Badge>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge variant="outline" className="text-[10px] font-bold">C.C. {msg.cedula}</Badge>
            {linkedCase ? (
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px]">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {linkedCase.caseNumber}
                </Badge>
                <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-7 px-2 text-[10px] font-bold text-green-700 hover:bg-green-50"
                    onClick={() => setShowContact(!showContact)}
                >
                    {showContact ? <ChevronUp className="h-3 w-3" /> : <Phone className="h-3 w-3" />}
                </Button>
              </div>
            ) : (
              <Badge variant="destructive" className="text-[10px] opacity-70">
                <AlertCircle className="h-3 w-3 mr-1" />
                No registrado
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="p-3 bg-muted/20 rounded-lg border border-primary/5">
          <p className="font-bold text-primary mb-1 uppercase text-[9px] tracking-widest">{msg.asunto}</p>
          <p className="text-foreground/80 leading-relaxed italic text-xs border-l-2 border-primary/20 pl-3">
            "{msg.mensaje}"
          </p>
        </div>
        
        {showContact && linkedCase && (
          <div className="animate-in slide-in-from-top-2 duration-300">
            <CaseContactDetails caseData={linkedCase} />
            <Button variant="outline" size="sm" asChild className="w-full mt-2 h-8 text-[10px] font-bold">
              <Link href={`/dashboard/cases/${linkedCase.id}`}>
                <ExternalLink className="mr-2 h-3 w-3" /> Ver Ficha Completa
              </Link>
            </Button>
          </div>
        )}

        <div className="mt-4 pt-3 border-t flex items-center justify-end gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 text-[10px] text-destructive hover:text-destructive hover:bg-destructive/10 font-bold uppercase tracking-tighter">
                <Trash2 className="h-3 w-3 mr-1" /> Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar este mensaje?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción es permanente y no se puede deshacer. El mensaje de <strong>{msg.nombre}</strong> será borrado del buzón.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl font-bold">CANCELAR</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 rounded-xl font-bold">
                  SÍ, ELIMINAR
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button 
            variant={msg.resolved ? "outline" : "default"} 
            size="sm" 
            onClick={handleToggleResolved}
            className={cn(
              "h-8 text-[10px] font-bold uppercase tracking-tighter",
              !msg.resolved && "bg-green-600 hover:bg-green-700 text-white"
            )}
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            {msg.resolved ? "Reabrir Caso" : "Caso Resuelto"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MessagesPage() {
  const firestore = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('query') || '';

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'mensajes'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const casesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'cases');
  }, [firestore]);

  const { data: messages, isLoading: isMessagesLoading } = useCollection<Mensaje>(messagesQuery);
  const { data: cases, isLoading: isCasesLoading } = useCollection<Case>(casesQuery);

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('query', term);
    } else {
      params.delete('query');
    }
    router.replace(`/dashboard/messages?${params.toString()}`);
  }, 300);

  // Marcar como leídos al entrar
  useEffect(() => {
    if (messages && firestore) {
      messages.forEach(msg => {
        if (msg.read === false) {
          const msgRef = doc(firestore, 'mensajes', msg.id);
          updateDocumentNonBlocking(msgRef, { read: true });
        }
      });
    }
  }, [messages, firestore]);

  const categorizedMessages = useMemo(() => {
    if (!messages || !cases) return { linked: [], unlinked: [] };

    const searchTerm = queryParam.toLowerCase();
    const filtered = messages.filter(msg => 
      msg.nombre.toLowerCase().includes(searchTerm) ||
      msg.cedula.toLowerCase().includes(searchTerm) ||
      msg.asunto.toLowerCase().includes(searchTerm)
    );

    const caseMap = new Map(cases.map(c => [c.documentId, c]));
    
    const linked: { msg: Mensaje, case: Case }[] = [];
    const unlinked: Mensaje[] = [];

    filtered.forEach(msg => {
      const foundCase = caseMap.get(msg.cedula);
      if (foundCase) {
        linked.push({ msg, case: foundCase });
      } else {
        unlinked.push(msg);
      }
    });

    return { linked, unlinked };
  }, [messages, cases, queryParam]);

  if (isMessagesLoading || isCasesLoading) {
    return (
      <div className="space-y-4 py-4">
        <Skeleton className="h-12 w-64 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-96 w-full rounded-xl" />
            <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary font-headline flex items-center gap-2">
            <Mail className="h-8 w-8" />
            Buzón de Mensajes
          </h1>
          <p className="text-muted-foreground">Gestión de consultas ciudadanas vinculadas automáticamente.</p>
        </div>
      </div>

      <div className="relative w-full md:w-1/2 lg:w-1/3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar por nombre, cédula o asunto..." 
          className="pl-9 bg-background border-primary/20"
          onChange={(e) => handleSearch(e.target.value)}
          defaultValue={queryParam}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Columna Izquierda: Casos Vinculados */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-green-500 pb-2 mb-4">
            <h2 className="text-lg font-bold text-green-700 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Casos Vinculados
            </h2>
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{categorizedMessages.linked.length}</Badge>
          </div>
          
          <div className="grid gap-4">
            {categorizedMessages.linked.length > 0 ? (
              categorizedMessages.linked.map(({ msg, case: linkedCase }) => (
                <MessageCard key={msg.id} msg={msg} linkedCase={linkedCase} />
              ))
            ) : (
              <p className="text-center text-muted-foreground py-10 italic text-sm">No se encontraron mensajes vinculados.</p>
            )}
          </div>
        </div>

        {/* Columna Derecha: Sin Caso Registrado */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-red-400 pb-2 mb-4">
            <h2 className="text-lg font-bold text-red-600 flex items-center gap-2">
              <Inbox className="h-5 w-5" />
              Sin Caso Registrado
            </h2>
            <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100">{categorizedMessages.unlinked.length}</Badge>
          </div>

          <div className="grid gap-4">
            {categorizedMessages.unlinked.length > 0 ? (
              categorizedMessages.unlinked.map((msg) => (
                <MessageCard key={msg.id} msg={msg} />
              ))
            ) : (
              <p className="text-center text-muted-foreground py-10 italic text-sm">No se encontraron mensajes sin vincular.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
