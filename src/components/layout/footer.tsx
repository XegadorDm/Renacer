import Link from 'next/link';
import { Logo } from '@/components/icons/logo';

export function Footer() {
  return (
    <footer className="bg-muted py-8">
      <div className="container mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="flex flex-col items-start gap-4">
          <Link href="/" className="flex items-center gap-2" prefetch={false}>
            <Logo className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold font-headline text-foreground">
              Renacer Digital
            </span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Apoyando a las comunidades vulnerables del Cauca.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-bold mb-2">Navegación</h4>
            <ul>
              <li><Link href="#about" className="text-muted-foreground hover:text-foreground">Acerca de</Link></li>
              <li><Link href="#testimonials" className="text-muted-foreground hover:text-foreground">Testimonios</Link></li>
              <li><Link href="#contact" className="text-muted-foreground hover:text-foreground">Contacto</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-2">Legal</h4>
            <ul>
              <li><Link href="#" className="text-muted-foreground hover:text-foreground">Términos de Servicio</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-foreground">Política de Privacidad</Link></li>
            </ul>
          </div>
        </div>
        <div className="flex items-center justify-center md:justify-end text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Renacer Digital. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
