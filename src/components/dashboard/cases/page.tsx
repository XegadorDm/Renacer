import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, Search } from "lucide-react";
import { CasesTable } from "@/components/dashboard/cases-table";

export default function CasesPage({ searchParams }: { searchParams: { query?: string, location?: string } }) {
  const query = searchParams?.query || '';
  const location = searchParams?.location || '';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Casos {location && `- ${location}`}</CardTitle>
        <CardDescription>Busca, visualiza y gestiona los casos de la comunidad.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full md:w-1/2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nombre o N° de caso..." className="pl-9" />
          </div>
          <Button asChild style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
            <Link href="/dashboard/cases/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear Nuevo Caso
            </Link>
          </Button>
        </div>
        <Suspense fallback={<div>Cargando casos...</div>}>
            <CasesTable query={query} location={location} />
        </Suspense>
      </CardContent>
    </Card>
  );
}
