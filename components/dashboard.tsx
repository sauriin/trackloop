"use client";

import Link from "next/link";
import { dayTotals, openItems, portfolio } from "@/lib/derive";
import { greeting, money, prettyDate, todayISO } from "@/lib/dates";
import { update, uid, useAppState } from "@/lib/store";
import type { OpenItem } from "@/lib/derive";
import { Card, CardHead, Empty, Pill, Progress, Stat } from "./ui";

const KIND_LABEL: Record<OpenItem["kind"], string> = {
  office: "Task",
  gym: "Gym",
  reminder: "Reminder",
};

export function Dashboard() {
  const state = useAppState();
  const today = todayISO();
  const items = openItems(state, today);
  const food = dayTotals(state, today);
  const port = portfolio(state);
  const doneToday =
    state.office.filter((t) => t.done && t.doneAt?.startsWith(today)).length +
    state.gym.filter((s) => s.done && s.date === today).length;

  function complete(item: OpenItem) {
    update((draft) => {
      if (item.kind === "office") {
        const task = draft.office.find((t) => t.id === item.id);
        if (task) {
          task.done = true;
          task.doneAt = new Date().toISOString();
        }
      } else if (item.kind === "gym") {
        const session = draft.gym.find((s) => s.id === item.id);
        if (session) session.done = true;
      } else {
        const reminder = draft.reminders.find((r) => r.id === item.id);
        if (reminder) {
          if (reminder.repeat !== "none") reminder.lastFired = null;
          else reminder.done = true;
        }
      }
    });
  }

  function addQuickTask(form: HTMLFormElement) {
    const title = String(new FormData(form).get("title") ?? "").trim();
    if (!title) return;
    update((draft) => {
      draft.office.unshift({
        id: uid(),
        title,
        project: "",
        priority: "normal",
        due: todayISO(),
        done: false,
        createdAt: new Date().toISOString(),
      });
    });
    form.reset();
  }

  return (
    <>
      <section className="relative overflow-hidden rounded-3xl border border-green/20 bg-[linear-gradient(155deg,#16241f_0%,#121a24_62%,#101821_100%)] p-5 shadow-[0_24px_50px_-34px_rgba(74,222,128,0.45)]">
        <div className="absolute -right-16 -top-24 h-56 w-56 rounded-full bg-green/15 blur-3xl" aria-hidden="true" />
        <p className="text-[11px] uppercase tracking-[0.1em] text-ink/60" suppressHydrationWarning>
          {prettyDate(today)}
        </p>
        <h1 className="mt-2 text-[27px] font-semibold leading-tight tracking-[-0.025em]" suppressHydrationWarning>
          {greeting()} 👋
        </h1>
        <p className="mt-1 text-[13px] text-muted">
          {items.length} open item{items.length === 1 ? "" : "s"} · {doneToday} done today
        </p>
      </section>

      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        <Stat label="Open tasks" value={items.length} />
        <Stat label="Calories" value={money(food.calories)} sub={money(state.goals.calories)} />
        <Stat label="Protein" value={`${Math.round(food.protein)}g`} sub={`${state.goals.protein}g`} />
        <Stat label="Portfolio" value={money(port.current)} sub="current" />
      </div>

      <Card>
        <CardHead title="Today’s list" right={`${items.length} item${items.length === 1 ? "" : "s"}`} />
        {items.length ? (
          <ul className="grid gap-2">
            {items.map((item) => (
              <li key={item.key} className="item">
                <input
                  type="checkbox"
                  className="check mt-0.5"
                  aria-label={`Mark ${item.title} done`}
                  onChange={() => complete(item)}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[14.5px] font-semibold leading-snug tracking-tight">{item.title}</div>
                  <div className="mt-0.5 text-xs text-muted">
                    {KIND_LABEL[item.kind]}
                    {item.meta ? ` · ${item.meta}` : ""}
                  </div>
                </div>
                {item.priority === "high" && <Pill tone="warn">high</Pill>}
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Nothing open. Add a task below or enjoy the quiet. 🌤️</Empty>
        )}

        <form
          className="mt-3 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            addQuickTask(event.currentTarget);
          }}
        >
          <input name="title" className="input flex-1" placeholder="Quick add a task for today…" required />
          <button type="submit" className="btn btn-primary">
            Add
          </button>
        </form>
      </Card>

      <Card>
        <div className="card-head">
          <h2 className="text-[15px] font-semibold">Fuel &amp; money</h2>
          <Link href="/nutrition" className="text-[12.5px] text-muted">
            Details →
          </Link>
        </div>

        <div className="grid gap-1.5">
          <div className="flex items-baseline justify-between text-[13px]">
            <span className="text-muted">Calories</span>
            <span className="tabular-nums">
              {money(food.calories)} / {money(state.goals.calories)}
            </span>
          </div>
          <Progress
            value={state.goals.calories ? (food.calories / state.goals.calories) * 100 : 0}
            tone={food.calories > state.goals.calories * 1.1 ? "warn" : undefined}
          />
          <div className="mt-2 flex justify-between text-xs text-muted">
            <span>P {Math.round(food.protein)}g</span>
            <span>C {Math.round(food.carbs)}g</span>
            <span>F {Math.round(food.fat)}g</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted">Invested → current</p>
            <p className="text-sm">
              <strong>{money(port.invested)}</strong> → <strong>{money(port.current)}</strong>
            </p>
          </div>
          <Pill tone={port.pl >= 0 ? "ok" : "warn"}>
            {port.pl >= 0 ? "+" : ""}
            {port.plPct.toFixed(1)}%
          </Pill>
        </div>
      </Card>
    </>
  );
}
