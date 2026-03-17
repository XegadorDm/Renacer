'use client';
import Link from "next/link";
import { Suspense, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, Search, ArrowLeft, Phone } from "lucide-react";
import { CasesTable } from "@/components/dashboard/cases-table";
import { useRouter, useSearchParams } from "next/navigation";
import type { Case } from "@/lib/case-schema";

export default function CasesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('query') || '';
  const location = searchParams.get('location') || '';
  const userRole = searchParams.get('role') || '';
  
  const [selectedCase, setSelectedCase] = useState<(Case & { id: string }) | null>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('query', term);
    } else {
      params.delete('query');
    }
    if (userRole) params.set('role', userRole);
    if (location) params.set('location', location);

    router.replace(`/dashboard/cases?${params.toString()}`);
  }, 300);

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
                {/* Botón LLAMAR AL USUARIO - Visible debajo del menú */}
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

                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                <div className="relative w-full md:w-1/2 lg:w-1/3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar por nombre, documento o N° de caso..." 
                      className="pl-9"
                      onChange={(e) => handleSearch(e.target.value)}
                      defaultValue={query}
                    />
                </div>
                <Button asChild style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
                    <Link href="/dashboard/cases/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Crear Nuevo Caso
                    </Link>
                </Button>
                </div>
                
                <Suspense fallback={<div className="p-8 text-center">Cargando casos...</div>}>
                    <CasesTable 
                        query={query} 
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