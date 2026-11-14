/**
 * Tiny toast store shared by actions across the app. Render <Toaster /> once
 * (in the app shell) and call toast() from any client event handler.
 */
export type ToastTone = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

const EMPTY: ToastItem[] = [];
let items: ToastItem[] = EMPTY;
let nextId = 1;
const listeners = new Set<() => void>();
const timers = new Map<number, ReturnType<typeof setTimeout>>();

function emit() {
  listeners.forEach((fn) => fn());
}

export function subscribeToasts(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getToasts(): ToastItem[] {
  return items;
}

export function getServerToasts(): ToastItem[] {
  return EMPTY;
}

export function dismissToast(id: number) {
  const timer = timers.get(id);
  if (timer) clearTimeout(timer);
  timers.delete(id);
  items = items.filter((item) => item.id !== id);
  emit();
}

export function toast(message: string, tone: ToastTone = "success") {
  const id = nextId++;
  items = [...items.slice(-2), { id, message, tone }];
  emit();
  timers.set(
    id,
    setTimeout(() => dismissToast(id), 3200)
  );
}
