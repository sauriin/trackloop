import { state_, update, localDateTime } from "./store.js";

const WINDOW_MS = 12 * 60 * 60 * 1000; // fire reminders up to 12h late

export function supported() {
  return "Notification" in window;
}

export function notifyState() {
  const granted = supported() && Notification.permission === "granted";
  return { supported: supported(), granted, permission: supported() ? Notification.permission : "unsupported" };
}

export async function requestPermission() {
  if (!supported()) {
    return { granted: false, reason: "This browser does not support notifications. On iPhone, add the app to your Home Screen first (iOS 16.4+)." };
  }
  if (Notification.permission === "granted") return { granted: true };
  if (Notification.permission === "denied") {
    return { granted: false, reason: "Notifications are blocked for this site. Enable them in your browser/site settings, then reload." };
  }
  try {
    const permission = await Notification.requestPermission();
    return permission === "granted"
      ? { granted: true }
      : { granted: false, reason: "Notifications were not allowed. You can turn them on later with the bell button." };
  } catch {
    return { granted: false, reason: "Could not request notification permission in this browser." };
  }
}

export async function show(title, body = "", tag = "trackloop") {
  if (!notifyState().granted) return false;
  const options = {
    body,
    tag,
    icon: "icon.svg",
    badge: "icon.svg",
    vibrate: [120, 60, 120],
  };
  try {
    const reg = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : null;
    if (reg) {
      await reg.showNotification(title, options);
      return true;
    }
    new Notification(title, options);
    return true;
  } catch (err) {
    console.warn("Notification failed", err);
    return false;
  }
}

/* ---------- repeat handling ---------- */

function atTime(day, r) {
  const [hh, mm] = String(r.time || "09:00").split(":").map(Number);
  const d = new Date(day);
  d.setHours(hh || 0, mm || 0, 0, 0);
  return d;
}

/** Most recent scheduled occurrence at or before `now` (within the grace window). */
export function dueOccurrence(r, now = new Date()) {
  if (!r.date || !r.time || r.done) return null;

  if (r.repeat === "daily") {
    const today = atTime(now, r);
    if (today <= now) return today;
    const yesterday = atTime(new Date(now.getTime() - 86400000), r);
    return yesterday;
  }

  if (r.repeat === "weekly") {
    const base = localDateTime(r.date, r.time);
    if (!base) return null;
    for (let i = 0; i < 60; i++) {
      const day = new Date(now.getTime() - i * 86400000);
      if (day.getDay() !== base.getDay()) continue;
      const occ = atTime(day, r);
      if (occ <= now) return occ;
    }
    return null;
  }

  return localDateTime(r.date, r.time);
}

/** Next time this reminder will fire (for display). */
export function nextOccurrence(r, now = new Date()) {
  if (!r.date || !r.time) return null;
  if (r.repeat === "daily") {
    const today = atTime(now, r);
    return today > now ? today : atTime(new Date(now.getTime() + 86400000), r);
  }
  if (r.repeat === "weekly") {
    const base = localDateTime(r.date, r.time);
    if (!base) return null;
    for (let i = 0; i <= 8; i++) {
      const day = new Date(now.getTime() + i * 86400000);
      if (day.getDay() !== base.getDay()) continue;
      const occ = atTime(day, r);
      if (occ > now) return occ;
    }
    return null;
  }
  return localDateTime(r.date, r.time);
}

/** Check for reminders that are due and show them. Returns how many fired. */
export function checkDue() {
  const now = new Date();
  const fired = [];

  for (const r of state_().reminders) {
    if (r.done) continue;
    const occ = dueOccurrence(r, now);
    if (!occ) continue;
    if (now - occ > WINDOW_MS) continue;
    if (r.lastFired === occ.toISOString()) continue;
    fired.push({ id: r.id, key: occ.toISOString(), title: r.title, at: occ });
  }

  if (!fired.length) return 0;

  update((s) => {
    for (const f of fired) {
      const r = s.reminders.find((x) => x.id === f.id);
      if (!r) continue;
      r.lastFired = f.key;
      if (r.repeat === "none") r.done = true;
    }
  });

  fired.forEach((f) => {
    show(`⏰ ${f.title}`, f.at.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }), `reminder-${f.id}`);
  });

  return fired.length;
}

export function startTicker(onFire) {
  const run = () => {
    const count = checkDue();
    if (count && typeof onFire === "function") onFire();
  };
  run();
  setInterval(run, 20000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") run();
  });
}
