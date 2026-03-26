
'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, User, Calendar, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Mensaje } from '@/lib/mensaje-schema';

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
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
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
          <p className="text-muted-foreground">Comunicaciones recibidas desde el portal público.</p>
        </div>
        <Badge variant="outline" className="px-4 py-1 font-bold">
          Total: {messages?.length || 0}
        </Badge>
      </div>

      <div className="grid gap-6">
        {messages && messages.length > 0 ? (
          messages.map((msg) => (
            <Card key={msg.id} className="overflow-hidden border-primary/10 hover:shadow-md transition-shadow">
              <div className={`h-1.5 w-full ${msg.linkedCase ? 'bg-green-500' : 'bg-destructive'}`} />
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold uppercase">{msg.nombre}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <span className="font-mono text-xs">{msg.email}</span>
                        <span>•</span>
                        <span className="font-semibold text-xs text-foreground">C.C. {msg.cedula}</span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase font-black">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(msg.createdAt), "d 'de' MMMM, HH:mm", { locale: es })}
                    </div>
                    {msg.linkedCase ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Caso Vinculado: {msg.linkedCase.caseNumber}
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="flex items-center gap-1 animate-pulse">
                        <AlertCircle className="h-3 w-3" />
                        Sin caso registrado
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-lg border border-primary/5 italic text-sm">
                  <p className="font-bold text-primary mb-1 uppercase text-[10px] tracking-widest">{msg.asunto}</p>
                  <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">{msg.mensaje}</p>
                </div>
                
                {msg.linkedCase && (
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" asChild className="text-xs font-bold border-primary/20 hover:bg-primary/5">
                      <Link href={`/dashboard/cases/${msg.linkedCase.id}`}>
                        <ExternalLink className="mr-2 h-3 w-3" />
                        Ver Caso Completo
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="p-12 text-center border-dashed">
            <Mail className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No se han recibido mensajes todavía.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
