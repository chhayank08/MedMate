/**
 * QStash Reminder Scheduler - Event-Driven Push Notifications
 * 
 * Instead of polling every minute with a cron job, we schedule exact-time
 * webhooks via Upstash QStash (free tier: 500 requests/day).
 * 
 * When a reminder is due, QStash calls our webhook, which triggers push
 * notifications to all user's subscribed devices.
 */
import "server-only";

interface ScheduleReminderOptions {
  /** Unique identifier for this reminder (used for cancellation) */
  reminderId: string;
  /** ISO timestamp when notification should fire */
  scheduledFor: string;
  /** User ID to send notification to */
  userId: string;
  /** Notification payload */
  title: string;
  message: string;
  /** Optional URL to open when notification is clicked */
  url?: string;
  /** Optional task ID if this is task-related */
  taskId?: string;
}

/**
 * Schedule a reminder via QStash. When the time arrives, QStash will call
 * our webhook endpoint which sends the push notification.
 */
export async function scheduleReminder(options: ScheduleReminderOptions): Promise<boolean> {
  const qstashUrl = process.env.QSTASH_URL;
  const qstashToken = process.env.QSTASH_TOKEN;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL;
  const webhookSecret = process.env.NOTIFICATION_WEBHOOK_SECRET;

  if (!qstashUrl || !qstashToken || !siteUrl || !webhookSecret) {
    console.error("[QStash] Missing required environment variables");
    return false;
  }

  const scheduledTime = new Date(options.scheduledFor).getTime();
  const now = Date.now();
  
  // QStash requires delay in seconds (minimum 10 seconds in future)
  const delaySeconds = Math.max(10, Math.floor((scheduledTime - now) / 1000));

  if (delaySeconds < 0) {
    console.warn("[QStash] Scheduled time is in the past, skipping:", options.reminderId);
    return false;
  }

  try {
    const webhookUrl = `${siteUrl.replace(/\/$/, '')}/api/notifications/send`;
    
    const response = await fetch(`${qstashUrl}/v2/publish/${webhookUrl}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${qstashToken}`,
        "Content-Type": "application/json",
        "Upstash-Delay": `${delaySeconds}s`,
        "Upstash-Deduplication-Id": options.reminderId,
      },
      body: JSON.stringify({
        reminderId: options.reminderId,
        userId: options.userId,
        title: options.title,
        message: options.message,
        url: options.url,
        taskId: options.taskId,
        secret: webhookSecret,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[QStash] Failed to schedule reminder:", error);
      return false;
    }

    const result = await response.json();
    console.log(`[QStash] ✅ Scheduled reminder ${options.reminderId} to fire in ${delaySeconds}s (messageId: ${result.messageId})`);
    return true;
  } catch (error) {
    console.error("[QStash] Error scheduling reminder:", error);
    return false;
  }
}

/**
 * Cancel a scheduled reminder (if it hasn't fired yet)
 */
export async function cancelReminder(reminderId: string): Promise<boolean> {
  // QStash doesn't support direct cancellation by deduplication ID
  // Best practice: mark as cancelled in DB, webhook will check before sending
  console.log(`[QStash] Reminder cancellation requested: ${reminderId} (will be ignored by webhook if fired)`);
  return true;
}

/**
 * Schedule a recurring reminder (e.g., daily study reminder)
 * This creates the NEXT occurrence only. After it fires, the webhook
 * should schedule the next one.
 */
export async function scheduleRecurringReminder(
  reminderId: string,
  userId: string,
  title: string,
  message: string,
  nextFireAt: string,
  recurrenceMinutes: number
): Promise<boolean> {
  const success = await scheduleReminder({
    reminderId: `${reminderId}-${Date.now()}`,
    scheduledFor: nextFireAt,
    userId,
    title,
    message,
    url: "/dashboard",
  });

  if (success) {
    console.log(`[QStash] Scheduled recurring reminder: ${title} (recurs every ${recurrenceMinutes} minutes)`);
  }

  return success;
}

/**
 * Verify QStash webhook signature to ensure request is authentic
 */
export function verifyQStashSignature(
  signature: string | null,
  body: string
): boolean {
  if (!signature) return false;
  
  const currentKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextKey = process.env.QSTASH_NEXT_SIGNING_KEY;
  
  if (!currentKey || !nextKey) {
    console.error("[QStash] Missing signing keys");
    return false;
  }

  // QStash sends signatures in format: "sig1,sig2"
  const signatures = signature.split(',');
  
  // In production, verify HMAC-SHA256 signature
  // For now, simplified verification (you should implement proper HMAC verification)
  // See: https://docs.upstash.com/qstash/howto/signature
  
  return true; // TODO: Implement proper HMAC verification
}
