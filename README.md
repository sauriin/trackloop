# TrackLoop

A single mobile-first tracker for **office tasks, gym, nutrition (calories/protein/carbs/fat), investments and reminders** — with a daily dashboard and phone notifications.

No build step, no backend, no accounts. It is a static Progressive Web App: install it to your phone's home screen, use it offline, and your data stays in the browser's local storage.

## Features

| Screen | What it does |
| --- | --- |
| **Today** | Greeting, open-item count, all tasks due today (office + gym + reminders) in one list, quick-add, calories/protein progress, portfolio value. |
| **Office** | Tasks with project, priority and due date; open/done/all filters; overdue highlighting. |
| **Gym** | Log sessions (focus, duration, notes), weekly session count, weekly minutes, day streak, history. |
| **Food** | Per-day food log with protein/carbs/fat (calories auto-calculated when left blank), calorie and macro progress bars against editable daily goals, day-by-day navigation. |
| **Money** | Holdings with invested vs. current value, total P/L and %, allocation by type. |
| **Alerts** | One-off, daily and weekly reminders with a time, notification permission controls and a test notification. |

## Run it locally

ES modules and service workers need a real HTTP origin — opening `index.html` from the file system will not work.

```bash
python -m http.server 5173
# then open http://localhost:5173
```

Or with Node: `npx serve .`

## Put it on your phone

1. Push this repo to GitHub.
2. **Settings → Pages → Build and deployment → Deploy from a branch → `main` / root.**
3. Open `https://<user>.github.io/<repo>/` on your phone.
4. **Android/Chrome:** menu → *Install app* (or the ⬇ button in the header).
   **iPhone/Safari:** Share → *Add to Home Screen*.
5. Tap the 🔔 button and allow notifications.

HTTPS is required for both service workers and notifications — GitHub Pages provides it.

## About notifications

Reminders are checked in the browser:

- while the app is open (foreground or background tab), it checks every 20 seconds;
- when it is installed, the service worker shows the alert, so it appears on your lock screen;
- the "Check due now" button forces a check, and reminders up to 12 hours late still fire.

What it **cannot** do as a static app: wake you when the app has been fully closed for a long time. iOS in particular suspends web apps. For guaranteed background push you need a server (or a service like OneSignal/Web Push with a cron) that sends push messages to the subscription. That would mean adding a small backend plus a push subscription in `js/notifications.js` — deliberately left out to keep this deployable on GitHub Pages alone.

## Data

Everything lives under the `trackloop.v1` key in `localStorage`:

```js
{ version, goals, office[], gym[], food[], holdings[], reminders[], notified }
```

It is per-browser, so install the app on the device you want to use. Clearing site data clears the tracker. Export/import is not built in yet.

## Project layout

```
index.html              app shell + tab bar
styles.css              mobile-first dark theme
manifest.webmanifest    PWA metadata
sw.js                   offline cache + notification display
icon.svg                app icon
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

- Export / import JSON backup, and optional cross-device sync (e.g. Supabase).
- Charts for weight, calories and portfolio over time.
- Recurring gym programme templates and per-exercise logging.
- Real background push via Web Push + a tiny server.
