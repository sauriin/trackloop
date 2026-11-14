"use client";

import { useEffect, useSyncExternalStore } from "react";
import { toast } from "./toast";
import type { AppState } from "./types";

/**
 * App state lives in the local SQLite database through /api/state.
 * localStorage is kept as an offline cache: it paints instantly, survives a
 * dropped connection, and seeds the database with data from the old version.
 */
export const STORAGE_KEY = "trackloop.v1";
const API_URL = "/api/state";

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
let loaded = false;
let changedBeforeLoad = false;
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

function readCache(): AppState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? normalize(JSON.parse(raw) as Partial<AppState>) : null;
  } catch (err) {
    console.warn("Could not read browser cache", err);
    return null;
  }
}

function writeCache() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn("Could not write browser cache", err);
  }
}

let saveTimer: number | null = null;
let saving = false;
let dirty = false;
let failureNotified = false;

/**
 * Save the current state.
 * `quiet` skips the failure toast — used for background work (migrating the
 * browser copy on load, flushing on pagehide) so a read-only server does not
 * pop the same message on every reload. Failures from a user action always toast.
 */
async function persistNow(quiet = false) {
  if (!hydrated) return;
  if (saving) {
    dirty = true;
    return;
  }
  saving = true;
  try {
    const response = await fetch(API_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state }),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (failureNotified) {
      failureNotified = false;
      toast("Database reconnected — your changes are saved.", "success");
    }
  } catch (err) {
    console.warn("Local database unavailable — changes kept in the browser cache.", err);
    if (!quiet && !failureNotified) {
      failureNotified = true;
      toast("Couldn't save to the local database — kept in the browser.", "error");
    }
  } finally {
    saving = false;
    if (dirty) {
      dirty = false;
      void persistNow();
    }
  }
}

function schedulePersist() {
  if (!hydrated) return;
  writeCache();
  if (!loaded) {
    changedBeforeLoad = true;
    return;
  }
  if (saveTimer !== null) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    saveTimer = null;
    void persistNow();
  }, 400);
}

async function load() {
  // Paint from the last browser copy while the database responds.
  const cached = readCache();
  if (cached) {
    state = cached;
    emit();
  }

  try {
    const response = await fetch(API_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = (await response.json()) as { state: AppState | null };
    if (payload.state) {
      state = normalize(payload.state);
      writeCache();
      emit();
    } else if (cached) {
      // First run with the database: move existing browser data into SQLite.
      changedBeforeLoad = true;
    }
  } catch (err) {
    console.warn("Could not read the local database — using the browser cache.", err);
  } finally {
    loaded = true;
    if (changedBeforeLoad) {
      changedBeforeLoad = false;
      void persistNow(true);
    }
  }
}

/** Apply a mutation, cache it immediately and save to the local database. */
export function update(mutator: (draft: AppState) => void) {
  const next = structuredClone(state);
  mutator(next);
  state = next;
  schedulePersist();
  emit();
}

/**
 * Subscribe a component to the store.
 * The first client render uses the defaults so it matches the server HTML;
 * the database (or offline cache) is loaded right after mount.
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
    void load();

    const flush = () => {
      if (saveTimer !== null) {
        window.clearTimeout(saveTimer);
        saveTimer = null;
        void persistNow(true);
      }
    };
    const retry = () => void persistNow();
    window.addEventListener("pagehide", flush);
    window.addEventListener("online", retry);
    return () => {
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("online", retry);
    };
  }, []);

  return snapshot;
}
