import { dayLabel, num, shiftISO, todayISO } from "./dates";
import type { AppState, Totals } from "./types";

export function entryCalories(entry: { calories: number; protein: number; carbs: number; fat: number }): number {
  const stored = num(entry.calories);
  return stored || num(entry.protein) * 4 + num(entry.carbs) * 4 + num(entry.fat) * 9;
}

export function dayTotals(state: AppState, date: string): Totals {
  return state.food
    .filter((entry) => entry.date === date)
    .reduce<Totals>(
      (acc, entry) => {
        acc.calories += entryCalories(entry);
        acc.protein += num(entry.protein);
        acc.carbs += num(entry.carbs);
        acc.fat += num(entry.fat);
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
}

export function portfolio(state: AppState) {
  const invested = state.holdings.reduce((sum, h) => sum + num(h.invested), 0);
  const current = state.holdings.reduce((sum, h) => sum + num(h.current), 0);
  const pl = current - invested;
  return { invested, current, pl, plPct: invested ? (pl / invested) * 100 : 0 };
}

export function gymWeek(state: AppState, today = todayISO()) {
  const start = shiftISO(-6);
  const sessions = state.gym.filter((s) => s.date >= start && s.date <= today);
  return { sessions: sessions.length, minutes: sessions.reduce((sum, s) => sum + num(s.duration), 0) };
}

export function gymStreak(state: AppState): number {
  const dates = new Set(state.gym.map((s) => s.date));
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    if (!dates.has(shiftISO(-i))) break;
    streak++;
  }
  return streak;
}

export type OpenItemKind = "office" | "gym" | "reminder";

export interface OpenItem {
  key: string;
  kind: OpenItemKind;
  id: string;
  title: string;
  meta: string;
  overdue?: boolean;
  priority?: "low" | "normal" | "high";
}

/** Everything actionable today: due office tasks, planned workouts, reminders. */
export function openItems(state: AppState, today = todayISO()): OpenItem[] {
  const items: OpenItem[] = [];

  for (const task of state.office) {
    if (task.done) continue;
    if (task.due && task.due > today) continue;
    items.push({
      key: `office-${task.id}`,
      kind: "office",
      id: task.id,
      title: task.title,
      meta: [task.project, task.due ? `${dayLabel(task.due)}${task.due < today ? " · overdue" : ""}` : "No due date"]
        .filter(Boolean)
        .join(" · "),
      overdue: Boolean(task.due && task.due < today),
      priority: task.priority,
    });
  }

  for (const session of state.gym) {
    if (session.done || session.date !== today) continue;
    items.push({
      key: `gym-${session.id}`,
      kind: "gym",
      id: session.id,
      title: session.name || `${session.focus} day`,
      meta: [session.focus, session.duration ? `${session.duration} min` : ""].filter(Boolean).join(" · ") || "Planned today",
    });
  }

  for (const reminder of state.reminders) {
    if (reminder.done) continue;
    if (reminder.repeat === "none" && reminder.date !== today) continue;
    items.push({
      key: `reminder-${reminder.id}`,
      kind: "reminder",
      id: reminder.id,
      title: reminder.title,
      meta: `${reminder.time || "any time"}${reminder.repeat !== "none" ? ` · repeats ${reminder.repeat}` : ""}`,
    });
  }

  return items;
}
