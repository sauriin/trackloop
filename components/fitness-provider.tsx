"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { db } from "@/lib/db";
import type {
  DayMetrics,
  Exercise,
  Workout,
  WorkoutDraft,
} from "@/lib/types";

type FitnessContextValue = {
  workouts: Workout[];
  metrics: DayMetrics[];
  addWorkout: (draft: WorkoutDraft) => Workout;
  updateWorkout: (id: string, draft: WorkoutDraft) => void;
  toggleExercise: (workoutId: string, exerciseId: string) => void;
  deleteWorkout: (id: string) => void;
  saveMetric: (input: {
    date: string;
    weightKg: number | null;
    steps: number | null;
  }) => void;
  deleteMetric: (date: string) => void;
  hydrated: boolean;
};

const FitnessContext = createContext<FitnessContextValue | null>(null);

function newId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `fit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function sortWorkouts(workouts: Workout[]) {
  return [...workouts].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );
}

function draftExercises(draft: WorkoutDraft, previous?: Workout): Exercise[] {
  return draft.exercises
    .map((exercise) => ({
      id: exercise.id || newId(),
      name: exercise.name.trim(),
      done: previous?.exercises.find((old) => old.id === exercise.id)?.done ?? false,
    }))
    .filter((exercise) => exercise.name);
}

function reportWriteError(error: unknown) {
  console.warn("Could not save fitness entry", error);
}

export function FitnessProvider({ children }: { children: React.ReactNode }) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [metrics, setMetrics] = useState<DayMetrics[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Refs so every mutation callback can stay referentially stable.
  const workoutsRef = useRef<Workout[]>(workouts);
  const metricsRef = useRef<DayMetrics[]>(metrics);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [storedWorkouts, storedMetrics] = await Promise.all([
          db.workouts.toArray(),
          db.metrics.toArray(),
        ]);
        if (!active) return;
        workoutsRef.current = sortWorkouts(storedWorkouts);
        metricsRef.current = storedMetrics;
        setWorkouts(workoutsRef.current);
        setMetrics(metricsRef.current);
      } catch (error) {
        console.warn("Could not open the fitness database", error);
      } finally {
        if (active) setHydrated(true);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const addWorkout = useCallback((draft: WorkoutDraft) => {
    const now = new Date().toISOString();
    const workout: Workout = {
      id: newId(),
      title: draft.title.trim(),
      date: draft.date,
      notes: draft.notes.trim(),
      exercises: draftExercises(draft),
      createdAt: now,
      updatedAt: now,
    };

    workoutsRef.current = sortWorkouts([workout, ...workoutsRef.current]);
    setWorkouts(workoutsRef.current);
    void db.workouts.add(workout).catch(reportWriteError);
    return workout;
  }, []);

  const updateWorkout = useCallback((id: string, draft: WorkoutDraft) => {
    const previous = workoutsRef.current.find((workout) => workout.id === id);
    if (!previous) return;

    const next: Workout = {
      ...previous,
      title: draft.title.trim(),
      date: draft.date,
      notes: draft.notes.trim(),
      exercises: draftExercises(draft, previous),
      updatedAt: new Date().toISOString(),
    };

    workoutsRef.current = sortWorkouts(
      workoutsRef.current.map((workout) => (workout.id === id ? next : workout)),
    );
    setWorkouts(workoutsRef.current);
    void db.workouts.put(next).catch(reportWriteError);
  }, []);

  const toggleExercise = useCallback((workoutId: string, exerciseId: string) => {
    const workout = workoutsRef.current.find((entry) => entry.id === workoutId);
    if (!workout) return;

    const next: Workout = {
      ...workout,
      exercises: workout.exercises.map((exercise) =>
        exercise.id === exerciseId ? { ...exercise, done: !exercise.done } : exercise,
      ),
      updatedAt: new Date().toISOString(),
    };

    workoutsRef.current = workoutsRef.current.map((entry) =>
      entry.id === workoutId ? next : entry,
    );
    setWorkouts(workoutsRef.current);
    void db.workouts.put(next).catch(reportWriteError);
  }, []);

  const deleteWorkout = useCallback((id: string) => {
    workoutsRef.current = workoutsRef.current.filter((workout) => workout.id !== id);
    setWorkouts(workoutsRef.current);
    void db.workouts.delete(id).catch(reportWriteError);
  }, []);

  const saveMetric = useCallback(
    ({
      date,
      weightKg,
      steps,
    }: {
      date: string;
      weightKg: number | null;
      steps: number | null;
    }) => {
      const entry: DayMetrics = {
        date,
        weightKg,
        steps,
        updatedAt: new Date().toISOString(),
      };

      const withoutDay = metricsRef.current.filter((metric) => metric.date !== date);
      metricsRef.current = [entry, ...withoutDay].sort((a, b) =>
        b.date.localeCompare(a.date),
      );
      setMetrics(metricsRef.current);
      void db.metrics.put(entry).catch(reportWriteError);
    },
    [],
  );

  const deleteMetric = useCallback((date: string) => {
    metricsRef.current = metricsRef.current.filter((metric) => metric.date !== date);
    setMetrics(metricsRef.current);
    void db.metrics.delete(date).catch(reportWriteError);
  }, []);

  const value = useMemo<FitnessContextValue>(
    () => ({
      workouts,
      metrics,
      addWorkout,
      updateWorkout,
      toggleExercise,
      deleteWorkout,
      saveMetric,
      deleteMetric,
      hydrated,
    }),
    [
      workouts,
      metrics,
      addWorkout,
      updateWorkout,
      toggleExercise,
      deleteWorkout,
      saveMetric,
      deleteMetric,
      hydrated,
    ],
  );

  return <FitnessContext.Provider value={value}>{children}</FitnessContext.Provider>;
}

export function useFitness() {
  const context = useContext(FitnessContext);
  if (!context) throw new Error("useFitness must be used inside <FitnessProvider>");
  return context;
}
