"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { BatSymbol, Reticle, SystemDot } from "@/components/shared/bat-sprites";

/** True only when the Batman theme is the effective theme (handles system). */
export function useBatActive() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, theme } = useTheme();
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return false;
  return (theme === "system" ? resolvedTheme : theme) === "batman";
}

/** Renders children only when the Batman theme is active. */
export function BatOnly({ children }: { children: ReactNode }) {
  const active = useBatActive();
  if (!active) return null;
  return <>{children}</>;
}

// Gated decoration wrappers (themed via text-primary).
export function BatGlyph({ className }: { className?: string }) {
  return (
    <BatOnly>
      <BatSymbol className={className} />
    </BatOnly>
  );
}

/**
 * Tactical banner shown at the top of Batman-mode pages. Decorative subtitle
 * only — no feature is renamed.
 */
export function BatBanner() {
  const active = useBatActive();
  if (!active) return null;

  return (
    <div className="flex items-center justify-center gap-2.5 border-b border-primary/15 bg-primary/[0.06] py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-primary/80">
      <SystemDot className="bat-pulse size-3" />
      <BatSymbol className="size-4 text-primary" />
      <span className="bat-hud">Batcomputer · Academic Intelligence System</span>
      <Reticle className="bat-spin-slow size-3" />
    </div>
  );
}
