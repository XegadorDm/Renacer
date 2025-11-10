'use client';

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

const formSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido.'),
  lastName: z.string().min(1, 'El apellido es requerido.'),
  documentType: z.string({ required_error: 'Selecciona un tipo de documento.' }),
  documentNumber: z.string().min(5, 'El número de documento es requerido.'),
  email: z.string().email('Por favor ingresa un correo válido.'),
  gender: z.string({ required_error: 'Selecciona un género.' }),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
  socialSecurityCode: z.string().min(1, 'El código es requerido.'),
  role: z.string().default('case-worker'),
});

export function RegisterForm() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      documentType: '',
      documentNumber: '',
      email: '',
      gender: '',
      password: '',
      socialSecurityCode: '',
      role: 'case-worker',
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
      // Step 1: Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // Step 2: Now that the user is created and we have the UID, save user profile and grant role.
      const { password, ...userData } = values;
      
      const userDocRef = doc(firestore, 'users', user.uid);
      await setDoc(userDocRef, { ...userData, id: user.uid }, { merge: true });

      const adminRoleRef = doc(firestore, 'roles_admin', user.uid);
      await setDoc(adminRoleRef, { role: 'admin' }, { merge: true });

      // Sign the user out to force a clean login
      await auth.signOut();

      toast({
        title: '¡Registro Exitoso!',
        description: 'Tu cuenta ha sido creada. Ahora puedes iniciar sesión.',
        duration: 5000,
      });

      // Instead of redirecting, let the user click to go to login.
      // This gives auth state time to propagate properly on next login.
      router.push('/login');

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
              <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input placeholder="Tu nombre" {...field} /></FormControl><FormMessage /></FormItem>
            )}
          />
          <FormField control={form.control} name="lastName" render={({ field }) => (
              <FormItem><FormLabel>Apellido</FormLabel><FormControl><Input placeholder="Tu apellido" {...field} /></FormControl><FormMessage /></FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="documentType" render={({ field }) => (
                <FormItem><FormLabel>Tipo de Documento</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="cc">C.C.</SelectItem><SelectItem value="ti">T.I.</SelectItem><SelectItem value="ce">C.E.</SelectItem></SelectContent>
                  </Select>
                <FormMessage /></FormItem>
              )}
            />
            <FormField control={form.control} name="documentNumber" render={({ field }) => (
                <FormItem><FormLabel>Número</FormLabel><FormControl><Input placeholder="Tu número" {...field} /></FormControl><FormMessage /></FormItem>
              )}
            />
        </div>
        <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem><FormLabel>Correo Electrónico</FormLabel><FormControl><Input type="email" placeholder="tu@correo.com" {...field} /></FormControl><FormMessage /></FormItem>
          )}
        />
        <FormField control={form.control} name="gender" render={({ field }) => (
            <FormItem><FormLabel>Género</FormLabel>
               <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Selecciona tu género" /></SelectTrigger></FormControl>
                <SelectContent><SelectItem value="male">Masculino</SelectItem><SelectItem value="female">Femenino</SelectItem><SelectItem value="other">Otro</SelectItem></SelectContent>
              </Select>
            <FormMessage /></FormItem>
          )}
        />
        <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem><FormLabel>Contraseña</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
          )}
        />
        <FormField control={form.control} name="socialSecurityCode" render={({ field }) => (
            <FormItem><FormLabel>Código de Seguridad Social</FormLabel><FormControl><Input placeholder="Código proporcionado" {...field} /></FormControl><FormMessage /></FormItem>
          )}
        />
        <Button type="submit" className="w-full" style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
          Crear Cuenta
        </Button>
        <div className="text-center text-sm text-muted-foreground">
          ¿Ya tienes una cuenta?{' '}
          <Link href="/login" passHref>
            <Button variant="link" className="p-0 h-auto text-primary">Ingresa aquí</Button>
          </Link>
        </div>
      </form>
    </Form>
  );
}
