const pad = (n: number) => String(n).padStart(2, "0");

export function todayISO(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function shiftISO(days: number, from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return todayISO(d);
}

export function prettyDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function dayLabel(iso: string): string {
  if (!iso) return "";
  if (iso === todayISO()) return "Today";
  if (iso === shiftISO(-1)) return "Yesterday";
  if (iso === shiftISO(1)) return "Tomorrow";
  return prettyDate(iso);
}

/** Local Date for an ISO date + HH:MM time, or null when either is missing. */
export function localDateTime(iso: string, time: string): Date | null {
  if (!iso || !time) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const date = new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function money(n: number): string {
  return (Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function num(n: unknown): number {
  const v = typeof n === "number" ? n : parseFloat(String(n ?? ""));
  return Number.isFinite(v) ? v : 0;
}

export function greeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
