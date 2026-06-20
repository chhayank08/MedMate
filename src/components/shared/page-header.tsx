import { cn } from "@/lib/utils";
import { HKOnly } from "@/components/shared/hk-decorations";
import { Bow } from "@/components/shared/hk-sprites";
import { BatOnly } from "@/components/shared/bat-decorations";
import { BatSymbol } from "@/components/shared/bat-sprites";

export function PageHeader({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <HKOnly>
            <Bow className="hk-float size-6" />
          </HKOnly>
          <BatOnly>
            <BatSymbol className="bat-float size-6" />
          </BatOnly>
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
