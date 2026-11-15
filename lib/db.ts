import Dexie, { type EntityTable } from "dexie";
import type { Task } from "@/lib/types";

/** One IndexedDB table holding every task. */
export const db = new Dexie("daily") as Dexie & {
  tasks: EntityTable<Task, "id">;
};

db.version(1).stores({
  tasks: "id, category, done, updatedAt, createdAt",
});

/** Where tasks lived before the move to IndexedDB. */
export const LEGACY_STORAGE_KEY = "daily.tasks.v1";

/**
 * Copies tasks saved in localStorage into IndexedDB once, then drops the old
 * key so deleted tasks do not come back on the next load.
 */
export async function migrateLegacyTasks() {
  const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const existing = new Set(await db.tasks.toCollection().primaryKeys());
      const legacy = (parsed as Task[]).filter(
        (task) => task?.id && !existing.has(task.id),
      );
      if (legacy.length > 0) await db.tasks.bulkAdd(legacy);
    }
  } catch (error) {
    console.warn("Could not migrate saved tasks", error);
  } finally {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  }
}
