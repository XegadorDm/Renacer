
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function ColombiaMap({ userRole }: { userRole?: string }) {
  const [hovered, setHovered] = useState<string | null>(null);

  // Approximate coordinates for municipalities within the Cauca department on the new map
  const regions = [
    { id: 'suarez', name: 'Suárez', path: 'M 130 405 L 140 401 L 143 411 L 133 415 Z' },
    { id: 'piendamo', name: 'Piendamó', path: 'M 145 410 L 155 406 L 158 416 L 148 420 Z' },
    { id: 'morales', name: 'Morales', path: 'M 138 420 L 148 416 L 151 426 L 141 430 Z' },
  ];

  const createHref = (regionName: string) => {
    let href = `/dashboard/cases?location=${regionName}`;
    if (userRole) {
      href += `&role=${userRole}`;
    }
    return href;
  }

  return (
    <div className="flex flex-col md:flex-row items-center gap-8 w-full">
      <div className="relative w-full md:w-2/3 aspect-square max-w-lg mx-auto">
        <svg viewBox="80 0 340 550" className="w-full h-full">
          <g>
            {/* Colombia Outline */}
            <path
              d="M251 10C244 20 231 25 225 33C216 46 220 60 216 73C212 87 205 97 197 109C189 120 180 133 178 146C176 160 182 173 184 186C186 200 181 213 175 225C168 238 159 249 152 261C145 273 135 284 133 297C131 310 137 323 138 336C139 349 135 362 128 373C121 384 112 393 104 402C96 411 90 422 90 434C90 446 95 457 103 465C111 473 121 478 133 480C145 482 157 480 168 475C179 470 189 462 198 454C207 446 215 437 225 432C235 427 246 427 257 430C268 433 279 439 289 446C299 453 308 461 318 465C328 469 339 469 349 465C359 461 368 453 376 444C384 435 391 425 394 414C397 403 396 391 392 380C388 369 381 359 373 351C365 343 356 337 348 329C340 321 333 311 330 300C327 289 328 277 332 266C336 255 343 245 351 237C359 229 368 223 375 215C382 207 388 197 390 186C392 175 390 163 385 152C380 141 372 131 363 123C354 115 344 109 335 102C326 95 318 87 312 78C306 69 302 59 301 48C300 37 302 25 299 14C296 3 283 1 273 2C263 3 255 6 251 10Z"
              fill="hsl(var(--muted))"
              stroke="hsl(var(--border))"
              strokeWidth="1.5"
            />
            
            {/* Department boundaries */}
            <path d="M184,186 L250,180 L260,240 L175,225Z" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" />
            <text x="210" y="210" fontSize="24" fill="hsl(var(--muted-foreground))">Antioquia</text>

            <path d="M225,270 L280,260 L290,320 L230,330Z" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" />
            <text x="245" y="295" fontSize="24" fill="hsl(var(--muted-foreground))">Cundinamarca</text>

            <path d="M138,336 L190,320 L200,380 L140,390Z" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" />
            <text x="150" y="360" fontSize="24" fill="hsl(var(--muted-foreground))">Valle del Cauca</text>

            <path d="M104,402 L170,380 L175,440 L110,450Z" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" />
            <text x="135" y="420" fontSize="24" fill="hsl(var(--muted-foreground))">Cauca</text>
          </g>

          {/* Interactive region paths for Cauca municipalities */}
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
