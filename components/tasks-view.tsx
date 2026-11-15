"use client";

import { useState } from "react";
import { Plus, ListChecks } from "lucide-react";
import { TaskForm } from "@/components/task-form";
import { TaskItem } from "@/components/task-item";
import { useTasks } from "@/components/task-provider";
import type { TaskDraft } from "@/lib/types";

export function TasksView() {
  const {
    filter,
    visibleTasks,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    hydrated,
  } = useTasks();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const heading = filter === "all" ? "All tasks" : filter;
  const openCount = visibleTasks.filter((task) => !task.done).length;
  const editingTask = visibleTasks.find((task) => task.id === editingId);

  function closeForm() {
    setCreating(false);
    setEditingId(null);
  }

  function handleCreate(draft: TaskDraft) {
    addTask(draft);
    setCreating(false);
  }

  function handleUpdate(draft: TaskDraft) {
    if (editingId) updateTask(editingId, draft);
    setEditingId(null);
  }

  function handleDelete(id: string, title: string) {
    if (window.confirm(`Delete "${title}"?`)) {
      deleteTask(id);
      if (editingId === id) setEditingId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <header className="flex flex-wrap items-end justify-between gap-3 pb-5 sm:gap-4 sm:pb-6">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
            {heading}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {hydrated ? `${openCount} open · ${visibleTasks.length} total` : "Loading tasks…"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setCreating(true);
            setEditingId(null);
          }}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-canvas transition-opacity hover:opacity-90 sm:w-auto"
        >
          <Plus className="size-4" strokeWidth={2.5} />
          New task
        </button>
      </header>

      {creating ? (
        <div className="pb-6">
          <TaskForm onSave={handleCreate} onCancel={closeForm} />
        </div>
      ) : null}

      {editingTask ? (
        <div className="pb-6">
          <TaskForm
            key={editingTask.id}
            task={editingTask}
            onSave={handleUpdate}
            onCancel={closeForm}
          />
        </div>
      ) : null}

      {visibleTasks.length > 0 ? (
        <ul className="space-y-2">
          {visibleTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={() => toggleTask(task.id)}
              onEdit={() => {
                setCreating(false);
                setEditingId(task.id);
              }}
              onDelete={() => handleDelete(task.id, task.title)}
            />
          ))}
        </ul>
      ) : hydrated ? (
        <div className="rounded-2xl border border-dashed border-line px-4 py-10 text-center sm:px-6 sm:py-14">
          <ListChecks className="mx-auto size-7 text-muted" />
          <p className="mt-3 text-sm font-medium text-slate-200">Nothing here yet</p>
          <p className="mt-1 text-sm text-muted">
            Add your first task to {filter === "all" ? "today" : filter.toLowerCase()}.
          </p>
        </div>
      ) : null}
    </div>
  );
}
