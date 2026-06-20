/**
 * Batman nav-icon mapping: each dashboard route → a tactical sprite used in
 * place of the lucide icon when the Batman theme is active (see sidebar).
 * Pure SVG components, so this carries no client cost. Titles and links are
 * unchanged — only the icon visual is swapped.
 */
import type { FC } from "react";
import {
  BatSymbol,
  SystemDot,
  Reticle,
  DataStream,
  GridGlyph,
  Radar,
  WayneCrest,
} from "@/components/shared/bat-sprites";

type IconProps = { className?: string };

export const BAT_NAV_ICONS: Record<string, FC<IconProps>> = {
  "/dashboard": BatSymbol,
  "/tasks": SystemDot,
  "/quizzes": Reticle,
  "/summaries": DataStream,
  "/planner": GridGlyph,
  "/analytics": Radar,
  "/settings": WayneCrest,
};
