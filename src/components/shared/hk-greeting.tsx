"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { KittyFace, Bow, Heart, Star, Sparkle } from "@/components/shared/hk-sprites";

/** Fire the Hello Kitty welcome moment (called when switching to the theme). */
export function celebrateHK() {
  window.dispatchEvent(new CustomEvent("hk:welcome"));
}

const GREETING = "Welcome to Hello Kitty World!";

/**
 * Global, one-shot welcome overlay shown when the user switches to the Hello
 * Kitty theme. Listens for the `hk:welcome` event. Under prefers-reduced-motion
 * it shows a quiet toast instead of the animated overlay.
 */
export function HKGreeting() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onWelcome() {
      const reduce =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        toast(`${GREETING} 🎀`);
        return;
      }
      setVisible(true);
      window.setTimeout(() => setVisible(false), 1800);
    }
    window.addEventListener("hk:welcome", onWelcome);
    return () => window.removeEventListener("hk:welcome", onWelcome);
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center"
    >
      {/* soft wash */}
      <div className="hk-greeting-fade absolute inset-0 bg-primary/10 backdrop-blur-[2px]" />
      {/* burst of sparkles */}
      <Sparkle className="hk-sparkle absolute left-[30%] top-[34%] size-8 text-primary" />
      <Star className="hk-sparkle absolute right-[28%] top-[38%] size-6 text-primary" />
      <Heart className="hk-sparkle absolute left-[38%] bottom-[34%] size-5 text-primary" />
      <Bow className="hk-sparkle absolute right-[34%] bottom-[32%] size-9 text-primary" />
      {/* center card */}
      <div className="hk-greeting-pop relative flex flex-col items-center gap-2 rounded-3xl bg-card px-10 py-8 text-center shadow-xl ring-1 ring-primary/20">
        <KittyFace className="hk-bounce size-16" />
        <p className="hk-display text-xl font-bold text-primary">{GREETING}</p>
        <p className="text-xs text-muted-foreground">Your study space just got cuter ✨</p>
      </div>
    </div>
  );
}
