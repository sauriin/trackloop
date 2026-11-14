import { state_, update, uid, num, money } from "./store.js";
import { esc, $$, bar, empty, onSubmit } from "./ui.js";

const TYPES = ["Stocks", "Mutual fund", "ETF", "Crypto", "Gold", "FD / Debt", "Other"];

export function portfolio() {
  const holdings = state_().holdings;
  const invested = holdings.reduce((sum, h) => sum + num(h.invested), 0);
  const current = holdings.reduce((sum, h) => sum + num(h.current), 0);
  const pl = current - invested;
  return { invested, current, pl, plPct: invested ? (pl / invested) * 100 : 0 };
}

export function render(root) {
  const s = state_();
  const port = portfolio();
  const byType = TYPES.map((type) => {
    const items = s.holdings.filter((h) => h.type === type);
    return {
      type,
      value: items.reduce((sum, h) => sum + num(h.current), 0),
    };
  }).filter((t) => t.value > 0);

  const top = [...s.holdings].sort((a, b) => num(b.current) - num(a.current));

  root.innerHTML = `
    <section class="card">
      <div class="card-head">
        <h2>Investments</h2>
        <span class="pill ${port.pl >= 0 ? "ok" : "hi"}">${port.pl >= 0 ? "+" : ""}${port.plPct.toFixed(1)}%</span>
      </div>
      <div class="muted small">Current value</div>
      <div style="font-size:30px;font-weight:750;letter-spacing:-0.02em">${money(port.current)}</div>
      <div class="row between small" style="margin-top:6px">
        <span class="muted">Invested ${money(port.invested)}</span>
        <span style="color:${port.pl >= 0 ? "var(--accent)" : "var(--danger)"}">
          ${port.pl >= 0 ? "▲" : "▼"} ${money(Math.abs(port.pl))}
        </span>
      </div>
    </section>

    <section class="card">
      <div class="card-head"><h3>Allocation</h3></div>
      ${
        byType.length
          ? byType
              .map(
                (t) => `<div class="macro" style="margin-bottom:10px">
                  <div class="row between"><span>${esc(t.type)}</span>
                    <span class="muted">${money(t.value)} · ${port.current ? Math.round((t.value / port.current) * 100) : 0}%</span>
                  </div>
                  ${bar((t.value / (port.current || 1)) * 100, "var(--accent-2)")}
                </div>`
              )
              .join("")
          : empty("Add a holding to see your allocation.")
      }
    </section>

    <section class="card">
      <div class="card-head"><h3>Add holding</h3></div>
      <form class="add" id="hold-add">
        <div class="grid-2">
          <input name="name" placeholder="Name (e.g. Nifty 50 index)" required />
          <select name="type">${TYPES.map((t) => `<option>${t}</option>`).join("")}</select>
        </div>
        <div class="grid-2">
          <input name="invested" type="number" min="0" step="0.01" placeholder="Invested amount" required />
          <input name="current" type="number" min="0" step="0.01" placeholder="Current value" />
        </div>
        <button class="btn primary" type="submit">Add holding</button>
      </form>
    </section>

    <section class="card">
      <div class="card-head"><h3>Holdings</h3><span class="muted">${top.length}</span></div>
      ${
        top.length
          ? `<ul class="list">${top
              .map((h) => {
                const pl = num(h.current) - num(h.invested);
                const pct = num(h.invested) ? (pl / num(h.invested)) * 100 : 0;
                return `<li class="item">
                  <div class="grow">
                    <div class="title">${esc(h.name)}</div>
                    <div class="meta">${esc(h.type)} · invested ${money(h.invested)}</div>
                    <div class="row between" style="margin-top:6px">
                      <input class="cur-input" type="number" min="0" step="0.01" value="${num(h.current)}"
                             data-id="${esc(h.id)}" aria-label="Current value for ${esc(h.name)}" style="max-width:150px" />
                      <span class="pill ${pl >= 0 ? "ok" : "hi"}">${pl >= 0 ? "+" : ""}${pct.toFixed(1)}%</span>
                    </div>
                  </div>
                  <button class="x" data-del="${esc(h.id)}" aria-label="Delete holding">✕</button>
                </li>`;
              })
              .join("")}</ul>`
          : empty("No holdings yet.")
      }
    </section>
    <p class="muted small" style="margin:0 4px">Edit the value field on a holding to refresh its current worth — totals update instantly.</p>
  `;

  onSubmit(root, "#hold-add", (data) => {
    update((st) => {
      st.holdings.unshift({
        id: uid(),
        name: String(data.name).trim(),
        type: data.type,
        invested: num(data.invested),
        current: data.current === "" ? num(data.invested) : num(data.current),
      });
    });
  });

  $$(".cur-input", root).forEach((input) => {
    input.addEventListener("change", () => {
      update((st) => {
        const h = st.holdings.find((x) => x.id === input.dataset.id);
        if (h) h.current = num(input.value);
      });
    });
  });

  $$("[data-del]", root).forEach((btn) => {
    btn.addEventListener("click", () => {
      update((st) => {
        st.holdings = st.holdings.filter((h) => h.id !== btn.dataset.del);
      });
    });
  });
}
