# TrackLoop

A personal daily tracker for **office tasks, gym, nutrition (calories + macros), investments and reminders** — built with Next.js 16 (App Router), React 19, TypeScript and Tailwind CSS 4. Data lives in your browser's `localStorage`, so there is no sign-up, no backend and no database to run.

## Features

- **Today** — one combined list of due tasks, planned workouts and reminders, quick-add, plus calories / protein / portfolio summaries.
- **Office** — tasks with project, priority, due date, done state and open/done/all filters.
- **Gym** — sessions with focus, duration and notes; weekly count, minutes and current streak.
- **Nutrition** — per-day food log with automatic calorie calculation from macros, macro progress bars and editable daily goals.
- **Investments** — holdings with invested vs current value, live P/L, allocation by asset type, inline value updates.
- **Reminders** — one-off, daily or weekly alerts with browser notifications.
- **PWA** — installable on phone and desktop, offline app shell via service worker, dark UI with a bottom tab bar.

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts:

```bash
npm run build      # production build
npm run start      # serve the production build
npm run typecheck  # tsc --noEmit
npm run db         # print what is saved in data/trackloop.db (-- --raw for JSON)
```

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, **Add New → Project**, import the repo, keep the detected **Next.js** preset and click **Deploy**.
3. No environment variables are required.

`vercel.json` pins the **Next.js** framework preset so deployments cannot fall back to a static preset (which serves a Vercel 404). `package.json` requires Node `>=22.13.0` because `node:sqlite` is unflagged from that version.

**The local database does not work on Vercel.** Serverless functions have a read-only, ephemeral filesystem, so `/api/state` will refuse writes there and the app falls back to saving in that browser's `localStorage` (an error toast appears the first time a change cannot be stored). To keep data in a real database on Vercel you need a hosted one (Postgres, Turso/libSQL, …). SQLite is meant for self-hosting with `next start` and a persistent disk, where it works exactly as described below.

The PWA side is deployment-friendly: `app/manifest.ts` + `public/sw.js` provide the installable app.

## Install on your phone

- **Android / Chrome**: open the deployed URL → menu **⋮ → Add to Home screen / Install app**.
- **iPhone / Safari** (iOS 16.4+): open the URL → **Share → Add to Home Screen**, then open TrackLoop from the Home Screen icon. Notifications only work in the installed app.

The header shows an install button when the browser offers an install prompt.

## Notifications — how far they go

TrackLoop checks reminders every 20 seconds while the app is open (and again when it regains focus). Tapping the 🔔 in the header asks for permission; **Alerts** also has a test notification button.

- Alerts fire reliably while the app is open.
- An installed PWA can keep running in the background for a while, but browsers may suspend it.
- **Guaranteed** delivery when the app is fully closed needs a server with Web Push (VAPID keys, a subscription store and a scheduled job). That would add a backend; it is intentionally out of scope here.

## Data & privacy

Everything is stored in a local SQLite database at `data/trackloop.db` (git-ignored), accessed through `/api/state` on the same machine. `localStorage` is only an offline cache of the latest state, and existing browser data is migrated into SQLite on first load. Nothing leaves your machine.

To reset everything, stop the app and delete `data/trackloop.db`; the browser cache is replaced on the next save.

## Project structure

```
app/
  layout.tsx        root layout, metadata, PWA meta
  globals.css       Tailwind 4 theme tokens + component classes
  manifest.ts       web app manifest (/manifest.webmanifest)
  page.tsx          Today
  office|gym|nutrition|money|alerts/page.tsx
  api/state/route.ts  GET/PUT the local database state
components/
  app-shell.tsx     header, bottom nav, SW registration, reminder ticker
  dashboard.tsx     Today screen
  office.tsx gym.tsx nutrition.tsx money.tsx alerts.tsx
  ui.tsx            card / stat / progress / pill primitives
lib/
  types.ts          shared data model
  store.ts          store + useAppState() (SQLite API with browser cache)
  db.ts             local SQLite database (node:sqlite, server-only)
  derive.ts         totals, portfolio, streak, today's open items
  dates.ts          local-time date and number helpers
  notifications.ts  occurrence math, permission, due-reminder ticker
public/
  sw.js             service worker (offline shell + notification display)
  icons/            PNG icons (192, 512, maskable, Apple touch)
```
