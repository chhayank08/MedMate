"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DOMAIN_SUBJECTS } from "@/lib/constants";
import { useActiveDomain } from "@/lib/stores/global-settings-store";

const STORAGE_KEY = "prepbud:custom-subjects";

function getActiveSubjects(domainName?: string): readonly string[] {
  if (!domainName) return DOMAIN_SUBJECTS.medical;
  
  // Convert domain name to key format (e.g., "Computer Science" -> "computer_science")
  const domainKey = domainName.toLowerCase().replace(/\s+/g, '_');
  return DOMAIN_SUBJECTS[domainKey as keyof typeof DOMAIN_SUBJECTS] || DOMAIN_SUBJECTS.medical;
}

function loadCustomSubjects(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveCustomSubject(subject: string) {
  const existing = loadCustomSubjects();
  if (!existing.includes(subject)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, subject]));
  }
}

interface SubjectComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /**
   * When true, the input clears itself immediately after a subject is selected.
   * Use this for multi-select scenarios where repeated selection is expected.
   */
  clearAfterSelect?: boolean;
}

export function SubjectCombobox({
  value,
  onChange,
  placeholder = "e.g. Physics, Cardiology, Marketing",
  className,
  disabled,
  clearAfterSelect = false,
}: SubjectComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(clearAfterSelect ? "" : value);
  const [customSubjects, setCustomSubjects] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Subscribe to active domain from global store (reactive)
  const activeDomain = useActiveDomain();
  const activeSubjects = getActiveSubjects(activeDomain?.name);

  useEffect(() => {
    setCustomSubjects(loadCustomSubjects());
  }, []);
  
  // Listen for domain changes and reset query if needed
  useEffect(() => {
    if (clearAfterSelect) {
      setQuery("");
    }
  }, [activeDomain, clearAfterSelect]);

  // For single-select mode, keep query in sync with external value.
  useEffect(() => {
    if (!clearAfterSelect) {
      setQuery(value);
    }
  }, [value, clearAfterSelect]);

  const allSubjects = [
    ...activeSubjects,
    ...customSubjects.filter((s) => !activeSubjects.includes(s as never)),
  ];

  const filtered = allSubjects.filter((s) =>
    s.toLowerCase().includes(query.toLowerCase())
  );

  const showAddOption =
    query.trim().length > 0 &&
    !allSubjects.some((s) => s.toLowerCase() === query.trim().toLowerCase());

  function select(subject: string) {
    onChange(subject);
    if (clearAfterSelect) {
      setQuery("");
    } else {
      setQuery(subject);
    }
    setOpen(false);
  }

  function addCustom() {
    const trimmed = query.trim();
    if (!trimmed) return;
    saveCustomSubject(trimmed);
    setCustomSubjects(loadCustomSubjects());
    select(trimmed);
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
    setQuery("");
    inputRef.current?.focus();
  }

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        if (!clearAfterSelect && query.trim() && query !== value) {
          const matched = allSubjects.find(
            (s) => s.toLowerCase() === query.trim().toLowerCase()
          );
          if (matched) {
            onChange(matched);
            setQuery(matched);
          } else if (query.trim()) {
            saveCustomSubject(query.trim());
            onChange(query.trim());
          }
        }
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [query, value, allSubjects, onChange, clearAfterSelect]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div
        className={cn(
          "flex h-8 items-center gap-1 rounded-lg border border-input bg-background px-2.5 text-sm transition-colors",
          "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
          disabled && "pointer-events-none opacity-50"
        )}
        onClick={() => {
          setOpen(true);
          inputRef.current?.focus();
        }}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (filtered[0]) select(filtered[0]);
              else if (query.trim()) addCustom();
            }
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
        />
        {!clearAfterSelect && value ? (
          <button type="button" onClick={clear} tabIndex={-1} className="shrink-0 text-muted-foreground hover:text-foreground">
            <X className="size-3.5" />
          </button>
        ) : (
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-md">
          <div className="max-h-56 overflow-y-auto p-1">
            {filtered.length === 0 && !showAddOption && (
              <p className="px-2 py-3 text-center text-xs text-muted-foreground">No subjects found.</p>
            )}
            {filtered.map((subject) => (
              <button
                key={subject}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); select(subject); }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left hover:bg-accent",
                  !clearAfterSelect && value === subject && "bg-accent"
                )}
              >
                <Check className={cn("size-3.5 shrink-0", !clearAfterSelect && value === subject ? "opacity-100" : "opacity-0")} />
                {subject}
              </button>
            ))}
            {showAddOption && (
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); addCustom(); }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left hover:bg-accent text-primary"
              >
                <Plus className="size-3.5 shrink-0" />
                Add &ldquo;{query.trim()}&rdquo;
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
