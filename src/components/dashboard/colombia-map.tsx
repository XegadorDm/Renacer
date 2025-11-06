'use client';

import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function ColombiaMap() {
  const [hovered, setHovered] = useState<string | null>(null);

  const regions = [
    { id: 'norte', name: 'Norte Cauca', path: 'M180 120 L220 100 L250 130 L210 150 Z', link: '/dashboard/cases?location=Norte%20Cauca' },
    { id: 'sur', name: 'Sur Cauca', path: 'M180 160 L210 150 L250 170 L200 200 Z', link: '/dashboard/cases?location=Sur%20Cauca' },
  ];

  return (
    <div className="relative w-full aspect-square max-w-lg mx-auto">
      <svg viewBox="0 0 400 400" className="w-full h-full">
        <path
          d="M150 50 L280 40 L350 150 L300 280 L180 350 L80 250 L100 120 Z"
          className="fill-muted stroke-border"
        />
        <text x="250" y="300" className="text-sm fill-muted-foreground font-sans">Valle del Cauca</text>
        <text x="100" y="80" className="text-sm fill-muted-foreground font-sans">Océano Pacífico</text>
        
        {regions.map(region => (
          <Link href={region.link} key={region.id}>
            <path
              d={region.path}
              className={cn(
                'fill-primary/20 stroke-primary transition-all duration-300 cursor-pointer hover:fill-accent/80',
                {'fill-accent': hovered === region.id}
              )}
              onMouseEnter={() => setHovered(region.id)}
              onMouseLeave={() => setHovered(null)}
            />
          </Link>
        ))}
        
        <g className="fill-primary-foreground stroke-none pointer-events-none">
          <text x="195" y="130" className="text-xs font-bold font-sans">Norte</text>
          <text x="200" y="175" className="text-xs font-bold font-sans">Sur</text>
        </g>
      </svg>
      <div className="absolute bottom-2 right-2 p-2 bg-background/70 rounded-md text-sm text-foreground">
        <p className="font-bold">Región Seleccionada:</p>
        <p>{hovered ? regions.find(r => r.id === hovered)?.name : 'Ninguna'}</p>
      </div>
    </div>
  );
}
