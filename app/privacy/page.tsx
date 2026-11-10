import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "No accounts, no cookies, no trackers. Your progress stays on your device.",
};

export default function PrivacyPage() {
  return (
    <div className="view">
      <div className="view-head">
        <h1 className="view-title">Privacy</h1>
        <p className="lede">Coming in Phase 5.</p>
      </div>
    </div>
  );
}
