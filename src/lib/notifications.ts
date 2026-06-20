"use client";

/** Client-side helpers for browser notifications + service worker. */

export function notificationsSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator
  );
}

export function pushSupported(): boolean {
  return notificationsSupported() && "PushManager" in window;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!notificationsSupported()) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch {
    return null;
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return "denied";
  if (Notification.permission === "granted") return "granted";
  return Notification.requestPermission();
}

/** Convert the URL-safe base64 VAPID public key to a Uint8Array for pushManager.subscribe(). */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/**
 * Subscribe this browser to Web Push and save the subscription to the server.
 * Safe to call multiple times — reuses any existing subscription.
 */
export async function subscribeToPush(): Promise<boolean> {
  if (!pushSupported()) return false;
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) return false;

  try {
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    const sub =
      existing ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as BufferSource,
      }));

    const json = sub.toJSON();
    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: sub.endpoint,
        keys: json.keys,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Unsubscribe this browser from Web Push and remove from the server. */
export async function unsubscribeFromPush(): Promise<void> {
  if (!pushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    await fetch("/api/push/subscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });
    await sub.unsubscribe();
  } catch {
    // best-effort
  }
}

export interface ReminderPayload {
  title: string;
  body: string;
  tag?: string;
  url?: string;
}

/** Show a notification via the SW if possible, otherwise fall back to the page API. */
export async function showReminder(payload: ReminderPayload): Promise<void> {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  const reg = await navigator.serviceWorker.ready.catch(() => null);
  if (reg?.active) {
    reg.active.postMessage({ type: "SHOW_NOTIFICATION", payload });
  } else {
    new Notification(payload.title, { body: payload.body, tag: payload.tag });
  }
}
