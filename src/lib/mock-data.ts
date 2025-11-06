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

export type CaseStatus = "Pendiente de pago" | "Pendiente de cobro" | "Sin novedad";

export const cases = [
  {
    id: "CAS-001",
    internalId: "INT-732",
    name: "Ana Milena Pérez",
    document: "CC 1061789456",
    ethnicGroup: "Mestizo",
    maritalStatus: "Soltera",
    gender: "Femenino",
    dob: "1990-05-15",
    address: "Vereda El Descanso",
    department: "Cauca",
    municipality: "Morales",
    phone1: "3115678901",
    phone2: "",
    displacementType: "Individual",
    disability: "Ninguna",
    age: 34,
    isElderly: "No",
    householdMembers: 1,
    testimony: "Desplazamiento forzado por grupos armados en 2022. Pérdida de cultivos y vivienda.",
    status: "Sin novedad" as CaseStatus,
    location: "Norte Cauca"
  },
  {
    id: "CAS-002",
    internalId: "INT-733",
    name: "Carlos Arturo López",
    document: "CC 1061789457",
    ethnicGroup: "Afrocolombiano",
    maritalStatus: "Casado",
    gender: "Masculino",
    dob: "1985-11-20",
    address: "Corregimiento de Suárez",
    department: "Cauca",
    municipality: "Suárez",
    phone1: "3128901234",
    phone2: "3104567890",
    displacementType: "Familiar",
    disability: "Ninguna",
    age: 38,
    isElderly: "No",
    householdMembers: 4,
    testimony: "Amenazas directas a la familia. Tuvimos que salir con lo que llevábamos puesto.",
    status: "Pendiente de pago" as CaseStatus,
    location: "Norte Cauca"
  },
  {
    id: "CAS-003",
    internalId: "INT-734",
    name: "Rosa Elena Guetio",
    document: "TI 1002345678",
    ethnicGroup: "Indígena",
    maritalStatus: "Soltera",
    gender: "Femenino",
    dob: "2005-02-10",
    address: "Resguardo de Piendamó",
    department: "Cauca",
    municipality: "Piendamó",
    phone1: "3134567890",
    phone2: "",
    displacementType: "Individual",
    disability: "Ninguna",
    age: 19,
    isElderly: "No",
    householdMembers: 1,
    testimony: "Reclutamiento forzado en la zona.",
    status: "Pendiente de cobro" as CaseStatus,
    location: "Sur Cauca"
  },
    {
    id: "CAS-004",
    internalId: "INT-735",
    name: "Luis Alberto Perea",
    document: "CC 1061789458",
    ethnicGroup: "Mestizo",
    maritalStatus: "Viudo",
    gender: "Masculino",
    dob: "1958-07-30",
    address: "El Bordo",
    department: "Cauca",
    municipality: "Patía",
    phone1: "3145678901",
    phone2: "",
    displacementType: "Individual",
    disability: "Física",
    age: 66,
    isElderly: "Sí",
    householdMembers: 1,
    testimony: "Conflicto armado destruyó la vereda. Perdí a mi esposa en el proceso.",
    status: "Sin novedad" as CaseStatus,
    location: "Sur Cauca"
  }
];
