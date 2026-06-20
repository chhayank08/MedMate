import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fanOut, type PushSubscriptionRecord } from "@/lib/push";
import { verifyQStashSignature } from "@/lib/qstash";

/**
 * Notification webhook endpoint - called by QStash when a reminder is due.
 * Sends push notifications to all user's subscribed devices.
 * 
 * Secured by webhook secret and QStash signature verification.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const data = JSON.parse(body);

    // Verify webhook secret
    const webhookSecret = process.env.NOTIFICATION_WEBHOOK_SECRET;
    if (!webhookSecret || data.secret !== webhookSecret) {
      console.error("[Webhook] Unauthorized request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify QStash signature (optional but recommended)
    const signature = req.headers.get("Upstash-Signature");
    if (signature && !verifyQStashSignature(signature, body)) {
      console.error("[Webhook] Invalid QStash signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const { userId, title, message, url, taskId, reminderId } = data;

    if (!userId || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    // Check if this reminder was cancelled in the meantime
    if (reminderId) {
      const { data: notification } = await supabase
        .from("notifications")
        .select("sent, cancelled")
        .eq("id", reminderId)
        .single();

      if (notification?.sent || notification?.cancelled) {
        console.log(`[Webhook] Reminder ${reminderId} already sent or cancelled`);
        return NextResponse.json({ ok: true, skipped: true });
      }
    }

    // Get user's push subscriptions
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", userId);

    const subs = (subscriptions ?? []) as PushSubscriptionRecord[];

    if (subs.length === 0) {
      console.log(`[Webhook] No push subscriptions found for user ${userId}`);
      return NextResponse.json({ ok: true, sent: 0 });
    }

    // Send push notifications
    const staleEndpoints = await fanOut(subs, {
      title,
      body: message,
      url: url || "/tasks",
      tag: reminderId,
    });

    // Remove stale subscriptions
    if (staleEndpoints.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("endpoint", staleEndpoints);
      console.log(`[Webhook] Removed ${staleEndpoints.length} stale subscriptions`);
    }

    // Mark notification as sent in database
    if (reminderId) {
      await supabase
        .from("notifications")
        .update({ sent: true, sent_at: new Date().toISOString() })
        .eq("id", reminderId);
    }

    console.log(`[Webhook] ✅ Sent notification to ${subs.length} devices for user ${userId}`);

    return NextResponse.json({
      ok: true,
      sent: subs.length,
      staleRemoved: staleEndpoints.length,
    });
  } catch (error) {
    console.error("[Webhook] Error processing notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Also support GET for QStash health checks
export async function GET() {
  return NextResponse.json({ ok: true, service: "MedMate Notifications" });
}
