/**
 * Notification scheduling helpers - integrate QStash into your app logic
 * 
 * Call these functions when users create tasks with reminders, schedule
 * study sessions, etc. They handle the QStash scheduling automatically.
 */
import "server-only";
import { scheduleReminder, scheduleRecurringReminder } from "@/lib/qstash";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type Supabase = SupabaseClient<Database>;

/**
 * Schedule a task reminder notification
 * Call this when a user creates/updates a task with a reminder
 */
export async function scheduleTaskReminder(
  supabase: Supabase,
  taskId: string,
  userId: string,
  taskTitle: string,
  dueDate: string,
  reminderMinutes: number
): Promise<boolean> {
  const dueTime = new Date(dueDate).getTime();
  const reminderTime = new Date(dueTime - reminderMinutes * 60 * 1000).toISOString();

  // Create notification record in database
  const { data: notification, error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      task_id: taskId,
      title: `Task reminder: ${taskTitle}`,
      message: `Your task "${taskTitle}" is due in ${reminderMinutes} minutes`,
      scheduled_for: reminderTime,
      sent: false,
    })
    .select("id")
    .single();

  if (error || !notification) {
    console.error("[Notifications] Failed to create notification record:", error);
    return false;
  }

  // Schedule via QStash
  return scheduleReminder({
    reminderId: notification.id,
    scheduledFor: reminderTime,
    userId,
    title: `Task reminder: ${taskTitle}`,
    message: `Your task "${taskTitle}" is due in ${reminderMinutes} minutes`,
    url: "/tasks",
    taskId,
  });
}

/**
 * Schedule a study reminder (recurring or one-time)
 */
export async function scheduleStudyReminder(
  userId: string,
  title: string,
  message: string,
  nextFireAt: string,
  recurring: boolean = false,
  recurrenceMinutes?: number
): Promise<boolean> {
  if (recurring && recurrenceMinutes) {
    return scheduleRecurringReminder(
      `study-${userId}-${Date.now()}`,
      userId,
      title,
      message,
      nextFireAt,
      recurrenceMinutes
    );
  }

  return scheduleReminder({
    reminderId: `study-${userId}-${Date.now()}`,
    scheduledFor: nextFireAt,
    userId,
    title,
    message,
    url: "/dashboard",
  });
}

/**
 * Cancel all reminders for a task (when task is completed or deleted)
 */
export async function cancelTaskReminders(
  supabase: Supabase,
  taskId: string
): Promise<void> {
  // Mark notifications as sent in DB to prevent them from being triggered
  await supabase
    .from("notifications")
    .update({ sent: true })
    .eq("task_id", taskId)
    .eq("sent", false);

  console.log(`[Notifications] Cancelled reminders for task ${taskId}`);
}

/**
 * Send an instant notification (no scheduling, immediate push)
 * Use for: quiz completed, summary ready, etc.
 */
export async function sendInstantNotification(
  supabase: Supabase,
  userId: string,
  title: string,
  message: string,
  url?: string
): Promise<boolean> {
  try {
    // Get push subscriptions
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", userId);

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`[Notifications] No subscriptions for user ${userId}`);
      return false;
    }

    // Import fanOut dynamically to avoid circular dependencies
    const { fanOut } = await import("@/lib/push");

    const staleEndpoints = await fanOut(subscriptions, {
      title,
      body: message,
      url: url || "/dashboard",
    });

    // Remove stale subscriptions
    if (staleEndpoints.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("endpoint", staleEndpoints);
    }

    console.log(`[Notifications] ✅ Sent instant notification to ${subscriptions.length} devices`);
    return true;
  } catch (error) {
    console.error("[Notifications] Failed to send instant notification:", error);
    return false;
  }
}
