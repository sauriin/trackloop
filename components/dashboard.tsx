"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Hand } from "lucide-react";
import { dayTotals, openItems, portfolio } from "@/lib/derive";
import { greeting, money, prettyDate, todayISO } from "@/lib/dates";
import { update, uid, useAppState } from "@/lib/store";
import { toast } from "@/lib/toast";
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
    toast("Task added");
  }

  return (
    <>
      <section className="relative overflow-hidden rounded-[26px] border border-accent/25 bg-[linear-gradient(145deg,#2b1727_0%,#1c1230_54%,#120e1c_100%)] p-5 shadow-[0_30px_60px_-40px_rgba(255,90,43,0.6)]">
        <div className="absolute -right-20 -top-24 h-60 w-60 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />
        <div className="absolute -left-16 bottom-[-80px] h-48 w-48 rounded-full bg-orchid/15 blur-3xl" aria-hidden="true" />

        <div className="relative">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10.5px] uppercase tracking-[0.14em] text-ink/70"
            suppressHydrationWarning
          >
            <CalendarDays size={12} aria-hidden="true" />
            {prettyDate(today)}
          </span>
          <h1 className="mt-3 text-[27px] font-semibold leading-tight tracking-[-0.025em]" suppressHydrationWarning>
            {greeting()}
            <Hand className="ml-1 inline-block h-6 w-6 -translate-y-0.5 text-amber" aria-hidden="true" />
          </h1>
          <p className="mt-1 text-[13px] text-ink/65">
            {items.length} open item{items.length === 1 ? "" : "s"} · {doneToday} done today
          </p>

          <div className="mt-4 grid gap-1.5">
            <div className="flex items-baseline justify-between text-[11px] uppercase tracking-[0.1em] text-ink/55">
              <span>Today’s momentum</span>
              <span className="tabular-nums">
                {doneToday}/{items.length + doneToday}
              </span>
            </div>
            <Progress value={items.length + doneToday ? (doneToday / (items.length + doneToday)) * 100 : 0} />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Stat label="Open tasks" value={items.length} />
        <Stat label="Calories" value={money(food.calories)} sub={money(state.goals.calories)} />
        <Stat label="Protein" value={`${Math.round(food.protein)}g`} sub={`${state.goals.protein}g`} />
        <Stat label="Portfolio" value={money(port.current)} sub="current" />
      </div>

      <div className="grid gap-3.5 lg:grid-cols-[1.35fr_1fr] lg:items-start">
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
          <Empty>Nothing open. Add a task below or enjoy the quiet.</Empty>
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
          <Link href="/nutrition" className="inline-flex items-center gap-1 text-[12.5px] text-muted">
            Details
            <ArrowRight size={13} aria-hidden="true" />
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
      </div>
    </>
  );
}
