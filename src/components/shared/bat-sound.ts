"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Optional Batcomputer sound effects, synthesized in-browser via the Web Audio
 * API — no audio files are shipped or downloaded. Every effect is a short
 * oscillator envelope. Sound is OFF by default and gated behind a user toggle
 * persisted in localStorage; `playBatSound` is a no-op unless enabled.
 */

const STORAGE_KEY = "medmate:bat-sound";

export type BatSoundName = "boot" | "scan" | "complete";

/** Read the persisted preference (default: disabled). SSR-safe. */
export function isBatSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

// A single shared AudioContext, created lazily on first use (must follow a
// user gesture per browser autoplay policies).
let ctx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Play a short note with a quick attack/decay envelope. */
function note(
  context: AudioContext,
  freq: number,
  start: number,
  duration: number,
  type: OscillatorType,
  gain: number,
) {
  const osc = context.createOscillator();
  const env = context.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, context.currentTime + start);
  env.gain.setValueAtTime(0.0001, context.currentTime + start);
  env.gain.exponentialRampToValueAtTime(gain, context.currentTime + start + 0.02);
  env.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + start + duration);
  osc.connect(env);
  env.connect(context.destination);
  osc.start(context.currentTime + start);
  osc.stop(context.currentTime + start + duration + 0.02);
}

/**
 * Play a Batcomputer sound effect. No-op when sound is disabled or the Web
 * Audio API is unavailable. Volume is kept deliberately low.
 */
export function playBatSound(name: BatSoundName) {
  if (!isBatSoundEnabled()) return;
  const context = getCtx();
  if (!context) return;

  switch (name) {
    case "boot":
      // rising power-up chord
      note(context, 180, 0, 0.5, "sawtooth", 0.05);
      note(context, 360, 0.08, 0.5, "triangle", 0.045);
      note(context, 540, 0.18, 0.55, "sine", 0.04);
      break;
    case "scan":
      // quick high blip
      note(context, 880, 0, 0.09, "square", 0.035);
      note(context, 1320, 0.05, 0.08, "sine", 0.03);
      break;
    case "complete":
      // two-tone confirm
      note(context, 660, 0, 0.12, "triangle", 0.045);
      note(context, 990, 0.12, 0.18, "sine", 0.045);
      break;
  }
}

/** Subscribe to preference changes (same tab via custom event, other tabs via storage). */
function subscribe(onChange: () => void) {
  window.addEventListener("bat:sound-change", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener("bat:sound-change", onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * React hook for the sound preference. Reads from the localStorage-backed
 * external store via useSyncExternalStore (SSR-safe: defaults to disabled) and
 * returns a setter that persists and notifies other hook instances.
 */
export function useBatSound() {
  const enabled = useSyncExternalStore(subscribe, isBatSoundEnabled, () => false);

  const setSound = useCallback((value: boolean) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
    } catch {
      /* ignore persistence errors (e.g. private mode) */
    }
    window.dispatchEvent(new CustomEvent("bat:sound-change"));
    // Confirm the toggle audibly when turning it on (also primes the AudioContext).
    if (value) playBatSound("scan");
  }, []);

  return { enabled, setSound } as const;
}
