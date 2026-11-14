import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { neon } from "@neondatabase/serverless";
import type { AppState } from "./types";

/**
 * Storage for the single app state row.
 *
 * - Deployed on Vercel: Neon Postgres, connected through the Vercel Marketplace
 *   integration, which injects DATABASE_URL. Serverless filesystems are
 *   read-only and ephemeral, so a local file cannot work there.
 * - Self-hosted: a local SQLite file at `data/trackloop.db` (git-ignored),
 *   overridable with TRACKLOOP_DB. Used whenever DATABASE_URL is unset.
 *
 * Server-only — never import from components.
 */
const REMOTE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;
export const usingPostgres = Boolean(REMOTE_URL);

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = process.env.TRACKLOOP_DB || path.join(DATA_DIR, "trackloop.db");

const SCHEMA = `CREATE TABLE IF NOT EXISTS app_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);`;

const UPSERT_PG = `INSERT INTO app_state (id, data, updated_at) VALUES (1, $1, $2)
  ON CONFLICT (id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`;

const UPSERT_SQLITE = `INSERT INTO app_state (id, data, updated_at) VALUES (1, ?, ?)
  ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`;

/* -------------------------------- Postgres -------------------------------- */

const sql = REMOTE_URL ? neon(REMOTE_URL) : null;
let schemaReady: Promise<unknown> | null = null;

function ensureSchema() {
  if (!schemaReady) schemaReady = sql!.query(SCHEMA);
  return schemaReady.catch((err) => {
    schemaReady = null;
    throw err;
  });
}

/* ------------------------------ Local SQLite ------------------------------ */

let db: DatabaseSync | null = null;

function getLocal(): DatabaseSync {
  if (db) return db;
  mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const database = new DatabaseSync(DB_PATH);
  database.exec(`PRAGMA journal_mode = WAL;${SCHEMA}`);
  db = database;
  return db;
}

/* --------------------------------- Public --------------------------------- */

export async function readState(): Promise<AppState | null> {
  try {
    if (sql) {
      await ensureSchema();
      const rows = (await sql.query("SELECT data FROM app_state WHERE id = 1")) as { data?: string }[];
      return rows[0]?.data ? (JSON.parse(String(rows[0].data)) as AppState) : null;
    }

    const row = getLocal().prepare("SELECT data FROM app_state WHERE id = 1").get() as { data: string } | undefined;
    return row ? (JSON.parse(row.data) as AppState) : null;
  } catch (err) {
    console.error("Could not read the database", err);
    return null;
  }
}

export async function writeState(state: AppState): Promise<void> {
  const data = JSON.stringify(state);
  const updatedAt = new Date().toISOString();

  if (sql) {
    await ensureSchema();
    await sql.query(UPSERT_PG, [data, updatedAt]);
    return;
  }

  getLocal().prepare(UPSERT_SQLITE).run(data, updatedAt);
}
