"use client";

import { TrendingDown, TrendingUp, X } from "lucide-react";
import { money, num } from "@/lib/dates";
import { portfolio } from "@/lib/derive";
import { update, uid, useAppState } from "@/lib/store";
import { toast } from "@/lib/toast";
import type { HoldingType } from "@/lib/types";
import { Card, CardHead, Empty, Pill, Progress } from "./ui";

const TYPES: HoldingType[] = ["Stocks", "Mutual fund", "ETF", "Crypto", "Gold", "FD / Debt", "Other"];

export function MoneyBoard() {
  const state = useAppState();
  const port = portfolio(state);
  const top = [...state.holdings].sort((a, b) => num(b.current) - num(a.current));
  const byType = TYPES.map((type) => ({
    type,
    value: state.holdings.filter((h) => h.type === type).reduce((sum, h) => sum + num(h.current), 0),
  })).filter((entry) => entry.value > 0);

  function addHolding(form: HTMLFormElement) {
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    if (!name) return;
    const invested = num(data.get("invested"));
    const currentRaw = String(data.get("current") ?? "").trim();
    update((draft) => {
      draft.holdings.unshift({
        id: uid(),
        name,
        type: (String(data.get("type") ?? "Stocks") as HoldingType) || "Stocks",
        invested,
        current: currentRaw === "" ? invested : num(currentRaw),
      });
    });
    form.reset();
    toast("Holding added");
  }

  function setCurrent(id: string, value: string) {
    update((draft) => {
      const holding = draft.holdings.find((h) => h.id === id);
      if (holding) holding.current = num(value);
    });
  }

  function remove(id: string) {
    update((draft) => {
      draft.holdings = draft.holdings.filter((h) => h.id !== id);
    });
  }

  return (
    <>
      <div className="grid gap-3.5 lg:grid-cols-2 lg:items-start">
      <Card>
        <CardHead
          title="Investments"
          right={<Pill tone={port.pl >= 0 ? "ok" : "warn"}>{`${port.pl >= 0 ? "+" : ""}${port.plPct.toFixed(1)}%`}</Pill>}
        />
        <p className="text-xs text-muted">Current value</p>
        <p className="text-3xl font-bold tracking-tight tabular-nums">{money(port.current)}</p>
        <div className="mt-1.5 flex items-baseline justify-between text-[13px]">
          <span className="text-muted">Invested {money(port.invested)}</span>
          <span className={`inline-flex items-center gap-1 ${port.pl >= 0 ? "text-accent" : "text-red"}`}>
            {port.pl >= 0 ? <TrendingUp size={14} aria-hidden="true" /> : <TrendingDown size={14} aria-hidden="true" />}
            {money(Math.abs(port.pl))}
          </span>
        </div>
      </Card>

      <Card>
        <CardHead title={<span className="text-[15px]">Allocation</span>} />
        {byType.length ? (
          <div className="grid gap-2.5">
            {byType.map((entry) => (
              <div key={entry.type} className="grid gap-1.5">
                <div className="flex items-baseline justify-between text-[13px]">
                  <span>{entry.type}</span>
                  <span className="text-muted tabular-nums">
                    {money(entry.value)} · {port.current ? Math.round((entry.value / port.current) * 100) : 0}%
                  </span>
                </div>
                <Progress value={(entry.value / (port.current || 1)) * 100} />
              </div>
            ))}
          </div>
        ) : (
          <Empty>Add a holding to see your allocation.</Empty>
        )}
      </Card>
      </div>

      <div className="grid gap-3.5 lg:grid-cols-2 lg:items-start">
      <Card>
        <CardHead title={<span className="text-[15px]">Add holding</span>} />
        <form
          className="grid gap-2.5"
          onSubmit={(event) => {
            event.preventDefault();
            addHolding(event.currentTarget);
          }}
        >
          <div className="grid grid-cols-2 gap-2.5">
            <input name="name" className="input" placeholder="Name (e.g. Nifty 50 index)" required />
            <select name="type" className="input" defaultValue="Stocks">
              {TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <input name="invested" type="number" min={0} step="0.01" className="input" placeholder="Invested amount" required />
            <input name="current" type="number" min={0} step="0.01" className="input" placeholder="Current value" />
          </div>
          <button type="submit" className="btn btn-primary">
            Add holding
          </button>
        </form>
      </Card>

      <Card>
        <CardHead title={<span className="text-[15px]">Holdings</span>} right={top.length} />
        {top.length ? (
          <ul className="grid gap-2">
            {top.map((holding) => {
              const pl = num(holding.current) - num(holding.invested);
              const pct = num(holding.invested) ? (pl / num(holding.invested)) * 100 : 0;
              return (
                <li key={holding.id} className="item">
                  <div className="min-w-0 flex-1">
                    <div className="text-[14.5px] font-semibold leading-snug">{holding.name}</div>
                    <div className="mt-0.5 text-xs text-muted">
                      {holding.type} · invested {money(holding.invested)}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        className="input max-w-[150px] px-2 py-1.5 text-sm tabular-nums"
                        defaultValue={num(holding.current)}
                        aria-label={`Current value for ${holding.name}`}
                        onBlur={(event) => setCurrent(holding.id, event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") event.currentTarget.blur();
                        }}
                      />
                      <Pill tone={pl >= 0 ? "ok" : "warn"}>
                        {pl >= 0 ? "+" : ""}
                        {pct.toFixed(1)}%
                      </Pill>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(holding.id)}
                    aria-label={`Delete ${holding.name}`}
                    className="grid h-[30px] w-[30px] flex-none cursor-pointer place-items-center rounded-[9px] border-0 bg-transparent text-[14px] text-muted hover:bg-red/10 hover:text-red"
                  >
                    <X size={15} aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty>No holdings yet.</Empty>
        )}
      </Card>
      </div>

      <p className="px-1 text-xs text-muted">Edit a value field to refresh its current worth — totals update instantly.</p>
    </>
  );
}
