'use client';
import { useParams } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { NewCaseForm } from "@/components/dashboard/new-case-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import type { Case } from '@/lib/case-schema';

export default function EditCasePage() {
    const params = useParams();
    const id = params.id as string;
    const firestore = useFirestore();

    // Se usa useMemoFirebase para cumplir con los requerimientos de seguridad y rendimiento de los hooks de Firebase
    const caseDocRef = useMemoFirebase(() => {
        if (!firestore || !id) return null;
        return doc(firestore, 'cases', id);
    }, [firestore, id]);

    const { data: caseData, isLoading } = useDoc<Case>(caseDocRef);
    
    if (isLoading) {
        return (
            <div className="w-full py-4">
                <Card className="w-full">
                    <CardHeader>
                        <Skeleton className="h-8 w-1/2" />
                        <Skeleton className="h-4 w-3/4" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Array.from({length: 12}).map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-1/4" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            ))}
                        </div>
                        <div className="flex justify-end gap-4">
                            <Skeleton className="h-10 w-24" />
                            <Skeleton className="h-10 w-32" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!caseData) {
         return (
            <div className="w-full py-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Caso no encontrado</CardTitle>
                        <CardDescription>No se pudo cargar el caso para editar.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
         )
    }

    return (
        <div className="w-full py-4">
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Editar Caso</CardTitle>
                    <CardDescription>
                        Estás modificando la caracterización de <span className="font-semibold text-primary">{caseData.firstName} {caseData.lastName}</span>.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <NewCaseForm caseData={caseData} />
                </CardContent>
            </Card>
        </div>
    )
}
