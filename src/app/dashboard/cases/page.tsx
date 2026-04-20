'use client';
import Link from "next/link";
import { Suspense, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, Search, ArrowLeft, Phone, Calendar as CalendarIcon, FileSearch, FilterX } from "lucide-react";
import { CasesTable } from "@/components/dashboard/cases-table";
import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Case, UserProfile } from "@/lib/case-schema";
import { Label } from "@/components/ui/label";

export default function CasesPage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  
  const queryParam = searchParams.get('query') || '';
  const docQuery = searchParams.get('doc') || '';
  const period = searchParams.get('period') || 'all';
  const location = searchParams.get('location') || '';
  const startDate = searchParams.get('from') || '';
  const endDate = searchParams.get('to') || '';
  
  const [selectedCase, setSelectedCase] = useState<(Case & { id: string }) | null>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc<UserProfile>(userDocRef);

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`/dashboard/cases?${params.toString()}`);
  };

  const clearFilters = () => {
    router.replace('/dashboard/cases');
  };

  const handleSearch = useDebouncedCallback((term: string) => updateFilters('query', term), 300);
  const handleDocSearch = useDebouncedCallback((term: string) => updateFilters('doc', term), 300);

  return (
    <div className="flex justify-center w-full py-4">
        <Card className="w-full">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <CardTitle className="text-2xl font-bold text-primary">Gestión de Casos {location && `- ${location}`}</CardTitle>
                    <CardDescription>Busca, visualiza y gestiona los casos de la comunidad.</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
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
                            * Selecciona un caso en la tabla para habilitar la llamada.
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
                        <Link href="/dashboard/cases/new">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Nuevo Registro
                        </Link>
                    </Button>
                </div>
                
                <Suspense fallback={<div className="p-8 text-center">Cargando casos...</div>}>
                    <CasesTable 
                        query={queryParam} 
                        docQuery={docQuery}
                        period={period}
                        startDate={startDate}
                        endDate={endDate}
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
