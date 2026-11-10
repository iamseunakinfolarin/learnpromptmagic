import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "What Prompt Magic is, who it is for, and who makes it.",
};

export default function AboutPage() {
  return (
    <div className="view">
      <div className="view-head">
        <h1 className="view-title">About</h1>
        <p className="lede">Coming in Phase 5.</p>
      </div>
    </div>
  );
}
