/**
 * Original kawaii SVG sprite library for the Hello Kitty theme.
 *
 * These are ORIGINAL, abstract cute motifs (bows, hearts, stars, paws, a generic
 * kitty face, twin-star clouds) — deliberately NOT depictions of any trademarked
 * Sanrio character. They are pure presentational SVGs (no hooks, no "use client")
 * so they render in either server or client components. Visibility is gated by
 * callers (CSS `.hello-kitty` scope or the `HKOnly` wrapper), never by these.
 */
import { cn } from "@/lib/utils";

type SpriteProps = { className?: string };

const base = "inline-block shrink-0";

export function Bow({ className }: SpriteProps) {
  return (
    <svg viewBox="0 0 32 18" fill="none" className={cn(base, "size-5 text-primary", className)} aria-hidden>
      <ellipse cx="9" cy="9" rx="8.5" ry="7" fill="currentColor" opacity="0.9" />
      <ellipse cx="23" cy="9" rx="8.5" ry="7" fill="currentColor" opacity="0.9" />
      <circle cx="16" cy="9" r="3.6" fill="currentColor" />
      <ellipse cx="7" cy="6.6" rx="3" ry="2" fill="white" opacity="0.3" />
      <ellipse cx="25" cy="6.6" rx="3" ry="2" fill="white" opacity="0.3" />
    </svg>
  );
}

export function Heart({ className }: SpriteProps) {
  return (
    <svg viewBox="0 0 20 18" fill="none" className={cn(base, "size-4 text-primary", className)} aria-hidden>
      <path
        d="M10 17S1 11 1 5.5A4.5 4.5 0 0 1 10 3.28 4.5 4.5 0 0 1 19 5.5C19 11 10 17 10 17z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Star({ className }: SpriteProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={cn(base, "size-3.5 text-primary", className)} aria-hidden>
      <path
        d="M10 1l2.39 6.26L18.09 8l-5 4.44 1.52 6.56L10 15.27l-4.61 3.73L6.91 12.44 2 8l5.7-.74L10 1z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Paw({ className }: SpriteProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, "size-5 text-primary", className)} aria-hidden>
      {/* main pad */}
      <ellipse cx="12" cy="16" rx="6" ry="5" fill="currentColor" />
      {/* toes */}
      <ellipse cx="5.5" cy="10" rx="2.4" ry="3" fill="currentColor" />
      <ellipse cx="10" cy="6.5" rx="2.4" ry="3" fill="currentColor" />
      <ellipse cx="14" cy="6.5" rx="2.4" ry="3" fill="currentColor" />
      <ellipse cx="18.5" cy="10" rx="2.4" ry="3" fill="currentColor" />
    </svg>
  );
}

export function Flower({ className }: SpriteProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, "size-5 text-primary", className)} aria-hidden>
      {[0, 72, 144, 216, 288].map((deg) => (
        <ellipse
          key={deg}
          cx="12"
          cy="6"
          rx="3"
          ry="4.5"
          fill="currentColor"
          opacity="0.9"
          transform={`rotate(${deg} 12 12)`}
        />
      ))}
      <circle cx="12" cy="12" r="3" fill="white" opacity="0.85" />
    </svg>
  );
}

export function Ribbon({ className }: SpriteProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, "size-5 text-primary", className)} aria-hidden>
      <circle cx="12" cy="7" r="4" fill="currentColor" />
      <circle cx="12" cy="7" r="1.6" fill="white" opacity="0.5" />
      <path d="M9 9l-3 12 6-4 6 4-3-12z" fill="currentColor" opacity="0.9" />
    </svg>
  );
}

export function Wand({ className }: SpriteProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, "size-5 text-primary", className)} aria-hidden>
      <rect x="11" y="9" width="2.2" height="13" rx="1.1" fill="currentColor" transform="rotate(20 12 15)" />
      <path
        d="M9 4l1.2 3.1L13.2 8l-2.9 1.3L9 12l-1.3-2.7L5 8l3-0.9z"
        fill="currentColor"
      />
      <circle cx="16.5" cy="6" r="1" fill="currentColor" opacity="0.7" />
      <circle cx="18" cy="10" r="0.8" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

export function Sparkle({ className }: SpriteProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, "size-4 text-primary", className)} aria-hidden>
      <path
        d="M12 2c.6 4.8 2.2 6.4 7 7-4.8.6-6.4 2.2-7 7-.6-4.8-2.2-6.4-7-7 4.8-.6 6.4-2.2 7-7z"
        fill="currentColor"
      />
    </svg>
  );
}

/** A friendly, generic cat face (original art — not a specific character). */
export function KittyFace({ className }: SpriteProps) {
  return (
    <svg viewBox="0 0 48 40" fill="none" className={cn(base, "size-10 text-primary", className)} aria-hidden>
      {/* ears */}
      <path d="M8 4l9 8-11 4z" fill="currentColor" />
      <path d="M40 4l-9 8 11 4z" fill="currentColor" />
      {/* head */}
      <ellipse cx="24" cy="22" rx="18" ry="15" fill="white" stroke="currentColor" strokeWidth="2.5" />
      {/* eyes */}
      <ellipse cx="17" cy="22" rx="1.8" ry="2.6" fill="currentColor" />
      <ellipse cx="31" cy="22" rx="1.8" ry="2.6" fill="currentColor" />
      {/* nose */}
      <ellipse cx="24" cy="25.5" rx="2.2" ry="1.6" fill="currentColor" />
      {/* whiskers */}
      <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.7">
        <path d="M6 21h7M5 25h8" />
        <path d="M42 21h-7M43 25h-8" />
      </g>
      {/* bow */}
      <g transform="translate(34 9)">
        <ellipse cx="-3" cy="2" rx="3.4" ry="2.8" fill="currentColor" />
        <ellipse cx="3" cy="2" rx="3.4" ry="2.8" fill="currentColor" />
        <circle cx="0" cy="2" r="1.5" fill="currentColor" />
      </g>
    </svg>
  );
}

/** Two little stars on a cloud — a nod to "twin stars" (original art). */
export function TwinStar({ className }: SpriteProps) {
  return (
    <svg viewBox="0 0 40 28" fill="none" className={cn(base, "size-8 text-primary", className)} aria-hidden>
      <path
        d="M10 22a6 6 0 0 1 0-12 8 8 0 0 1 15-2 6 6 0 0 1 3 14z"
        fill="currentColor"
        opacity="0.85"
      />
      <path d="M13 14l1 2.3 2.5.3-1.8 1.7.5 2.5L13 21.5 10.8 23l.5-2.5L9.5 18.8l2.5-.3z" fill="white" opacity="0.9" />
      <path d="M25 12l.9 1.9 2 .3-1.5 1.4.4 2L25 18.3 23.2 19.6l.4-2-1.5-1.4 2-.3z" fill="white" opacity="0.9" />
    </svg>
  );
}

/** A small notebook accent for empty states. */
export function Notebook({ className }: SpriteProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, "size-5 text-primary", className)} aria-hidden>
      <rect x="5" y="3" width="14" height="18" rx="2" fill="currentColor" opacity="0.9" />
      <rect x="5" y="3" width="3" height="18" rx="1.5" fill="currentColor" />
      <g stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.8">
        <path d="M11 8h5M11 11h5M11 14h4" />
      </g>
    </svg>
  );
}

/** A small pencil accent for empty states. */
export function Pencil({ className }: SpriteProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn(base, "size-5 text-primary", className)} aria-hidden>
      <path d="M15.5 4.5l4 4L9 19l-4.5 1 1-4.5z" fill="currentColor" opacity="0.9" />
      <path d="M14 6l4 4" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}
