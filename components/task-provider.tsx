"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { db, migrateLegacyTasks } from "@/lib/db";
import { CATEGORIES, type Category, type Task, type TaskDraft } from "@/lib/types";

export type TaskFilter = Category | "all";

type TaskContextValue = {
  tasks: Task[];
  filter: TaskFilter;
  setFilter: (filter: TaskFilter) => void;
  visibleTasks: Task[];
  counts: Record<TaskFilter, number>;
  addTask: (draft: TaskDraft) => Task;
  updateTask: (id: string, draft: TaskDraft) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  /** Admin helper: replaces the whole table in one shot. */
  replaceTasks: (next: Task[]) => Promise<void>;
  hydrated: boolean;
};

const TaskContext = createContext<TaskContextValue | null>(null);

function newId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function sortTasks(tasks: Task[]) {
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

function reportWriteError(error: unknown) {
  console.warn("Could not save task", error);
}

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        await migrateLegacyTasks();
        const stored = await db.tasks.toArray();
        if (active) setTasks(stored);
      } catch (error) {
        console.warn("Could not open the task database", error);
      } finally {
        if (active) setHydrated(true);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const addTask = useCallback((draft: TaskDraft) => {
    const now = new Date().toISOString();
    const task: Task = {
      id: newId(),
      title: draft.title.trim(),
      description: draft.description.trim(),
      category: draft.category,
      done: false,
      createdAt: now,
      updatedAt: now,
    };

    setTasks((current) => [task, ...current]);
    void db.tasks.add(task).catch(reportWriteError);
    return task;
  }, []);

  const updateTask = useCallback((id: string, draft: TaskDraft) => {
    const patch = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      category: draft.category,
      updatedAt: new Date().toISOString(),
    };

    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, ...patch } : task)),
    );
    void db.tasks.update(id, patch).catch(reportWriteError);
  }, []);

  const toggleTask = useCallback((id: string) => {
    setTasks((current) =>
      current.map((task) => {
        if (task.id !== id) return task;
        const patch = { done: !task.done, updatedAt: new Date().toISOString() };
        void db.tasks.update(id, patch).catch(reportWriteError);
        return { ...task, ...patch };
      }),
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((current) => current.filter((task) => task.id !== id));
    void db.tasks.delete(id).catch(reportWriteError);
  }, []);

  const replaceTasks = useCallback(async (next: Task[]) => {
    await db.tasks.clear();
    if (next.length > 0) await db.tasks.bulkAdd(next);
    setTasks(sortTasks(next));
  }, []);

  const visibleTasks = useMemo(() => {
    const matching =
      filter === "all" ? tasks : tasks.filter((task) => task.category === filter);
    return sortTasks(matching);
  }, [tasks, filter]);

  const counts = useMemo(() => {
    const result = { all: 0 } as Record<TaskFilter, number>;
    for (const category of CATEGORIES) result[category] = 0;
    for (const task of tasks) {
      if (task.done) continue;
      result[task.category] += 1;
      result.all += 1;
    }
    return result;
  }, [tasks]);

  const value = useMemo<TaskContextValue>(
    () => ({
      tasks,
      filter,
      setFilter,
      visibleTasks,
      counts,
      addTask,
      updateTask,
      toggleTask,
      deleteTask,
      replaceTasks,
      hydrated,
    }),
    [
      tasks,
      filter,
      visibleTasks,
      counts,
      addTask,
      updateTask,
      toggleTask,
      deleteTask,
      replaceTasks,
      hydrated,
    ],
  );

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (!context) throw new Error("useTasks must be used inside <TaskProvider>");
  return context;
}
