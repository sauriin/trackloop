"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { checkDueReminders, requestPermission, showNotification } from "@/lib/notifications";

const NAV = [
  { href: "/", label: "Today", icon: "🏠" },
  { href: "/office", label: "Office", icon: "🗂️" },
  { href: "/gym", label: "Gym", icon: "🏋️" },
  { href: "/nutrition", label: "Food", icon: "🥗" },
  { href: "/money", label: "Money", icon: "📈" },
  { href: "/alerts", label: "Alerts", icon: "⏰" },
] as const;

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [granted, setGranted] = useState(false);

  // Service worker: offline shell + notification display.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((err) => console.warn("SW registration failed", err));
  }, []);

  // Reminder ticker: every 20s while the app is open, plus when it regains focus.
  useEffect(() => {
    const run = () => checkDueReminders();
    const initial = window.setTimeout(run, 1500);
    const interval = window.setInterval(run, 20_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") run();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    if (typeof Notification !== "undefined") setGranted(Notification.permission === "granted");
  }, []);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  async function enableNotifications() {
    const result = await requestPermission();
    setGranted(result.granted);
    if (!result.granted) {
      if (result.reason) window.alert(result.reason);
      return;
    }
    await showNotification("Notifications enabled 🎉", "TrackLoop will alert you when a reminder is due.", "trackloop-welcome");
  }

  return (
    <>
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line bg-bg/85 px-4 pb-2.5 pt-3 backdrop-blur-xl">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-9 w-9 flex-none place-items-center rounded-xl border border-green/30 bg-green/15 shadow-[0_6px_18px_-10px_rgba(74,222,128,0.6)]">
            <svg viewBox="0 0 512 512" width="22" height="22" fill="none" aria-hidden="true">
              <circle
                cx="256"
                cy="256"
                r="150"
                stroke="#4ade80"
                strokeWidth="34"
                strokeLinecap="round"
                strokeDasharray="760 190"
                transform="rotate(-90 256 256)"
              />
              <path
                d="M206 260l34 34 70-74"
                stroke="#0a0e14"
                strokeWidth="34"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="min-w-0">
            <span className="block text-base font-semibold leading-tight tracking-tight">TrackLoop</span>
            <span className="block text-[10.5px] uppercase tracking-wider text-muted">tasks · gym · food · money</span>
          </span>
        </Link>

        <div className="flex flex-none gap-2">
          <button
            type="button"
            onClick={enableNotifications}
            aria-label="Enable notifications"
            title={granted ? "Notifications on" : "Tap to enable notifications"}
            className={`grid h-10 w-10 cursor-pointer place-items-center rounded-[13px] border text-base transition active:scale-95 ${
              granted ? "border-green/40 bg-green/15" : "border-line-strong bg-surface opacity-70"
            }`}
          >
            {granted ? "🔔" : "🔕"}
          </button>
          {installEvent && (
            <button
              type="button"
              onClick={async () => {
                await installEvent.prompt();
                await installEvent.userChoice;
                setInstallEvent(null);
              }}
              aria-label="Install app"
              title="Install app"
              className="grid h-10 w-10 cursor-pointer place-items-center rounded-[13px] border border-green/40 bg-green/15 text-base transition active:scale-95"
            >
              ⬇
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[760px] gap-3.5 px-4 pt-3.5">{children}</main>

      <nav
        aria-label="Sections"
        className="fixed inset-x-2.5 bottom-[calc(10px+env(safe-area-inset-bottom))] z-30 mx-auto grid max-w-[720px] grid-cols-6 gap-0.5 rounded-[22px] border border-line-strong bg-[#11171f]/92 p-1.5 shadow-[0_18px_44px_-20px_rgba(0,0,0,0.95)] backdrop-blur-xl"
      >
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              data-active={active}
              aria-current={active ? "page" : undefined}
              className="tab-link"
            >
              <span className="text-lg leading-none">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
