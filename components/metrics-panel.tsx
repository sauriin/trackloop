"use client";

import { useEffect, useState } from "react";
import { Footprints, Scale, Trash2 } from "lucide-react";
import { useFitness } from "@/components/fitness-provider";
import { dateKey, formatDateKey } from "@/lib/fitness";
import type { DayMetrics } from "@/lib/types";

/** Number of recent days shown in the log. */
const HISTORY_DAYS = 14;

export function MetricsPanel() {
  const { metrics, saveMetric, deleteMetric, hydrated } = useFitness();
  // Empty on the server so the prerendered HTML never depends on the server's
  // clock or timezone; today's date is filled in after mounting.
  const [date, setDate] = useState("");
  const [weight, setWeight] = useState("");
  const [steps, setSteps] = useState("");
  const [status, setStatus] = useState("");

  function fillFrom(entry: DayMetrics | undefined) {
    setWeight(entry?.weightKg != null ? String(entry.weightKg) : "");
    setSteps(entry?.steps != null ? String(entry.steps) : "");
    setStatus("");
  }

  useEffect(() => {
    setDate((current) => current || dateKey());
  }, []);

  // Once the stored log is loaded, show whatever was saved for the picked day.
  useEffect(() => {
    if (!hydrated) return;
    const entry = metrics.find((metric) => metric.date === date);
    setWeight(entry?.weightKg != null ? String(entry.weightKg) : "");
    setSteps(entry?.steps != null ? String(entry.steps) : "");
  }, [hydrated, date, metrics]);

  function pickDate(next: string) {
    setDate(next);
    setStatus("");
    fillFrom(metrics.find((metric) => metric.date === next));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const weightValue = weight.trim() ? Number(weight.replace(",", ".")) : null;
    if (weightValue != null && (!Number.isFinite(weightValue) || weightValue <= 0)) {
      setStatus("Weight must be a positive number.");
      return;
    }

    const stepsValue = steps.trim() ? Number(steps) : null;
    if (stepsValue != null && (!Number.isFinite(stepsValue) || stepsValue < 0)) {
      setStatus("Steps must be a whole number.");
      return;
    }

    if (weightValue == null && stepsValue == null) {
      setStatus("Enter weight or steps.");
      return;
    }

    saveMetric({
      date,
      weightKg: weightValue == null ? null : Math.round(weightValue * 10) / 10,
      steps: stepsValue == null ? null : Math.round(stepsValue),
    });
    setStatus(`Saved for ${formatDateKey(date)}.`);
  }

  const history = metrics.slice(0, HISTORY_DAYS);

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Weight &amp; steps</h2>
          <p className="mt-0.5 text-sm text-muted">
            {hydrated ? `${metrics.length} day${metrics.length === 1 ? "" : "s"} logged` : "Loading…"}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-3 rounded-2xl border border-line bg-panel p-4 sm:p-5"
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label htmlFor="metrics-date" className="text-xs font-medium text-muted">
              Date
            </label>
            <input
              id="metrics-date"
              type="date"
              value={date}
              onChange={(event) => pickDate(event.target.value)}
              className={fieldClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="metrics-weight" className="text-xs font-medium text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Scale className="size-3.5" /> Weight (kg)
              </span>
            </label>
            <input
              id="metrics-weight"
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
              placeholder="72.4"
              className={fieldClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="metrics-steps" className="text-xs font-medium text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Footprints className="size-3.5" /> Steps
              </span>
            </label>
            <input
              id="metrics-steps"
              type="number"
              inputMode="numeric"
              step="1"
              min="0"
              value={steps}
              onChange={(event) => setSteps(event.target.value)}
              placeholder="8000"
              className={fieldClass}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-canvas transition-opacity hover:opacity-90"
          >
            Save entry
          </button>
          {status ? <span className="text-xs text-muted">{status}</span> : null}
        </div>
      </form>

      {history.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-line bg-panel">
          <div className="grid grid-cols-[1.3fr_1fr_1fr_auto] gap-2 border-b border-line px-3 py-2 text-[11px] uppercase tracking-wider text-muted sm:px-4">
            <span>Day</span>
            <span>Weight</span>
            <span>Steps</span>
            <span className="sr-only">Actions</span>
          </div>
          <ul className="divide-y divide-line">
            {history.map((entry) => (
              <li
                key={entry.date}
                className="grid grid-cols-[1.3fr_1fr_1fr_auto] items-center gap-2 px-3 py-2.5 text-sm sm:px-4"
              >
                <span className="truncate text-slate-200">{formatDateKey(entry.date)}</span>
                <span className="tabular-nums text-slate-300">
                  {entry.weightKg != null ? `${entry.weightKg} kg` : "—"}
                </span>
                <span className="tabular-nums text-slate-300">
                  {entry.steps != null ? entry.steps.toLocaleString() : "—"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    deleteMetric(entry.date);
                    if (entry.date === date) fillFrom(undefined);
                  }}
                  aria-label={`Delete entry for ${formatDateKey(entry.date)}`}
                  className="rounded-md p-1.5 text-muted transition-colors hover:bg-panel-2 hover:text-rose-400"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : hydrated ? (
        <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
          Log your weight and steps to start the trend.
        </p>
      ) : null}
    </section>
  );
}

const fieldClass =
  "w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm outline-none placeholder:text-muted/60 focus:border-accent";
