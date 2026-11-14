import { getState, update } from "./store";
import { localDateTime } from "./dates";
import type { Reminder } from "./types";

const GRACE_MS = 12 * 60 * 60 * 1000;

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function permissionGranted(): boolean {
  return notificationsSupported() && Notification.permission === "granted";
}

export type PermissionResult = { granted: boolean; reason?: string };

export async function requestPermission(): Promise<PermissionResult> {
  if (!notificationsSupported()) {
    return {
      granted: false,
      reason:
        "This browser does not support notifications. On iPhone, add the app to your Home Screen first (iOS 16.4+).",
    };
  }
  if (Notification.permission === "granted") return { granted: true };
  if (Notification.permission === "denied") {
    return {
      granted: false,
      reason: "Notifications are blocked for this site. Allow them in your browser settings, then reload.",
    };
  }
  try {
    const permission = await Notification.requestPermission();
    return permission === "granted"
      ? { granted: true }
      : { granted: false, reason: "Notifications were not allowed. You can enable them later." };
  } catch {
    return { granted: false, reason: "Could not request notification permission in this browser." };
  }
}

export async function showNotification(title: string, body = "", tag = "trackloop"): Promise<boolean> {
  if (!permissionGranted()) return false;
  const options: NotificationOptions = {
    body,
    tag,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
  };
  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.showNotification(title, options);
        return true;
      }
    }
    new Notification(title, options);
    return true;
  } catch (err) {
    console.warn("Notification failed", err);
    return false;
  }
}

function atTime(day: Date, reminder: Reminder): Date {
  const [hh, mm] = String(reminder.time || "09:00").split(":").map(Number);
  const d = new Date(day);
  d.setHours(hh || 0, mm || 0, 0, 0);
  return d;
}

/** Latest scheduled occurrence at or before `now`. */
export function dueOccurrence(reminder: Reminder, now: Date = new Date()): Date | null {
  if (!reminder.date || !reminder.time || reminder.done) return null;

  if (reminder.repeat === "daily") {
    const today = atTime(now, reminder);
    if (today <= now) return today;
    return atTime(new Date(now.getTime() - 86_400_000), reminder);
  }

  if (reminder.repeat === "weekly") {
    const base = localDateTime(reminder.date, reminder.time);
    if (!base) return null;
    for (let i = 0; i < 60; i++) {
      const day = new Date(now.getTime() - i * 86_400_000);
      if (day.getDay() !== base.getDay()) continue;
      const occ = atTime(day, reminder);
      if (occ <= now) return occ;
    }
    return null;
  }

  return localDateTime(reminder.date, reminder.time);
}

/** Next scheduled occurrence, used for sorting and labels. */
export function nextOccurrence(reminder: Reminder, now: Date = new Date()): Date | null {
  if (!reminder.date || !reminder.time) return null;

  if (reminder.repeat === "daily") {
    const today = atTime(now, reminder);
    return today > now ? today : atTime(new Date(now.getTime() + 86_400_000), reminder);
  }

  if (reminder.repeat === "weekly") {
    const base = localDateTime(reminder.date, reminder.time);
    if (!base) return null;
    for (let i = 0; i <= 8; i++) {
      const day = new Date(now.getTime() + i * 86_400_000);
      if (day.getDay() !== base.getDay()) continue;
      const occ = atTime(day, reminder);
      if (occ > now) return occ;
    }
    return null;
  }

  return localDateTime(reminder.date, reminder.time);
}

/** Fire notifications for every due reminder. Returns how many fired. */
export function checkDueReminders(): number {
  const now = new Date();
  const due: { id: string; key: string; title: string; when: Date }[] = [];

  for (const reminder of getState().reminders) {
    if (reminder.done) continue;
    const occurrence = dueOccurrence(reminder, now);
    if (!occurrence) continue;
    if (now.getTime() - occurrence.getTime() > GRACE_MS) continue;
    const key = occurrence.toISOString();
    if (reminder.lastFired === key) continue;
    due.push({ id: reminder.id, key, title: reminder.title, when: occurrence });
  }

  if (!due.length) return 0;

  update((draft) => {
    for (const fired of due) {
      const reminder = draft.reminders.find((r) => r.id === fired.id);
      if (!reminder) continue;
      reminder.lastFired = fired.key;
      if (reminder.repeat === "none") reminder.done = true;
    }
  });

  for (const fired of due) {
    void showNotification(
      `⏰ ${fired.title}`,
      fired.when.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
      `reminder-${fired.id}`
    );
  }

  return due.length;
}
