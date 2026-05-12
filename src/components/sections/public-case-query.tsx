'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, limit, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, CheckCircle2, AlertCircle, Calendar, MapPin, Hash } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { CaseStatusIndicator } from '@/components/dashboard/case-status-indicator';
import type { Case } from '@/lib/case-schema';

export function PublicCaseQuery() {
  const firestore = useFirestore();
  const [cedula, setCedula] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Case | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cedula || !firestore) return;

    setLoading(true);
    setSearched(true);
    setResult(null);

    try {
      const casesRef = collection(firestore, 'cases');
      const q = query(casesRef, where("documentId", "==", cedula.trim()), limit(1));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setResult(querySnapshot.docs[0].data() as Case);
      }
    } catch (error) {
      console.error("Error consultando caso:", error);
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
      return format(dateObj, "d 'de' MMMM, yyyy", { locale: es });
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
              Ingresa tu número de identificación para conocer el estado actual de tu caracterización.
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
                  <p className="text-muted-foreground font-medium">Buscando en el sistema...</p>
                </div>
              )}

              {searched && !loading && result && (
                <div className="p-6 md:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary">Resultado de la Consulta</p>
                      <h3 className="text-2xl font-bold">¡Caso Encontrado!</h3>
                    </div>
                    <CaseStatusIndicator status={result.status} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-bold flex items-center gap-2">
                        <Hash className="h-3 w-3" /> N° DE CASO
                      </p>
                      <p className="text-lg font-mono font-black text-foreground">{result.caseNumber}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-bold flex items-center gap-2">
                        <MapPin className="h-3 w-3" /> MUNICIPIO
                      </p>
                      <p className="text-lg font-bold uppercase">{result.municipality}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-bold flex items-center gap-2">
                        <Calendar className="h-3 w-3" /> FECHA DE REGISTRO
                      </p>
                      <p className="text-lg font-medium">{formatDate(result.createdAt)}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Su caso se encuentra registrado en el sistema. Para más información o actualización de datos, un asesor podrá contactarlo a través de los números registrados.
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
                    <h3 className="text-xl font-bold">No se encontró el caso</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      No se encontró un registro asociado a la cédula <strong>{cedula}</strong>. 
                      Puede enviar una solicitud en el formulario de contacto más abajo para que un asesor revise su situación.
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
