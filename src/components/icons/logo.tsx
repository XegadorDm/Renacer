import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 18c2-2.5 4-3 7-3s5 0.5 7 3" fill="#a3b18a" stroke="none" />
      <path d="M5 16c1.5-2 3-2.5 6-2.5s4.5 0.5 6 2.5" fill="#588157" stroke="none" />
      <path d="M12 13.5c-1.5 0-3-0.5-4-1.5" stroke="#dda15e" strokeWidth="1" />
      <path d="M11 11c1-1 2.5-1 4-0.5" stroke="#dda15e" strokeWidth="1" />
      <path d="M15 10.5c1.5-0.5 3-0.5 4 0.5" stroke="#dda15e" strokeWidth="1" />
      <path d="M4 18c2-2.5 4-3 7-3s5 0.5 7 3" stroke="#3a5a40" />
      <path d="M5 16c1.5-2 3-2.5 6-2.5s4.5 0.5 6 2.5" stroke="#3a5a40" />
      <path d="M19 8l-1 2-2-1.5-1 2" fill="hsl(var(--primary))" stroke="none" />
      <path d="M18.5 7l-1.5-2.5L16 6.5l1.5-2.5" fill="hsl(var(--primary))" stroke="none" />
    </svg>
  );
}
