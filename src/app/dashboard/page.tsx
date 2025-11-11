'use client';
import { ColombiaMap } from "@/components/dashboard/colombia-map";
import { UserPanel } from "@/components/dashboard/user-panel";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 gap-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Mapa de Ubicaciones</CardTitle>
              <CardDescription>Selecciona una región del Cauca para gestionar los casos.</CardDescription>
            </div>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ColombiaMap />
          </CardContent>
        </Card>
      <UserPanel />
    </div>
  );
}
