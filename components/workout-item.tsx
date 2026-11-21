"use client";

import { memo } from "react";
import { Check, Pencil, Trash2 } from "lucide-react";
import { formatDateKey } from "@/lib/fitness";
import type { Workout } from "@/lib/types";

export const WorkoutItem = memo(function WorkoutItem({
  workout,
  onToggleExercise,
  onEdit,
  onDelete,
}: {
  workout: Workout;
  onToggleExercise: (workoutId: string, exerciseId: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string, title: string) => void;
}) {
  const done = workout.exercises.filter((exercise) => exercise.done).length;

  return (
    <li className="rounded-xl border border-line bg-panel px-3 py-3 sm:px-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-100">{workout.title}</p>
          <p className="mt-0.5 text-xs text-muted">
            {formatDateKey(workout.date)} · {done}/{workout.exercises.length} exercises
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(workout.id)}
            aria-label={`Edit "${workout.title}"`}
            className="rounded-md p-1.5 text-muted transition-colors hover:bg-panel-2 hover:text-slate-100"
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(workout.id, workout.title)}
            aria-label={`Delete "${workout.title}"`}
            className="rounded-md p-1.5 text-muted transition-colors hover:bg-panel-2 hover:text-rose-400"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <ul className="mt-3 space-y-1">
        {workout.exercises.map((exercise) => (
          <li key={exercise.id}>
            <button
              type="button"
              onClick={() => onToggleExercise(workout.id, exercise.id)}
              role="checkbox"
              aria-checked={exercise.done}
              className="flex w-full items-center gap-2.5 rounded-lg px-1 py-1 text-left transition-colors hover:bg-panel-2"
            >
              <span
                className={`grid size-4.5 shrink-0 place-items-center rounded border transition-colors ${
                  exercise.done
                    ? "border-accent bg-accent text-canvas"
                    : "border-line text-transparent"
                }`}
              >
                <Check className="size-3" strokeWidth={3} />
              </span>
              <span
                className={`text-sm ${
                  exercise.done ? "text-muted line-through" : "text-slate-200"
                }`}
              >
                {exercise.name}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {workout.notes ? (
        <p className="mt-2 border-t border-line pt-2 text-xs text-muted">
          {workout.notes}
        </p>
      ) : null}
    </li>
  );
});
