"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  notificationsSupported,
  requestNotificationPermission,
  registerServiceWorker,
  subscribeToPush,
} from "@/lib/notifications";

export function NotificationPrompt() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPermission(notificationsSupported() ? Notification.permission : "unsupported");
  }, []);

  if (permission === "unsupported" || permission === "granted") return null;

  async function enable() {
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === "granted") {
      await registerServiceWorker();
      await subscribeToPush();
      toast.success("Reminders enabled — you'll get notified even when the app is closed.");
    } else {
      toast.error("Notifications blocked. Enable them in your browser settings.");
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed bg-card/50 p-3">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <BellOff className="size-4.5" />
        </span>
        <div className="text-sm">
          <p className="font-medium">Turn on reminders</p>
          <p className="text-muted-foreground">Get notified before tasks are due — even with the app closed.</p>
        </div>
      </div>
      <Button size="sm" onClick={enable}>
        <Bell className="size-4" /> Enable
      </Button>
    </div>
  );
}
