
'use client';
import { ColombiaMap } from "@/components/dashboard/colombia-map";
import { UserPanel } from "@/components/dashboard/user-panel";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from "@/components/ui/skeleton";


interface UserProfile {
    role: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  if (isProfileLoading) {
      return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-6xl">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="w-full aspect-square" />
                </CardContent>
            </Card>
            <div className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
          </div>
      )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-6xl">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Mapa de Ubicaciones</CardTitle>
              <CardDescription>Selecciona una región del Cauca para gestionar los casos.</CardDescription>
            </div>
            <Button variant="outline" onClick={() => router.back()} className="hidden sm:flex">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ColombiaMap userRole={userProfile?.role} />
          </CardContent>
        </Card>
        <div className="lg:col-span-1 flex flex-col">
            <UserPanel />
        </div>
    </div>
  );
}
