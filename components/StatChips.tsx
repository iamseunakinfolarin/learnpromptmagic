"use client";

import { streakNow } from "@/lib/daily";
import { today, totalStars } from "@/lib/progress";
import { StarIcon } from "./Stars";
import { useProgress } from "./useProgress";

/**
 * The stars and streak chips in the header.
 *
 * Each number has its meaning written out in visually hidden text, so a screen
 * reader always hears "12 stars earned" or "Daily Special streak: 3 days", even
 * on a phone where the visible words are trimmed to save room. The visible
 * label is hidden from screen readers so nothing is said twice.
 */
export default function StatChips() {
  const progress = useProgress();
  const stars = totalStars(progress);
  // The saved streak only counts while the last special was today or yesterday.
  const streak = streakNow(progress, today());

  return (
    <div className="stats">
      <span className="stat stat-stars">
        <StarIcon />
        <span aria-hidden="true">{stars}</span>
        <span className="stat-label" aria-hidden="true">
          stars
        </span>
        <span className="sr-only">
          {stars} {stars === 1 ? "star" : "stars"} earned
        </span>
      </span>
      <span className="stat stat-streak">
        <span className="stat-label" aria-hidden="true">
          Streak
        </span>
        <span aria-hidden="true">{streak}</span>
        <span className="sr-only">
          Daily Special streak: {streak} {streak === 1 ? "day" : "days"}
        </span>
      </span>
    </div>
  );
}
