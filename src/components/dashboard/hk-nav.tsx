/**
 * Hello Kitty nav-icon mapping: each dashboard route → a kawaii sprite used in
 * place of the lucide icon when the Hello Kitty theme is active (see sidebar).
 * Pure SVG components, so this carries no client cost.
 */
import type { FC } from "react";
import { Bow, Paw, Heart, Flower, Ribbon, Star, Wand } from "@/components/shared/hk-sprites";

type IconProps = { className?: string };

export const HK_NAV_ICONS: Record<string, FC<IconProps>> = {
  "/dashboard": Bow,
  "/tasks": Ribbon,
  "/quizzes": Paw,
  "/summaries": Heart,
  "/planner": Flower,
  "/analytics": Star,
  "/settings": Wand,
};
