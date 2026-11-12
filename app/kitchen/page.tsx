import type { Metadata } from "next";
import KitchenMap from "@/components/KitchenMap";
import { getUnlockData } from "@/lib/content";

export const metadata: Metadata = {
  title: "The Kitchen",
  description:
    "Every station in the kitchen, grouped by line. Each station teaches one recipe for talking to AI.",
};

export default function KitchenPage() {
  const { lines, recipes } = getUnlockData();
  return <KitchenMap lines={lines} recipes={recipes} />;
}
