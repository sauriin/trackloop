import { state_, update, uid, todayISO, dayLabel, prettyDate, money } from "./store.js";
import { esc, $, $$, bar, stat, empty, onSubmit } from "./ui.js";
import { dayTotals } from "./nutrition.js";
import { portfolio } from "./investments.js";

const KIND_LABEL = { office: "Task", gym: "Gym", reminder: "Reminder" };

function openItems() {
  const s = state_();
  const today = todayISO();
  const items = [];

  for (const t of s.office) {
    if (t.done) continue;
    if (t.due && t.due > today) continue; // future tasks live on the Office tab
    items.push({
      kind: "office",
      id: t.id,
      title: t.title,
      meta: [t.project, t.due ? `${dayLabel(t.due)}${t.due < today ? " · overdue" : ""}` : "No due date"]
        .filter(Boolean)
        .join(" · "),
      tone: t.due && t.due < today ? "hi" : "",
      priority: t.priority,
    });
  }

  for (const g of s.gym) {
    if (g.done || g.date !== today) continue;
    items.push({
      kind: "gym",
      id: g.id,
      title: g.name || "Workout",
      meta: [g.focus, g.duration ? `${g.duration} min` : ""].filter(Boolean).join(" · ") || "Planned today",
      tone: "ok",
    });
  }

  for (const r of s.reminders) {
    if (r.done) continue;
    if (r.repeat !== "none" || r.date === today) {
      items.push({
        kind: "reminder",
        id: r.id,
        title: r.title,
        meta: `${r.time || "any time"}${r.repeat && r.repeat !== "none" ? ` · repeats ${r.repeat}` : ""}`,
        tone: "",
      });
    }
  }

  return items;
}

export function render(root) {
  const s = state_();
  const today = todayISO();
  const food = dayTotals(today);
  const port = portfolio();
  const items = openItems();
  const doneToday =
    s.office.filter((t) => t.done && t.doneAt && t.doneAt.startsWith(today)).length +
    s.gym.filter((g) => g.done && g.date === today).length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const kcalPct = s.goals.calories ? (food.calories / s.goals.calories) * 100 : 0;

  root.innerHTML = `
    <section class="hero">
      <div class="date">${esc(prettyDate(today))}</div>
      <h2>${greeting} 👋</h2>
      <p class="muted small">${items.length} open item${items.length === 1 ? "" : "s"} · ${doneToday} done today</p>
    </section>

    <section class="stat-grid">
      ${stat("Open tasks", items.length, "today")}
      ${stat("Calories", money(food.calories), `/ ${money(s.goals.calories)}`)}
      ${stat("Protein", `${Math.round(food.protein)}g`, `/ ${s.goals.protein}g`)}
      ${stat("Portfolio", money(port.current), `${port.pl >= 0 ? "+" : ""}${money(port.pl)}`)}
    </section>

    <section class="card">
      <div class="card-head">
        <h3>Today's list</h3>
        <span class="muted">${items.length} item${items.length === 1 ? "" : "s"}</span>
      </div>
      ${
        items.length
          ? `<ul class="list">${items
              .map(
                (it) => `<li class="item">
                  <input class="check" type="checkbox" data-kind="${it.kind}" data-id="${esc(it.id)}" aria-label="Mark done" />
                  <div class="grow">
                    <div class="title">${esc(it.title)}</div>
                    <div class="meta">${esc(KIND_LABEL[it.kind])}${it.meta ? ` · ${esc(it.meta)}` : ""}</div>
                  </div>
                  ${it.priority === "high" ? '<span class="pill hi">high</span>' : ""}
                </li>`
              )
              .join("")}</ul>`
          : empty("Nothing open. Add a task below or enjoy the quiet. 🌤️")
      }
      <form class="add" id="quick-add" style="margin-top:12px">
        <div class="row">
          <input name="title" class="grow" placeholder="Quick add a task for today…" required />
          <button class="btn primary" type="submit">Add</button>
        </div>
      </form>
    </section>

    <section class="card">
      <div class="card-head">
        <h3>Fuel &amp; money</h3>
        <a class="muted small" href="#nutrition">Details →</a>
      </div>
      <div class="macro">
        <div class="row between"><span class="muted">Calories</span><span>${money(food.calories)} / ${money(s.goals.calories)}</span></div>
        ${bar(kcalPct, kcalPct > 110 ? "var(--warn)" : "")}
        <div class="row between small" style="margin-top:6px">
          <span>P ${Math.round(food.protein)}g</span>
          <span>C ${Math.round(food.carbs)}g</span>
          <span>F ${Math.round(food.fat)}g</span>
        </div>
      </div>
      <div class="row between" style="margin-top:14px">
        <div>
          <div class="muted small">Invested → current</div>
          <div><strong>${money(port.invested)}</strong> → <strong>${money(port.current)}</strong></div>
        </div>
        <span class="pill ${port.pl >= 0 ? "ok" : "hi"}">${port.pl >= 0 ? "+" : ""}${port.plPct.toFixed(1)}%</span>
      </div>
    </section>
  `;

  $$(".check", root).forEach((box) => {
    box.addEventListener("change", () => complete(box.dataset.kind, box.dataset.id));
  });

  onSubmit(root, "#quick-add", (data) => {
    const title = String(data.title || "").trim();
    if (!title) return false;
    update((st) => {
      st.office.unshift({
        id: uid(),
        title,
        project: "",
        priority: "normal",
        due: todayISO(),
        done: false,
        createdAt: new Date().toISOString(),
      });
    });
  });
}


function complete(kind, id) {
  update((s) => {
    if (kind === "office") {
      const t = s.office.find((x) => x.id === id);
      if (t) {
        t.done = true;
        t.doneAt = new Date().toISOString();
      }
    } else if (kind === "gym") {
      const g = s.gym.find((x) => x.id === id);
      if (g) g.done = true;
    } else if (kind === "reminder") {
      const r = s.reminders.find((x) => x.id === id);
      if (r) {
        if (r.repeat && r.repeat !== "none") {
          r.lastFired = null; // fires again on the next occurrence
        } else {
          r.done = true;
        }
      }
    }
  });
}
