"use client";

import { dayLabel, num, todayISO } from "@/lib/dates";
import { gymStreak, gymWeek } from "@/lib/derive";
import { update, uid, useAppState } from "@/lib/store";
import type { GymFocus } from "@/lib/types";
import { Card, CardHead, Empty, Stat } from "./ui";

const FOCUS: GymFocus[] = ["Push", "Pull", "Legs", "Upper", "Lower", "Cardio", "Full body", "Mobility"];

export function GymBoard() {
  const state = useAppState();
  const today = todayISO();
  const week = gymWeek(state, today);
  const streak = gymStreak(state);
  const sessions = [...state.gym].sort((a, b) => (a.date < b.date ? 1 : -1));

  function addSession(form: HTMLFormElement) {
    const data = new FormData(form);
    const date = String(data.get("date") ?? today) || today;
    update((draft) => {
      draft.gym.unshift({
        id: uid(),
        date,
        name: String(data.get("name") ?? "").trim(),
        focus: (String(data.get("focus") ?? "Push") as GymFocus) || "Push",
        duration: num(data.get("duration")),
        notes: String(data.get("notes") ?? "").trim(),
        done: date !== today,
      });
    });
    form.reset();
  }

  function toggle(id: string, done: boolean) {
    update((draft) => {
      const session = draft.gym.find((s) => s.id === id);
      if (session) session.done = done;
    });
  }

  function remove(id: string) {
    update((draft) => {
      draft.gym = draft.gym.filter((s) => s.id !== id);
    });
  }

  return (
    <>
      <Card>
        <CardHead title="Gym" right={dayLabel(today)} />
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
          <Stat label="This week" value={week.sessions} sub="sessions" />
          <Stat label="Minutes" value={week.minutes} />
          <Stat label="All time" value={sessions.length} sub="sessions" />
          <Stat label="Streak" value={streak} sub="days" />
        </div>
      </Card>

      <Card>
        <CardHead title={<span className="text-[15px]">Log a session</span>} />
        <form
          className="grid gap-2.5"
          onSubmit={(event) => {
            event.preventDefault();
            addSession(event.currentTarget);
          }}
        >
          <div className="grid grid-cols-2 gap-2.5">
            <label className="grid gap-1.5">
              <span className="label">Date</span>
              <input name="date" type="date" className="input" defaultValue={today} required />
            </label>
            <label className="grid gap-1.5">
              <span className="label">Focus</span>
              <select name="focus" className="input" defaultValue="Push">
                {FOCUS.map((focus) => (
                  <option key={focus} value={focus}>
                    {focus}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <input name="name" className="input" placeholder="Workout name (e.g. Push day A)" />
          <div className="flex gap-2.5">
            <input name="duration" type="number" min={0} step={5} className="input flex-1" placeholder="Minutes" />
            <button type="submit" className="btn btn-primary">
              Save
            </button>
          </div>
          <input name="notes" className="input" placeholder="Notes: sets, weights, how it felt…" />
        </form>
      </Card>

      <Card>
        <CardHead title={<span className="text-[15px]">History</span>} right={sessions.length} />
        {sessions.length ? (
          <ul className="grid gap-2">
            {sessions.slice(0, 30).map((session) => (
              <li key={session.id} className="item">
                <input
                  type="checkbox"
                  className="check mt-0.5"
                  checked={session.done}
                  onChange={(event) => toggle(session.id, event.target.checked)}
                  aria-label="Mark session done"
                />
                <div className={`min-w-0 flex-1 ${session.done ? "opacity-70" : ""}`}>
                  <div className={`text-[14.5px] font-semibold leading-snug ${session.done ? "line-through" : ""}`}>
                    {session.name || `${session.focus} day`}
                  </div>
                  <div className="mt-0.5 text-xs text-muted">
                    {[dayLabel(session.date), session.focus, session.duration ? `${session.duration} min` : "", session.notes]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => remove(session.id)}
                  aria-label="Delete session"
                  className="grid h-[30px] w-[30px] flex-none cursor-pointer place-items-center rounded-[9px] border-0 bg-transparent text-[14px] text-muted hover:bg-red/10 hover:text-red"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>No sessions yet. Log your first one above.</Empty>
        )}
      </Card>
    </>
  );
}
