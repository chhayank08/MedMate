import "server-only";
import webPush from "web-push";

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
}

export interface PushSubscriptionRecord {
  endpoint: string;
  p256dh: string;
  auth: string;
}

function vapidConfig() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@medmate.app";
  if (!publicKey || !privateKey) {
    throw new Error("VAPID keys are not configured.");
  }
  return { publicKey, privateKey, subject };
}

/** Send a Web Push notification to a single subscription. Returns true on success, false if the subscription is stale/gone. */
export async function sendPush(
  subscription: PushSubscriptionRecord,
  payload: PushPayload,
): Promise<{ ok: boolean; gone: boolean }> {
  const { publicKey, privateKey, subject } = vapidConfig();
  webPush.setVapidDetails(subject, publicKey, privateKey);

  try {
    await webPush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url ?? "/dashboard",
        tag: payload.tag,
        icon: payload.icon ?? "/icon.svg",
        badge: "/icon.svg",
      }),
    );
    return { ok: true, gone: false };
  } catch (err: unknown) {
    const status = (err as { statusCode?: number })?.statusCode;
    // 404 / 410 = subscription is no longer valid (browser unsubscribed or expired).
    const gone = status === 404 || status === 410;
    return { ok: false, gone };
  }
}

/** Fan out a push notification to every subscription in the list. Returns stale endpoints so the caller can delete them. */
export async function fanOut(
  subscriptions: PushSubscriptionRecord[],
  payload: PushPayload,
): Promise<string[]> {
  const staleEndpoints: string[] = [];
  await Promise.all(
    subscriptions.map(async (sub) => {
      const result = await sendPush(sub, payload);
      if (result.gone) staleEndpoints.push(sub.endpoint);
    }),
  );
  return staleEndpoints;
}
