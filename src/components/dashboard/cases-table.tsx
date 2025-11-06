import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cases } from "@/lib/mock-data";
import { CaseStatusIndicator } from "./case-status-indicator";
import { MoreHorizontal } from "lucide-react";
import { Button } from "../ui/button";

export function CasesTable({ query, location }: { query: string; location: string }) {
  const filteredCases = cases.filter(c => {
    const matchesLocation = location ? c.location === location : true;
    const matchesQuery = query ? 
      c.name.toLowerCase().includes(query.toLowerCase()) || 
      c.id.toLowerCase().includes(query.toLowerCase()) : true;
    return matchesLocation && matchesQuery;
  });

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>N° Caso</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Documento</TableHead>
            <TableHead>Ubicación</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead><span className="sr-only">Acciones</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCases.length > 0 ? (
            filteredCases.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.id}</TableCell>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.document}</TableCell>
                <TableCell>{c.municipality}</TableCell>
                <TableCell>
                  <CaseStatusIndicator status={c.status} />
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center h-24">
                No se encontraron casos.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
