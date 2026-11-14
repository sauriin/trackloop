// Peek inside the local SQLite database.
//   npm run db          -> every saved record, section by section
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
const list = (value) => (Array.isArray(value) ? value : []);
const money = (n) => {
  const value = Number(n || 0);
  return `${value < 0 ? "-" : ""}$${Math.abs(value).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
};
const pad = (text, width) => String(text ?? "").padEnd(width).slice(0, width);

function section(title, rows, header, toLine) {
  console.log("");
  console.log(`${title} — ${rows.length}`);
  if (!rows.length) {
    console.log("  (none)");
    return;
  }
  console.log("  " + header.map(([label, width]) => pad(label, width)).join(" "));
  rows.forEach((item) => console.log("  " + toLine(item).map((cell, i) => pad(cell, header[i][1])).join(" ")));
}

console.log(`Database  ${file}`);
console.log(`Updated   ${row.updated_at}`);
console.log(
  `Totals    ${list(state.office).length} tasks · ${list(state.gym).length} gym · ` +
    `${list(state.food).length} food · ${list(state.holdings).length} holdings · ${list(state.reminders).length} alerts`
);

section("Office tasks", list(state.office), [["✓", 2], ["TITLE", 28], ["PROJECT", 14], ["DUE", 12], ["PRIORITY", 8]], (t) => [
  t.done ? "x" : " ",
  t.title,
  t.project || "-",
  t.due || "-",
  t.priority,
]);

section("Gym sessions", list(state.gym), [["✓", 2], ["DATE", 12], ["NAME", 22], ["FOCUS", 12], ["MIN", 5]], (s) => [
  s.done ? "x" : " ",
  s.date,
  s.name,
  s.focus,
  s.duration,
]);

section("Food", list(state.food), [["DATE", 12], ["MEAL", 10], ["NAME", 24], ["KCAL", 6], ["P/C/F", 12]], (f) => [
  f.date,
  f.meal,
  f.name,
  f.calories || f.protein * 4 + f.carbs * 4 + f.fat * 9,
  `${f.protein}/${f.carbs}/${f.fat}`,
]);

section("Holdings", list(state.holdings), [["NAME", 22], ["TYPE", 12], ["INVESTED", 12], ["CURRENT", 12], ["P/L", 12]], (h) => {
  const profit = Number(h.current || 0) - Number(h.invested || 0);
  return [h.name, h.type, money(h.invested), money(h.current), profit > 0 ? `+${money(profit)}` : money(profit)];
});

section("Reminders", list(state.reminders), [["✓", 2], ["DATE", 12], ["TIME", 6], ["TITLE", 28], ["REPEAT", 8]], (r) => [
  r.done ? "x" : " ",
  r.date,
  r.time,
  r.title,
  r.repeat,
]);

console.log("");
console.log(`Goals     ${state.goals.calories} kcal · ${state.goals.protein}P / ${state.goals.carbs}C / ${state.goals.fat}F`);
