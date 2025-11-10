'use client';

import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function ColombiaMap() {
  const [hovered, setHovered] = useState<string | null>(null);

  const regions = [
    { id: 'suarez', name: 'Suárez', path: 'M180 120 L220 100 L250 130 L210 150 Z', textPos: { x: 190, y: 125 } },
    { id: 'piendamo', name: 'Piendamó', path: 'M180 160 L210 150 L220 170 L190 180 Z', textPos: { x: 183, y: 168 } },
    { id: 'morales', name: 'Morales', path: 'M220 170 L250 170 L230 200 L200 200 Z', textPos: { x: 215, y: 185 } },
  ];

  return (
    <div className="relative w-full aspect-square max-w-lg mx-auto">
      <svg viewBox="0 0 400 400" className="w-full h-full">
        {/* Main department shape */}
        <path
          d="M150 50 L280 40 L350 150 L300 280 L180 350 L80 250 L100 120 Z"
          className="fill-muted stroke-border"
        />
        <text x="100" y="80" className="text-sm fill-muted-foreground font-sans">CAUCA</text>
        
        {/* Interactive region paths */}
        {regions.map(region => (
          <Link href={`/dashboard/cases?location=${region.name}`} key={region.id}>
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
        
        {/* Region names */}
        <g className="fill-primary-foreground stroke-none pointer-events-none">
          {regions.map(region => (
             <text key={`text-${region.id}`} x={region.textPos.x} y={region.textPos.y} className="text-xs font-bold font-sans fill-primary">
                {region.name.toUpperCase()}
            </text>
          ))}
        </g>

        <text x="250" y="300" className="text-sm fill-muted-foreground font-sans">Valle del Cauca</text>
      </svg>
      <div className="absolute bottom-2 right-2 p-2 bg-background/70 rounded-md text-sm text-foreground">
        <p className="font-bold">Municipio Seleccionado:</p>
        <p>{hovered ? regions.find(r => r.id === hovered)?.name : 'Ninguno'}</p>
      </div>
    </div>
  );
}
