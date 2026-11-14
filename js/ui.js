export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

export function bar(pct, color = "") {
  const width = Math.max(0, Math.min(100, Math.round(pct)));
  return `<div class="bar"><i style="width:${width}%;${color ? `background:${color}` : ""}"></i></div>`;
}

export function empty(text) {
  return `<p class="empty">${esc(text)}</p>`;
}

export function stat(label, value, sub = "") {
  return `<div class="stat">
    <div class="k">${esc(label)}</div>
    <div class="v">${value}${sub ? ` <small>${esc(sub)}</small>` : ""}</div>
  </div>`;
}

export function pills(list) {
  return list.map((p) => `<span class="pill ${p.tone || ""}">${esc(p.text)}</span>`).join(" ");
}

/** Wire a submit handler that clears the form afterwards. */
export function onSubmit(root, selector, handler) {
  const form = $(selector, root);
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    if (handler(data, form) !== false) form.reset();
  });
}

export function onDelete(root, selector, handler) {
  $$(selector, root).forEach((btn) => {
    btn.addEventListener("click", () => handler(btn.dataset));
  });
}
