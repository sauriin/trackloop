"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { AppState } from "./types";

export const STORAGE_KEY = "trackloop.v1";

export const DEFAULT_STATE: AppState = {
  version: 1,
  goals: { calories: 2200, protein: 140, carbs: 240, fat: 70 },
  office: [],
  gym: [],
  food: [],
  holdings: [],
  reminders: [],
};

let state: AppState = DEFAULT_STATE;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getState(): AppState {
  return state;
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

function normalize(saved: Partial<AppState> | null): AppState {
  if (!saved || typeof saved !== "object") return DEFAULT_STATE;
  return {
    ...DEFAULT_STATE,
    ...saved,
    goals: { ...DEFAULT_STATE.goals, ...(saved.goals ?? {}) },
    office: Array.isArray(saved.office) ? saved.office : [],
    gym: Array.isArray(saved.gym) ? saved.gym : [],
    food: Array.isArray(saved.food) ? saved.food : [],
    holdings: Array.isArray(saved.holdings) ? saved.holdings : [],
    reminders: Array.isArray(saved.reminders) ? saved.reminders : [],
  };
}

function load() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    state = normalize(JSON.parse(raw) as Partial<AppState>);
    emit();
  } catch (err) {
    console.warn("Could not read saved data", err);
  }
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn("Could not save data", err);
  }
}

/** Apply a mutation, persist it and re-render subscribers. */
export function update(mutator: (draft: AppState) => void) {
  const next = structuredClone(state);
  mutator(next);
  state = next;
  if (hydrated) persist();
  emit();
}

/**
 * Subscribe a component to the store.
 * The first client render uses the defaults so it matches the server HTML;
 * saved data is loaded right after mount.
 */
export function useAppState(): AppState {
  const snapshot = useSyncExternalStore(
    subscribe,
    getState,
    () => DEFAULT_STATE
  );

  useEffect(() => {
    if (hydrated) return;
    hydrated = true;
    load();
  }, []);

  return snapshot;
}
