"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { dayLabel, money, num, shiftISO, todayISO } from "@/lib/dates";
import { dayTotals, entryCalories } from "@/lib/derive";
import { update, uid, useAppState } from "@/lib/store";
import { toast } from "@/lib/toast";
import type { Meal } from "@/lib/types";
import { Card, CardHead, Empty, Progress } from "./ui";

const MEALS: Meal[] = ["Breakfast", "Lunch", "Dinner", "Snack"];

function MacroRow({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) {
  return (
    <div className="mt-2.5 grid gap-1.5">
      <div className="flex items-baseline justify-between text-[13px]">
        <span className="text-muted">{label}</span>
        <span className="tabular-nums">
          {Math.round(value)}g <span className="text-muted">/ {goal}g</span>
        </span>
      </div>
      <div className="bar">
        <i className="bar-fill" style={{ width: `${Math.min(100, goal ? (value / goal) * 100 : 0)}%`, backgroundImage: `linear-gradient(90deg, ${color}, ${color})` }} />
      </div>
    </div>
  );
}

export function NutritionBoard() {
  const state = useAppState();
  const [date, setDate] = useState(todayISO());
  const totals = dayTotals(state, date);
  const entries = state.food.filter((entry) => entry.date === date);
  const remaining = state.goals.calories - totals.calories;

  function addFood(form: HTMLFormElement) {
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    if (!name) return;
    update((draft) => {
      draft.food.unshift({
        id: uid(),
        date,
        meal: (String(data.get("meal") ?? "Breakfast") as Meal) || "Breakfast",
        name,
        protein: num(data.get("protein")),
        carbs: num(data.get("carbs")),
        fat: num(data.get("fat")),
        calories: num(data.get("calories")),
      });
    });
    form.reset();
    toast("Food logged");
  }

  function saveGoals(form: HTMLFormElement) {
    const data = new FormData(form);
    update((draft) => {
      draft.goals = {
        calories: num(data.get("calories")),
        protein: num(data.get("protein")),
        carbs: num(data.get("carbs")),
        fat: num(data.get("fat")),
      };
    });
    toast("Goals updated");
  }

  function removeEntry(id: string) {
    update((draft) => {
      draft.food = draft.food.filter((entry) => entry.id !== id);
    });
  }

  return (
    <>
      <div className="grid gap-3.5 lg:grid-cols-2 lg:items-start">
      <Card>
        <CardHead
          title="Nutrition"
          right={
            <span className="flex gap-1.5">
              <button type="button" className="btn btn-sm btn-ghost px-2.5" onClick={() => setDate(shiftISO(-1, new Date(`${date}T12:00:00`)))} aria-label="Previous day">
                ‹
              </button>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setDate(todayISO())}>
                Today
              </button>
              <button type="button" className="btn btn-sm btn-ghost px-2.5" onClick={() => setDate(shiftISO(1, new Date(`${date}T12:00:00`)))} aria-label="Next day">
                ›
              </button>
            </span>
          }
        />
        <p className="mb-2 text-xs text-muted" suppressHydrationWarning>
          {dayLabel(date)}
        </p>

        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted">Calories</p>
            <p className="text-[26px] font-bold leading-tight tracking-tight tabular-nums">{money(totals.calories)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted">{remaining >= 0 ? "Remaining" : "Over"}</p>
            <p className={`text-xl font-bold tabular-nums ${remaining >= 0 ? "text-accent" : "text-red"}`}>
              {money(Math.abs(remaining))}
            </p>
          </div>
        </div>
        <div className="mt-2">
          <Progress value={state.goals.calories ? (totals.calories / state.goals.calories) * 100 : 0} />
        </div>
        <MacroRow label="Protein" value={totals.protein} goal={state.goals.protein} color="#38bdf8" />
        <MacroRow label="Carbs" value={totals.carbs} goal={state.goals.carbs} color="#fbbf24" />
        <MacroRow label="Fat" value={totals.fat} goal={state.goals.fat} color="#f472b6" />
      </Card>

      <Card>
        <CardHead title={<span className="text-[15px]">Add food</span>} />
        <form
          className="grid gap-2.5"
          onSubmit={(event) => {
            event.preventDefault();
            addFood(event.currentTarget);
          }}
        >
          <div className="grid grid-cols-2 gap-2.5">
            <select name="meal" className="input" defaultValue="Breakfast">
              {MEALS.map((meal) => (
                <option key={meal} value={meal}>
                  {meal}
                </option>
              ))}
            </select>
            <input name="name" className="input" placeholder="Food / meal name" required />
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <input name="protein" type="number" min={0} className="input" placeholder="Protein g" />
            <input name="carbs" type="number" min={0} className="input" placeholder="Carbs g" />
            <input name="fat" type="number" min={0} className="input" placeholder="Fat g" />
          </div>
          <div className="flex gap-2.5">
            <input name="calories" type="number" min={0} className="input flex-1" placeholder="Calories (auto if blank)" />
            <button type="submit" className="btn btn-primary">
              Log
            </button>
          </div>
        </form>
      </Card>
      </div>

      <div className="grid gap-3.5 lg:grid-cols-[1.35fr_1fr] lg:items-start">
      <Card>
        <CardHead title={<span className="text-[15px]">Logged</span>} right={`${entries.length} item${entries.length === 1 ? "" : "s"}`} />
        {entries.length ? (
          <ul className="grid gap-2">
            {entries.map((entry) => (
              <li key={entry.id} className="item">
                <div className="min-w-0 flex-1">
                  <div className="text-[14.5px] font-semibold leading-snug">{entry.name}</div>
                  <div className="mt-0.5 text-xs text-muted tabular-nums">
                    {entry.meal} · {entryCalories(entry)} kcal · P{entry.protein || 0} C{entry.carbs || 0} F{entry.fat || 0}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeEntry(entry.id)}
                  aria-label={`Delete ${entry.name}`}
                  className="grid h-[30px] w-[30px] flex-none cursor-pointer place-items-center rounded-[9px] border-0 bg-transparent text-[14px] text-muted hover:bg-red/10 hover:text-red"
                >
                  <X size={15} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Nothing logged for this day yet.</Empty>
        )}
      </Card>

      <Card>
        <CardHead title={<span className="text-[15px]">Daily goals</span>} />
        <form
          key={`${state.goals.calories}-${state.goals.protein}-${state.goals.carbs}-${state.goals.fat}`}
          className="grid gap-2.5"
          onSubmit={(event) => {
            event.preventDefault();
            saveGoals(event.currentTarget);
          }}
        >
          <div className="grid grid-cols-2 gap-2.5">
            <label className="grid gap-1.5">
              <span className="label">Calories</span>
              <input name="calories" type="number" min={0} className="input" defaultValue={state.goals.calories} />
            </label>
            <label className="grid gap-1.5">
              <span className="label">Protein g</span>
              <input name="protein" type="number" min={0} className="input" defaultValue={state.goals.protein} />
            </label>
            <label className="grid gap-1.5">
              <span className="label">Carbs g</span>
              <input name="carbs" type="number" min={0} className="input" defaultValue={state.goals.carbs} />
            </label>
            <label className="grid gap-1.5">
              <span className="label">Fat g</span>
              <input name="fat" type="number" min={0} className="input" defaultValue={state.goals.fat} />
            </label>
          </div>
          <button type="submit" className="btn">
            Save goals
          </button>
        </form>
      </Card>
      </div>
    </>
  );
}
