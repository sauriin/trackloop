"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { dayLabel, todayISO } from "@/lib/dates";
import { update, uid, useAppState } from "@/lib/store";
import { toast } from "@/lib/toast";
import type { OfficeTask, Priority } from "@/lib/types";
import { Card, CardHead, Empty, Pill } from "./ui";

type Filter = "open" | "done" | "all";
const FILTERS: Filter[] = ["open", "done", "all"];

export function OfficeBoard() {
  const state = useAppState();
  const [filter, setFilter] = useState<Filter>("open");
  const today = todayISO();

  const tasks = [...state.office];
  const open = tasks.filter((task) => !task.done);
  const overdue = open.filter((task) => task.due && task.due < today).length;

  const visible = tasks
    .filter((task) => (filter === "all" ? true : filter === "done" ? task.done : !task.done))
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      if (Boolean(a.due) !== Boolean(b.due)) return a.due ? -1 : 1;
      if (a.due && b.due && a.due !== b.due) return a.due < b.due ? -1 : 1;
      return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
    });

  function addTask(form: HTMLFormElement) {
    const data = new FormData(form);
    const title = String(data.get("title") ?? "").trim();
    if (!title) return;
    update((draft) => {
      draft.office.unshift({
        id: uid(),
        title,
        project: String(data.get("project") ?? "").trim(),
        priority: (String(data.get("priority") ?? "normal") as Priority) || "normal",
        due: String(data.get("due") ?? ""),
        done: false,
        createdAt: new Date().toISOString(),
      });
    });
    form.reset();
    toast("Task added");
  }

  function toggle(id: string, done: boolean) {
    update((draft) => {
      const task = draft.office.find((t) => t.id === id);
      if (!task) return;
      task.done = done;
      task.doneAt = done ? new Date().toISOString() : null;
    });
  }

  function remove(id: string) {
    update((draft) => {
      draft.office = draft.office.filter((t) => t.id !== id);
    });
  }

  return (
    <>
      <div className="grid gap-3.5 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:items-start">
      <div className="grid gap-3.5">
      <Card>
        <CardHead
          title="Office"
          right={
            <>
              {open.length} open
              {overdue ? <span className="text-amber"> · {overdue} overdue</span> : null}
            </>
          }
        />
        <form
          className="grid gap-2.5"
          onSubmit={(event) => {
            event.preventDefault();
            addTask(event.currentTarget);
          }}
        >
          <input name="title" className="input" placeholder="What needs doing?" required />
          <div className="grid grid-cols-2 gap-2.5">
            <input name="project" className="input" placeholder="Project (optional)" />
            <select name="priority" className="input" defaultValue="normal">
              <option value="normal">Normal priority</option>
              <option value="high">High priority</option>
              <option value="low">Low priority</option>
            </select>
          </div>
          <div className="flex gap-2.5">
            <input name="due" type="date" className="input" aria-label="Due date" />
            <button type="submit" className="btn btn-primary whitespace-nowrap">
              Add task
            </button>
          </div>
        </form>
      </Card>

      <div className="flex gap-2">
        {FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`btn btn-sm flex-1 ${filter === value ? "btn-active" : "btn-ghost"}`}
          >
            {value[0].toUpperCase() + value.slice(1)}
          </button>
        ))}
      </div>
      </div>

      <Card>
        {visible.length ? (
          <ul className="grid gap-2">
            {visible.map((task: OfficeTask) => (
              <li key={task.id} className="item">
                <input
                  type="checkbox"
                  className="check mt-0.5"
                  checked={task.done}
                  onChange={(event) => toggle(task.id, event.target.checked)}
                  aria-label={`Mark ${task.title} done`}
                />
                <div className={`min-w-0 flex-1 ${task.done ? "opacity-70" : ""}`}>
                  <div className={`text-[14.5px] font-semibold leading-snug ${task.done ? "line-through" : ""}`}>
                    {task.title}
                  </div>
                  <div className="mt-0.5 text-xs text-muted">
                    {[task.project, task.due ? dayLabel(task.due) : "No date", task.priority !== "normal" ? `${task.priority} priority` : ""]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
                {task.done ? <Pill tone="ok">done</Pill> : task.priority === "high" ? <Pill tone="warn">high</Pill> : null}
                <button
                  type="button"
                  onClick={() => remove(task.id)}
                  aria-label={`Delete ${task.title}`}
                  className="grid h-[30px] w-[30px] flex-none cursor-pointer place-items-center rounded-[9px] border-0 bg-transparent text-[14px] text-muted hover:bg-red/10 hover:text-red"
                >
                  <X size={15} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>{filter === "done" ? "No finished tasks yet." : "No tasks here. Add one above."}</Empty>
        )}
      </Card>
      </div>

      <p className="px-1 text-xs text-muted">Tasks due today and overdue ones also appear on the Today screen.</p>
    </>
  );
}
