"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { celebrateHK } from "@/components/shared/hk-greeting";
import { celebrateBat } from "@/components/shared/bat-greeting";

function HKIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={cn("size-5", className)} aria-hidden>
      {/* Cute bow / heart icon for Hello Kitty theme */}
      <path d="M10 14s-6-3.5-6-7.5A3.5 3.5 0 0 1 10 5a3.5 3.5 0 0 1 6 1.5C16 10.5 10 14 10 14z" fill="currentColor" opacity="0.9" />
      <circle cx="7" cy="4.5" r="1" fill="currentColor" opacity="0.5" />
      <circle cx="13" cy="4.5" r="1" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

function BatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 18" fill="none" className={cn("size-5", className)} aria-hidden>
      {/* Abstract bat emblem for the Batman theme */}
      <path
        d="M16 3c.8-1.2 1.6-1.6 1.8-.4.2 1 1 1.3 1.8.9 1.6-.8 3-.4 3.6 1 .3-.8 1.2-1 1.6-.2.7-1.2 1.9-.4 1.6 1-2 .2-3.2 1.5-3.8 3.2-.8 2-3 3.2-5 2.5C17 11.5 16.4 11 16 10.3c-.4.7-1 1.2-2.6 1.6-2 .7-4.2-.5-5-2.5C7.8 7.7 6.6 6.4 4.6 6.2 4.3 5.4 5.5 4.6 6.2 5.8c.4-.8 1.3-.6 1.6.2.6-1.4 2-1.8 3.6-1 .8.4 1.6.1 1.8-.9C13.4 1.4 15.2 1.8 16 3z"
        fill="currentColor"
      />
    </svg>
  );
}

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "hello-kitty", label: "Hello Kitty", icon: HKIcon },
  { value: "batman", label: "Batman", icon: BatIcon },
] as const;

type ThemeValue = (typeof THEMES)[number]["value"];

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Effective theme for icon display (resolvedTheme handles system)
  const effective = mounted
    ? ((theme === "system" ? resolvedTheme : theme) as ThemeValue | undefined)
    : undefined;
  const current = THEMES.find((t) => t.value === effective) ?? THEMES[0];
  const Icon = current.icon;

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="Change theme" disabled>
        <Sun className="size-5 opacity-0" />
      </Button>
    );
  }

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Change theme"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon className="size-5" />
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[9rem] rounded-xl border border-border bg-popover shadow-lg">
          <div className="p-1">
            {THEMES.map(({ value, label, icon: ItemIcon }) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setTheme(value);
                  setOpen(false);
                  // Magical welcome when entering the Hello Kitty world.
                  if (value === "hello-kitty" && effective !== "hello-kitty") celebrateHK();
                  // Cinematic boot sequence when entering the Batman theme.
                  if (value === "batman" && effective !== "batman") celebrateBat();
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent",
                  effective === value && "bg-accent font-semibold"
                )}
              >
                <ItemIcon className="size-4 shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
