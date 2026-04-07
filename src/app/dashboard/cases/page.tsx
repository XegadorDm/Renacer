
'use client';
import Link from "next/link";
import { Suspense, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, Search, ArrowLeft, Phone, Calendar as CalendarIcon, FileSearch } from "lucide-react";
import { CasesTable } from "@/components/dashboard/cases-table";
import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Case } from "@/lib/case-schema";

export default function CasesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('query') || '';
  const docQuery = searchParams.get('doc') || '';
  const period = searchParams.get('period') || 'all';
  const location = searchParams.get('location') || '';
  const userRole = searchParams.get('role') || '';
  
  const [selectedCase, setSelectedCase] = useState<(Case & { id: string }) | null>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);

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

  return (
    <div className="flex justify-center w-full py-4">
        <Card className="w-full">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <CardTitle className="text-2xl font-bold text-primary">Gestión de Casos {location && `- ${location}`}</CardTitle>
                    <CardDescription>Busca, visualiza y gestiona los casos de la comunidad.</CardDescription>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {/* Botón LLAMAR AL USUARIO */}
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

                {/* Controles de Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Nombre o N° de caso..." 
                            className="pl-9"
                            onChange={(e) => handleSearch(e.target.value)}
                            defaultValue={query}
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
                        query={query} 
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
