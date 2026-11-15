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

export const CATEGORY_DOT: Record<Category, string> = {
  Office: "bg-[#6d7cff]",
  Home: "bg-[#34d399]",
  Family: "bg-[#f472b6]",
  Personal: "bg-[#fbbf24]",
  Health: "bg-[#22d3ee]",
  Finance: "bg-[#a78bfa]",
};
