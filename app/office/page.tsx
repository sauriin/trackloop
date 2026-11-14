import type { Metadata } from "next";
import { OfficeBoard } from "@/components/office";

export const metadata: Metadata = { title: "Office" };

export default function OfficePage() {
  return <OfficeBoard />;
}
