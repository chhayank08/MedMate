import { cn } from "@/lib/utils";
import { GraduationCap, Sparkles } from "lucide-react";

export function Logo({
  className,
  showText = true,
  textClassName,
}: {
  className?: string;
  showText?: boolean;
  textClassName?: string;
}) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-chart-2 text-primary-foreground shadow-sm",
          className,
        )}
      >
        <GraduationCap className="size-5" />
      </span>
      {showText && (
        <span className={cn("text-lg font-semibold tracking-tight", textClassName)}>
          Prep<span className="text-primary">Bud</span>
        </span>
      )}
    </span>
  );
}
