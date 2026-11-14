export type Priority = "low" | "normal" | "high";
export type Repeat = "none" | "daily" | "weekly";

export type Meal = "Breakfast" | "Lunch" | "Dinner" | "Snack";

export type HoldingType =
  | "Stocks"
  | "Mutual fund"
  | "ETF"
  | "Crypto"
  | "Gold"
  | "FD / Debt"
  | "Other";

export type GymFocus =
  | "Push"
  | "Pull"
  | "Legs"
  | "Upper"
  | "Lower"
  | "Cardio"
  | "Full body"
  | "Mobility";

export interface OfficeTask {
  id: string;
  title: string;
  project: string;
  priority: Priority;
  due: string; // ISO yyyy-mm-dd, "" when none
  done: boolean;
  createdAt: string;
  doneAt?: string | null;
}

export interface GymSession {
  id: string;
  date: string;
  name: string;
  focus: GymFocus;
  duration: number; // minutes
  notes: string;
  done: boolean;
}

export interface FoodEntry {
  id: string;
  date: string;
  meal: Meal;
  name: string;
  protein: number;
  carbs: number;
  fat: number;
  calories: number; // 0 = derive from macros
}

export interface Holding {
  id: string;
  name: string;
  type: HoldingType;
  invested: number;
  current: number;
}

export interface Reminder {
  id: string;
  title: string;
  date: string;
  time: string; // HH:MM
  repeat: Repeat;
  done: boolean;
  lastFired: string | null;
}

export interface Goals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface AppState {
  version: number;
  goals: Goals;
  office: OfficeTask[];
  gym: GymSession[];
  food: FoodEntry[];
  holdings: Holding[];
  reminders: Reminder[];
}

export interface Totals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}
