'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useUser, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/provider';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bell, BellOff, CheckCircle2, Clock } from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { Notification } from '@/lib/notification-schema';

interface NotificationsSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function NotificationsSheet({ open, onOpenChange }: NotificationsSheetProps) {
    const { user } = useUser();
    const firestore = useFirestore();

    const notificationsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        // La consulta debe filtrar por el ID del usuario actual para que coincida con la lógica de seguridad y visualización
        return query(
            collection(firestore, 'notifications'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, user]);

    const { data: notifications, isLoading } = useCollection<Notification>(notificationsQuery);

    const markAsRead = (id: string) => {
        if (!firestore) return;
        const notifRef = doc(firestore, 'notifications', id);
        updateDocumentNonBlocking(notifRef, { read: true });
    };

    const unreadCount = useMemo(() => {
        return notifications?.filter(n => !n.read).length || 0;
    }, [notifications]);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader className="pb-4 border-b">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-primary" />
                            Notificaciones
                        </SheetTitle>
                        {unreadCount > 0 && (
                            <Badge variant="destructive" className="rounded-full">
                                {unreadCount} nuevas
                            </Badge>
                        )}
                    </div>
                    <SheetDescription>
                        Historial de actualizaciones de tus casos registrados.
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="h-[calc(100vh-150px)] mt-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-8">
                            <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : notifications && notifications.length > 0 ? (
                        <div className="space-y-4 pr-4">
                            {notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    onClick={() => !notif.read && markAsRead(notif.id)}
                                    className={`p-4 rounded-lg border transition-all cursor-pointer hover:shadow-sm ${
                                        notif.read ? 'bg-background opacity-75' : 'bg-primary/5 border-primary/20 shadow-inner'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                            Caso: {notif.caseId.substring(0, 12)}
                                        </p>
                                        {!notif.read && <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
                                    </div>
                                    <p className="text-sm font-medium mb-2 leading-relaxed">
                                        {notif.message}
                                    </p>
                                    <div className="flex items-center justify-between mt-3">
                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {format(new Date(notif.createdAt), "d 'de' MMM, HH:mm", { locale: es })}
                                        </span>
                                        {notif.read && (
                                            <span className="text-[10px] text-primary flex items-center gap-1">
                                                <CheckCircle2 className="h-3 w-3" />
                                                Leída
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-12 text-center">
                            <BellOff className="h-12 w-12 text-muted-foreground/30 mb-4" />
                            <p className="text-muted-foreground font-medium">No tienes notificaciones por ahora.</p>
                        </div>
                    )}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}