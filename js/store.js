const KEY = "trackloop.v1";

const DEFAULTS = {
  version: 1,
  goals: { calories: 2200, protein: 140, carbs: 240, fat: 70 },
  office: [],
  gym: [],
  food: [],
  holdings: [],
  reminders: [],
  notified: {},
};

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULTS);
    const saved = JSON.parse(raw);
    return { ...structuredClone(DEFAULTS), ...saved, goals: { ...DEFAULTS.goals, ...(saved.goals || {}) } };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

export function state_() {
  return state;
}

export function uid() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

/** Mutate state, persist, and notify listeners. */
export function update(mutator) {
  mutator(state);
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Could not save", err);
  }
  listeners.forEach((fn) => fn(state));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/* ---------- date helpers (all local time, ISO yyyy-mm-dd) ---------- */

export function todayISO(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function shiftISO(days, from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return todayISO(d);
}

export function prettyDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function dayLabel(iso) {
  if (iso === todayISO()) return "Today";
  if (iso === shiftISO(-1)) return "Yesterday";
  if (iso === shiftISO(1)) return "Tomorrow";
  return prettyDate(iso);
}

export function localDateTime(iso, time) {
  if (!iso || !time) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

export function timeAgo(date) {
  const diff = Date.now() - date.getTime();
  const mins = Math.round(diff / 60000);
  if (Math.abs(mins) < 60) return mins <= 0 ? "now" : `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (Math.abs(hours) < 24) return hours <= 0 ? "now" : `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function money(n) {
  const v = Number(n) || 0;
  return v.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function num(n) {
  return Number(n) || 0;
}
