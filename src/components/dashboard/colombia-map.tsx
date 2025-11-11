'use client';

import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function ColombiaMap() {
  const [hovered, setHovered] = useState<string | null>(null);

  const regions = [
    { id: 'suarez', name: 'Suárez', path: 'M180 120 L220 100 L250 130 L210 150 Z', position: { top: '28%', left: '46%' } },
    { id: 'piendamo', name: 'Piendamó', path: 'M180 160 L210 150 L220 170 L190 180 Z', position: { top: '40%', left: '45%' } },
    { id: 'morales', name: 'Morales', path: 'M220 170 L250 170 L230 200 L200 200 Z', position: { top: '44%', left: '54%' } },
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
                {'fill-accent/60': hovered === region.id}
              )}
              onMouseEnter={() => setHovered(region.id)}
              onMouseLeave={() => setHovered(null)}
            />
          </Link>
        ))}
        
        <text x="250" y="300" className="text-sm fill-muted-foreground font-sans">Valle del Cauca</text>
      </svg>
      
      {/* Region Labels as HTML buttons */}
      {regions.map(region => (
        <Link href={`/dashboard/cases?location=${region.name}`} key={`btn-${region.id}`} legacyBehavior>
          <a 
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ top: region.position.top, left: region.position.left }}
            onMouseEnter={() => setHovered(region.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <Button
              variant="secondary"
              size="sm"
              className={cn(
                  "pointer-events-none whitespace-nowrap h-auto py-1 px-3 text-xs font-bold shadow-md transition-all",
                  {"bg-accent text-accent-foreground": hovered === region.id }
              )}
            >
              {region.name.toUpperCase()}
            </Button>
          </a>
        </Link>
      ))}

      <div className="absolute bottom-2 right-2 p-2 bg-background/70 rounded-md text-sm text-foreground">
        <p className="font-bold">Municipio Seleccionado:</p>
        <p>{hovered ? regions.find(r => r.id === hovered)?.name : 'Ninguno'}</p>
      </div>
    </div>
  );
}
