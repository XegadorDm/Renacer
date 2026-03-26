'use client';
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase";
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
import { Home, LogOut, Settings, Users, Loader2, Mail, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/icons/logo";
import { doc, collection, query, where } from "firebase/firestore";
import { ConnectionStatus } from "@/components/dashboard/connection-status";
import type { UserProfile } from "@/lib/case-schema";
import type { Mensaje } from "@/lib/mensaje-schema";

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

  // Validación de aprobación: true si es aprobado o legado (sin campo status)
  const isApproved = userProfile && (!userProfile.status || userProfile.status === 'approved');

  // Contador de mensajes no leídos (solo si el usuario está aprobado)
  const unreadMessagesQuery = useMemoFirebase(() => {
    if (!firestore || !user || !isApproved) return null;
    return query(collection(firestore, 'mensajes'), where('read', '==', false));
  }, [firestore, user, isApproved]);

  const { data: unreadMessages } = useCollection<Mensaje>(unreadMessagesQuery);
  const unreadCount = unreadMessages?.length || 0;

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [isUserLoading, user, router]);

  // Validación de estado de aprobación con soporte para usuarios legados
  useEffect(() => {
    if (!isProfileLoading && userProfile) {
      // Solo redirigir si el estado es explícitamente 'rejected' o 'pending'
      if (userProfile.status === 'rejected' || userProfile.status === 'pending') {
        router.replace('/pending-approval');
      }
    }
  }, [isProfileLoading, userProfile, router]);

  if (isUserLoading || isProfileLoading || !user) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    )
  }
  
  const handleLogout = async () => {
    if(auth) {
        await auth.signOut();
        router.push('/');
    }
  }

  const getInitials = () => {
    if (userProfile?.firstName && userProfile?.lastName) {
      return `${userProfile.firstName[0]}${userProfile.lastName[0]}`.toUpperCase();
    }
    return user.email?.[0].toUpperCase() || 'U';
  }

  const isAdmin = userProfile?.role === 'admin';

  // Estilo unificado para los iconos del sidebar
  const iconClasses = "h-5 w-5 text-black shrink-0";

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
                <SidebarMenuButton asChild tooltip="Buzón">
                    <Link href="/dashboard/messages" className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                            <Mail className={iconClasses}/><span>Buzón</span>
                        </div>
                        {unreadCount > 0 && (
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse mr-2 group-data-[collapsible=icon]:hidden">
                                {unreadCount}
                            </div>
                        )}
                    </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Solicitudes">
                      <Link href="/dashboard/users"><ShieldCheck className={iconClasses}/><span>Solicitudes</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
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
            
            <div className="ml-2 hidden sm:block">
              <ConnectionStatus />
            </div>

            <div className="flex-1" />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="overflow-hidden rounded-full h-9 w-9">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`} alt="Avatar" />
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{userProfile?.firstName || user.email}</DropdownMenuLabel>
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
