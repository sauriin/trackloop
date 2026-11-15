"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2, Database, LayoutList } from "lucide-react";
import { useTasks } from "@/components/task-provider";
import { CATEGORIES, CATEGORY_DOT } from "@/lib/types";

export function Sidebar() {
  const { filter, setFilter, counts, tasks } = useTasks();
  const pathname = usePathname();
  const onAdmin = pathname?.startsWith("/admin") ?? false;
  const open = counts.all;
  const done = tasks.filter((task) => task.done).length;

  return (
    <aside className="sticky top-0 flex h-dvh w-14 shrink-0 flex-col border-r border-line bg-panel/80 sm:w-16 lg:w-64">
      <div className="flex items-center gap-3 px-2 py-4 sm:px-3 sm:py-5 lg:px-5">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-canvas">
          <CheckCircle2 className="size-5" strokeWidth={2.5} />
        </span>
        <div className="hidden min-w-0 lg:block">
          <p className="truncate text-sm font-semibold tracking-tight">Daily</p>
          <p className="truncate text-xs text-muted">Task tracker</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-1.5 pb-4 sm:px-2 lg:px-3">
        <NavButton
          active={filter === "all"}
          label="All tasks"
          count={counts.all}
          onClick={() => setFilter("all")}
          icon={<LayoutList className="size-4 shrink-0" />}
        />

        <p className="hidden px-3 pt-5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted lg:block">
          Categories
        </p>
        <div className="space-y-1 pt-3 lg:pt-0">
          {CATEGORIES.map((category) => (
            <NavButton
              key={category}
              active={filter === category}
              label={category}
              count={counts[category]}
              onClick={() => setFilter(category)}
              icon={
                <span
                  className={`size-2 shrink-0 rounded-full ${CATEGORY_DOT[category]}`}
                />
              }
              title={category}
            />
          ))}
        </div>

        <div className="mt-3 border-t border-line pt-2">
          <Link
            href="/admin"
            title="Admin — database records"
            aria-current={onAdmin ? "page" : undefined}
            className={`flex w-full items-center justify-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors sm:px-2.5 lg:justify-start lg:px-3 ${
              onAdmin
                ? "bg-accent-soft text-white"
                : "text-muted hover:bg-panel-2 hover:text-slate-200"
            }`}
          >
            <span className="grid size-5 place-items-center">
              <Database className="size-4 shrink-0" />
            </span>
            <span className="hidden flex-1 truncate text-left lg:inline">Admin</span>
          </Link>
        </div>
      </nav>

      <div className="border-t border-line px-2 py-3 text-xs text-muted sm:px-3 sm:py-4 lg:px-5">
        <p className="hidden lg:block">
          {open} open · {done} done
        </p>
        <p className="hidden lg:block">Saved on this device</p>
        <p className="truncate text-center lg:hidden" title={`${open} open`}>
          {open}
        </p>
      </div>
    </aside>
  );
}

function NavButton({
  active,
  label,
  count,
  icon,
  onClick,
  title,
}: {
  active: boolean;
  label: string;
  count: number;
  icon: React.ReactNode;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title ?? label}
      aria-current={active ? "page" : undefined}
      className={`flex w-full items-center justify-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors sm:px-2.5 lg:justify-start lg:px-3 ${
        active
          ? "bg-accent-soft text-white"
          : "text-muted hover:bg-panel-2 hover:text-slate-200"
      }`}
    >
      <span className="grid size-5 place-items-center">{icon}</span>
      <span className="hidden flex-1 truncate text-left lg:inline">{label}</span>
      <span
        className={`hidden rounded-md px-1.5 py-0.5 text-[11px] tabular-nums lg:inline ${
          active ? "bg-white/10 text-white" : "text-muted"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
