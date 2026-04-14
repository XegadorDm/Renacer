'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PhoneCall, User, IdCard, MapPin, Calendar, Eye, PhoneOff, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Case } from '@/lib/case-schema';

function ContactCard({ item }: { item: Case }) {
  return (
    <Card className="hover:shadow-md transition-shadow border-primary/10">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-sm font-bold uppercase truncate pr-2">
            {item.firstName} {item.lastName}
          </CardTitle>
          <Badge variant={item.status === 'CONTACTADO' ? 'default' : 'destructive'} className="text-[8px] h-4 font-black">
            {item.status}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-1 text-[10px]">
          <IdCard className="h-3 w-3" />
          C.C. {item.documentId}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2 space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 text-primary" />
          <span>{item.municipality}, {item.department}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground italic">
          <Calendar className="h-3 w-3" />
          <span>Registrado: {item.createdAt ? format(parseISO(item.createdAt), "dd/MM/yyyy", { locale: es }) : 'Sin fecha'}</span>
        </div>
      </CardContent>
      <CardFooter className="pt-2 border-t">
        <Button asChild variant="ghost" size="sm" className="w-full text-[10px] font-bold h-8">
          <Link href={`/dashboard/cases/${item.id}`}>
            <Eye className="mr-2 h-3 w-3" /> VER DETALLES
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function ContactedUsersPage() {
  const firestore = useFirestore();

  const casesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'cases');
  }, [firestore]);

  const { data: cases, isLoading } = useCollection<Case>(casesQuery);

  const contactedCases = useMemo(() => {
    return cases?.filter(c => c.status === 'CONTACTADO') || [];
  }, [cases]);

  const notContactedCases = useMemo(() => {
    return cases?.filter(c => c.status === 'NO CONTACTADO') || [];
  }, [cases]);

  if (isLoading) {
    return (
      <div className="space-y-6 py-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Skeleton className="h-8 w-40" />
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
          </div>
          <div className="space-y-4">
            <Skeleton className="h-8 w-40" />
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <div>
        <h1 className="text-3xl font-bold text-primary font-headline flex items-center gap-2">
          <PhoneCall className="h-8 w-8" />
          Usuarios Contactados
        </h1>
        <p className="text-muted-foreground">Seguimiento rápido del estado de comunicación con los beneficiarios.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Columna Contactados */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-green-500 pb-2">
            <h2 className="text-lg font-bold text-green-700 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Contactados
            </h2>
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{contactedCases.length}</Badge>
          </div>
          
          <div className="grid gap-4">
            {contactedCases.length > 0 ? (
              contactedCases.map((c) => <ContactCard key={c.id} item={c} />)
            ) : (
              <Card className="bg-muted/30 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm italic">No hay usuarios marcados como contactados.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Columna No Contactados */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-destructive pb-2">
            <h2 className="text-lg font-bold text-destructive flex items-center gap-2">
              <PhoneOff className="h-5 w-5" />
              No Contactados
            </h2>
            <Badge variant="destructive" className="bg-destructive/10 text-destructive hover:bg-destructive/20">{notContactedCases.length}</Badge>
          </div>

          <div className="grid gap-4">
            {notContactedCases.length > 0 ? (
              notContactedCases.map((c) => <ContactCard key={c.id} item={c} />)
            ) : (
              <Card className="bg-muted/30 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm italic">No hay intentos fallidos registrados.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
