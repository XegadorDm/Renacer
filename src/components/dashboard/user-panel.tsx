'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function UserPanel() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = format(currentTime, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
  const formattedTime = format(currentTime, 'HH:mm:ss');

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Información de Usuario</CardTitle>
        <CardDescription>Resumen de tu sesión actual.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src="https://picsum.photos/seed/user-avatar/100/100" alt="Avatar" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold">Juan David</h3>
            <p className="text-sm text-muted-foreground">juan.david@example.com</p>
            <Badge variant="secondary" className="mt-1">Trabajador Social</Badge>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="font-medium text-muted-foreground">Fecha de visita:</span>
            <span className="font-mono text-foreground capitalize">{formattedDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-muted-foreground">Hora exacta:</span>
            <span className="font-mono text-foreground">{formattedTime}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
