
'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CaseStatusIndicator } from "./case-status-indicator";
import { MoreHorizontal } from "lucide-react";
import { Button } from "../ui/button";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query as firestoreQuery, where } from "firebase/firestore";
import { Skeleton } from "../ui/skeleton";
import type { Case } from "@/lib/case-schema";

export function CasesTable({ query, location }: { query: string; location: string }) {
  const firestore = useFirestore();

  const casesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    
    const baseCollection = collection(firestore, 'cases');

    if (location) {
      return firestoreQuery(baseCollection, where("municipality", "==", location));
    }
    
    return baseCollection;

  }, [firestore, location]);

  const { data: cases, isLoading } = useCollection<Case>(casesQuery);
  
  const filteredCases = cases?.filter(c => {
    const searchTerm = query.toLowerCase();
    return query ? 
      (c.firstName.toLowerCase() + " " + c.lastName.toLowerCase()).includes(searchTerm) || 
      c.caseNumber.toLowerCase().includes(searchTerm) ||
      c.documentId.toLowerCase().includes(searchTerm)
      : true;
  });

  if (isLoading) {
    return (
        <div className="border rounded-lg p-4 space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>N° Caso</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Documento</TableHead>
            <TableHead>Municipio</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead><span className="sr-only">Acciones</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCases && filteredCases.length > 0 ? (
            filteredCases.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.caseNumber}</TableCell>
                <TableCell>{c.firstName} {c.lastName}</TableCell>
                <TableCell>{c.documentId}</TableCell>
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
