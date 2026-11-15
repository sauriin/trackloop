"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Database, Download, LogOut, Plus, Trash2, Upload, X } from "lucide-react";
import { useTasks } from "@/components/task-provider";
import { db } from "@/lib/db";
import { CATEGORIES, CATEGORY_DOT, type Category, type Task } from "@/lib/types";

function nowIso() {
  return new Date().toISOString();
}

function newId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Accepts a bare array or `{ tasks: [...] }` and normalises every row. */
function parseImport(text: string): Task[] {
  const parsed: unknown = JSON.parse(text);
  const rows = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as { tasks?: unknown })?.tasks)
      ? (parsed as { tasks: unknown[] }).tasks
      : null;

  if (!rows) throw new Error("Expected a JSON array of tasks.");

  const seen = new Set<string>();
  return rows.map((row) => {
    const record = row as Partial<Task>;
    if (typeof record?.title !== "string" || !record.title.trim()) {
      throw new Error("Every record needs a non-empty title.");
    }
    let id = typeof record.id === "string" && record.id ? record.id : newId();
    while (seen.has(id)) id = newId();
    seen.add(id);
    const stamp = typeof record.createdAt === "string" ? record.createdAt : nowIso();
    return {
      id,
      title: record.title.trim(),
      description: typeof record.description === "string" ? record.description : "",
      category: CATEGORIES.includes(record.category as Category)
        ? (record.category as Category)
        : "Office",
      done: record.done === true,
      createdAt: stamp,
      updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : stamp,
    };
  });
}

export function AdminView() {
  const { tasks, addTask, updateTask, toggleTask, deleteTask, replaceTasks, hydrated } =
    useTasks();
  const [rawId, setRawId] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [usage, setUsage] = useState<string>("—");
  const [creating, setCreating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const table = db.tables[0];
  const meta = useMemo(
    () => ({
      name: db.name,
      version: db.verno,
      table: table?.name ?? "tasks",
      keyPath: String(table?.schema.primKey.keyPath ?? "id"),
      indexes: (table?.schema.indexes ?? []).map((index) => index.name),
    }),
    [table],
  );

  useEffect(() => {
    let active = true;
    async function read() {
      try {
        const estimate = await navigator.storage?.estimate?.();
        if (!active || !estimate?.usage) return;
        setUsage(`${(estimate.usage / 1024).toFixed(1)} KB`);
      } catch {
        if (active) setUsage("unavailable");
      }
    }
    void read();
    return () => {
      active = false;
    };
  }, [tasks.length]);

  const done = tasks.filter((task) => task.done).length;
  const raw = rawId ? tasks.find((task) => task.id === rawId) : undefined;
  const sorted = useMemo(
    () => [...tasks].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [tasks],
  );

  function exportJson() {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `daily-tasks-${nowIso().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus(`Exported ${tasks.length} record${tasks.length === 1 ? "" : "s"}.`);
  }

  async function importFile(file: File) {
    try {
      const imported = parseImport(await file.text());
      await replaceTasks(imported);
      setStatus(`Imported ${imported.length} record${imported.length === 1 ? "" : "s"} — table replaced.`);
      setRawId(null);
    } catch (error) {
      setStatus(`Import failed: ${error instanceof Error ? error.message : "unknown error"}`);
    }
  }

  async function clearTable() {
    if (!window.confirm(`Delete all ${tasks.length} records? This cannot be undone.`)) {
      return;
    }
    try {
      await replaceTasks([]);
      setRawId(null);
      setStatus("Table cleared.");
    } catch (error) {
      setStatus(`Clear failed: ${error instanceof Error ? error.message : "unknown error"}`);
    }
  }

  async function signOut() {
    try {
      await fetch("/api/admin-auth", { method: "DELETE" });
    } finally {
      window.location.href = "/";
    }
  }

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    if (!title) return;
    const created = addTask({
      title,
      description: String(form.get("description") ?? ""),
      category: String(form.get("category") ?? "Office") as Category,
    });
    if (form.get("done") === "on") toggleTask(created.id);
    setCreating(false);
    setStatus("Record added.");
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
            <Database className="size-3.5" />
            Admin
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
            IndexedDB console
          </h1>
          <p className="mt-1 text-sm text-muted">
            Full read and write access to the table this app uses.
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <button
            type="button"
            onClick={() => setCreating((value) => !value)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-canvas transition-opacity hover:opacity-90 sm:flex-none"
          >
            <Plus className="size-4" strokeWidth={2.5} />
            Add record
          </button>
          <button
            type="button"
            onClick={() => void signOut()}
            title="Sign out of the admin console"
            className={toolbarButton}
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </header>

      <section className="grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
        <Fact label="Database" value={meta.name} />
        <Fact label="Version" value={String(meta.version)} />
        <Fact label="Table · key" value={`${meta.table} · ${meta.keyPath}`} />
        <Fact label="Indexes" value={meta.indexes.length ? meta.indexes.join(", ") : "none"} />
        <Fact label="Records" value={hydrated ? String(tasks.length) : "loading…"} />
        <Fact label="Open" value={String(tasks.length - done)} />
        <Fact label="Done" value={String(done)} />
        <Fact label="Storage used" value={usage} />
      </section>

      <section className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-panel p-3">
        <button type="button" onClick={exportJson} className={toolbarButton}>
          <Download className="size-4" /> Export JSON
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className={toolbarButton}
        >
          <Upload className="size-4" /> Import JSON
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void importFile(file);
            event.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={clearTable}
          className="inline-flex items-center gap-2 rounded-lg border border-rose-500/40 px-3 py-1.5 text-xs font-medium text-rose-400 transition-colors hover:bg-rose-500/10"
        >
          <Trash2 className="size-4" /> Delete all records
        </button>
        {status ? <span className="text-xs text-muted">{status}</span> : null}
      </section>

      {creating ? (
        <form
          onSubmit={handleCreate}
          className="grid gap-3 rounded-xl border border-line bg-panel p-4 sm:grid-cols-[1fr_1fr_auto_auto]"
        >
          <input name="title" placeholder="Title" required className={fieldClass} />
          <input name="description" placeholder="Description" className={fieldClass} />
          <select name="category" defaultValue="Office" className={fieldClass}>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-muted">
              <input type="checkbox" name="done" className="accent-accent" /> done
            </label>
            <button
              type="submit"
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-canvas hover:opacity-90"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="rounded-lg px-2 py-1.5 text-xs text-muted hover:text-slate-200"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-line bg-panel">
        <div className="flex items-center justify-between border-b border-line px-3 py-2 text-xs text-muted">
          <span>
            {meta.table} · {tasks.length} rows
          </span>
          <span className="hidden sm:inline">Edit a field, then press Tab or click away to save</span>
        </div>

        {sorted.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted">No records in this table.</p>
        ) : (
          <ul className="divide-y divide-line">
            {sorted.map((task) => (
              <li key={task.id} className="grid gap-2 px-3 py-3 lg:grid-cols-[1.4fr_1.4fr_auto_auto_auto] lg:items-center">
                <input
                  defaultValue={task.title}
                  key={`${task.id}-title`}
                  onBlur={(event) => {
                    const title = event.target.value.trim();
                    if (!title) {
                      event.target.value = task.title;
                      return;
                    }
                    if (title !== task.title) {
                      updateTask(task.id, {
                        title,
                        description: task.description,
                        category: task.category,
                      });
                    }
                  }}
                  className={fieldClass}
                  aria-label="Title"
                />
                <input
                  defaultValue={task.description}
                  key={`${task.id}-description`}
                  onBlur={(event) => {
                    if (event.target.value === task.description) return;
                    updateTask(task.id, {
                      title: task.title,
                      description: event.target.value,
                      category: task.category,
                    });
                  }}
                  placeholder="—"
                  className={fieldClass}
                  aria-label="Description"
                />
                <select
                  value={task.category}
                  onChange={(event) =>
                    updateTask(task.id, {
                      title: task.title,
                      description: task.description,
                      category: event.target.value as Category,
                    })
                  }
                  className={`${fieldClass} lg:w-32`}
                  aria-label="Category"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-muted">
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => toggleTask(task.id)}
                      className="accent-accent"
                    />
                    done
                  </label>
                  <span className={`size-1.5 rounded-full ${CATEGORY_DOT[task.category]}`} />
                </div>

                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => setRawId((current) => (current === task.id ? null : task.id))}
                    className="rounded-md px-2 py-1 text-[11px] text-muted transition-colors hover:bg-panel-2 hover:text-slate-100"
                    aria-label={`Raw record for "${task.title}"`}
                  >
                    {rawId === task.id ? "hide json" : "json"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete "${task.title}"?`)) {
                        deleteTask(task.id);
                        if (rawId === task.id) setRawId(null);
                        setStatus("Record deleted.");
                      }
                    }}
                    className="rounded-md p-1.5 text-muted transition-colors hover:bg-panel-2 hover:text-rose-400"
                    aria-label={`Delete "${task.title}"`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                {rawId === task.id && raw ? (
                  <pre className="col-span-full overflow-x-auto rounded-lg bg-canvas p-3 text-[11px] leading-relaxed text-muted">
                    {JSON.stringify(raw, null, 2)}
                  </pre>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="flex items-start gap-2 text-xs text-muted">
        <X className="mt-0.5 size-3.5 shrink-0" />
        This page is local-only: it reads and writes the IndexedDB of the browser you open
        it in, so records on another device or browser are not visible here.
      </p>
    </div>
  );
}

const fieldClass =
  "w-full rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-sm outline-none placeholder:text-muted/60 focus:border-accent";

const toolbarButton =
  "inline-flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-panel-2";

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-panel px-3 py-2">
      <p className="text-[11px] uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-0.5 truncate font-medium text-slate-100" title={value}>
        {value}
      </p>
    </div>
  );
}
