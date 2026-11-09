"use client";

import { useSyncExternalStore } from "react";
import { load, totalStars } from "@/lib/progress";
import { StarIcon } from "./Stars";

/**
 * The stars and streak chips.
 *
 * Progress lives on the device, which the server knows nothing about, so the
 * chips are read as an external store: the first render matches the markup
 * that was built, and the real numbers arrive once the page is running. That
 * leaves nothing for React to warn about, and a second tab that earns a star
 * updates this one.
 */

type Stats = { stars: number; streak: number };

const serverStats: Stats = { stars: 0, streak: 0 };

// useSyncExternalStore compares snapshots by identity, so the same object is
// handed back until the numbers themselves change.
let snapshot: Stats = serverStats;

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function getSnapshot(): Stats {
  const progress = load();
  const stars = totalStars(progress);
  const streak = progress.daily.streak;
  if (stars !== snapshot.stars || streak !== snapshot.streak) {
    snapshot = { stars, streak };
  }
  return snapshot;
}

function getServerSnapshot(): Stats {
  return serverStats;
}

export default function StatChips() {
  const stats = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <div className="stats">
      <span className="stat" aria-label={`${stats.stars} stars earned`}>
        <StarIcon />
        <span>{stats.stars}</span>
        <span className="stat-label">stars</span>
      </span>
      <span
        className="stat"
        aria-label={`Daily Special streak: ${stats.streak}`}
      >
        <span className="stat-label">Streak</span>
        <span>{stats.streak}</span>
      </span>
    </div>
  );
}
