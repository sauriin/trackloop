# TrackLoop

A single mobile-first tracker for **office tasks, gym, nutrition (calories/protein/carbs/fat), investments and reminders** — with a daily dashboard and phone notifications.

Pure static web app: HTML + CSS + ES modules. No build step, no backend, no accounts, no package install. Install it to your phone's home screen, use it offline, and your data stays in the browser's local storage.

## Features

| Screen | What it does |
| --- | --- |
| **Today** | Greeting, open-item count, everything due today (office + gym + reminders) in one checkable list, quick-add, calories/protein progress, portfolio value. |
| **Office** | Tasks with project, priority and due date; open/done/all filters; overdue highlighting. |
| **Gym** | Log sessions (focus, duration, notes), weekly sessions, weekly minutes, day streak, history. |
| **Food** | Per-day log of protein/carbs/fat (calories auto-calculated when blank), calorie and macro bars against editable daily goals, day navigation. |
| **Money** | Holdings with invested vs. current value, total P/L and %, allocation by type, inline value updates. |
| **Alerts** | One-off, daily and weekly reminders, notification permission controls and a test notification. |

## Deploy to Vercel

The repo is already Vercel-ready (`vercel.json` sets service-worker and icon cache headers). Pick one:

**A. Import the repo (recommended)**
1. Push this repo to GitHub.
2. vercel.com → **Add New… → Project** → import the repo.
3. Framework preset: **Other**. Build command: **empty**. Output directory: **`.`** (root). → **Deploy**.

**B. From the terminal**
```bash
npx vercel          # preview URL
npx vercel --prod   # production URL
```

Either way you get an `https://<project>.vercel.app` URL. HTTPS is required for the installable app and for notifications, and Vercel provides it automatically.

> GitHub Pages works too: Settings → Pages → Deploy from branch → `main` / root.

## Install it on your phone

1. Open your deployed URL (or `http://localhost:5173` for local testing) on the phone.
2. **Android / Chrome:** menu → **Install app** (or the ⬇ button in the header).
   **iPhone / Safari:** Share → **Add to Home Screen**.
3. Launch it from the home screen — it opens full-screen without browser chrome.
4. Tap **🔔** and allow notifications.

## Run locally

ES modules and service workers need an HTTP origin, so double-clicking `index.html` will not work.

```bash
npx serve . -l 5173
# open http://localhost:5173
```

Any static server is fine (`npx http-server`, VS Code Live Server, etc.).

## About notifications

Reminders are checked in the browser:

- while the app is open (foreground or background tab) it checks every 20 seconds;
- when installed, the service worker shows the alert, so it lands on your lock screen;
- "Check due now" forces a check, and reminders up to 12 hours late still fire.

A static app cannot wake you when it has been fully closed for a long time (iOS suspends web apps). Guaranteed background push needs a server that sends Web Push messages to a subscription — deliberately left out so this deploys anywhere for free in one step.

## Data

Everything lives under the `trackloop.v1` key in `localStorage`:

```js
{ version, goals, office[], gym[], food[], holdings[], reminders[], notified }
```

Data is per-browser and per-device; clearing site data clears the tracker. Export/import is not built in yet.

## Project layout

```
index.html              app shell, logo and tab bar
styles.css              design system, mobile-first dark theme
manifest.webmanifest    PWA metadata (standalone, icons, theme)
vercel.json             static deploy + cache headers
sw.js                   offline cache + notification display
icon.svg                vector mark
icons/                  PNG app icons (192, 512, maskable, Apple 180)
js/app.js               router, install prompt, notification bell
js/store.js             state, persistence, date/number helpers
js/ui.js                tiny DOM helpers
js/dashboard.js         Today screen
js/office.js            office tasks
js/gym.js               gym sessions
js/nutrition.js         food log + goals
js/investments.js       portfolio
js/reminders.js         reminders screen
js/notifications.js     permissions, occurrences, reminder ticker
```

## Ideas for later

- JSON export / import for backups, and optional cross-device sync.
- Charts for weight, calories and portfolio over time.
- Recurring gym templates with per-exercise logging.
- Real background push via Web Push + a tiny server.
