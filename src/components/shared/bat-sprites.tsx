/**
 * Original tactical SVG sprite library for the Batman / Batcomputer theme.
 *
 * These are ORIGINAL, abstract "intelligence-system" motifs (a stylized bat
 * emblem, a signal beam, targeting reticles, radar, a city skyline, data
 * streams) — deliberately NOT depictions of any trademarked DC artwork. They
 * are pure presentational SVGs (no hooks, no "use client") so they render in
 * either server or client components. Visibility is gated by callers (CSS
 * `.batman` scope or the `BatOnly` wrapper), never by these.
 */
import { cn } from "@/lib/utils";

type SpriteProps = { className?: string };

const base = "inline-block shrink-0";

/** Abstract bat emblem — the primary brand glyph for the theme. */
export function BatSymbol({ className }: SpriteProps) {
  return (
    <svg viewBox="0 0 48 24" fill="none" className={cn(base, "size-5 text-primary", className)} aria-hidden>
      <path
        d="M24 5c1.4-1.7 3-2.6 3.2-1 .2 1.6 1.3 2.2 2.6 1.6 2.6-1.2 5-.4 6 1.4.5-1.1 1.7-1.6 2.3-.6.5.8 1.6 1 2.6.4 1.7-1 4.6-.8 6.3 1.2-3 .3-4.7 2.2-5.6 4.7-1.2 3.2-4.6 5.3-8 4.3-2.4-.7-4.4-2.2-6-4.3-1.6 2.1-3.6 3.6-6 4.3-3.4 1-6.8-1.1-8-4.3-.9-2.5-2.6-4.4-5.6-4.7 1.7-2 4.6-2.2 6.3-1.2 1 .6 2.1.4 2.6-.4.6-1 1.8-.5 2.3.6 1-1.8 3.4-2.6 6-1.4 1.3.6 2.4 0 2.6-1.6.2-1.6 1.8-.7 3.2 1z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Bat-signal: a light beam crossed by the emblem. */
export function BatSignal({ className }: SpriteProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={cn(base, "size-6 text-primary", className)} aria-hidden>
      {/* beam */}
      <path d="M24 46 6 6h36z" fill="currentColor" opacity="0.12" />
      <path d="M24 46 12 10h24z" fill="currentColor" opacity="0.14" />
      {/* disc */}
      <circle cx="24" cy="14" r="9.5" fill="currentColor" opacity="0.9" />
      {/* emblem cut-out */}
      <path
        d="M24 11c.8-1 1.7-1.4 1.8-.5.1.9.8 1.2 1.5.9 1.4-.6 2.7-.2 3.2 1 .4-.7 1.3-.5 1.4.3-1.6.2-2.5 1.2-3 2.5-.6 1.6-2.4 2.6-4 1.9-.5-.2-1-.6-1.4-1-.4.4-.9.8-1.4 1-1.6.7-3.4-.3-4-1.9-.5-1.3-1.4-2.3-3-2.5.1-.8 1-1 1.4-.3.5-1.2 1.8-1.6 3.2-1 .7.3 1.4 0 1.5-.9.1-.9 1-.5 1.8.5z"
        fill="var(--background, #000)"
      />
    </svg>
  );
}

/** Targeting reticle / crosshair. */
export function Reticle({ className }: SpriteProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, "size-5 text-primary", className)} aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" opacity="0.85" />
      <circle cx="12" cy="12" r="2.2" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M12 1.5v4" />
        <path d="M12 18.5v4" />
        <path d="M1.5 12h4" />
        <path d="M18.5 12h4" />
      </g>
    </svg>
  );
}

/** Radar sweep — concentric arcs with a sweep line. */
export function Radar({ className }: SpriteProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, "size-5 text-primary", className)} aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.4" opacity="0.5" />
      <circle cx="12" cy="12" r="5.5" stroke="currentColor" strokeWidth="1.4" opacity="0.7" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <path d="M12 12 19 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 3a9 9 0 0 1 7 3.2L12 12z" fill="currentColor" opacity="0.18" />
    </svg>
  );
}

/** A grid / tactical map glyph. */
export function GridGlyph({ className }: SpriteProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, "size-5 text-primary", className)} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.5" opacity="0.85" />
      <g stroke="currentColor" strokeWidth="1.1" opacity="0.55">
        <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
      </g>
      <rect x="9" y="9" width="6" height="6" fill="currentColor" opacity="0.85" />
    </svg>
  );
}

/** Data-stream / signal bars. */
export function DataStream({ className }: SpriteProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, "size-5 text-primary", className)} aria-hidden>
      <g fill="currentColor">
        <rect x="3" y="13" width="2.6" height="8" rx="1" opacity="0.6" />
        <rect x="7.4" y="9" width="2.6" height="12" rx="1" opacity="0.8" />
        <rect x="11.8" y="4" width="2.6" height="17" rx="1" />
        <rect x="16.2" y="11" width="2.6" height="10" rx="1" opacity="0.7" />
      </g>
    </svg>
  );
}

/** A status indicator: a dot inside a ring. */
export function SystemDot({ className }: SpriteProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, "size-5 text-primary", className)} aria-hidden>
      <circle cx="12" cy="12" r="8.2" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <circle cx="12" cy="12" r="4.4" fill="currentColor" />
    </svg>
  );
}

/** A shield / crest motif (nods to Wayne Enterprises styling — original art). */
export function WayneCrest({ className }: SpriteProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, "size-5 text-primary", className)} aria-hidden>
      <path d="M12 2 4 5v6.5c0 5 3.4 8.6 8 10.5 4.6-1.9 8-5.5 8-10.5V5z" fill="currentColor" opacity="0.9" />
      <path
        d="M8.5 10.5h7l-3.5 5z"
        fill="var(--background, #000)"
        opacity="0.85"
      />
    </svg>
  );
}

/** Gotham skyline silhouette — used in the background atmosphere layer. */
export function GothamSkyline({ className }: SpriteProps) {
  return (
    <svg viewBox="0 0 240 60" preserveAspectRatio="none" fill="none" className={cn(base, "text-foreground", className)} aria-hidden>
      <path
        d="M0 60V40h8V28h6v12h7V22h9v18h6V32h10v-9l4-6 4 6v9h7V36h8V18h7v22h6V30h9v10h7V14h8v26h6V34h10v6h7V24h6v16h7V20h9v20h6V30h8v10h7V26h7v14h6V36h10v4h7V18h7v22h8V32h6v8h10V60z"
        fill="currentColor"
      />
    </svg>
  );
}
