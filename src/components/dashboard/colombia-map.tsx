'use client';

import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function ColombiaMap() {
  const [hovered, setHovered] = useState<string | null>(null);

  const regions = [
    { id: 'suarez', name: 'Suárez', path: 'M180 120 L220 100 L250 130 L210 150 Z' },
    { id: 'piendamo', name: 'Piendamó', path: 'M180 160 L210 150 L220 170 L190 180 Z' },
    { id: 'morales', name: 'Morales', path: 'M220 170 L250 170 L230 200 L200 200 Z' },
  ];

  return (
    <div className="flex flex-col md:flex-row items-center gap-8 w-full">
      <div className="relative w-full md:w-2/3 aspect-square max-w-lg mx-auto">
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
                  'fill-primary/20 stroke-primary transition-all duration-300 cursor-pointer',
                  {'fill-accent/60': hovered === region.id}
                )}
                onMouseEnter={() => setHovered(region.id)}
                onMouseLeave={() => setHovered(null)}
              />
            </Link>
          ))}
          
          <text x="250" y="300" className="text-sm fill-muted-foreground font-sans">Valle del Cauca</text>
        </svg>
      </div>
      
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-center md:text-left">Municipios</h3>
        {regions.map(region => (
          <Link href={`/dashboard/cases?location=${region.name}`} key={`btn-${region.id}`} passHref>
            <Button
              variant="secondary"
              size="lg"
              className={cn(
                  "w-full justify-center text-base font-bold shadow-md transition-all",
                  {"bg-accent text-accent-foreground": hovered === region.id }
              )}
              onMouseEnter={() => setHovered(region.id)}
              onMouseLeave={() => setHovered(null)}
            >
              {region.name.toUpperCase()}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}
