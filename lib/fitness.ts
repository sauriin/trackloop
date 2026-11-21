/** How many workouts count as a good week. */
export const WEEKLY_WORKOUT_GOAL = 3;

/** Local calendar day as `YYYY-MM-DD` (not UTC, so late evenings stay on today). */
export function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

/** Monday-based week that contains `date`. */
export function weekRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: dateKey(start), end: dateKey(end) };
}

export function formatDateKey(key: string) {
  return parseDateKey(key).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatWeekRange(start: string, end: string) {
  return `${parseDateKey(start).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })} – ${parseDateKey(end).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })}`;
}
