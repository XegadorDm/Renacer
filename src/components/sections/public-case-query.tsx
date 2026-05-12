
'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { doc, getDoc, Timestamp, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, CheckCircle2, AlertCircle, Calendar, MapPin, Hash, User, Clock, Info } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { CaseStatusIndicator } from '@/components/dashboard/case-status-indicator';
import type { PublicCaseStatus } from '@/lib/case-schema';

export function PublicCaseQuery() {
  const firestore = useFirestore();
  const [cedula, setCedula] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PublicCaseStatus | null>(null);
  const [searched, setSearched] = useState(false);
  const [queryTime, setQueryTime] = useState<string | null>(null);

  const normalizeCedula = (val: string) => val.replace(/\D/g, '');

  const getInterpretiveMessage = (status: string) => {
    switch (status) {
      case 'CONTACTADO':
        return 'La corporación registra que ya se realizó contacto telefónico con usted o con el número asociado a su caso. Si requiere ampliar información, actualizar datos o continuar el seguimiento, puede comunicarse nuevamente con la corporación.';
      case 'NO CONTACTADO':
        return 'La corporación ha intentado comunicarse con usted a través de los números registrados, pero no fue posible establecer contacto. Le recomendamos actualizar sus datos de contacto o comunicarse directamente con la corporación para continuar el seguimiento de su caso.';
      default:
        return 'Su caso se encuentra registrado en el sistema. Hasta el momento no se han registrado novedades o actualizaciones recientes. Le recomendamos consultar nuevamente más adelante o comunicarse con la corporación si requiere mayor orientación.';
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cedula || !firestore) return;

    setLoading(true);
    setSearched(true);
    setResult(null);
    setQueryTime(format(new Date(), "d 'de' MMMM, HH:mm", { locale: es }));

    try {
      const normalized = normalizeCedula(cedula);
      if (!normalized) throw new Error("Cédula inválida");

      const docRef = doc(firestore, 'publicCaseStatus', normalized);
      const docSnap = await getDoc(docRef);
      const foundData = docSnap.exists() ? (docSnap.data() as PublicCaseStatus) : null;

      if (foundData) {
        setResult(foundData);
      }

      // Registro de trazabilidad (Audit log)
      const queriesRef = collection(firestore, 'publicCaseQueries');
      addDoc(queriesRef, {
        documentId: normalized,
        caseNumber: foundData?.caseNumber || null,
        statusAtQuery: foundData?.status || null,
        consultedAt: serverTimestamp(),
        result: foundData ? 'found' : 'not_found'
      }).catch(e => console.error("Error logging query", e));

    } catch (error) {
      console.error("Error consultando estado público:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateValue: any) => {
    if (!dateValue) return 'No disponible';
    try {
      const dateObj = dateValue instanceof Timestamp ? dateValue.toDate() : 
                     (typeof dateValue === 'string' ? parseISO(dateValue) : 
                     (dateValue.toDate ? dateValue.toDate() : new Date()));
      return format(dateObj, "dd/MM/yyyy", { locale: es });
    } catch (e) {
      return 'Fecha inválida';
    }
  };

  return (
    <section id="check-status" className="py-16 md:py-24 bg-background border-y border-primary/5">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold font-headline">Consultar estado de mi caso</h2>
            <p className="text-muted-foreground">
              Ingresa tu número de identificación para conocer el estado actual y recibir orientación sobre tu proceso.
            </p>
          </div>

          <Card className="shadow-lg border-primary/20 overflow-hidden">
            <CardHeader className="bg-muted/30 pb-6">
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-grow">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Número de Cédula" 
                    className="pl-9 h-12"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90 font-bold h-12 px-8"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "CONSULTAR"}
                </Button>
              </form>
            </CardHeader>
            
            <CardContent className="p-0">
              {loading && (
                <div className="p-12 text-center animate-pulse">
                  <Search className="h-12 w-12 text-primary/20 mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">Buscando en el sistema seguro...</p>
                </div>
              )}

              {searched && !loading && result && (
                <div className="p-6 md:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                         <Clock className="h-3 w-3" /> Consulta realizada el {queryTime}
                      </p>
                      <h3 className="text-2xl font-bold flex items-center gap-2">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                        Registro Encontrado
                      </h3>
                    </div>
                    <CaseStatusIndicator status={result.status} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter flex items-center gap-1">
                        <User className="h-3 w-3" /> Beneficiario
                      </p>
                      <p className="text-lg font-bold uppercase">{result.firstName} {result.lastName}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter flex items-center gap-1">
                        <Hash className="h-3 w-3" /> Número de Caso
                      </p>
                      <p className="text-lg font-mono font-black text-primary">{result.caseNumber}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> Municipio
                      </p>
                      <p className="text-lg font-bold uppercase">{result.municipality}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Fecha de Registro
                      </p>
                      <p className="text-lg font-medium">{formatDate(result.createdAt)}</p>
                    </div>
                  </div>

                  <div className="mt-4 p-5 bg-primary/5 rounded-2xl border border-primary/10 space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                        <Info className="h-5 w-5" />
                        <span className="text-xs font-bold uppercase tracking-widest">Información Importante</span>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/80 italic">
                      "{getInterpretiveMessage(result.status)}"
                    </p>
                  </div>
                </div>
              )}

              {searched && !loading && !result && (
                <div className="p-12 text-center space-y-4 animate-in zoom-in-95 duration-300">
                  <div className="bg-destructive/10 p-4 rounded-full w-fit mx-auto">
                    <AlertCircle className="h-10 w-10 text-destructive" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">No se encontró el registro</h3>
                    <p className="text-muted-foreground max-w-md mx-auto text-sm">
                      No se encontró una caracterización asociada a la cédula <strong>{cedula}</strong>. 
                      Verifique el número o use el formulario de contacto para que un asesor revise su situación.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
