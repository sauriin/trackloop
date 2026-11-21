"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CheckCircle2,
  Database,
  Dumbbell,
  LayoutList,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useTasks, type TaskFilter } from "@/components/task-provider";
import { CATEGORIES, CATEGORY_DOT } from "@/lib/types";

/** Remembers the manual collapse choice across visits. */
const COLLAPSE_KEY = "daily.sidebar.collapsed";

export function Sidebar() {
  const { filter, setFilter, counts, tasks } = useTasks();
  const pathname = usePathname();
  const router = useRouter();
  const onTasks = pathname === "/";
  const onFitness = pathname?.startsWith("/fitness") ?? false;
  const onAdmin = pathname?.startsWith("/admin") ?? false;

  // Task filters only live on the tasks page, so follow the click when on
  // another screen (e.g. Fitness) instead of silently changing hidden state.
  function selectFilter(next: TaskFilter) {
    setFilter(next);
    if (!onTasks) router.push("/");
  }
  const open = counts.all;
  const done = tasks.filter((task) => task.done).length;

  // Starts expanded so the server and first client render agree, then picks up
  // whatever the user last chose.
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }

  // Labels are hidden below `lg` already; collapsing hides them at every width.
  const labelClass = `hidden flex-1 truncate text-left ${collapsed ? "" : "lg:inline"}`;
  const headingClass = `hidden px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted ${collapsed ? "" : "lg:block"}`;

  return (
    <aside
      className={`sticky top-0 flex h-dvh w-14 shrink-0 flex-col border-r border-line bg-panel/80 sm:w-16 ${
        collapsed ? "lg:w-14" : "lg:w-64"
      }`}
    >
      <div className="flex items-center gap-3 px-2 py-4 sm:px-3 sm:py-5 lg:px-5">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-canvas">
          <CheckCircle2 className="size-5" strokeWidth={2.5} />
        </span>
        <div className={`hidden min-w-0 ${collapsed ? "" : "lg:block"}`}>
          <p className="truncate text-sm font-semibold tracking-tight">Daily</p>
          <p className="truncate text-xs text-muted">Task tracker</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-1.5 pb-4 sm:px-2 lg:px-3">
        <NavButton
          active={onTasks && filter === "all"}
          label="All tasks"
          count={counts.all}
          onClick={() => selectFilter("all")}
          icon={<LayoutList className="size-4 shrink-0" />}
          labelClass={labelClass}
          collapsed={collapsed}
        />

        <Link
          href="/fitness"
          title="Fitness — workouts, weight and steps"
          aria-current={onFitness ? "page" : undefined}
          className={`flex w-full items-center justify-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors sm:px-2.5 lg:px-3 ${
            collapsed ? "lg:justify-center" : "lg:justify-start"
          } ${
            onFitness
              ? "bg-accent-soft text-white"
              : "text-muted hover:bg-panel-2 hover:text-slate-200"
          }`}
        >
          <span className="grid size-5 place-items-center">
            <Dumbbell className="size-4 shrink-0" />
          </span>
          <span className={labelClass}>Fitness</span>
        </Link>

        <p className={`${headingClass} pt-5`}>Categories</p>
        <div className="space-y-1 pt-3 lg:pt-0">
          {CATEGORIES.map((category) => (
            <NavButton
              key={category}
              active={onTasks && filter === category}
              label={category}
              count={counts[category]}
              onClick={() => selectFilter(category)}
              icon={
                <span
                  className={`size-2 shrink-0 rounded-full ${CATEGORY_DOT[category]}`}
                />
              }
              title={category}
              labelClass={labelClass}
              collapsed={collapsed}
            />
          ))}
        </div>

        <div className="mt-3 space-y-1 border-t border-line pt-2">
          <Link
            href="/admin"
            title="Admin — database records"
            aria-current={onAdmin ? "page" : undefined}
            className={`flex w-full items-center justify-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors sm:px-2.5 lg:px-3 ${
              collapsed ? "lg:justify-center" : "lg:justify-start"
            } ${
              onAdmin
                ? "bg-accent-soft text-white"
                : "text-muted hover:bg-panel-2 hover:text-slate-200"
            }`}
          >
            <span className="grid size-5 place-items-center">
              <Database className="size-4 shrink-0" />
            </span>
            <span className={labelClass}>Admin</span>
          </Link>

          <button
            type="button"
            onClick={toggleCollapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            className={`hidden w-full items-center justify-center gap-3 rounded-lg px-2 py-2 text-sm text-muted transition-colors hover:bg-panel-2 hover:text-slate-200 sm:px-2.5 lg:flex lg:px-3 ${
              collapsed ? "lg:justify-center" : "lg:justify-start"
            }`}
          >
            <span className="grid size-5 place-items-center">
              {collapsed ? (
                <PanelLeftOpen className="size-4 shrink-0" />
              ) : (
                <PanelLeftClose className="size-4 shrink-0" />
              )}
            </span>
            <span className={labelClass}>
              {collapsed ? "Expand" : "Collapse"}
            </span>
          </button>
        </div>
      </nav>

      <div
        className={`border-t border-line px-2 py-3 text-xs text-muted sm:px-3 sm:py-4 ${
          collapsed ? "lg:px-2" : "lg:px-5"
        }`}
      >
        <p className={`hidden ${collapsed ? "" : "lg:block"}`}>
          {open} open · {done} done
        </p>
        <p className={`hidden ${collapsed ? "" : "lg:block"}`}>Saved on this device</p>
        <p
          className={`truncate text-center ${collapsed ? "lg:block" : "lg:hidden"}`}
          title={`${open} open`}
        >
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
  labelClass,
  collapsed,
}: {
  active: boolean;
  label: string;
  count: number;
  icon: React.ReactNode;
  onClick: () => void;
  title?: string;
  labelClass: string;
  collapsed: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title ?? label}
      aria-current={active ? "page" : undefined}
      className={`flex w-full items-center justify-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors sm:px-2.5 lg:px-3 ${
        collapsed ? "lg:justify-center" : "lg:justify-start"
      } ${
        active
          ? "bg-accent-soft text-white"
          : "text-muted hover:bg-panel-2 hover:text-slate-200"
      }`}
    >
      <span className="grid size-5 place-items-center">{icon}</span>
      <span className={labelClass}>{label}</span>
      <span
        className={`hidden rounded-md px-1.5 py-0.5 text-[11px] tabular-nums ${
          collapsed ? "" : "lg:inline"
        } ${active ? "bg-white/10 text-white" : "text-muted"}`}
      >
        {count}
      </span>
    </button>
  );
}
