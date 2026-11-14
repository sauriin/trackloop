import { state_, update, uid, todayISO } from "./store.js";
import { esc, $$, empty, onSubmit } from "./ui.js";
import { nextOccurrence, notifyState, requestPermission, show, checkDue } from "./notifications.js";

const REPEATS = [
  { value: "none", label: "Once" },
  { value: "daily", label: "Every day" },
  { value: "weekly", label: "Every week" },
];

export function render(root) {
  const now = new Date();
  const st = notifyState();

  const list = state_()
    .reminders.map((r) => ({ ...r, next: nextOccurrence(r, now) }))
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      if (!a.next) return 1;
      if (!b.next) return -1;
      return a.next - b.next;
    });

  root.innerHTML = `
    <section class="card">
      <div class="card-head">
        <h2>Reminders</h2>
        <span class="muted">${list.filter((r) => !r.done).length} active</span>
      </div>
      <form class="add" id="rem-add">
        <input name="title" placeholder="Remind me to…" required />
        <div class="grid-2">
          <div class="field">
            <label for="rem-date">Date</label>
            <input id="rem-date" name="date" type="date" value="${todayISO()}" required />
          </div>
          <div class="field">
            <label for="rem-time">Time</label>
            <input id="rem-time" name="time" type="time" value="09:00" required />
          </div>
        </div>
        <div class="row">
          <select name="repeat" class="grow">${REPEATS.map((r) => `<option value="${r.value}">${r.label}</option>`).join("")}</select>
          <button class="btn primary" type="submit">Add</button>
        </div>
      </form>
    </section>

    <section class="card">
      <div class="card-head"><h3>Notifications</h3></div>
      <p class="muted small" style="margin-top:0">
        ${st.granted
          ? "Notifications are on. You'll get an alert when a reminder is due."
          : st.supported
            ? "Notifications are off. Turn them on so reminders reach your phone."
            : "This browser doesn't expose notifications. On iPhone, install the app to the Home Screen (iOS 16.4+) and open it from there."}
      </p>
      <div class="row wrap">
        ${
          st.granted
            ? `<button class="btn small" id="test-notify">Send test notification</button>`
            : `<button class="btn small primary" id="enable-notify">Enable notifications</button>`
        }
        <button class="btn small ghost" id="check-now">Check due now</button>
      </div>
      <p class="muted small" style="margin-bottom:0">
        Alerts fire while TrackLoop is open or installed in the background. Reliable push while the app is fully closed
        needs a server — see the README for how to add one.
      </p>
    </section>

    <section class="card">
      <div class="card-head"><h3>Scheduled</h3><span class="muted">${list.length}</span></div>
      ${
        list.length
          ? `<ul class="list">${list
              .map(
                (r) => `<li class="item ${r.done ? "done" : ""}">
                  <input class="check" type="checkbox" data-id="${esc(r.id)}" ${r.done ? "checked" : ""} aria-label="Mark reminder done" />
                  <div class="grow">
                    <div class="title">${esc(r.title)}</div>
                    <div class="meta">${
                      r.next
                        ? esc(
                            r.next.toLocaleString(undefined, {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              hour: "numeric",
                              minute: "2-digit",
                            })
                          )
                        : "No schedule"
                    }${r.repeat !== "none" ? ` · ${r.repeat}` : ""}</div>
                  </div>
                  <button class="x" data-del="${esc(r.id)}" aria-label="Delete reminder">✕</button>
                </li>`
              )
              .join("")}</ul>`
          : empty("No reminders yet — add one above.")
      }
    </section>
  `;

  onSubmit(root, "#rem-add", (data) => {
    update((s) => {
      s.reminders.unshift({
        id: uid(),
        title: String(data.title).trim(),
        date: data.date || todayISO(),
        time: data.time || "09:00",
        repeat: data.repeat || "none",
        done: false,
        lastFired: null,
      });
    });
  });

  const enable = root.querySelector("#enable-notify");
  if (enable)
    enable.addEventListener("click", async () => {
      const result = await requestPermission();
      if (!result.granted) {
        alert(result.reason || "Notifications are still off.");
        return;
      }
      await show("Notifications enabled 🎉", "TrackLoop will alert you when a reminder is due.", "trackloop-welcome");
      render(root);
    });

  const test = root.querySelector("#test-notify");
  if (test)
    test.addEventListener("click", () => {
      show("Test reminder ⏰", "If you can see this, notifications work.", "trackloop-test");
    });

  root.querySelector("#check-now").addEventListener("click", () => {
    const fired = checkDue();
    if (!fired) alert("Nothing is due right now.");
  });

  $$(".check", root).forEach((box) => {
    box.addEventListener("change", () => {
      update((s) => {
        const r = s.reminders.find((x) => x.id === box.dataset.id);
        if (!r) return;
        r.done = box.checked;
        if (!box.checked) r.lastFired = null;
      });
    });
  });

  $$("[data-del]", root).forEach((btn) => {
    btn.addEventListener("click", () => {
      update((s) => {
        s.reminders = s.reminders.filter((r) => r.id !== btn.dataset.del);
      });
    });
  });
}
