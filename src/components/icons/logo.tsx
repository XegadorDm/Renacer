import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Sun */}
      <circle cx="12" cy="8" r="3" fill="hsl(var(--accent))" stroke="none" />

      {/* Back Mountain */}
      <path d="M3 18 L8 10 L13 18 Z" fill="hsl(var(--primary))" opacity="0.7" stroke="none" />
      
      {/* Front Mountain */}
      <path d="M11 18 L16 12 L21 18 Z" fill="hsl(var(--primary))" stroke="none" />

      {/* Strokes for definition */}
      <path d="M3 18 L8 10 L13 18" stroke="hsl(var(--primary-foreground))" strokeWidth="0.5" />
      <path d="M11 18 L16 12 L21 18" stroke="hsl(var(--primary-foreground))" strokeWidth="0.5" />
    </svg>
  );
}
