// Peek inside the local SQLite database.
//   npm run db          -> summary of what is saved
//   npm run db -- --raw -> the stored JSON exactly as written
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const file = process.env.TRACKLOOP_DB || path.join(process.cwd(), "data", "trackloop.db");
const raw = process.argv.includes("--raw");

let db;
try {
  db = new DatabaseSync(file, { readOnly: true });
} catch {
  console.log(`No database at ${file}`);
  console.log("Open the app and add something first, or check TRACKLOOP_DB.");
  process.exit(0);
}

const row = db.prepare("SELECT id, data, updated_at FROM app_state WHERE id = 1").get();
if (!row) {
  console.log(`Database ${file} exists but is empty — nothing saved yet.`);
  process.exit(0);
}

if (raw) {
  console.log(JSON.stringify(JSON.parse(row.data), null, 2));
  process.exit(0);
}

const state = JSON.parse(row.data);
const count = (list) => (Array.isArray(list) ? list.length : 0);
const done = (list) => (Array.isArray(list) ? list.filter((item) => item.done).length : 0);

console.log(`Database  ${file}`);
console.log(`Row       app_state id=${row.id}`);
console.log(`Updated   ${row.updated_at}`);
console.log("");
console.log(`Office    ${count(state.office)} tasks (${done(state.office)} done)`);
console.log(`Gym       ${count(state.gym)} sessions (${done(state.gym)} done)`);
console.log(`Food      ${count(state.food)} entries`);
console.log(`Money     ${count(state.holdings)} holdings`);
console.log(`Alerts    ${count(state.reminders)} reminders (${done(state.reminders)} done)`);
console.log("");
console.log("Goals     " + JSON.stringify(state.goals));
