import type { Metadata } from "next";
import { FitnessProvider } from "@/components/fitness-provider";
import { FitnessView } from "@/components/fitness-view";

export const metadata: Metadata = {
  title: "Fitness — Daily",
  description: "Workouts, exercise checklists, weight and steps.",
};

export default function FitnessPage() {
  return (
    <FitnessProvider>
      <FitnessView />
    </FitnessProvider>
  );
}
