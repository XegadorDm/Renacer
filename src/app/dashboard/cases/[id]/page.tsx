
'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Case } from '@/lib/case-schema';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Edit, FileText } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CaseStatusIndicator } from '@/components/dashboard/case-status-indicator';

function DetailItem({ label, value }: { label: string, value: React.ReactNode }) {
    if (value === undefined || value === null || value === '') return null;
    return (
        <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-base text-foreground">{String(value)}</p>
        </div>
    );
}

export default function CaseDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const firestore = useFirestore();

    const caseDocRef = useMemo(() => {
        if (!firestore || !id) return null;
        return doc(firestore, 'cases', id);
    }, [firestore, id]);

    const { data: caseData, isLoading } = useDoc<Case>(caseDocRef);

    if (isLoading) {
        return (
            <Card className="w-full max-w-4xl mx-auto">
                <CardHeader>
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 15 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-5 w-2/3" />
                        </div>
                    ))}
                    <div className="lg:col-span-3 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </CardFooter>
            </Card>
        )
    }

    if (!caseData) {
        return (
            <Card className="w-full max-w-4xl mx-auto text-center">
                <CardHeader>
                    <CardTitle>Caso no encontrado</CardTitle>
                    <CardDescription>El caso que estás buscando no existe, fue eliminado o no tienes permiso para verlo.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                    </Button>
                </CardContent>
            </Card>
        );
    }
    
    const details = [
        { label: 'N° de Caso', value: caseData.caseNumber },
        { label: 'ID Interno', value: caseData.internalId },
        { label: 'Documento de Identidad', value: caseData.documentId },
        { label: 'Fecha de Nacimiento', value: format(new Date(caseData.birthDate), "d 'de' MMMM, yyyy", { locale: es }) },
        { label: 'Edad', value: `${caseData.age} años` },
        { label: 'Género', value: caseData.gender },
        { label: 'Estado Civil', value: caseData.maritalStatus },
        { label: 'Grupo Étnico', value: caseData.ethnicGroup },
        { label: 'Dirección', value: caseData.address },
        { label: 'Municipio', value: caseData.municipality },
        { label: 'Departamento', value: caseData.department },
        { label: 'Celular 1', value: caseData.phone1 },
        { label: 'Celular 2', value: caseData.phone2 },
        { label: 'Tipo de Desplazamiento', value: caseData.displacementType },
        { label: 'Discapacidad', value: caseData.disability },
        { label: '¿Es adulto mayor?', value: caseData.isElderly ? 'Sí' : 'No' },
        { label: 'Miembros del hogar', value: caseData.householdMembers },
    ];

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader className="border-b">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-2xl font-bold font-headline flex items-center gap-2">
                           <FileText className="h-6 w-6 text-primary" />
                           Detalles del Caso: {caseData.firstName} {caseData.lastName}
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Información completa de la caracterización.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold">Estado:</span>
                        <CaseStatusIndicator status={caseData.status} />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
                    {details.map(item => (
                        <DetailItem key={item.label} label={item.label} value={item.value} />
                    ))}
                </div>
                <div className="mt-8 pt-6 border-t">
                     <h3 className="text-lg font-semibold mb-2">Testimonio</h3>
                     <p className="text-muted-foreground whitespace-pre-wrap bg-muted/50 p-4 rounded-md">{caseData.testimony}</p>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
                 <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                </Button>
                <Button asChild>
                    <Link href={`/dashboard/cases/${id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" /> Editar Caso
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    )
}
