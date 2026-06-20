"use client";

import { useHKActive } from "@/components/shared/hk-decorations";
import { Bow, Heart, Star, Paw } from "@/components/shared/hk-sprites";

/**
 * Subtle full-screen Hello Kitty backdrop: a low-opacity tiled SVG pattern plus
 * a handful of slowly drifting sprites. Fixed, non-interactive, aria-hidden, and
 * rendered only in HK mode so it has zero cost in other themes. Motion is paused
 * under prefers-reduced-motion (see globals.css).
 */

// Tiled motif pattern as a single inline SVG data-URI (soft pink, very light).
const PATTERN = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'>
     <g fill='#ec4f9c' fill-opacity='0.5'>
       <path d='M30 26s-7-4-7-8a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4-7 8-7 8z'/>
       <path d='M104 12l1.7 4.4L110 18l-3.5 3.1 1 4.6-3.5-2.3-3.5 2.3 1-4.6L98 18l4.3-1.6z'/>
       <circle cx='118' cy='86' r='3'/>
       <circle cx='112' cy='80' r='2'/>
       <circle cx='124' cy='80' r='2'/>
       <circle cx='115' cy='92' r='2'/>
       <circle cx='121' cy='92' r='2'/>
       <ellipse cx='52' cy='104' rx='8' ry='6'/>
       <ellipse cx='66' cy='104' rx='8' ry='6'/>
       <circle cx='59' cy='104' r='3'/>
     </g>
   </svg>`,
);

export function HKBackground() {
  const active = useHKActive();
  if (!active) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* tiled motif layer */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: `url("data:image/svg+xml,${PATTERN}")`, backgroundSize: "200px 200px" }}
      />
      {/* a few drifting sprites (kept sparse + very low opacity) */}
      <Bow className="hk-float absolute left-[8%] top-[18%] size-8 text-primary/10" />
      <Heart className="hk-float-slow absolute right-[10%] top-[28%] size-6 text-primary/10" />
      <Star className="hk-float absolute left-[16%] bottom-[14%] size-5 text-primary/10" />
      <Paw className="hk-float-slow absolute right-[14%] bottom-[20%] size-7 text-primary/10" />
      <Heart className="hk-float absolute left-[46%] top-[10%] size-4 text-primary/10" />
    </div>
  );
}
