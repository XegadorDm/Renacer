'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email('Por favor ingresa un correo válido.'),
  password: z.string().min(1, 'La contraseña es requerida.'),
});

export function LoginForm() {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Servicio de autenticación no disponible.',
        });
        return;
    }
    try {
        await setPersistence(auth, browserLocalPersistence);
        await signInWithEmailAndPassword(auth, values.email, values.password);
        router.push('/dashboard');
    } catch (error: any) {
        console.error("Login failed:", error);
        toast({
            variant: 'destructive',
            title: 'Error al ingresar',
            description: 'Las credenciales son incorrectas. Por favor, verifica y vuelve a intentarlo.',
        });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo Electrónico</FormLabel>
              <FormControl>
                <Input type="email" placeholder="tu@correo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center">
                <FormLabel>Contraseña</FormLabel>
                <Link href="/forgot-password" passHref>
                  <Button variant="link" className="p-0 h-auto text-sm text-muted-foreground">¿Olvidaste tu contraseña?</Button>
                </Link>
              </div>
              <FormControl>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
          Ingresar
        </Button>
        <div className="text-center text-sm text-muted-foreground">
          ¿No tienes una cuenta?{' '}
          <Link href="/register" passHref>
            <Button variant="link" className="p-0 h-auto text-primary">Solicita tu registro</Button>
          </Link>
        </div>
      </form>
    </Form>
  );
}
