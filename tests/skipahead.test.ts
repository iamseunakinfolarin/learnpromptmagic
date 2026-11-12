import { describe, expect, it } from "vitest";
import { getChallenge, getRecipe, getRecipesInLine } from "../lib/content";
import { freshProgress } from "../lib/progress";
import {
  MAX_WRONG_PICKS,
  SKIP_AHEAD_CHALLENGES,
  passSkipAhead,
  skipAheadPassed,
  wrongPicksFromStars,
} from "../lib/skipahead";

describe("the six challenges", () => {
  it("are six distinct challenges", () => {
    expect(SKIP_AHEAD_CHALLENGES).toHaveLength(6);
    expect(new Set(SKIP_AHEAD_CHALLENGES).size).toBe(6);
  });

  it("all exist, and are each a Guess the Recipe or a Kitchen Rescue", () => {
    for (const id of SKIP_AHEAD_CHALLENGES) {
      const challenge = getChallenge(id);
      expect(challenge, id).toBeDefined();
      expect(["guess-the-recipe", "kitchen-rescue"]).toContain(challenge!.type);
    }
  });

  it("all belong to Prep Cook stations, and cover all four of them", () => {
    const prepCook = new Set(getRecipesInLine("prep-cook").filter((r) => r.release === 1).map((r) => r.id));
    expect(prepCook.size).toBe(4);
    const covered = new Set<string>();
    for (const id of SKIP_AHEAD_CHALLENGES) {
      const recipeId = getChallenge(id)!.recipeId;
      expect(prepCook.has(recipeId), id).toBe(true);
      covered.add(recipeId);
    }
    expect(covered).toEqual(prepCook);
  });

  it("belong to stations that are written", () => {
    for (const id of SKIP_AHEAD_CHALLENGES) {
      expect(getRecipe(getChallenge(id)!.recipeId)?.status).toBe("ready");
    }
  });
});

describe("what stars say about wrong picks", () => {
  it("is none for 3 stars, one for 2, and two or more for 1", () => {
    expect(wrongPicksFromStars(3)).toBe(0);
    expect(wrongPicksFromStars(2)).toBe(1);
    expect(wrongPicksFromStars(1)).toBe(2);
  });
});

describe("passing", () => {
  it("allows no more than one wrong pick in all", () => {
    expect(MAX_WRONG_PICKS).toBe(1);
    expect(skipAheadPassed([3, 3, 3, 3, 3, 3])).toBe(true);
    expect(skipAheadPassed([3, 3, 2, 3, 3, 3])).toBe(true);
  });

  it("fails on two wrong picks, whether in one challenge or two", () => {
    expect(skipAheadPassed([3, 3, 1, 3, 3, 3])).toBe(false);
    expect(skipAheadPassed([2, 3, 2, 3, 3, 3])).toBe(false);
  });

  it("fails when every challenge went badly", () => {
    expect(skipAheadPassed([1, 1, 1, 1, 1, 1])).toBe(false);
  });
});

describe("recording a pass", () => {
  it("sets the flag and the date, and touches nothing else", () => {
    const before = freshProgress();
    const after = passSkipAhead(before, "2026-11-12");
    expect(after.skipAhead).toEqual({ passed: true, passedAt: "2026-11-12" });
    expect(after.challenges).toEqual(before.challenges);
    expect(after.daily).toEqual(before.daily);
  });

  it("keeps the first date when it is passed again", () => {
    const first = passSkipAhead(freshProgress(), "2026-11-12");
    expect(passSkipAhead(first, "2026-12-01")).toBe(first);
  });
});
