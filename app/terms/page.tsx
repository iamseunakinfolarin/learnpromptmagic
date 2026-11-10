import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms",
  description: "The terms for using Prompt Magic.",
};

export default function TermsPage() {
  return (
    <div className="view">
      <div className="view-head">
        <h1 className="view-title">Terms</h1>
        <p className="lede">Coming in Phase 5.</p>
      </div>
    </div>
  );
}
