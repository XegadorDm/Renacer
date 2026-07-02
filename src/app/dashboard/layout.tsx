'use client';
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Home, LogOut, Settings, Users, Loader2, Mail, PhoneCall, UserCog, Database } from "lucide-react";
import { Logo } from "@/components/icons/logo";
import { doc, setDoc, getDoc } from "firebase/firestore";
import type { UserProfile } from "@/lib/case-schema";
import { isCoreAdmin } from "@/lib/core-admins";
import { SyncStatusPanel } from "@/components/dashboard/sync-status-panel";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  const autoCreateAttempted = useRef(false);

  useEffect(() => {
    if (!user || !firestore || isProfileLoading || userProfile || autoCreateAttempted.current) {
      return;
    }
    autoCreateAttempted.current = true;

    const userRef = doc(firestore, 'users', user.uid);

    getDoc(userRef).then((snap) => {
      if (snap.exists()) return; // Ya existe en el servidor: nunca tocar su status.

      const isCore = isCoreAdmin(user.email);
      setDoc(userRef, {
        id: user.uid,
        email: user.email,
        firstName: user.displayName?.split(' ')[0] || 'Usuario',
        lastName: user.displayName?.split(' ')[1] || 'Renacer',
        role: isCore ? 'admin' : 'case-worker',
        status: isCore ? 'approved' : 'pending',
        createdAt: new Date().toISOString()
      }, { merge: true }).catch(err => console.error("Error auto-creating user:", err));
    }).catch(err => console.error("Error checking user existence:", err));
  }, [user, userProfile, isProfileLoading, firestore]);

  useEffect(() => {
    if (!isUserLoading && user && !isProfileLoading && userProfile) {
      if (userProfile.status === 'pending' && !isCoreAdmin(user.email)) {
        router.replace('/pending-approval');
      }
    }
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [isUserLoading, user, userProfile, isProfileLoading, router]);

  if (isUserLoading || isProfileLoading || (user && !userProfile)) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm font-medium text-muted-foreground">Cargando plataforma...</p>
            </div>
        </div>
    );
  }
  
  const handleLogout = async () => {
    if(auth) {
        await auth.signOut();
        router.push('/');
    }
  };

  const getInitials = () => {
    if (userProfile?.firstName && userProfile?.lastName) {
      return `${userProfile.firstName[0]}${userProfile.lastName[0]}`.toUpperCase();
    }
    return user?.email?.[0].toUpperCase() || 'U';
  };

  const iconClasses = "h-5 w-5 text-black shrink-0";
  const isAdmin = userProfile?.role === 'admin' || isCoreAdmin(user?.email);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar collapsible="icon">
          <SidebarHeader className="flex flex-row items-center justify-between p-4">
             <Link href="/dashboard" className="flex items-center gap-2" prefetch={false}>
                <Logo className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold font-headline text-foreground group-data-[collapsible=icon]:hidden">
                    Renacer
                </span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Ubicaciones">
                    <Link href="/dashboard"><Home className={iconClasses}/><span>Ubicaciones</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Casos">
                    <Link href="/dashboard/cases"><Users className={iconClasses}/><span>Casos</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Seguimiento">
                    <Link href="/dashboard/contacted"><PhoneCall className={iconClasses}/><span>Seguimiento</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Buzón">
                    <Link href="/dashboard/messages" className="flex items-center gap-2">
                        <Mail className={iconClasses}/><span>Buzón</span>
                    </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {isAdmin && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Personal">
                        <Link href="/dashboard/users"><UserCog className={iconClasses}/><span>Personal</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Copias de Seguridad">
                        <Link href="/dashboard/backups"><Database className={iconClasses}/><span>Backups</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Configuración">
                        <Link href="#"><Settings className={iconClasses}/><span>Configuración</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex-1 overflow-hidden">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 py-2">
            <SidebarTrigger />
            <div className="flex-1" />
            <SyncStatusPanel />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="overflow-hidden rounded-full h-9 w-9">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.photoURL || `https://picsum.photos/seed/${user?.uid}/40/40`} alt="Avatar" />
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{userProfile?.firstName || user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Configuración</DropdownMenuItem>
                <DropdownMenuItem>Soporte</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="mx-auto w-full max-w-7xl">
                {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
