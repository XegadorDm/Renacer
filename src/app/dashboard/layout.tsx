'use client';
import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
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
import { Home, LogOut, Settings, Users, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/icons/logo";
import { doc } from "firebase/firestore";

interface UserProfile {
    role: string;
    firstName?: string;
    lastName?: string;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc<UserProfile>(userDocRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [isUserLoading, user, router]);

  const isAdmin = 
    user?.email === 'diegomauriciopastusano@gmail.com' || 
    user?.email === 'aleksimbachi@gmail.com';

  const casesLinkHref = useMemo(() => {
    let href = "/dashboard/cases";
    if (userProfile?.role) {
      href += `?role=${userProfile.role}`;
    }
    return href;
  }, [userProfile?.role]);


  if (isUserLoading || !user) {
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
                    <Link href="/dashboard"><Home/><span>Ubicaciones</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Casos">
                    <Link href={casesLinkHref}><Users/><span>Casos</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Administración">
                      <Link href="/dashboard/admin"><ShieldCheck/><span>Administración</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Configuración">
                        <Link href="#"><Settings/><span>Configuración</span></Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 py-2">
            <SidebarTrigger />
            <div className="flex-1" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="overflow-hidden rounded-full">
                  <Avatar>
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
          <main className="p-4 sm:px-6 sm:py-0">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

import { Loader2 } from "lucide-react";