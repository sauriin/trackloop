"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { dateKey } from "@/lib/fitness";
import type { Workout, WorkoutDraft } from "@/lib/types";

function newExerciseId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `ex_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

type ExerciseRow = { id: string; name: string };

function blankRow(): ExerciseRow {
  return { id: newExerciseId(), name: "" };
}

export function WorkoutForm({
  workout,
  onSave,
  onCancel,
}: {
  workout?: Workout;
  onSave: (draft: WorkoutDraft) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(workout?.title ?? "");
  const [date, setDate] = useState(workout?.date ?? dateKey());
  const [notes, setNotes] = useState(workout?.notes ?? "");
  const [exercises, setExercises] = useState<ExerciseRow[]>(
    workout?.exercises.length
      ? workout.exercises.map(({ id, name }) => ({ id, name }))
      : [blankRow()],
  );
  const [error, setError] = useState("");

  function updateRow(id: string, name: string) {
    setExercises((rows) =>
      rows.map((row) => (row.id === id ? { ...row, name } : row)),
    );
  }

  function removeRow(id: string) {
    setExercises((rows) => {
      const next = rows.filter((row) => row.id !== id);
      return next.length ? next : [blankRow()];
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) {
      setError("Give the workout a name.");
      return;
    }
    const filled = exercises.filter((exercise) => exercise.name.trim());
    if (filled.length === 0) {
      setError("Add at least one exercise.");
      return;
    }
    onSave({ title, date, notes, exercises: filled });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-line bg-panel p-4 sm:p-5"
    >
      <div className="grid gap-3 sm:grid-cols-[1.6fr_1fr]">
        <div className="space-y-1.5">
          <label htmlFor="workout-title" className="text-xs font-medium text-muted">
            Workout
          </label>
          <input
            id="workout-title"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (error) setError("");
            }}
            autoFocus
            placeholder="Push day"
            className={fieldClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="workout-date" className="text-xs font-medium text-muted">
            Date
          </label>
          <input
            id="workout-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className={fieldClass}
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted">Exercises</p>
        <ul className="space-y-2">
          {exercises.map((exercise, index) => (
            <li key={exercise.id} className="flex items-center gap-2">
              <input
                value={exercise.name}
                onChange={(event) => updateRow(exercise.id, event.target.value)}
                placeholder={index === 0 ? "Bench press 3×8" : "Next exercise"}
                className={fieldClass}
                aria-label={`Exercise ${index + 1}`}
              />
              <button
                type="button"
                onClick={() => removeRow(exercise.id)}
                aria-label={`Remove exercise ${index + 1}`}
                className="rounded-md p-1.5 text-muted transition-colors hover:bg-panel-2 hover:text-rose-400"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setExercises((rows) => [...rows, blankRow()])}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-panel-2"
        >
          <Plus className="size-3.5" /> Add exercise
        </button>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="workout-notes" className="text-xs font-medium text-muted">
          Notes
        </label>
        <textarea
          id="workout-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={2}
          placeholder="Optional — weights, how it felt"
          className={`${fieldClass} resize-y`}
        />
      </div>

      {error ? <p className="text-xs text-rose-400">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="submit"
          className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-canvas transition-opacity hover:opacity-90 sm:flex-none"
        >
          {workout ? "Save changes" : "Log workout"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:text-slate-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

const fieldClass =
  "w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm outline-none placeholder:text-muted/60 focus:border-accent";
