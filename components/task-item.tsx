"use client";

import { memo } from "react";
import { Check, Pencil, Trash2 } from "lucide-react";
import { CATEGORY_DOT, type Task } from "@/lib/types";

/**
 * Memoized so that changing one task only re-renders that row: the handlers are
 * stable (they take the id) and `task` is a fresh object only when it changed.
 */
export const TaskItem = memo(function TaskItem({
  task,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string, title: string) => void;
}) {
  return (
    <li className="group flex items-start gap-2.5 rounded-xl border border-line bg-panel px-3 py-3 sm:gap-3 sm:px-4">
      <button
        type="button"
        onClick={() => onToggle(task.id)}
        role="checkbox"
        aria-checked={task.done}
        aria-label={task.done ? `Mark "${task.title}" as open` : `Mark "${task.title}" as done`}
        className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-colors ${
          task.done
            ? "border-accent bg-accent text-canvas"
            : "border-line text-transparent hover:border-accent/60"
        }`}
      >
        <Check className="size-3.5" strokeWidth={3} />
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={`break-words text-sm font-medium ${
            task.done ? "text-muted line-through" : "text-slate-100"
          }`}
        >
          {task.title}
        </p>
        {task.description ? (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted">{task.description}</p>
        ) : null}
        <span className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full bg-canvas px-2 py-0.5 text-[11px] text-muted">
          <span className={`size-1.5 rounded-full ${CATEGORY_DOT[task.category]}`} />
          {task.category}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1 opacity-100 transition-opacity sm:opacity-70 sm:group-hover:opacity-100">
        <button
          type="button"
          onClick={() => onEdit(task.id)}
          aria-label={`Edit "${task.title}"`}
          className="rounded-md p-1.5 text-muted transition-colors hover:bg-panel-2 hover:text-slate-100"
        >
          <Pencil className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(task.id, task.title)}
          aria-label={`Delete "${task.title}"`}
          className="rounded-md p-1.5 text-muted transition-colors hover:bg-panel-2 hover:text-rose-400"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </li>
  );
});
