import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Logo } from '../icons/logo';

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
        <Logo className="h-20 w-20 md:h-24 md:w-24 mb-4" />
        <h1 className="text-4xl md:text-6xl font-bold font-headline tracking-tight">
          Bienvenidos a Renacer
        </h1>
        <p className="mt-4 max-w-2xl text-lg md:text-xl">
          Servir, Ayudar, Eso es vivir.
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
