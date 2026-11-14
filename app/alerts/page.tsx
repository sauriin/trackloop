import type { Metadata } from "next";
import { AlertsBoard } from "@/components/alerts";

export const metadata: Metadata = { title: "Reminders" };

export default function AlertsPage() {
  return <AlertsBoard />;
}
