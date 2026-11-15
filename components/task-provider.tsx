"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CATEGORIES, type Category, type Task, type TaskDraft } from "@/lib/types";

export type TaskFilter = Category | "all";

type TaskContextValue = {
  tasks: Task[];
  filter: TaskFilter;
  setFilter: (filter: TaskFilter) => void;
  visibleTasks: Task[];
  counts: Record<TaskFilter, number>;
  addTask: (draft: TaskDraft) => void;
  updateTask: (id: string, draft: TaskDraft) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  hydrated: boolean;
};

const STORAGE_KEY = "daily.tasks.v1";

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

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) setTasks(parsed as Task[]);
      }
    } catch (error) {
      console.warn("Could not read saved tasks", error);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.warn("Could not save tasks", error);
    }
  }, [tasks, hydrated]);

  const addTask = useCallback((draft: TaskDraft) => {
    const now = new Date().toISOString();
    setTasks((current) => [
      {
        id: newId(),
        title: draft.title.trim(),
        description: draft.description.trim(),
        category: draft.category,
        done: false,
        createdAt: now,
        updatedAt: now,
      },
      ...current,
    ]);
  }, []);

  const updateTask = useCallback((id: string, draft: TaskDraft) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === id
          ? {
              ...task,
              title: draft.title.trim(),
              description: draft.description.trim(),
              category: draft.category,
              updatedAt: new Date().toISOString(),
            }
          : task,
      ),
    );
  }, []);

  const toggleTask = useCallback((id: string) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === id
          ? { ...task, done: !task.done, updatedAt: new Date().toISOString() }
          : task,
      ),
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((current) => current.filter((task) => task.id !== id));
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
      hydrated,
    }),
    [tasks, filter, visibleTasks, counts, addTask, updateTask, toggleTask, deleteTask, hydrated],
  );

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (!context) throw new Error("useTasks must be used inside <TaskProvider>");
  return context;
}
