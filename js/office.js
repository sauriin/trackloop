import { state_, update, uid, todayISO, dayLabel } from "./store.js";
import { esc, $$, empty, onSubmit } from "./ui.js";

let filter = "open"; // open | done | all

export function render(root) {
  const tasks = [...state_().office];
  const today = todayISO();
  const open = tasks.filter((t) => !t.done);
  const overdue = open.filter((t) => t.due && t.due < today).length;

  const visible = tasks
    .filter((t) => (filter === "all" ? true : filter === "done" ? t.done : !t.done))
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      if (!!a.due !== !!b.due) return a.due ? -1 : 1;
      if (a.due && b.due && a.due !== b.due) return a.due < b.due ? -1 : 1;
      return (b.createdAt || "").localeCompare(a.createdAt || "");
    });

  root.innerHTML = `
    <section class="card">
      <div class="card-head">
        <h2>Office</h2>
        <span class="muted">${open.length} open${overdue ? ` · <span style="color:var(--warn)">${overdue} overdue</span>` : ""}</span>
      </div>
      <form class="add" id="task-add">
        <input name="title" placeholder="What needs doing?" required />
        <div class="grid-2">
          <input name="project" placeholder="Project (optional)" />
          <select name="priority">
            <option value="normal">Normal priority</option>
            <option value="high">High priority</option>
            <option value="low">Low priority</option>
          </select>
        </div>
        <div class="row">
          <input name="due" type="date" aria-label="Due date" />
          <button class="btn primary" type="submit">Add task</button>
        </div>
      </form>
    </section>

    <div class="row" style="gap:6px">
      ${["open", "done", "all"]
        .map(
          (f) => `<button class="btn small ${f === filter ? "primary" : "ghost"}" data-filter="${f}">
            ${f[0].toUpperCase() + f.slice(1)}</button>`
        )
        .join("")}
    </div>

    <section class="card">
      ${
        visible.length
          ? `<ul class="list">${visible
              .map(
                (t) => `<li class="item ${t.done ? "done" : ""}">
                  <input class="check" type="checkbox" data-id="${esc(t.id)}" ${t.done ? "checked" : ""} aria-label="Toggle done" />
                  <div class="grow">
                    <div class="title">${esc(t.title)}</div>
                    <div class="meta">${[
                      t.project,
                      t.due ? dayLabel(t.due) : "No date",
                      t.priority && t.priority !== "normal" ? `${t.priority} priority` : "",
                    ]
                      .filter(Boolean)
                      .map((x) => esc(x))
                      .join(" · ")}</div>
                  </div>
                  ${t.done ? '<span class="pill ok">done</span>' : t.priority === "high" ? '<span class="pill hi">high</span>' : ""}
                  <button class="x" data-del="${esc(t.id)}" aria-label="Delete task">✕</button>
                </li>`
              )
              .join("")}</ul>`
          : empty(filter === "done" ? "No finished tasks yet." : "No tasks here. Add one above.")
      }
    </section>
    <p class="muted small" style="margin:0 4px">
      Tip: tasks due today (and overdue ones) also show up on the Today screen.
    </p>
  `;

  onSubmit(root, "#task-add", (data) => {
    update((s) => {
      s.office.unshift({
        id: uid(),
        title: String(data.title).trim(),
        project: String(data.project || "").trim(),
        priority: data.priority || "normal",
        due: data.due || "",
        done: false,
        createdAt: new Date().toISOString(),
      });
    });
  });

  $$("[data-filter]", root).forEach((btn) => {
    btn.addEventListener("click", () => {
      filter = btn.dataset.filter;
      render(root);
    });
  });

  $$(".check", root).forEach((box) => {
    box.addEventListener("change", () => {
      update((s) => {
        const t = s.office.find((x) => x.id === box.dataset.id);
        if (!t) return;
        t.done = box.checked;
        t.doneAt = box.checked ? new Date().toISOString() : null;
      });
    });
  });

  $$("[data-del]", root).forEach((btn) => {
    btn.addEventListener("click", () => {
      update((s) => {
        s.office = s.office.filter((x) => x.id !== btn.dataset.del);
      });
    });
  });
}
