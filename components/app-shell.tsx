"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  BellOff,
  Briefcase,
  CalendarCheck,
  Download,
  Dumbbell,
  Salad,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { prettyDate, todayISO } from "@/lib/dates";
import { checkDueReminders, requestPermission, showNotification } from "@/lib/notifications";
import { Toaster } from "./toaster";

const NAV = [
  { href: "/", label: "Today", icon: CalendarCheck, tint: "#ff7a4d", tagline: "One loop at a time." },
  { href: "/office", label: "Office", icon: Briefcase, tint: "#a78bfa", tagline: "Clear the deck, ship the work." },
  { href: "/gym", label: "Gym", icon: Dumbbell, tint: "#4ade80", tagline: "Show up. Lift. Repeat." },
  { href: "/nutrition", label: "Food", icon: Salad, tint: "#2dd4bf", tagline: "Fuel the work." },
  { href: "/money", label: "Money", icon: TrendingUp, tint: "#fbbf24", tagline: "Let it compound." },
  { href: "/alerts", label: "Alerts", icon: Bell, tint: "#f472b6", tagline: "Never miss a beat." },
] as const;

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function tint(value: string, amount: number) {
  return `color-mix(in srgb, ${value} ${amount}%, transparent)`;
}

function Logo() {
  return (
    <Link href="/" className="flex min-w-0 items-center gap-2.5">
      <span className="grid h-9 w-9 flex-none place-items-center rounded-xl border border-accent/35 bg-[linear-gradient(150deg,rgba(255,176,138,0.25),rgba(232,121,249,0.12))] shadow-[0_8px_22px_-12px_rgba(255,90,43,0.85)]">
        <svg viewBox="0 0 512 512" width="22" height="22" fill="none" aria-hidden="true">
          <circle
            cx="256"
            cy="256"
            r="150"
            stroke="#ff8a5c"
            strokeWidth="34"
            strokeLinecap="round"
            strokeDasharray="760 190"
            transform="rotate(-90 256 256)"
          />
          <path
            d="M206 260l34 34 70-74"
            stroke="#1a0c14"
            strokeWidth="34"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="min-w-0">
        <span className="block text-base font-semibold leading-tight tracking-tight">TrackLoop</span>
        <span className="hidden text-[10.5px] uppercase tracking-wider text-muted sm:block">tasks · gym · food · money</span>
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [granted, setGranted] = useState(false);

  const current = NAV.find((item) => isActive(pathname, item.href)) ?? NAV[0];
  const CurrentIcon = current.icon;

  // Service worker: offline shell + notification display.
  // In development a cached worker keeps serving pre-edit chunks, which breaks
  // hydration and turns form submits into native GET navigations. Keep dev
  // worker-free; production still registers the offline worker.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
        .then(() => caches.keys())
        .then((keys) => Promise.all(keys.filter((key) => key.startsWith("trackloop-")).map((key) => caches.delete(key))))
        .catch((err) => console.warn("SW cleanup failed", err));
      return;
    }
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

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  }

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
      <Toaster />
      {/* Desktop sidebar */}
      <aside className="hidden border-r border-line bg-[linear-gradient(180deg,rgba(24,18,39,0.9),rgba(11,8,18,0.92))] lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:gap-7 lg:px-4 lg:py-6 lg:backdrop-blur-xl">
        <div className="px-1.5">
          <Logo />
        </div>

        <nav aria-label="Sections" className="grid content-start gap-1">
          <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted/80">Workspace</p>
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                data-active={active}
                aria-current={active ? "page" : undefined}
                className="nav-link"
                style={{ "--tint": item.tint } as React.CSSProperties}
              >
                <Icon size={18} strokeWidth={2} aria-hidden="true" />
                {item.label}
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
              </Link>
            );
          })}
        </nav>

        <div className="relative mt-auto overflow-hidden rounded-2xl border border-accent/25 bg-[linear-gradient(155deg,rgba(255,122,77,0.16),rgba(232,121,249,0.07))] p-3.5">
          <div className="absolute -right-8 -top-10 h-24 w-24 rounded-full bg-accent/20 blur-2xl" aria-hidden="true" />
          <p className="relative flex items-center gap-1.5 text-[12.5px] font-semibold">
            <Sparkles size={14} className="text-accent-soft" aria-hidden="true" />
            Keep the loop going
          </p>
          <p className="relative mt-1 text-[11.5px] leading-snug text-muted">
            {granted ? "Reminders will ping you when they are due." : "Turn on alerts so nothing slips past."}
          </p>
          <button type="button" onClick={enableNotifications} className={`btn btn-sm relative mt-2.5 w-full ${granted ? "btn-active" : "btn-primary"}`}>
            {granted ? <Bell size={15} aria-hidden="true" /> : <BellOff size={15} aria-hidden="true" />}
            {granted ? "Alerts on" : "Enable alerts"}
          </button>
          {installEvent && (
            <button type="button" onClick={install} className="btn btn-ghost btn-sm relative mt-1.5 w-full">
              <Download size={15} aria-hidden="true" />
              Install app
            </button>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Top bar: brand on mobile, section title on desktop */}
        <header className="sticky top-0 z-20 border-b border-line bg-bg/80 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 lg:px-8 lg:py-3">
            <div className="min-w-0 lg:hidden">
              <Logo />
            </div>

            <div className="hidden min-w-0 lg:block">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_2px_rgba(255,122,77,0.5)]" aria-hidden="true" />
                TrackLoop / {current.label}
              </p>
              <h1 className="mt-0.5 truncate text-[20px] font-semibold leading-tight tracking-tight">{current.tagline}</h1>
            </div>

            <div className="flex flex-none items-center gap-2">
              <span className="hidden text-[12px] text-muted xl:block" suppressHydrationWarning>
                {prettyDate(todayISO())}
              </span>
              <button
                type="button"
                onClick={enableNotifications}
                aria-label="Enable notifications"
                title={granted ? "Notifications on" : "Tap to enable notifications"}
                className={`grid h-9 w-9 cursor-pointer place-items-center rounded-xl border transition active:scale-95 ${
                  granted ? "border-accent/40 bg-accent/15 text-accent-soft" : "border-line-strong bg-surface text-muted hover:text-ink"
                }`}
              >
                {granted ? <Bell size={17} aria-hidden="true" /> : <BellOff size={17} aria-hidden="true" />}
              </button>
              {installEvent && (
                <button
                  type="button"
                  onClick={install}
                  aria-label="Install app"
                  title="Install app"
                  className="grid h-9 w-9 cursor-pointer place-items-center rounded-xl border border-accent/40 bg-accent/15 text-accent-soft transition active:scale-95"
                >
                  <Download size={17} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto grid w-full max-w-[1120px] flex-1 content-start gap-3.5 px-4 pb-28 pt-4 lg:gap-4 lg:px-8 lg:pb-12 lg:pt-6">
          {/* Mobile section intro (desktop shows it in the top bar) */}
          {pathname !== "/" && (
            <section className="flex items-center gap-3 lg:hidden">
              <span
                className="grid h-11 w-11 flex-none place-items-center rounded-2xl border"
                style={{
                  color: current.tint,
                  borderColor: tint(current.tint, 35),
                  background: tint(current.tint, 14),
                }}
              >
                <CurrentIcon size={20} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{current.label}</p>
                <h1 className="mt-0.5 text-[21px] font-semibold leading-tight tracking-tight">{current.tagline}</h1>
              </div>
            </section>
          )}

          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Sections"
        className="fixed inset-x-2.5 bottom-[calc(10px+env(safe-area-inset-bottom))] z-30 mx-auto grid max-w-[720px] grid-cols-6 gap-0.5 rounded-[22px] border border-line-strong bg-[#130f1f]/92 p-1.5 shadow-[0_18px_44px_-20px_rgba(0,0,0,0.95)] backdrop-blur-xl lg:hidden"
      >
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              data-active={active}
              aria-current={active ? "page" : undefined}
              className="tab-link"
              style={{ "--tint": item.tint } as React.CSSProperties}
            >
              <Icon size={19} strokeWidth={2} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
