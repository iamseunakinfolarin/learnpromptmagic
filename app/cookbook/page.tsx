import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookbook",
  description: "Every recipe you master, as a card you can copy into any AI tool you are allowed to use.",
};

export default function CookbookPage() {
  return (
    <div className="view">
      <div className="view-head">
        <h1 className="view-title">Cookbook</h1>
        <p className="lede">Coming in Phase 3.</p>
      </div>
    </div>
  );
}
