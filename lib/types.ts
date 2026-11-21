export const CATEGORIES = [
  "Office",
  "Home",
  "Family",
  "Personal",
  "Health",
  "Finance",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type Task = {
  id: string;
  title: string;
  description: string;
  category: Category;
  done: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TaskDraft = {
  title: string;
  description: string;
  category: Category;
};

export type Exercise = {
  id: string;
  name: string;
  done: boolean;
};

export type Workout = {
  id: string;
  title: string;
  /** Local calendar day, `YYYY-MM-DD`. */
  date: string;
  notes: string;
  exercises: Exercise[];
  createdAt: string;
  updatedAt: string;
};

export type ExerciseDraft = {
  id: string;
  name: string;
};

export type WorkoutDraft = {
  title: string;
  date: string;
  notes: string;
  exercises: ExerciseDraft[];
};

/** One row per day for weight and steps. */
export type DayMetrics = {
  /** Local calendar day, `YYYY-MM-DD` (primary key). */
  date: string;
  weightKg: number | null;
  steps: number | null;
  updatedAt: string;
};

export const CATEGORY_DOT: Record<Category, string> = {
  Office: "bg-[#6d7cff]",
  Home: "bg-[#34d399]",
  Family: "bg-[#f472b6]",
  Personal: "bg-[#fbbf24]",
  Health: "bg-[#22d3ee]",
  Finance: "bg-[#a78bfa]",
};
