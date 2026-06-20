/* MedMate service worker — handles both local (postMessage) and server-sent
 * (Web Push / VAPID) notifications so reminders fire even when the app is closed. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);

// ── Server-sent Web Push ─────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || "MedMate", {
      body: data.body || "",
      icon: "/icon.svg",
      badge: "/icon.svg",
      tag: data.tag || undefined,
      data: { url: data.url || "/dashboard" },
    }),
  );
});

// ── Client-triggered (tab open, polling fallback) ────────────────────────────
self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type !== "SHOW_NOTIFICATION") return;
  const { title, body, tag, url } = data.payload || {};
  self.registration.showNotification(title || "MedMate reminder", {
    body: body || "",
    tag: tag || undefined,
    icon: "/icon.svg",
    badge: "/icon.svg",
    data: { url: url || "/tasks" },
  });
});

// ── Notification click → open / focus the app ────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
