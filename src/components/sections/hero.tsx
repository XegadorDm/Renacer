import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function Hero() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-image');

  return (
    <section className="relative w-full h-[60vh] md:h-[80vh]">
      {heroImage && (
        <Image
          src={heroImage.imageUrl}
          alt={heroImage.description}
          fill
          className="object-cover"
          priority
          data-ai-hint={heroImage.imageHint}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="relative h-full flex flex-col items-center justify-center text-center text-white p-4">
        <h1 className="text-4xl md:text-6xl font-bold font-headline tracking-tight">
          Un Nuevo Comienzo para el Cauca
        </h1>
        <p className="mt-4 max-w-2xl text-lg md:text-xl">
          Facilitamos el acceso a trámites y apoyo para personas desplazadas y comunidades vulnerables.
        </p>
        <div className="mt-8 flex gap-4">
          <Button size="lg" asChild style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
            <Link href="/register">Registra un Caso</Link>
          </Button>
          <Button size="lg" variant="secondary" asChild>
            <Link href="#about">Conoce Más</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
