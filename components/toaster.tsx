"use client";

import { useSyncExternalStore } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { dismissToast, getServerToasts, getToasts, subscribeToasts, type ToastTone } from "@/lib/toast";

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info } as const;

const TONES: Record<ToastTone, { card: string; icon: string }> = {
  success: { card: "border-accent/40 bg-[#211424]/95", icon: "text-accent-soft" },
  error: { card: "border-red/45 bg-[#26131d]/95", icon: "text-red" },
  info: { card: "border-sky/40 bg-[#111a26]/95", icon: "text-sky" },
};

export function Toaster() {
  const items = useSyncExternalStore(subscribeToasts, getToasts, getServerToasts);

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+64px)] z-50 flex flex-col items-center gap-2 px-4 lg:top-[68px]"
    >
      {items.map((item) => {
        const Icon = ICONS[item.tone];
        const tone = TONES[item.tone];
        return (
          <div
            key={item.id}
            role="status"
            className={`toast pointer-events-auto flex w-fit max-w-full items-center gap-2 rounded-xl border px-3.5 py-2.5 text-[13px] font-medium shadow-[0_18px_36px_-18px_rgba(0,0,0,0.9)] backdrop-blur-xl ${tone.card}`}
          >
            <Icon size={16} className={`flex-none ${tone.icon}`} aria-hidden="true" />
            <span className="min-w-0">{item.message}</span>
            <button
              type="button"
              onClick={() => dismissToast(item.id)}
              aria-label="Dismiss notification"
              className="grid h-5 w-5 flex-none cursor-pointer place-items-center rounded-md border-0 bg-transparent text-muted transition hover:bg-white/10 hover:text-ink"
            >
              <X size={13} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
