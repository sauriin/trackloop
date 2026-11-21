"use client";

import { useCallback, useState } from "react";
import { Dumbbell, Plus } from "lucide-react";
import { useFitness } from "@/components/fitness-provider";
import { MetricsPanel } from "@/components/metrics-panel";
import { WorkoutForm } from "@/components/workout-form";
import { WorkoutItem } from "@/components/workout-item";
import { formatWeekRange, WEEKLY_WORKOUT_GOAL, weekRange } from "@/lib/fitness";
import type { WorkoutDraft } from "@/lib/types";

export function FitnessView() {
  const {
    workouts,
    addWorkout,
    updateWorkout,
    toggleExercise,
    deleteWorkout,
    hydrated,
  } = useFitness();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const week = weekRange();
  const weekCount = workouts.filter(
    (workout) => workout.date >= week.start && workout.date <= week.end,
  ).length;
  const editingWorkout = workouts.find((workout) => workout.id === editingId);

  const closeForm = useCallback(() => {
    setCreating(false);
    setEditingId(null);
  }, []);

  const openCreate = useCallback(() => {
    setCreating(true);
    setEditingId(null);
  }, []);

  const openEdit = useCallback((id: string) => {
    setCreating(false);
    setEditingId(id);
  }, []);

  const handleCreate = useCallback(
    (draft: WorkoutDraft) => {
      addWorkout(draft);
      setCreating(false);
    },
    [addWorkout],
  );

  const handleUpdate = useCallback(
    (draft: WorkoutDraft) => {
      if (editingId) updateWorkout(editingId, draft);
      setEditingId(null);
    },
    [editingId, updateWorkout],
  );

  const handleDelete = useCallback(
    (id: string, title: string) => {
      if (!window.confirm(`Delete "${title}"?`)) return;
      deleteWorkout(id);
      setEditingId((current) => (current === id ? null : current));
    },
    [deleteWorkout],
  );

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <header className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
              <Dumbbell className="size-3.5" /> Fitness
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
              This week
            </h1>
            <p className="mt-1 text-sm text-muted">
              {hydrated
                ? `${weekCount} of ${WEEKLY_WORKOUT_GOAL} workouts · ${formatWeekRange(
                    week.start,
                    week.end,
                  )}`
                : "Loading workouts…"}
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-canvas transition-opacity hover:opacity-90 sm:w-auto"
          >
            <Plus className="size-4" strokeWidth={2.5} />
            Log workout
          </button>
        </div>

        <div className="flex gap-1.5" aria-hidden>
          {Array.from({ length: WEEKLY_WORKOUT_GOAL }, (_, index) => (
            <span
              key={index}
              className={`h-1.5 flex-1 rounded-full ${
                index < weekCount ? "bg-accent" : "bg-line"
              }`}
            />
          ))}
        </div>
      </header>

      {creating ? (
        <WorkoutForm onSave={handleCreate} onCancel={closeForm} />
      ) : null}

      {editingWorkout ? (
        <WorkoutForm
          key={editingWorkout.id}
          workout={editingWorkout}
          onSave={handleUpdate}
          onCancel={closeForm}
        />
      ) : null}

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Workouts</h2>
          <p className="mt-0.5 text-sm text-muted">
            Tick exercises off as you finish them.
          </p>
        </div>

        {workouts.length > 0 ? (
          <ul className="space-y-2">
            {workouts.map((workout) => (
              <WorkoutItem
                key={workout.id}
                workout={workout}
                onToggleExercise={toggleExercise}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        ) : hydrated ? (
          <div className="rounded-2xl border border-dashed border-line px-4 py-10 text-center sm:px-6 sm:py-14">
            <Dumbbell className="mx-auto size-7 text-muted" />
            <p className="mt-3 text-sm font-medium text-slate-200">No workouts yet</p>
            <p className="mt-1 text-sm text-muted">
              Log your first session and add its exercises as a checklist.
            </p>
          </div>
        ) : null}
      </section>

      <MetricsPanel />
    </div>
  );
}
