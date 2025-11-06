import { NewCaseForm } from "@/components/dashboard/new-case-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function NewCasePage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Crear Nuevo Caso</CardTitle>
                <CardDescription>Diligencia todos los campos para registrar una nueva caracterización.</CardDescription>
            </CardHeader>
            <CardContent>
                <NewCaseForm />
            </CardContent>
        </Card>
    )
}
