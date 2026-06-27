"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

export function FormSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  className,
  id,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  id?: string;
}) {
  const safeOptions = useMemo(() => (options || []).filter(o => o?.value && o?.label), [options]);
  const safeValue = value || "";

  return (
    <Select
      value={safeValue}
      onValueChange={(v) => onValueChange((v as string) ?? "")}
    >
      <SelectTrigger id={id} className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {safeOptions.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
