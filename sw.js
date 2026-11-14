const CACHE = "trackloop-v1";
const SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.webmanifest",
  "./icon.svg",
  "./js/app.js",
  "./js/store.js",
  "./js/ui.js",
  "./js/notifications.js",
  "./js/dashboard.js",
  "./js/office.js",
  "./js/gym.js",
  "./js/nutrition.js",
  "./js/investments.js",
  "./js/reminders.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Stale-while-revalidate: instant loads, silent updates.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || !req.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

// Lets the page ask the service worker to show a reminder while it is backgrounded.
self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type !== "remind") return;
  self.registration.showNotification(data.title || "Reminder", {
    body: data.body || "",
    icon: "icon.svg",
    badge: "icon.svg",
    tag: data.tag || "trackloop",
    vibrate: [120, 60, 120],
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) return client.focus();
      }
      return self.clients.openWindow("./index.html#reminders");
    })
  );
});
