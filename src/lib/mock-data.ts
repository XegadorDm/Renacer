import type { ImagePlaceholder } from './placeholder-images';
import { PlaceHolderImages } from './placeholder-images';

const imageMap = new Map<string, ImagePlaceholder>(PlaceHolderImages.map(img => [img.id, img]));

export const testimonials = [
  {
    id: 1,
    name: "DIEGO PASTUSANO",
    role: "Líder comunitario",
    avatar: imageMap.get('testimonial-avatar-1'),
    testimonial: "Renacer ha sido una herramienta fundamental para organizar y agilizar la ayuda a nuestra gente. Por fin sentimos que avanzamos."
  },
  {
    id: 2,
    name: "CAMILO GIRALDO",
    role: "Beneficiario",
    avatar: imageMap.get('testimonial-avatar-2'),
    testimonial: "Gracias a la plataforma, pude registrar mi caso sin tener que viajar por horas. Me dieron una respuesta rápida y clara sobre mi situación."
  },
  {
    id: 3,
    name: "ALEKS IMBACHI",
    role: "Trabajador Social",
    avatar: imageMap.get('testimonial-avatar-3'),
    testimonial: "El sistema de semáforos es increíblemente útil. De un vistazo, sé qué casos necesitan atención urgente. Ha cambiado mi forma de trabajar."
  }
];
