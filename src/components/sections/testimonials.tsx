import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { testimonials } from '@/lib/mock-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function Testimonials() {
  return (
    <section id="testimonials" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold font-headline">Voces de Nuestra Comunidad</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Historias reales de personas que han encontrado apoyo a través de Renacer Digital.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="flex flex-col">
              <CardContent className="pt-6 flex-grow">
                <p className="text-muted-foreground italic">&quot;{testimonial.testimonial}&quot;</p>
              </CardContent>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar>
                    {testimonial.avatar && (
                      <AvatarImage 
                        src={testimonial.avatar.imageUrl} 
                        alt={testimonial.name}
                        data-ai-hint={testimonial.avatar.imageHint}
                      />
                    )}
                    <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
