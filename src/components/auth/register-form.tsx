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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';

const formSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido.'),
  lastName: z.string().min(1, 'El apellido es requerido.'),
  documentType: z.string({ required_error: 'Selecciona un tipo de documento.' }),
  documentNumber: z.string().min(5, 'El número de documento es requerido.'),
  email: z.string().email('Por favor ingresa un correo válido.'),
  gender: z.string({ required_error: 'Selecciona un género.' }),
  role: z.string({ required_error: 'Selecciona un rol.' }),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
  socialSecurityCode: z.string().optional(),
});

export function RegisterForm() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      documentNumber: '',
      email: '',
      password: '',
      socialSecurityCode: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Servicios de Firebase no disponibles.',
      });
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      const { password, ...userData } = values;
      
      const userDocRef = doc(firestore, 'users', user.uid);
      
      await setDoc(userDocRef, { 
        ...userData, 
        id: user.uid,
      });

      toast({
        title: '¡Registro Exitoso!',
        description: 'Tu cuenta ha sido creada y ahora estás conectado.',
        duration: 5000,
      });

      router.push('/dashboard');

    } catch (error: any) {
      console.error('Error during registration:', error);
      toast({
        variant: 'destructive',
        title: 'Error en el registro',
        description: error.message || 'No se pudo crear la cuenta. Por favor, inténtalo de nuevo.',
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="firstName" render={({ field }) => (
              <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input placeholder="Diego Mauricio" {...field} /></FormControl><FormMessage /></FormItem>
            )}
          />
          <FormField control={form.control} name="lastName" render={({ field }) => (
              <FormItem><FormLabel>Apellido</FormLabel><FormControl><Input placeholder="Pastusano Guetio" {...field} /></FormControl><FormMessage /></FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="documentType" render={({ field }) => (
                <FormItem><FormLabel>Tipo de Documento</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="C.C" /></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="cc">C.C.</SelectItem>
                        <SelectItem value="ti">T.I.</SelectItem>
                        <SelectItem value="ce">C.E.</SelectItem>
                    </SelectContent>
                  </Select>
                <FormMessage /></FormItem>
              )}
            />
            <FormField control={form.control} name="documentNumber" render={({ field }) => (
                <FormItem><FormLabel>Número</FormLabel><FormControl><Input placeholder="1006017710" {...field} /></FormControl><FormMessage /></FormItem>
              )}
            />
        </div>
        <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem><FormLabel>Correo Electrónico</FormLabel><FormControl><Input type="email" placeholder="dianazasalar1@gmail.com" {...field} /></FormControl><FormMessage /></FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="gender" render={({ field }) => (
                <FormItem><FormLabel>Género</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="male">Masculino</SelectItem>
                        <SelectItem value="female">Femenino</SelectItem>
                        <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                <FormMessage /></FormItem>
              )}
            />
            <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem><FormLabel>Rol</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="case-worker">Trabajador Social</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                <FormMessage /></FormItem>
              )}
            />
        </div>
        <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
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
                    {showPassword ? <Eye className="h-4 w-4 text-muted-foreground" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField control={form.control} name="socialSecurityCode" render={({ field }) => (
            <FormItem><FormLabel>Código de Seguridad Social (Opcional)</FormLabel><FormControl><Input placeholder="Código opcional para pruebas" {...field} /></FormControl><FormMessage /></FormItem>
          )}
        />
        <Button type="submit" className="w-full text-lg h-12" style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
          Crear Cuenta
        </Button>
        <div className="text-center text-sm text-muted-foreground mt-4">
          ¿Ya tienes una cuenta?{' '}
          <Link href="/login" passHref>
            <Button variant="link" className="p-0 h-auto text-primary font-bold">Ingresa aquí</Button>
          </Link>
        </div>
      </form>
    </Form>
  );
}
