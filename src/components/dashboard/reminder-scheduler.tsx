"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  registerServiceWorker,
  showReminder,
  notificationsSupported,
} from "@/lib/notifications";

const POLL_MS = 45_000;

/**
 * Mounted in the dashboard layout. While the app is open it polls the
 * notifications table for due reminders, fires a browser notification and marks
 * them sent. (Server-side Web Push with VAPID would deliver while closed — a
 * later enhancement noted in the README.)
 */
export function ReminderScheduler() {
  const running = useRef(false);

  useEffect(() => {
    if (!notificationsSupported()) return;
    registerServiceWorker();

    const supabase = createClient();

    async function tick() {
      if (running.current) return;
      if (Notification.permission !== "granted") return;
      running.current = true;
      try {
        const nowIso = new Date().toISOString();
        // Task-linked notifications
        const { data } = await supabase
          .from("notifications")
          .select("id, title, message, task_id")
          .eq("sent", false)
          .lte("scheduled_for", nowIso)
          .order("scheduled_for", { ascending: true })
          .limit(10);

        for (const n of data ?? []) {
          await showReminder({
            title: n.title ?? "MedMate reminder",
            body: n.message,
            tag: n.id,
            url: "/tasks",
          });
          await supabase
            .from("notifications")
            .update({ sent: true })
            .eq("id", n.id);
        }

        // Standalone study reminders
        const { data: studyDue } = await supabase
          .from("study_reminders")
          .select("id, title, reminder_type, recurrence, interval_minutes")
          .eq("enabled", true)
          .lte("next_fire_at", nowIso)
          .order("next_fire_at", { ascending: true })
          .limit(5);

        for (const r of studyDue ?? []) {
          await showReminder({
            title: "Study reminder",
            body: r.title,
            tag: `study-${r.id}`,
            url: "/dashboard",
          });

          if (r.reminder_type === "recurring") {
            const minutesMap: Record<string, number> = {
              hourly: 60, "2h": 120, "4h": 240, "6h": 360,
              daily: 1440, weekly: 10080, monthly: 43200,
            };
            const mins = r.recurrence === "custom"
              ? (r.interval_minutes ?? 60)
              : (minutesMap[r.recurrence ?? "daily"] ?? 1440);
            const next = new Date(Date.now() + mins * 60 * 1000).toISOString();
            await supabase
              .from("study_reminders")
              .update({ last_fired_at: nowIso, next_fire_at: next })
              .eq("id", r.id);
          } else {
            await supabase
              .from("study_reminders")
              .update({ enabled: false, last_fired_at: nowIso })
              .eq("id", r.id);
          }
        }
      } finally {
        running.current = false;
      }
    }

    tick();
    const interval = setInterval(tick, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  return null;
}
