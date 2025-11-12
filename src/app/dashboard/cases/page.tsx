
'use client';
import Link from "next/link";
import { Suspense } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, Search, ArrowLeft } from "lucide-react";
import { CasesTable } from "@/components/dashboard/cases-table";
import { useRouter, useSearchParams } from "next/navigation";

export default function CasesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('query') || '';
  const location = searchParams.get('location') || '';
  const userRole = searchParams.get('role') || '';

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('query', term);
    } else {
      params.delete('query');
    }
    // Preserve role and location parameters
    if (userRole) params.set('role', userRole);
    if (location) params.set('location', location);

    router.replace(`/dashboard/cases?${params.toString()}`);
  }, 300);

  return (
    <div className="flex justify-center w-full py-4">
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Gestión de Casos {location && `- ${location}`}</CardTitle>
                    <CardDescription>Busca, visualiza y gestiona los casos de la comunidad.</CardDescription>
                </div>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver
                </Button>
            </CardHeader>
            <CardContent>
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
                <Suspense fallback={<div>Cargando casos...</div>}>
                    <CasesTable query={query} location={location} userRole={userRole} />
                </Suspense>
            </CardContent>
        </Card>
    </div>
  );
}
