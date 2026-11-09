import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daily Special",
  description: "One short challenge a day, with a streak to keep.",
};

export default function DailyPage() {
  return (
    <div className="view">
      <div className="view-head">
        <h1 className="view-title">Daily Special</h1>
        <p className="lede">Coming in Phase 3.</p>
      </div>
    </div>
  );
}
