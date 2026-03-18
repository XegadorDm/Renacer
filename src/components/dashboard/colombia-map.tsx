'use client';

import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function ColombiaMap({ userRole }: { userRole?: string }) {
  const [hovered, setHovered] = useState<string | null>(null);

  const regions = [
    { id: 'suarez', name: 'Suárez', path: 'M 140 408 L 160 402 L 164 418 L 144 424 Z' },
    { id: 'piendamo', name: 'Piendamó', path: 'M 163 405 L 183 399 L 186 415 L 166 421 Z' },
    { id: 'morales', name: 'Morales', path: 'M 151 418 L 171 412 L 174 428 L 154 434 Z' },
  ];

  const createHref = (regionName: string) => {
    let href = `/dashboard/cases?location=${regionName}`;
    if (userRole) {
      href += `&role=${userRole}`;
    }
    return href;
  }

  return (
    <div className="flex flex-col xl:flex-row items-center gap-6 lg:gap-10 w-full">
      <div className="relative w-full max-w-md xl:max-w-xl mx-auto flex justify-center items-center">
        <svg viewBox="80 0 340 550" className="w-full h-auto drop-shadow-lg">
          <g>
            {/* Colombia Outline */}
            <path
              d="M251 10C244 20 231 25 225 33C216 46 220 60 216 73C212 87 205 97 197 109C189 120 180 133 178 146C176 160 182 173 184 186C186 200 181 213 175 225C168 238 159 249 152 261C145 273 135 284 133 297C131 310 137 323 138 336C139 349 135 362 128 373C121 384 112 393 104 402C96 411 90 422 90 434C90 446 95 457 103 465C111 473 121 478 133 480C145 482 157 480 168 475C179 470 189 462 198 454C207 446 215 437 225 432C235 427 246 427 257 430C268 433 279 439 289 446C299 453 308 461 318 465C328 469 339 469 349 465C359 461 368 453 376 444C384 435 391 425 394 414C397 403 396 391 392 380C388 369 381 359 373 351C365 343 356 337 348 329C340 321 333 311 330 300C327 289 328 277 332 266C336 255 343 245 351 237C359 229 368 223 375 215C382 207 388 197 390 186C392 175 390 163 385 152C380 141 372 131 363 123C354 115 344 109 335 102C326 95 318 87 312 78C306 69 302 59 301 48C300 37 302 25 299 14C296 3 283 1 273 2C263 3 255 6 251 10Z"
              fill="hsl(var(--muted))"
              stroke="hsl(var(--border))"
              strokeWidth="1.5"
            />
            {/* Etiquetas de Departamentos */}
            <text x="210" y="210" fontSize="24" fill="hsl(var(--muted-foreground))" className="opacity-40">Antioquia</text>
            <text x="245" y="295" fontSize="24" fill="hsl(var(--muted-foreground))" className="opacity-40">Cundinamarca</text>
            <text x="145" y="360" fontSize="24" fill="hsl(var(--muted-foreground))" className="opacity-40">Valle</text>
            <text x="135" y="420" fontSize="24" fill="hsl(var(--muted-foreground))" className="font-bold">Cauca</text>
          </g>

          {/* Regiones Interactivas */}
          {regions.map(region => (
            <Link href={createHref(region.name)} key={region.id}>
              <path
                d={region.path}
                className={cn(
                  'fill-primary/30 stroke-primary stroke-2 transition-all duration-300 cursor-pointer opacity-70 hover:opacity-100 hover:scale-[1.02] transform-gpu',
                  {'fill-accent/60': hovered === region.id}
                )}
                onMouseEnter={() => setHovered(region.id)}
                onMouseLeave={() => setHovered(null)}
              />
            </Link>
          ))}
        </svg>
      </div>
      
      <div className="w-full xl:w-80 flex flex-col gap-3">
        <h3 className="text-lg font-bold text-center xl:text-left text-primary uppercase tracking-wider mb-2">Municipios Priorizados</h3>
        {regions.map(region => (
          <Link href={createHref(region.name)} key={`btn-${region.id}`} passHref className="w-full">
            <Button
              variant="secondary"
              size="lg"
              className={cn(
                  "w-full justify-center text-sm font-bold shadow-md transition-all active:scale-95",
                  {"bg-accent text-accent-foreground ring-2 ring-accent ring-offset-2": hovered === region.id }
              )}
              onMouseEnter={() => setHovered(region.id)}
              onMouseLeave={() => setHovered(null)}
            >
              {region.name.toUpperCase()}
            </Button>
          </Link>
        ))}
        <p className="text-xs text-muted-foreground text-center xl:text-left mt-2 italic">
          * Haz clic en un municipio para ver los casos registrados en esa zona.
        </p>
      </div>
    </div>
  );
}
