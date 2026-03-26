'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where, limit, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Mail, User, Calendar, ExternalLink, AlertCircle, CheckCircle2, Phone, ChevronUp, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Mensaje } from '@/lib/mensaje-schema';
import type { Case, UserProfile } from '@/lib/case-schema';

/**
 * Componente que muestra la información de contacto detallada del caso vinculado.
 * Obtiene el nombre del trabajador social que registró el caso originalmente.
 */
function CaseContactDetails({ caseData }: { caseData: Case }) {
  const firestore = useFirestore();
  
  // Obtenemos la referencia al documento del usuario (asesor) que creó el caso usando su userId
  const workerDocRef = useMemoFirebase(() => {
    // Es vital que el caso tenga un userId asociado para encontrar al autor
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

/**
 * Componente que busca y muestra si un mensaje tiene un caso vinculado por cédula.
 * Incluye el botón de Contacto y la lógica de expansión.
 */
function LinkedCaseStatus({ documentId }: { documentId: string }) {
  const firestore = useFirestore();
  const [showContact, setShowContact] = useState(false);
  
  const caseQuery = useMemoFirebase(() => {
    if (!firestore || !documentId) return null;
    return query(
      collection(firestore, 'cases'),
      where('documentId', '==', documentId),
      limit(1)
    );
  }, [firestore, documentId]);

  const { data: cases, isLoading } = useCollection<Case>(caseQuery);

  if (isLoading) {
    return <Skeleton className="h-6 w-32 rounded-full" />;
  }

  if (cases && cases.length > 0) {
    const linkedCase = cases[0];
    return (
      <div className="w-full flex flex-col items-end gap-2">
        <div className="flex flex-wrap justify-end items-center gap-2">
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 flex items-center gap-1 py-1 px-3">
              <CheckCircle2 className="h-3 w-3" />
              Caso Vinculado: {linkedCase.caseNumber}
            </Badge>
            
            <Button 
              variant="outline" 
              size="sm" 
              asChild 
              className="text-[10px] h-8 font-bold border-primary/20 hover:bg-primary/5 hidden md:flex"
            >
              <Link href={`/dashboard/cases/${linkedCase.id}`}>
                <ExternalLink className="mr-2 h-3 w-3" />
                Ver Caso
              </Link>
            </Button>

            <Button 
              size="sm" 
              className={`text-[10px] h-8 font-bold shadow-md transition-all px-4 ${
                showContact 
                ? "bg-green-800 hover:bg-green-900 text-white" 
                : "bg-green-600 hover:bg-green-700 text-white"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setShowContact(!showContact);
              }}
            >
              {showContact ? <ChevronUp className="mr-2 h-3 w-3" /> : <Phone className="mr-2 h-3 w-3" />}
              {showContact ? "Ocultar" : "Contacto"}
            </Button>
        </div>
        
        {showContact && <CaseContactDetails caseData={linkedCase} />}
      </div>
    );
  }

  return (
    <Badge variant="destructive" className="flex items-center gap-1 px-3 py-1 font-bold">
      <AlertCircle className="h-3 w-3" />
      Sin caso registrado
    </Badge>
  );
}

export default function MessagesPage() {
  const firestore = useFirestore();

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'mensajes'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: messages, isLoading } = useCollection<Mensaje>(messagesQuery);

  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        <Skeleton className="h-12 w-64 mb-6" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
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
          <p className="text-muted-foreground">Comunicaciones recibidas vinculadas automáticamente por C.C.</p>
        </div>
        <Badge variant="outline" className="px-4 py-1 font-bold bg-background shadow-sm">
          Total Mensajes: {messages?.length || 0}
        </Badge>
      </div>

      <div className="grid gap-6">
        {messages && messages.length > 0 ? (
          messages.map((msg) => (
            <Card key={msg.id} className="overflow-hidden border-primary/10 hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3 bg-muted/10">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-full border border-primary/20">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold uppercase tracking-tight">{msg.nombre}</CardTitle>
                      <CardDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-mono text-xs text-primary">{msg.email}</span>
                        <span className="hidden sm:inline text-muted-foreground opacity-50">•</span>
                        <span className="font-bold text-xs text-foreground bg-muted px-2 py-0.5 rounded">C.C. {msg.cedula}</span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 w-full lg:w-auto">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase font-black tracking-widest bg-background px-2 py-1 rounded border">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(msg.createdAt), "d 'de' MMMM, HH:mm", { locale: es })}
                    </div>
                    <LinkedCaseStatus documentId={msg.cedula} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="p-5 bg-muted/30 rounded-xl border border-primary/5 relative">
                  <div className="absolute -top-3 left-4 bg-background px-2 text-[9px] font-black uppercase tracking-widest text-primary border rounded">
                    Consulta Ciudadana
                  </div>
                  <p className="font-bold text-primary mb-2 uppercase text-[11px] tracking-widest">{msg.asunto}</p>
                  <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap italic text-sm border-l-2 border-primary/20 pl-4">
                    "{msg.mensaje}"
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="p-20 text-center border-dashed border-2">
            <div className="bg-muted/30 p-6 rounded-full w-fit mx-auto mb-4">
              <Mail className="h-12 w-12 text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground font-bold uppercase tracking-widest text-sm">No hay mensajes en el buzón</p>
            <p className="text-xs text-muted-foreground mt-1">Las consultas enviadas desde la página principal aparecerán aquí.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
