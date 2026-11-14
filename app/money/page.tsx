import type { Metadata } from "next";
import { MoneyBoard } from "@/components/money";

export const metadata: Metadata = { title: "Investments" };

export default function MoneyPage() {
  return <MoneyBoard />;
}
