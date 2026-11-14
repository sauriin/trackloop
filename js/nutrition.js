import { state_, update, uid, todayISO, shiftISO, dayLabel, num, money } from "./store.js";
import { esc, $$, bar, empty, onSubmit } from "./ui.js";

const MEALS = ["Breakfast", "Lunch", "Dinner", "Snack"];

export function dayTotals(date = todayISO()) {
  const entries = state_().food.filter((f) => f.date === date);
  return entries.reduce(
    (acc, f) => {
      acc.protein += num(f.protein);
      acc.carbs += num(f.carbs);
      acc.fat += num(f.fat);
      acc.calories += num(f.calories) || num(f.protein) * 4 + num(f.carbs) * 4 + num(f.fat) * 9;
      return acc;
    },
    { protein: 0, carbs: 0, fat: 0, calories: 0 }
  );
}

export function render(root, date = null) {
  const current = date || root.dataset.date || todayISO();
  root.dataset.date = current;

  const s = state_();
  const totals = dayTotals(current);
  const entries = s.food.filter((f) => f.date === current);
  const goals = s.goals;
  const left = goals.calories - totals.calories;

  const macro = (label, value, goal, color) => {
    const pct = goal ? (value / goal) * 100 : 0;
    return `<div class="macro" style="margin-top:10px">
      <div class="row between"><span class="muted">${label}</span><span>${Math.round(value)}g <span class="muted">/ ${goal}g</span></span></div>
      ${bar(pct, color)}
    </div>`;
  };

  root.innerHTML = `
    <section class="card">
      <div class="card-head">
        <h2>Nutrition</h2>
        <div class="row" style="gap:6px">
          <button class="btn small ghost" data-day="-1" aria-label="Previous day">‹</button>
          <button class="btn small ghost" data-day="0">Today</button>
          <button class="btn small ghost" data-day="1" aria-label="Next day">›</button>
        </div>
      </div>
      <div class="muted small" style="margin-bottom:8px">${esc(dayLabel(current))}</div>

      <div class="row between">
        <div>
          <div class="muted small">Calories</div>
          <div style="font-size:26px;font-weight:700">${money(totals.calories)}</div>
        </div>
        <div style="text-align:right">
          <div class="muted small">${left >= 0 ? "Remaining" : "Over"}</div>
          <div style="font-size:20px;font-weight:700;color:${left >= 0 ? "var(--accent)" : "var(--danger)"}">
            ${money(Math.abs(left))}
          </div>
        </div>
      </div>
      <div style="margin-top:8px">${bar(goals.calories ? (totals.calories / goals.calories) * 100 : 0)}</div>
      ${macro("Protein", totals.protein, goals.protein, "#38bdf8")}
      ${macro("Carbs", totals.carbs, goals.carbs, "#fbbf24")}
      ${macro("Fat", totals.fat, goals.fat, "#f472b6")}
    </section>

    <section class="card">
      <div class="card-head"><h3>Add food</h3></div>
      <form class="add" id="food-add">
        <div class="grid-2">
          <select name="meal">${MEALS.map((m) => `<option>${m}</option>`).join("")}</select>
          <input name="name" placeholder="Food / meal name" required />
        </div>
        <div class="grid-3">
          <input name="protein" type="number" min="0" step="1" placeholder="Protein g" />
          <input name="carbs" type="number" min="0" step="1" placeholder="Carbs g" />
          <input name="fat" type="number" min="0" step="1" placeholder="Fat g" />
        </div>
        <div class="row">
          <input name="calories" type="number" min="0" step="1" placeholder="Calories (auto if blank)" class="grow" />
          <button class="btn primary" type="submit">Log</button>
        </div>
      </form>
    </section>

    <section class="card">
      <div class="card-head"><h3>Logged</h3><span class="muted">${entries.length} item${entries.length === 1 ? "" : "s"}</span></div>
      ${
        entries.length
          ? `<ul class="list">${entries
              .map((f) => {
                const kcal = num(f.calories) || num(f.protein) * 4 + num(f.carbs) * 4 + num(f.fat) * 9;
                return `<li class="item">
                  <div class="grow">
                    <div class="title">${esc(f.name)}</div>
                    <div class="meta">${esc(f.meal)} · ${esc(kcal)} kcal · P${esc(f.protein || 0)} C${esc(f.carbs || 0)} F${esc(f.fat || 0)}</div>
                  </div>
                  <button class="x" data-del="${esc(f.id)}" aria-label="Delete entry">✕</button>
                </li>`;
              })
              .join("")}</ul>`
          : empty("Nothing logged for this day yet.")
      }
    </section>

    <section class="card">
      <div class="card-head"><h3>Daily goals</h3></div>
      <form class="add" id="goal-form">
        <div class="grid-2">
          <div class="field"><label>Calories</label><input name="calories" type="number" min="0" value="${goals.calories}" /></div>
          <div class="field"><label>Protein g</label><input name="protein" type="number" min="0" value="${goals.protein}" /></div>
          <div class="field"><label>Carbs g</label><input name="carbs" type="number" min="0" value="${goals.carbs}" /></div>
          <div class="field"><label>Fat g</label><input name="fat" type="number" min="0" value="${goals.fat}" /></div>
        </div>
        <button class="btn" type="submit">Save goals</button>
      </form>
    </section>
  `;

  $$("[data-day]", root).forEach((btn) => {
    btn.addEventListener("click", () => {
      const delta = Number(btn.dataset.day);
      const next = delta === 0 ? todayISO() : shiftISO(delta, new Date(`${current}T12:00:00`));
      render(root, next);
    });
  });

  onSubmit(root, "#food-add", (data) => {
    update((st) => {
      st.food.unshift({
        id: uid(),
        date: current,
        meal: data.meal,
        name: String(data.name).trim(),
        protein: num(data.protein),
        carbs: num(data.carbs),
        fat: num(data.fat),
        calories: num(data.calories),
      });
    });
  });

  onSubmit(root, "#goal-form", (data) => {
    update((st) => {
      st.goals = {
        calories: num(data.calories),
        protein: num(data.protein),
        carbs: num(data.carbs),
        fat: num(data.fat),
      };
    });
  });

  $$("[data-del]", root).forEach((btn) => {
    btn.addEventListener("click", () => {
      update((st) => {
        st.food = st.food.filter((f) => f.id !== btn.dataset.del);
      });
    });
  });
}
