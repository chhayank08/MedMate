"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BatSymbol, Reticle } from "@/components/shared/bat-sprites";
import { playBatSound } from "@/components/shared/bat-sound";

/** Fire the Batcomputer boot moment (called when switching to the theme). */
export function celebrateBat() {
  window.dispatchEvent(new CustomEvent("bat:welcome"));
}

const GREETING = "Batcomputer Online";

/**
 * Global, one-shot boot overlay shown when the user switches to the Batman
 * theme. Listens for the `bat:welcome` event. Under prefers-reduced-motion it
 * shows a quiet toast instead of the animated sequence.
 */
export function BatGreeting() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onWelcome() {
      // Sound (if the user enabled it) plays regardless of motion preference.
      playBatSound("boot");
      const reduce =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        toast(`${GREETING} ▸ Welcome back`);
        return;
      }
      setVisible(true);
      window.setTimeout(() => setVisible(false), 2000);
    }
    window.addEventListener("bat:welcome", onWelcome);
    return () => window.removeEventListener("bat:welcome", onWelcome);
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center"
    >
      {/* dark wash */}
      <div className="bat-boot-fade absolute inset-0 bg-black/70 backdrop-blur-[2px]" />
      {/* scan sweep */}
      <div className="bat-boot-sweep absolute inset-x-0 h-[2px] bg-primary/70 shadow-[0_0_14px_2px] shadow-primary/50" />
      {/* center console */}
      <div className="bat-boot-pop relative flex flex-col items-center gap-3 rounded-md border border-primary/30 bg-card/95 px-12 py-9 text-center shadow-[0_0_40px_-8px] shadow-primary/40">
        <span className="relative flex items-center justify-center">
          <Reticle className="bat-spin-slow absolute size-20 text-primary/40" />
          <BatSymbol className="bat-flicker size-12 text-primary" />
        </span>
        <p className="bat-hud text-lg font-bold uppercase tracking-[0.3em] text-primary">{GREETING}</p>
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Welcome back · All systems nominal
        </p>
      </div>
    </div>
  );
}
