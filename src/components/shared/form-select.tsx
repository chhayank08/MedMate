"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Thin wrapper over the (base-ui) shadcn Select that takes a simple options
 * array. `items` lets base-ui render the selected label in the trigger.
 */
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
  return (
    <Select
      value={value}
      onValueChange={(v) => onValueChange((v as string) ?? "")}
      items={options}
    >
      <SelectTrigger id={id} className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
