"use client";

import { useBatActive } from "@/components/shared/bat-decorations";
import { BatSymbol, GothamSkyline } from "@/components/shared/bat-sprites";

/**
 * Subtle full-screen Batcomputer backdrop: a faint tactical grid, a slow scan
 * line, a radar pulse, a Gotham skyline silhouette pinned to the bottom, and a
 * couple of slowly drifting bat glyphs. Fixed, non-interactive, aria-hidden,
 * and rendered only in Batman mode so it has zero cost in other themes. Motion
 * is paused under prefers-reduced-motion (see globals.css).
 */
export function BatBackground() {
  const active = useBatActive();
  if (!active) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* tactical grid */}
      <div
        className="bat-grid absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--primary) 1px, transparent 1px), linear-gradient(to bottom, var(--primary) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      {/* radial vignette to deepen the cave */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% -10%, transparent 40%, color-mix(in oklch, var(--background), black 35%) 100%)",
        }}
      />
      {/* slow horizontal scan line */}
      <div className="bat-scanline absolute inset-x-0 h-px bg-primary/30" />
      {/* radar pulse, top-right */}
      <div className="bat-radar-pulse absolute right-[8%] top-[16%] size-40 rounded-full border border-primary/20" />
      {/* Gotham skyline along the bottom */}
      <GothamSkyline className="absolute inset-x-0 bottom-0 h-20 w-full text-primary/[0.06]" />
      {/* drifting bat glyphs (sparse, very low opacity) */}
      <BatSymbol className="bat-float absolute left-[10%] top-[22%] size-10 text-primary/[0.07]" />
      <BatSymbol className="bat-float-slow absolute right-[14%] top-[40%] size-7 text-primary/[0.06]" />
      <BatSymbol className="bat-float absolute left-[44%] top-[12%] size-6 text-primary/[0.05]" />
    </div>
  );
}
