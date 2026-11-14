import type { Metadata } from "next";
import { GymBoard } from "@/components/gym";

export const metadata: Metadata = { title: "Gym" };

export default function GymPage() {
  return <GymBoard />;
}
