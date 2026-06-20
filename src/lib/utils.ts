import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  format,
  formatDistanceToNow,
  isToday,
  isTomorrow,
  isPast,
  parseISO,
} from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Accepts an ISO string or Date and returns a Date. */
function toDate(value: string | Date): Date {
  return typeof value === "string" ? parseISO(value) : value;
}

/** "Today, 3:00 PM" / "Tomorrow, 9:00 AM" / "Mar 12, 3:00 PM". */
export function formatDueDate(value: string | Date | null): string {
  if (!value) return "No due date";
  const date = toDate(value);
  const time = format(date, "h:mm a");
  if (isToday(date)) return `Today, ${time}`;
  if (isTomorrow(date)) return `Tomorrow, ${time}`;
  return format(date, "MMM d, h:mm a");
}

export function formatDate(value: string | Date | null, pattern = "MMM d, yyyy"): string {
  if (!value) return "—";
  return format(toDate(value), pattern);
}

export function fromNow(value: string | Date): string {
  return formatDistanceToNow(toDate(value), { addSuffix: true });
}

export function isOverdue(value: string | Date | null): boolean {
  if (!value) return false;
  return isPast(toDate(value)) && !isToday(toDate(value));
}

/** mm:ss for quiz timers. */
export function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** "1h 30m" / "45m" for study hours display. */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function getInitials(name?: string | null, email?: string | null): string {
  if (name?.trim()) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("");
  }
  return email?.[0]?.toUpperCase() ?? "U";
}

export function clampText(text: string, max = 160): string {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

/** Deterministic chart color for an arbitrary subject string. */
export function subjectColor(subject: string): string {
  let hash = 0;
  for (let i = 0; i < subject.length; i++) {
    hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = (Math.abs(hash) % 5) + 1;
  return `var(--chart-${idx})`;
}
