import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fanOut, type PushSubscriptionRecord } from "@/lib/push";

/**
 * Cron endpoint — fires every minute on Vercel.
 * Checks for due notifications and study reminders, then fan-outs via Web Push
 * to every subscribed device for each user. Works even when the app is closed.
 *
 * Secured by CRON_SECRET so only Vercel (or an authorised curl) can call it.
 * Vercel automatically sends this as the Authorization: Bearer header.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;
  const nowIso = new Date().toISOString();
  const results = { notifications: 0, reminders: 0, staleRemoved: 0 };

  // ── Helper: get push subscriptions for a user ───────────────────────────
  async function getSubscriptions(userId: string): Promise<PushSubscriptionRecord[]> {
    const { data } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", userId);
    return (data ?? []) as PushSubscriptionRecord[];
  }

  async function removeStale(endpoints: string[]) {
    if (!endpoints.length) return;
    await supabase.from("push_subscriptions").delete().in("endpoint", endpoints);
    results.staleRemoved += endpoints.length;
  }

  // ── Task-linked notifications ────────────────────────────────────────────
  const { data: dueNotifications } = await supabase
    .from("notifications")
    .select("id, user_id, title, message, task_id")
    .eq("sent", false)
    .lte("scheduled_for", nowIso)
    .order("scheduled_for", { ascending: true })
    .limit(50);

  for (const n of dueNotifications ?? []) {
    const subs = await getSubscriptions(n.user_id);
    if (subs.length) {
      const stale = await fanOut(subs, {
        title: n.title ?? "MedMate reminder",
        body: n.message ?? "",
        url: "/tasks",
        tag: n.id,
      });
      await removeStale(stale);
    }
    await supabase.from("notifications").update({ sent: true }).eq("id", n.id);
    results.notifications++;
  }

  // ── Standalone study reminders ───────────────────────────────────────────
  const { data: dueReminders } = await supabase
    .from("study_reminders")
    .select("id, user_id, title, reminder_type, recurrence, interval_minutes")
    .eq("enabled", true)
    .lte("next_fire_at", nowIso)
    .order("next_fire_at", { ascending: true })
    .limit(50);

  const minutesMap: Record<string, number> = {
    hourly: 60,
    "2h": 120,
    "4h": 240,
    "6h": 360,
    daily: 1440,
    weekly: 10080,
    monthly: 43200,
  };

  for (const r of dueReminders ?? []) {
    const subs = await getSubscriptions(r.user_id);
    if (subs.length) {
      const stale = await fanOut(subs, {
        title: "Study reminder",
        body: r.title,
        url: "/dashboard",
        tag: `study-${r.id}`,
      });
      await removeStale(stale);
    }

    if (r.reminder_type === "recurring") {
      const mins =
        r.recurrence === "custom"
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
    results.reminders++;
  }

  return NextResponse.json({ ok: true, ...results });
}
