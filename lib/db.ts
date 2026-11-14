import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { AppState } from "./types";

/**
 * Local SQLite database. The file lives in `data/trackloop.db` (git-ignored)
 * and holds a single app state row. Server-only — never import from components.
 */
const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = process.env.TRACKLOOP_DB || path.join(DATA_DIR, "trackloop.db");

let db: DatabaseSync | null = null;

function getDb(): DatabaseSync {
  if (db) return db;
  mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const database = new DatabaseSync(DB_PATH);
  database.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS app_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  db = database;
  return db;
}

export function readState(): AppState | null {
  try {
    const row = getDb().prepare("SELECT data FROM app_state WHERE id = 1").get() as { data: string } | undefined;
    if (!row) return null;
    return JSON.parse(row.data) as AppState;
  } catch (err) {
    console.error("Could not read local database", err);
    return null;
  }
}

export function writeState(state: AppState): void {
  getDb()
    .prepare(
      `INSERT INTO app_state (id, data, updated_at)
       VALUES (1, ?, ?)
       ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
    )
    .run(JSON.stringify(state), new Date().toISOString());
}
