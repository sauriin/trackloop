"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { todayISO } from "@/lib/dates";
import {
  checkDueReminders,
  nextOccurrence,
  notificationsSupported,
  permissionGranted,
  requestPermission,
  showNotification,
} from "@/lib/notifications";
import { update, uid, useAppState } from "@/lib/store";
import { toast } from "@/lib/toast";
import type { Repeat } from "@/lib/types";
import { Card, CardHead, Empty, Pill } from "./ui";

const REPEATS: { value: Repeat; label: string }[] = [
  { value: "none", label: "Once" },
  { value: "daily", label: "Every day" },
  { value: "weekly", label: "Every week" },
];

export function AlertsBoard() {
  const state = useAppState();
  const [granted, setGranted] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(notificationsSupported());
    setGranted(permissionGranted());
  }, []);

  const reminders = state.reminders
    .map((reminder) => ({ ...reminder, next: nextOccurrence(reminder) }))
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      if (!a.next) return 1;
      if (!b.next) return -1;
      return a.next.getTime() - b.next.getTime();
    });

  const active = reminders.filter((reminder) => !reminder.done).length;

  function addReminder(form: HTMLFormElement) {
    const data = new FormData(form);
    const title = String(data.get("title") ?? "").trim();
    if (!title) return;
    update((draft) => {
      draft.reminders.unshift({
        id: uid(),
        title,
        date: String(data.get("date") ?? todayISO()) || todayISO(),
        time: String(data.get("time") ?? "09:00") || "09:00",
        repeat: (String(data.get("repeat") ?? "none") as Repeat) || "none",
        done: false,
        lastFired: null,
      });
    });
    form.reset();
    toast("Reminder added");
  }

  function toggle(id: string, done: boolean) {
    update((draft) => {
      const reminder = draft.reminders.find((r) => r.id === id);
      if (!reminder) return;
      reminder.done = done;
      if (!done) reminder.lastFired = null;
    });
  }

  function remove(id: string) {
    update((draft) => {
      draft.reminders = draft.reminders.filter((r) => r.id !== id);
    });
  }

  async function enable() {
    const result = await requestPermission();
    setGranted(result.granted);
    if (!result.granted) {
      window.alert(result.reason ?? "Notifications are still off.");
      return;
    }
    await showNotification("Notifications enabled 🎉", "TrackLoop will alert you when a reminder is due.", "trackloop-welcome");
    toast("Notifications enabled");
  }

  return (
    <>
      <div className="grid gap-3.5 lg:grid-cols-2 lg:items-start">
      <Card>
        <CardHead title="Reminders" right={`${active} active`} />
        <form
          className="grid gap-2.5"
          onSubmit={(event) => {
            event.preventDefault();
            addReminder(event.currentTarget);
          }}
        >
          <input name="title" className="input" placeholder="Remind me to…" required />
          <div className="grid grid-cols-2 gap-2.5">
            <label className="grid gap-1.5">
              <span className="label">Date</span>
              <input name="date" type="date" className="input" defaultValue={todayISO()} required />
            </label>
            <label className="grid gap-1.5">
              <span className="label">Time</span>
              <input name="time" type="time" className="input" defaultValue="09:00" required />
            </label>
          </div>
          <div className="flex gap-2.5">
            <select name="repeat" className="input flex-1" defaultValue="none">
              {REPEATS.map((repeat) => (
                <option key={repeat.value} value={repeat.value}>
                  {repeat.label}
                </option>
              ))}
            </select>
            <button type="submit" className="btn btn-primary">
              Add
            </button>
          </div>
        </form>
      </Card>

      <Card>
        <CardHead title={<span className="text-[15px]">Notifications</span>} />
        <p className="mb-3 text-xs leading-relaxed text-muted">
          {granted
            ? "Notifications are on. You’ll get an alert when a reminder is due."
            : supported
              ? "Notifications are off. Turn them on so reminders reach your phone."
              : "This browser doesn’t expose notifications. On iPhone, install the app to the Home Screen (iOS 16.4+) and open it from there."}
        </p>
        <div className="flex flex-wrap gap-2">
          {granted ? (
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => showNotification("Test reminder ⏰", "If you can see this, notifications work.", "trackloop-test")}
            >
              Send test notification
            </button>
          ) : (
            <button type="button" className="btn btn-sm btn-primary" onClick={enable}>
              Enable notifications
            </button>
          )}
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => {
              const fired = checkDueReminders();
              if (!fired) window.alert("Nothing is due right now.");
            }}
          >
            Check due now
          </button>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          Alerts fire while TrackLoop is open or installed in the background. Reliable push while the app is fully closed
          needs a server — see the README.
        </p>
      </Card>
      </div>

      <Card>
        <CardHead title={<span className="text-[15px]">Scheduled</span>} right={reminders.length} />
        {reminders.length ? (
          <ul className="grid gap-2">
            {reminders.map((reminder) => (
              <li key={reminder.id} className="item">
                <input
                  type="checkbox"
                  className="check mt-0.5"
                  checked={reminder.done}
                  onChange={(event) => toggle(reminder.id, event.target.checked)}
                  aria-label={`Mark ${reminder.title} done`}
                />
                <div className={`min-w-0 flex-1 ${reminder.done ? "opacity-70" : ""}`}>
                  <div className={`text-[14.5px] font-semibold leading-snug ${reminder.done ? "line-through" : ""}`}>
                    {reminder.title}
                  </div>
                  <div className="mt-0.5 text-xs text-muted">
                    {reminder.next
                      ? reminder.next.toLocaleString(undefined, {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : "No schedule"}
                    {reminder.repeat !== "none" ? ` · ${reminder.repeat}` : ""}
                  </div>
                </div>
                {reminder.repeat !== "none" && <Pill>{reminder.repeat}</Pill>}
                <button
                  type="button"
                  onClick={() => remove(reminder.id)}
                  aria-label={`Delete ${reminder.title}`}
                  className="grid h-[30px] w-[30px] flex-none cursor-pointer place-items-center rounded-[9px] border-0 bg-transparent text-[14px] text-muted hover:bg-red/10 hover:text-red"
                >
                  <X size={15} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>No reminders yet — add one above.</Empty>
        )}
      </Card>
    </>
  );
}
