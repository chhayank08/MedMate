"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { Bow, Heart, Star, Sparkle } from "@/components/shared/hk-sprites";

/** True only when the Hello Kitty theme is the effective theme (handles system). */
export function useHKActive() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, theme } = useTheme();
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return false;
  return (theme === "system" ? resolvedTheme : theme) === "hello-kitty";
}

/** Renders children only when the Hello Kitty theme is active. */
export function HKOnly({ children }: { children: ReactNode }) {
  const active = useHKActive();
  if (!active) return null;
  return <>{children}</>;
}

// Backwards-compatible decoration wrappers (gated; themed via text-primary).
export function HKBow({ className }: { className?: string }) {
  return (
    <HKOnly>
      <Bow className={className} />
    </HKOnly>
  );
}

export function HKHeart({ className }: { className?: string }) {
  return (
    <HKOnly>
      <Heart className={className} />
    </HKOnly>
  );
}

export function HKStar({ className }: { className?: string }) {
  return (
    <HKOnly>
      <Star className={className} />
    </HKOnly>
  );
}

/** Decorative banner shown at the top of HK-mode pages. */
export function HKBanner() {
  const active = useHKActive();
  if (!active) return null;

  return (
    <div className="flex items-center justify-center gap-2.5 bg-primary/10 py-1.5 text-xs font-semibold text-primary">
      <Heart className="hk-float size-3.5" />
      <span className="hk-display tracking-wide">Hello Kitty World</span>
      <Bow className="size-4" />
      <Star className="hk-float size-3" />
      <Sparkle className="size-3.5" />
    </div>
  );
}
