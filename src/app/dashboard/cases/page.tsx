'use client';
import Link from "next/link";
import { Suspense, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, Search, ArrowLeft, Phone, Calendar as CalendarIcon, FileSearch, RefreshCw, Loader2, Wrench } from "lucide-react";
import { CasesTable } from "@/components/dashboard/cases-table";
import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, getDocs, writeBatch, doc, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { subDays } from 'date-fns';
import type { Case, UserProfile } from "@/lib/case-schema";

export default function CasesPage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  
  const queryParam = searchParams.get('query') || '';
  const docQuery = searchParams.get('doc') || '';
  const period = searchParams.get('period') || 'all';
  const location = searchParams.get('location') || '';
  
  const [selectedCase, setSelectedCase] = useState<(Case & { id: string }) | null>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isFixing, setIsFixing] = useState(false);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc<UserProfile>(userDocRef);
  const isAdmin = userProfile?.role === 'admin';

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`/dashboard/cases?${params.toString()}`);
  };

  const handleSearch = useDebouncedCallback((term: string) => updateFilters('query', term), 300);
  const handleDocSearch = useDebouncedCallback((term: string) => updateFilters('doc', term), 300);

  const handleFixDates = async () => {
    if (!firestore) return;
    setIsFixing(true);
    try {
      const casesRef = collection(firestore, 'cases');
      // Buscamos casos registrados hoy (07/04/2026) que necesitan corrección
      const q = query(casesRef, where("createdAt", ">=", "2026-04-07"), where("createdAt", "<=", "2026-04-07\uf8ff"));
      const snapshot = await getDocs(q);
      const batch = writeBatch(firestore);
      
      // Fecha objetivo: 7 días antes de la fecha errónea
      const targetDate = subDays(new Date("2026-04-07"), 7).toISOString();
      
      let count = 0;
      snapshot.docs.forEach((docSnap) => {
        batch.update(docSnap.ref, { createdAt: targetDate });
        count++;
      });

      if (count > 0) {
        await batch.commit();
        toast({
          title: "Fechas Corregidas",
          description: `Se han actualizado ${count} casos registrados erróneamente el 07/04/2026.`,
        });
      } else {
        toast({
          title: "Sin casos para corregir",
          description: "No se encontraron casos con la fecha errónea del 07/04/2026.",
        });
      }
    } catch (error) {
      console.error("Fix dates failed:", error);
      toast({
        variant: "destructive",
        title: "Error de Corrección",
        description: "No se pudieron actualizar los casos.",
      });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="flex justify-center w-full py-4">
        <Card className="w-full">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <CardTitle className="text-2xl font-bold text-primary">Gestión de Casos {location && `- ${location}`}</CardTitle>
                    <CardDescription>Busca, visualiza y gestiona los casos de la comunidad.</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                    {isAdmin && (
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleFixDates}
                            disabled={isFixing}
                            className="text-[10px] font-bold border-accent/20 text-accent hover:bg-accent/10"
                        >
                            {isFixing ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Wrench className="mr-2 h-3 w-3" />}
                            CORREGIR FECHAS (07/04)
                        </Button>
                    )}
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
                            * Selecciona un caso en la tabla para habilitar la llamada.
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Nombre o N° de caso..." 
                            className="pl-9"
                            onChange={(e) => handleSearch(e.target.value)}
                            defaultValue={queryParam}
                        />
                    </div>
                    <div className="relative">
                        <FileSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar por Cédula..." 
                            className="pl-9"
                            onChange={(e) => handleDocSearch(e.target.value)}
                            defaultValue={docQuery}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Select value={period} onValueChange={(val) => updateFilters('period', val)}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Periodo de registro" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los casos</SelectItem>
                                <SelectItem value="1w">Última semana</SelectItem>
                                <SelectItem value="15d">Hace 15 días</SelectItem>
                                <SelectItem value="1m">Hace 1 mes</SelectItem>
                                <SelectItem value="3m">Hace 3 meses</SelectItem>
                                <SelectItem value="6m">Hace 6 meses</SelectItem>
                                <SelectItem value="1y">1 año o más</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button asChild style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
                        <Link href="/dashboard/cases/new">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Nuevo Caso
                        </Link>
                    </Button>
                </div>
                
                <Suspense fallback={<div className="p-8 text-center">Cargando casos...</div>}>
                    <CasesTable 
                        query={queryParam} 
                        docQuery={docQuery}
                        period={period}
                        location={location} 
                        onSelectCase={setSelectedCase}
                        selectedCaseId={selectedCase?.id}
                        isCallModalOpen={isCallModalOpen}
                        setIsCallModalOpen={setIsCallModalOpen}
                    />
                </Suspense>
            </CardContent>
        </Card>
    </div>
  );
}
