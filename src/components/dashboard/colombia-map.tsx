
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function ColombiaMap({ userRole }: { userRole?: string }) {
  const [hovered, setHovered] = useState<string | null>(null);

  const regions = [
    { id: 'suarez', name: 'Suárez', path: 'M165 245 l20 -10 l15 15 l-20 10z' },
    { id: 'piendamo', name: 'Piendamó', path: 'M190 250 l20 -5 l10 15 l-20 5z' },
    { id: 'morales', name: 'Morales', path: 'M185 270 l25 -5 l10 15 l-25 5z' },
  ];

  const createHref = (regionName: string) => {
    let href = `/dashboard/cases?location=${regionName}`;
    if (userRole) {
      href += `&role=${userRole}`;
    }
    return href;
  }

  // Vertices for a 12-sided polygon (dodecagon)
  const dodecagonPath = "M260 50 L310 100 L320 175 L295 245 L235 300 L165 310 L100 285 L60 225 L50 150 L75 80 L130 45 L200 40 Z";

  return (
    <div className="flex flex-col md:flex-row items-center gap-8 w-full">
      <div className="relative w-full md:w-2/3 aspect-square max-w-lg mx-auto">
        <svg viewBox="0 0 380 380" className="w-full h-full">
          <g>
            <path
              d={dodecagonPath}
              fill="hsl(var(--muted))"
              stroke="hsl(var(--border))"
              strokeWidth="1.5"
            />
          </g>
          {/* Labels */}
          <text x="270" y="60" fontFamily="sans-serif" fontSize="12" fill="hsl(var(--muted-foreground))" textAnchor="middle">Valle del Cauca</text>
          <text x="110" y="320" fontFamily="sans-serif" fontSize="12" fill="hsl(var(--muted-foreground))" textAnchor="middle">Cauca</text>

          {/* Interactive region paths */}
          {regions.map(region => (
            <Link href={createHref(region.name)} key={region.id}>
              <path
                d={region.path}
                className={cn(
                  'fill-primary/20 stroke-primary transition-all duration-300 cursor-pointer opacity-70 hover:opacity-100',
                  {'fill-accent/60': hovered === region.id}
                )}
                onMouseEnter={() => setHovered(region.id)}
                onMouseLeave={() => setHovered(null)}
              />
            </Link>
          ))}
        </svg>
      </div>
      
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-center md:text-left">Municipios del Cauca</h3>
        {regions.map(region => (
          <Link href={createHref(region.name)} key={`btn-${region.id}`} passHref>
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
