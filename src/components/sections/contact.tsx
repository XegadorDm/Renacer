
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Instagram, Facebook, Twitter, Loader2, CheckCircle } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

function TikTokIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
    )
}

export function Contact() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore) return;

    const formData = new FormData(e.currentTarget);
    const nombre = formData.get('nombre') as string;
    const email = formData.get('email') as string;
    const cedula = formData.get('cedula') as string;
    const asunto = (formData.get('asunto') as string) || "Sin asunto";
    const mensaje = formData.get('mensaje') as string;

    if (!nombre || !email || !cedula || !mensaje) {
      toast({
        variant: "destructive",
        title: "Campos incompletos",
        description: "Por favor, completa todos los campos requeridos.",
      });
      return;
    }

    setIsSubmitting(true);

    const mensajesRef = collection(firestore, 'mensajes');
    const data = {
      nombre,
      email,
      cedula,
      asunto,
      mensaje,
      read: false, // Inicialmente no leído
      createdAt: new Date().toISOString()
    };

    addDoc(mensajesRef, data)
      .then(() => {
        setIsSuccess(true);
        toast({
          title: "Mensaje Enviado",
          description: "Hemos recibido tu mensaje correctamente.",
        });
        setIsSubmitting(false);
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: mensajesRef.path,
          operation: 'create',
          requestResourceData: data,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        setIsSubmitting(false);
      });
  };

  if (isSuccess) {
    return (
      <section id="contact" className="py-16 md:py-24 bg-card">
        <div className="container mx-auto px-4 md:px-6">
          <Card className="max-w-2xl mx-auto text-center p-12">
            <CheckCircle className="h-16 w-16 text-primary mx-auto mb-6" />
            <CardTitle className="text-3xl font-bold mb-4">¡Gracias por escribirnos!</CardTitle>
            <CardDescription className="text-lg">
              Tu mensaje ha sido recibido. Nuestro equipo se pondrá en contacto contigo lo antes posible.
            </CardDescription>
            <Button className="mt-8" onClick={() => setIsSuccess(false)}>Enviar otro mensaje</Button>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="py-16 md:py-24 bg-card">
      <div className="container mx-auto px-4 md:px-6">
        <Card className="max-w-2xl mx-auto shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl md:text-4xl font-bold font-headline">Ponte en Contacto</CardTitle>
            <CardDescription>
              ¿Tienes preguntas o necesitas seguimiento a tu caso? Escríbenos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input name="nombre" placeholder="Tu Nombre Completo" required disabled={isSubmitting} />
                <Input name="email" type="email" placeholder="Tu Correo Electrónico" required disabled={isSubmitting} />
              </div>
              <Input name="cedula" placeholder="Número de Cédula" required disabled={isSubmitting} />
              <Input name="asunto" placeholder="Asunto (Opcional)" disabled={isSubmitting} />
              <Textarea name="mensaje" placeholder="Tu Mensaje..." rows={5} required disabled={isSubmitting} />
              <Button 
                type="submit" 
                className="w-full text-lg h-12" 
                disabled={isSubmitting}
                style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}
              >
                {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> ENVIANDO...</> : "ENVIAR MENSAJE"}
              </Button>
            </form>
            <div className="flex justify-center gap-6 mt-8">
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <TikTokIcon className="h-6 w-6" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <Instagram className="h-6 w-6" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <Facebook className="h-6 w-6" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <Twitter className="h-6 w-6" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
