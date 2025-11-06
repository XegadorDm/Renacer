import { ColombiaMap } from "@/components/dashboard/colombia-map";
import { UserPanel } from "@/components/dashboard/user-panel";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Mapa de Ubicaciones</CardTitle>
            <CardDescription>Selecciona una región del Cauca para gestionar los casos.</CardDescription>
          </CardHeader>
          <CardContent>
            <ColombiaMap />
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-1">
        <UserPanel />
      </div>
    </div>
  );
}
