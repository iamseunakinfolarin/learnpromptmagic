import { describe, expect, it } from "vitest";
import { freshProgress, type Progress, type Stars } from "../lib/progress";
import {
  buildSteps,
  canVisit,
  finishStep,
  firstUnfinishedStep,
  isStationFinished,
  isStepFinished,
  lastFinishedStep,
  stationStars,
} from "../lib/station";

const recipeId = "the-order";
const recipe = {
  stationChallengeIds: ["the-order-tk", "the-order-rescue", "the-order-guess", "the-order-inspect"],
};
const challenges = [
  { id: "the-order-tk", type: "test-kitchen" as const },
  { id: "the-order-rescue", type: "kitchen-rescue" as const },
  { id: "the-order-guess", type: "guess-the-recipe" as const },
  { id: "the-order-inspect", type: "health-inspector" as const },
];

const steps = buildSteps(recipe, challenges);
// 0 Order up, 1 TK, 2 Rescue, 3 Guess, 4 Inspect, 5 Plate up
const PLATE = 5;

/** Finishes a challenge the way the station does: stars saved, step moved on. */
function solve(progress: Progress, index: number, stars: Stars = 3): Progress {
  const step = steps[index];
  const withStars: Progress = {
    ...progress,
    challenges: {
      ...progress.challenges,
      [step.challengeId!]: { stars, attempts: 1, completedAt: "2026-01-01" },
    },
  };
  return finishStep(withStars, recipeId, index);
}

function playedThrough(): Progress {
  let progress = finishStep(freshProgress(), recipeId, 0);
  for (let index = 1; index <= 4; index++) progress = solve(progress, index);
  return progress;
}

describe("building the steps", () => {
  it("is Order up, the challenges in play order, then Plate up", () => {
    expect(steps.map((step) => step.label)).toEqual([
      "Order up",
      "Test Kitchen",
      "Kitchen Rescue",
      "Guess the Recipe",
      "Health Inspector",
      "Plate up",
    ]);
    expect(steps.map((step) => step.kind)).toEqual([
      "order", "challenge", "challenge", "challenge", "challenge", "plate",
    ]);
    expect(steps.map((step) => step.index)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("copes with a station of three challenges", () => {
    const three = buildSteps({ stationChallengeIds: ["a", "b", "c"] }, [
      { id: "a", type: "test-kitchen" },
      { id: "b", type: "kitchen-rescue" },
      { id: "c", type: "guess-the-recipe" },
    ]);
    expect(three).toHaveLength(5);
    expect(three.at(-1)?.kind).toBe("plate");
  });

  it("refuses a station that lists a challenge that does not exist", () => {
    expect(() => buildSteps({ stationChallengeIds: ["nope"] }, [])).toThrow(/nope/);
  });
});

describe("a new learner", () => {
  const progress = freshProgress();

  it("starts at Order up with nothing finished", () => {
    expect(lastFinishedStep(progress, recipeId)).toBe(-1);
    expect(firstUnfinishedStep(steps, progress, recipeId)).toBe(0);
    expect(isStationFinished(steps, progress, recipeId)).toBe(false);
  });

  it("can open Order up and nothing beyond it", () => {
    expect(canVisit(steps[0], steps, progress, recipeId)).toBe(true);
    expect(canVisit(steps[1], steps, progress, recipeId)).toBe(false);
    expect(canVisit(steps[PLATE], steps, progress, recipeId)).toBe(false);
  });
});

describe("advancing", () => {
  it("moves the resume point on as each step is finished", () => {
    let progress = freshProgress();
    progress = finishStep(progress, recipeId, 0);
    expect(firstUnfinishedStep(steps, progress, recipeId)).toBe(1);

    progress = solve(progress, 1);
    expect(firstUnfinishedStep(steps, progress, recipeId)).toBe(2);

    progress = solve(progress, 2);
    progress = solve(progress, 3);
    expect(firstUnfinishedStep(steps, progress, recipeId)).toBe(4);
  });

  it("writes the index of the last finished step", () => {
    let progress = finishStep(freshProgress(), recipeId, 0);
    progress = solve(progress, 1);
    expect(progress.stationSteps[recipeId]).toBe(1);
    expect(lastFinishedStep(progress, recipeId)).toBe(1);
  });

  it("lets a learner open what they have finished and the step they are up to", () => {
    let progress = finishStep(freshProgress(), recipeId, 0);
    progress = solve(progress, 1);
    expect(canVisit(steps[0], steps, progress, recipeId)).toBe(true);
    expect(canVisit(steps[1], steps, progress, recipeId)).toBe(true);
    expect(canVisit(steps[2], steps, progress, recipeId)).toBe(true);
    expect(canVisit(steps[3], steps, progress, recipeId)).toBe(false);
  });

  it("does not change the progress it was given", () => {
    const before = freshProgress();
    const snapshot = JSON.stringify(before);
    finishStep(before, recipeId, 0);
    expect(JSON.stringify(before)).toBe(snapshot);
  });
});

describe("resuming", () => {
  it("lands on the first unfinished step after a reload mid-station", () => {
    let progress = finishStep(freshProgress(), recipeId, 0);
    progress = solve(progress, 1);
    progress = solve(progress, 2);
    expect(firstUnfinishedStep(steps, progress, recipeId)).toBe(3);
  });

  it("does not trust a step count that has no saved result behind it", () => {
    // The station says Rescue is finished, but no stars were ever saved for it.
    const progress = finishStep(freshProgress(), recipeId, 2);
    expect(isStepFinished(steps[2], progress, recipeId)).toBe(false);
    expect(firstUnfinishedStep(steps, progress, recipeId)).toBe(1);
  });

  it("lands on Plate up once every challenge is done", () => {
    const progress = playedThrough();
    expect(firstUnfinishedStep(steps, progress, recipeId)).toBe(PLATE);
    expect(canVisit(steps[PLATE], steps, progress, recipeId)).toBe(true);
  });
});

describe("a finished station", () => {
  it("is finished once every challenge is done", () => {
    expect(isStationFinished(steps, playedThrough(), recipeId)).toBe(true);
  });

  it("stays finished after an earlier challenge is replayed", () => {
    let progress = playedThrough();
    progress = solve(progress, 1, 1);
    expect(lastFinishedStep(progress, recipeId)).toBe(4);
    expect(isStationFinished(steps, progress, recipeId)).toBe(true);
    expect(firstUnfinishedStep(steps, progress, recipeId)).toBe(PLATE);
  });

  it("never moves the step count backwards", () => {
    const progress = playedThrough();
    expect(finishStep(progress, recipeId, 0)).toBe(progress);
    expect(finishStep(progress, recipeId, 2)).toBe(progress);
    expect(finishStep(progress, recipeId, 4)).toBe(progress);
  });

  it("keeps stations separate from each other", () => {
    const progress = playedThrough();
    expect(lastFinishedStep(progress, "show-the-plate")).toBe(-1);
  });
});

describe("stars across a station", () => {
  it("adds up the best stars and the most that could be earned", () => {
    let progress = finishStep(freshProgress(), recipeId, 0);
    progress = solve(progress, 1, 2);
    progress = solve(progress, 2, 1);
    expect(stationStars(steps, progress)).toEqual({ earned: 3, possible: 12 });
  });

  it("reads the possible total from the station, not a fixed number", () => {
    const three = buildSteps({ stationChallengeIds: ["a", "b", "c"] }, [
      { id: "a", type: "test-kitchen" },
      { id: "b", type: "kitchen-rescue" },
      { id: "c", type: "guess-the-recipe" },
    ]);
    expect(stationStars(three, freshProgress())).toEqual({ earned: 0, possible: 9 });
  });
});
