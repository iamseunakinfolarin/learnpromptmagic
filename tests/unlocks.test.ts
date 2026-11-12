import { describe, expect, it } from "vitest";
import { getUnlockData } from "../lib/content";
import { freshProgress, type Progress, type Stars } from "../lib/progress";
import {
  certificateEarned,
  currentRank,
  isLineFinished,
  isRecipeFinished,
  kitchenSummary,
  lineProgress,
  lineStatus,
  recipeStars,
  stationStatus,
  type UnlockRecipe,
} from "../lib/unlocks";
import type { Line } from "../lib/content/schemas";

/** A tiny kitchen: a starting rank, a rank after it, a certificate, and a Release 2 rank. */
const lines: Line[] = [
  { id: "prep", kind: "rank", number: 1, name: "Prep", release: 1, blurb: "b", opensAfter: null },
  { id: "sous", kind: "rank", number: 2, name: "Sous", release: 1, blurb: "b", opensAfter: "prep" },
  { id: "safety", kind: "certificate", number: 3, name: "Safety", release: 1, blurb: "b", opensAfter: "prep", certificateName: "Safety Certified" },
  { id: "head", kind: "rank", number: 4, name: "Head", release: 2, blurb: "b", opensAfter: "sous" },
];

function recipe(id: string, line: string, number: number, over: Partial<UnlockRecipe> = {}): UnlockRecipe {
  return {
    id, line, number, name: id, technique: "t", release: 1, status: "ready",
    stationChallengeIds: [`${id}-a`, `${id}-b`], ...over,
  };
}

const recipes: UnlockRecipe[] = [
  recipe("p1", "prep", 1),
  recipe("p2", "prep", 2),
  recipe("s1", "sous", 3),
  recipe("f1", "safety", 4),
  recipe("f2", "safety", 5),
  recipe("f3", "safety", 6, { release: 2, status: "planned", stationChallengeIds: [] }),
  recipe("h1", "head", 7, { release: 2, status: "planned", stationChallengeIds: [] }),
];

function finish(progress: Progress, ...recipeIds: string[]): Progress {
  const challenges = { ...progress.challenges };
  for (const id of recipeIds) {
    const r = recipes.find((item) => item.id === id)!;
    for (const challengeId of r.stationChallengeIds) {
      challenges[challengeId] = { stars: 2 as Stars, attempts: 1, completedAt: "2026-01-01" };
    }
  }
  return { ...progress, challenges };
}

const status = (id: string, progress: Progress) =>
  stationStatus(recipes.find((r) => r.id === id)!, lines, recipes, progress);
const lineOf = (id: string, progress: Progress) =>
  lineStatus(lines.find((l) => l.id === id)!, lines, recipes, progress);

describe("a new learner", () => {
  const progress = freshProgress();

  it("has only the starting line open", () => {
    expect(lineOf("prep", progress)).toBe("open");
    expect(lineOf("sous", progress)).toBe("locked");
    expect(lineOf("safety", progress)).toBe("locked");
  });

  it("sees Release 2 lines as coming soon, never locked or open", () => {
    expect(lineOf("head", progress)).toBe("soon");
  });

  it("can play the starting stations and not the locked ones", () => {
    expect(status("p1", progress)).toBe("open");
    expect(status("s1", progress)).toBe("locked");
    expect(status("f1", progress)).toBe("locked");
  });

  it("sees Release 2 stations as coming soon, and an unwritten one as being written", () => {
    expect(status("f3", progress)).toBe("soon");
    const unwritten = recipe("x", "prep", 9, { status: "planned", stationChallengeIds: [] });
    expect(stationStatus(unwritten, lines, [...recipes, unwritten], progress)).toBe("writing");
  });

  it("holds the first rank", () => {
    expect(currentRank(lines, recipes, progress)?.id).toBe("prep");
  });
});

describe("finishing stations", () => {
  it("finishes a station only when every challenge has a result", () => {
    const half = freshProgress();
    half.challenges["p1-a"] = { stars: 3, attempts: 1, completedAt: "2026-01-01" };
    expect(isRecipeFinished(recipes[0], half)).toBe(false);
    expect(isRecipeFinished(recipes[0], finish(freshProgress(), "p1"))).toBe(true);
  });

  it("never finishes a station that is not written, or has no challenges", () => {
    const planned = recipe("x", "prep", 9, { status: "planned", stationChallengeIds: [] });
    expect(isRecipeFinished(planned, freshProgress())).toBe(false);
  });

  it("marks a finished station done", () => {
    expect(status("p1", finish(freshProgress(), "p1"))).toBe("done");
  });

  it("finishes a line only when all its written Release 1 stations are", () => {
    expect(isLineFinished(lines[0], recipes, finish(freshProgress(), "p1"))).toBe(false);
    expect(isLineFinished(lines[0], recipes, finish(freshProgress(), "p1", "p2"))).toBe(true);
  });

  it("does not make a line wait for a Release 2 station", () => {
    // Safety has two written Release 1 stations and one Release 2 station.
    expect(isLineFinished(lines[2], recipes, finish(freshProgress(), "f1", "f2"))).toBe(true);
  });

  it("never finishes a line with nothing written in it", () => {
    expect(isLineFinished(lines[3], recipes, freshProgress())).toBe(false);
  });
});

describe("opening the next lines", () => {
  const prepDone = finish(freshProgress(), "p1", "p2");

  it("opens every line that follows a finished line", () => {
    expect(lineOf("sous", prepDone)).toBe("open");
    expect(lineOf("safety", prepDone)).toBe("open");
    expect(status("s1", prepDone)).toBe("open");
  });

  it("keeps a line locked while the one before it is unfinished", () => {
    expect(lineOf("sous", finish(freshProgress(), "p1"))).toBe("locked");
  });

  it("moves a learner up a rank when the next rank opens", () => {
    expect(currentRank(lines, recipes, prepDone)?.id).toBe("sous");
  });

  it("does not treat a certificate line as a rank", () => {
    expect(currentRank(lines, recipes, prepDone)?.kind).toBe("rank");
  });

  it("never opens a Release 2 line, however much is finished", () => {
    expect(lineOf("head", finish(prepDone, "s1"))).toBe("soon");
  });
});

describe("passing the Skip-ahead test", () => {
  const passed: Progress = { ...freshProgress(), skipAhead: { passed: true, passedAt: "2026-01-02" } };

  it("opens the lines after the starting rank without any stars", () => {
    expect(lineOf("sous", passed)).toBe("open");
    expect(lineOf("safety", passed)).toBe("open");
    expect(kitchenSummary(recipes, passed).stars).toBe(0);
  });

  it("does not finish the starting rank", () => {
    expect(isLineFinished(lines[0], recipes, passed)).toBe(false);
    expect(status("p1", passed)).toBe("open");
  });

  it("moves the rank up", () => {
    expect(currentRank(lines, recipes, passed)?.id).toBe("sous");
  });

  it("does not open a line that follows a different line", () => {
    // Head follows Sous, which the test does not count as done. It is Release 2 anyway.
    const wide: Line[] = [...lines.slice(0, 2), { ...lines[3], release: 1 }];
    expect(lineStatus(wide[2], wide, recipes, passed)).toBe("locked");
  });
});

describe("certificates", () => {
  it("is earned when a certificate line is finished", () => {
    expect(certificateEarned(lines[2], recipes, finish(freshProgress(), "f1"))).toBe(false);
    expect(certificateEarned(lines[2], recipes, finish(freshProgress(), "f1", "f2"))).toBe(true);
  });

  it("is never earned by a rank line", () => {
    expect(certificateEarned(lines[0], recipes, finish(freshProgress(), "p1", "p2"))).toBe(false);
  });
});

describe("stars and progress", () => {
  it("adds up a station's stars and what it could earn", () => {
    expect(recipeStars(recipes[0], finish(freshProgress(), "p1"))).toEqual({ earned: 4, possible: 6 });
  });

  it("counts finished stations in a line, over its Release 1 stations", () => {
    expect(lineProgress(lines[0], recipes, finish(freshProgress(), "p1"))).toEqual({ done: 1, total: 2 });
    expect(lineProgress(lines[2], recipes, freshProgress())).toEqual({ done: 0, total: 2 });
  });

  it("summarises the kitchen over Release 1 only", () => {
    expect(kitchenSummary(recipes, finish(freshProgress(), "p1"))).toEqual({
      stars: 4, stationsDone: 1, stationsTotal: 5,
    });
  });
});

describe("the real kitchen", () => {
  const real = getUnlockData();
  const realStatus = (id: string, progress: Progress) =>
    lineStatus(real.lines.find((l) => l.id === id)!, real.lines, real.recipes, progress);

  function finishLine(progress: Progress, lineId: string): Progress {
    const challenges = { ...progress.challenges };
    for (const r of real.recipes.filter((x) => x.line === lineId && x.release === 1)) {
      for (const id of r.stationChallengeIds) {
        challenges[id] = { stars: 3, attempts: 1, completedAt: "2026-01-01" };
      }
    }
    return { ...progress, challenges };
  }

  it("starts with Prep Cook open, Sous Chef and Kitchen Safety locked, and Head Chef soon", () => {
    const fresh = freshProgress();
    expect(realStatus("prep-cook", fresh)).toBe("open");
    expect(realStatus("sous-chef", fresh)).toBe("locked");
    expect(realStatus("kitchen-safety", fresh)).toBe("locked");
    expect(realStatus("head-chef", fresh)).toBe("soon");
  });

  it("opens Sous Chef and Kitchen Safety once Prep Cook is finished", () => {
    const done = finishLine(freshProgress(), "prep-cook");
    expect(realStatus("sous-chef", done)).toBe("open");
    expect(realStatus("kitchen-safety", done)).toBe("open");
    expect(currentRank(real.lines, real.recipes, done)?.id).toBe("sous-chef");
  });

  it("opens the same two lines when the Skip-ahead test is passed", () => {
    const skipped: Progress = { ...freshProgress(), skipAhead: { passed: true, passedAt: "2026-01-01" } };
    expect(realStatus("sous-chef", skipped)).toBe("open");
    expect(realStatus("kitchen-safety", skipped)).toBe("open");
  });

  it("earns Safety Certified by finishing the three Release 1 safety stations", () => {
    const safety = real.lines.find((l) => l.id === "kitchen-safety")!;
    expect(certificateEarned(safety, real.recipes, freshProgress())).toBe(false);
    expect(certificateEarned(safety, real.recipes, finishLine(freshProgress(), "kitchen-safety"))).toBe(true);
  });

  it("has all twelve Release 1 stations written, so none can read 'being written'", () => {
    const release1 = real.recipes.filter((r) => r.release === 1);
    expect(release1).toHaveLength(12);
    expect(release1.every((r) => r.status === "ready" && r.stationChallengeIds.length >= 3)).toBe(true);
  });
});
