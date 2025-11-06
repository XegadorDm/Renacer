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
      <defs>
        <linearGradient id="sunGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="1" />
          <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      
      {/* Sun */}
      <circle cx="12" cy="10" r="4" fill="url(#sunGradient)" stroke="none" />

      {/* Back Mountain Range */}
      <path
        d="M1 22 C 4 14, 6 14, 9 18 S 15 14, 18 18 L 23 22 L 1 22 Z"
        fill="hsl(var(--primary))"
        opacity="0.5"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="0.2"
      />
      
      {/* Mid Mountain Range */}
      <path
        d="M2 22 C 5 16, 7 16, 10 20 S 16 16, 19 20 L 23 22 L 2 22 Z"
        fill="hsl(var(--primary))"
        opacity="0.7"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="0.3"
      />
      
      {/* Front Mountain */}
      <path
        d="M3 22 C 6 18, 8 18, 12 21 S 17 18, 20 21 L 22 22 L 3 22 Z"
        fill="hsl(var(--primary))"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="0.4"
      />
    </svg>
  );
}
