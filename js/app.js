import { subscribe } from "./store.js";
import { $, $$ } from "./ui.js";
import { startTicker, notifyState, requestPermission } from "./notifications.js";

import * as today from "./dashboard.js";
import * as office from "./office.js";
import * as gym from "./gym.js";
import * as nutrition from "./nutrition.js";
import * as money from "./investments.js";
import * as reminders from "./reminders.js";

const TABS = { today, office, gym, nutrition, money, reminders };
const DEFAULT_TAB = "today";

let currentTab = null;

function tabFromHash() {
  const id = location.hash.replace("#", "");
  return TABS[id] ? id : DEFAULT_TAB;
}

function render() {
  const id = tabFromHash();
  if (id !== currentTab) {
    currentTab = id;
    const view = $("#view");
    view.innerHTML = "";
    view.scrollTop = 0;
    window.scrollTo({ top: 0 });
  }
  TABS[id].render($("#view"));
  $$(".tabbar a").forEach((a) => a.classList.toggle("active", a.dataset.tab === id));
}

window.addEventListener("hashchange", render);
subscribe(render);

/* Service worker: offline cache + notifications */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch((err) => console.warn("SW failed", err));
}

/* Install prompt */
let installEvent = null;
const installBtn = $("#install-btn");
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installEvent = event;
  installBtn.classList.remove("hidden");
});
installBtn.addEventListener("click", async () => {
  if (!installEvent) return;
  installEvent.prompt();
  await installEvent.userChoice;
  installEvent = null;
  installBtn.classList.add("hidden");
});

/* Notification bell */
const notifyBtn = $("#notify-btn");
function paintNotifyBtn() {
  const s = notifyState();
  notifyBtn.textContent = s.granted ? "🔔" : "🔕";
  notifyBtn.title = s.granted ? "Notifications on" : "Tap to enable notifications";
  notifyBtn.style.opacity = s.granted ? "1" : "0.55";
}
notifyBtn.addEventListener("click", async () => {
  const result = await requestPermission();
  paintNotifyBtn();
  if (!result.granted && result.reason) alert(result.reason);
});
paintNotifyBtn();

startTicker(render);
render();
