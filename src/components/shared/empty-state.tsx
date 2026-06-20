import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { HKOnly } from "@/components/shared/hk-decorations";
import { KittyFace, Notebook, Pencil, Heart } from "@/components/shared/hk-sprites";
import { BatOnly } from "@/components/shared/bat-decorations";
import { BatSymbol, Reticle } from "@/components/shared/bat-sprites";

const HK_ACCENT = {
  notebook: Notebook,
  pencil: Pencil,
  heart: Heart,
} as const;

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  hkVariant = "heart",
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  /** Kawaii accent shown beside the kitty in Hello Kitty mode. */
  hkVariant?: keyof typeof HK_ACCENT;
}) {
  const Accent = HK_ACCENT[hkVariant];
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed bg-card/50 px-6 py-12 text-center",
        className,
      )}
    >
      {/* Hello Kitty mode: friendly character illustration; otherwise the lucide icon. */}
      <HKOnly>
        <span className="relative flex size-16 items-center justify-center">
          <KittyFace className="size-16" />
          <Accent className="absolute -right-1 bottom-0 size-6" />
        </span>
      </HKOnly>
      {/* Batman mode: tactical emblem inside a targeting reticle. */}
      <BatOnly>
        <span className="relative flex size-16 items-center justify-center">
          <Reticle className="bat-spin-slow absolute size-16 text-primary/40" />
          <BatSymbol className="size-9 text-primary" />
        </span>
      </BatOnly>
      <span
        className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground"
        data-hk-hide
        data-bat-hide
      >
        <Icon className="size-6" />
      </span>
      <h3 className="mt-4 font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
