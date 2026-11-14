import { state_, update, uid, todayISO, shiftISO, dayLabel, num } from "./store.js";
import { esc, $$, empty, onSubmit, stat } from "./ui.js";

const FOCUS = ["Push", "Pull", "Legs", "Upper", "Lower", "Cardio", "Full body", "Mobility"];

export function render(root) {
  const today = todayISO();
  const weekStart = shiftISO(-6);
  const sessions = [...state_().gym].sort((a, b) => (a.date < b.date ? 1 : -1));
  const week = sessions.filter((g) => g.date >= weekStart && g.date <= today);
  const minutes = week.reduce((sum, g) => sum + num(g.duration), 0);
  const streak = calcStreak(sessions);

  root.innerHTML = `
    <section class="card">
      <div class="card-head">
        <h2>Gym</h2>
        <span class="muted">${dayLabel(today)}</span>
      </div>
      <div class="stat-grid">
        ${stat("This week", week.length, "sessions")}
        ${stat("Minutes", minutes)}
        ${stat("All time", sessions.length, "sessions")}
        ${stat("Streak", streak, "days")}
      </div>
    </section>

    <section class="card">
      <div class="card-head"><h3>Log a session</h3></div>
      <form class="add" id="gym-add">
        <div class="grid-2">
          <div class="field">
            <label for="gym-date">Date</label>
            <input id="gym-date" name="date" type="date" value="${today}" required />
          </div>
          <div class="field">
            <label for="gym-focus">Focus</label>
            <select id="gym-focus" name="focus">${FOCUS.map((f) => `<option>${f}</option>`).join("")}</select>
          </div>
        </div>
        <input name="name" placeholder="Workout name (e.g. Push day A)" />
        <div class="row">
          <input name="duration" type="number" min="0" step="5" placeholder="Minutes" class="grow" />
          <button class="btn primary" type="submit">Save</button>
        </div>
        <input name="notes" placeholder="Notes: sets, weights, how it felt…" />
      </form>
    </section>

    <section class="card">
      <div class="card-head"><h3>History</h3><span class="muted">${sessions.length}</span></div>
      ${
        sessions.length
          ? `<ul class="list">${sessions
              .slice(0, 30)
              .map(
                (g) => `<li class="item ${g.done ? "done" : ""}">
                  <input class="check" type="checkbox" data-id="${esc(g.id)}" ${g.done ? "checked" : ""} aria-label="Mark session done" />
                  <div class="grow">
                    <div class="title">${esc(g.name || `${g.focus} day`)}</div>
                    <div class="meta">${esc(dayLabel(g.date))} · ${esc(g.focus || "—")}${g.duration ? ` · ${esc(g.duration)} min` : ""}${
                      g.notes ? ` · ${esc(g.notes)}` : ""
                    }</div>
                  </div>
                  <button class="x" data-del="${esc(g.id)}" aria-label="Delete session">✕</button>
                </li>`
              )
              .join("")}</ul>`
          : empty("No sessions yet. Log your first one above.")
      }
    </section>
  `;

  onSubmit(root, "#gym-add", (data) => {
    update((s) => {
      s.gym.unshift({
        id: uid(),
        date: data.date || today,
        name: String(data.name || "").trim(),
        focus: data.focus,
        duration: num(data.duration),
        notes: String(data.notes || "").trim(),
        done: data.date === today ? false : true,
      });
    });
  });

  $$(".check", root).forEach((box) => {
    box.addEventListener("change", () => {
      update((s) => {
        const g = s.gym.find((x) => x.id === box.dataset.id);
        if (g) g.done = box.checked;
      });
    });
  });

  $$("[data-del]", root).forEach((btn) => {
    btn.addEventListener("click", () => {
      update((s) => {
        s.gym = s.gym.filter((x) => x.id !== btn.dataset.del);
      });
    });
  });
}

/** Consecutive days with a logged session, counting back from today. */
function calcStreak(sessions) {
  const dates = new Set(sessions.map((g) => g.date));
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    if (dates.has(shiftISO(-i))) streak++;
    else break;
  }
  return streak;
}
