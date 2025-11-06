import { Users, Target, Handshake } from 'lucide-react';

export function About() {
  const features = [
    {
      icon: <Target className="h-10 w-10 text-primary" />,
      title: 'Nuestra Misión',
      description: 'Ofrecer una plataforma digital accesible y eficiente que centralice la gestión de casos sociales y trámites gubernamentales para las poblaciones vulnerables del Cauca.',
    },
    {
      icon: <Users className="h-10 w-10 text-primary" />,
      title: 'A Quién Servimos',
      description: 'Nos enfocamos en personas desplazadas, familias en situación de vulnerabilidad y líderes comunitarios que buscan apoyo y una gestión transparente de sus casos.',
    },
    {
      icon: <Handshake className="h-10 w-10 text-primary" />,
      title: 'Nuestro Compromiso',
      description: 'Estamos comprometidos con la dignidad, la resiliencia y el renacimiento de cada individuo y comunidad, utilizando la tecnología como puente hacia nuevas oportunidades.',
    },
  ];

  return (
    <section id="about" className="py-16 md:py-24 bg-card">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold font-headline">Acerca de Renacer Digital</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Somos un puente de esperanza y organización, conectando necesidades con soluciones a través de la tecnología.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-center text-center p-6 rounded-lg shadow-md bg-background">
              {feature.icon}
              <h3 className="mt-4 text-xl font-bold font-headline">{feature.title}</h3>
              <p className="mt-2 text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
