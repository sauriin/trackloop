"use client";

import { useState } from "react";
import { CATEGORIES, type Category, type Task, type TaskDraft } from "@/lib/types";

export function TaskForm({
  task,
  onSave,
  onCancel,
}: {
  task?: Task;
  onSave: (draft: TaskDraft) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [category, setCategory] = useState<Category>(task?.category ?? "Office");
  const [error, setError] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) {
      setError("Give the task a title.");
      return;
    }
    onSave({ title, description, category });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-line bg-panel p-4 sm:p-5"
    >
      <div className="space-y-1.5">
        <label htmlFor="task-title" className="text-xs font-medium text-muted">
          Title
        </label>
        <input
          id="task-title"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            if (error) setError("");
          }}
          autoFocus
          placeholder="What needs doing?"
          className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm outline-none placeholder:text-muted/60 focus:border-accent"
        />
        {error ? <p className="text-xs text-rose-400">{error}</p> : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="task-description" className="text-xs font-medium text-muted">
          Short description
        </label>
        <textarea
          id="task-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={2}
          placeholder="Optional details"
          className="w-full resize-y rounded-lg border border-line bg-canvas px-3 py-2 text-sm outline-none placeholder:text-muted/60 focus:border-accent"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="task-category" className="text-xs font-medium text-muted">
          Category
        </label>
        <select
          id="task-category"
          value={category}
          onChange={(event) => setCategory(event.target.value as Category)}
          className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-accent"
        >
          {CATEGORIES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="submit"
          className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-canvas transition-opacity hover:opacity-90 sm:flex-none"
        >
          {task ? "Save changes" : "Add task"}
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
