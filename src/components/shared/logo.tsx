import { cn } from "@/lib/utils";
import { Stethoscope } from "lucide-react";

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
          "flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm",
          className,
        )}
      >
        <Stethoscope className="size-5" />
      </span>
      {showText && (
        <span className={cn("text-lg font-semibold tracking-tight", textClassName)}>
          MedMate<span className="text-primary"> AI</span>
        </span>
      )}
    </span>
  );
}
