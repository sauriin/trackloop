import type { Metadata } from "next";
import { NutritionBoard } from "@/components/nutrition";

export const metadata: Metadata = { title: "Nutrition" };

export default function NutritionPage() {
  return <NutritionBoard />;
}
