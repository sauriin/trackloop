import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>;
}

export function CardHead({ title, right }: { title: ReactNode; right?: ReactNode }) {
  return (
    <div className="card-head">
      <h2 className="text-[21px] font-semibold tracking-tight">{title}</h2>
      {right ? <span className="text-[12.5px] text-muted">{right}</span> : null}
    </div>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-1 flex items-baseline justify-between px-0.5">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">{children}</h3>
      {right}
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="stat">
      <div className="stat-k">{label}</div>
      <div className="stat-v">
        {value}
        {sub ? <small className="ml-1 text-[11.5px] font-medium text-muted">/ {sub}</small> : null}
      </div>
    </div>
  );
}

export function Progress({ value, tone }: { value: number; tone?: "warn" }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <i
        className="bar-fill"
        style={{
          width: `${pct}%`,
          backgroundImage: tone === "warn" ? "linear-gradient(90deg,#f59e0b,#fbbf24)" : undefined,
        }}
      />
    </div>
  );
}

export function Pill({ children, tone }: { children: ReactNode; tone?: "ok" | "warn" }) {
  return <span className={`pill ${tone === "ok" ? "pill-ok" : tone === "warn" ? "pill-warn" : ""}`}>{children}</span>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>;
}

export function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`grid min-w-0 gap-1.5 ${className}`}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}
