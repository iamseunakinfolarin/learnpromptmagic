import type { Challenge, ReadyRecipe } from "./content/schemas";
import type { Progress } from "./progress";

/**
 * The step machine for a station: which steps it has, which are finished, and
 * where a learner resumes. Pure functions over Progress, so the rules can be
 * tested without a page.
 *
 * A station is [Order up, ...its challenges in play order, Plate up].
 * stationSteps[recipeId] holds the index of the last finished step, as the
 * content model says. It only ever moves forward, so replaying an earlier
 * challenge never un-finishes a station.
 */

export type StepKind = "order" | "challenge" | "plate";

export type Step = {
  index: number;
  kind: StepKind;
  label: string;
  /** Set on challenge steps. */
  challengeId?: string;
  challengeType?: Challenge["type"];
};

export const challengeLabels: Record<Challenge["type"], string> = {
  "test-kitchen": "Test Kitchen",
  "kitchen-rescue": "Kitchen Rescue",
  "guess-the-recipe": "Guess the Recipe",
  "health-inspector": "Health Inspector",
};

/** Builds the steps for a ready recipe, from its challenges in play order. */
export function buildSteps(
  recipe: Pick<ReadyRecipe, "stationChallengeIds">,
  challenges: Pick<Challenge, "id" | "type">[],
): Step[] {
  const byId = new Map(challenges.map((challenge) => [challenge.id, challenge]));
  const steps: Step[] = [{ index: 0, kind: "order", label: "Order up" }];

  for (const id of recipe.stationChallengeIds) {
    const challenge = byId.get(id);
    if (!challenge) throw new Error(`Station lists a missing challenge "${id}"`);
    steps.push({
      index: steps.length,
      kind: "challenge",
      label: challengeLabels[challenge.type],
      challengeId: id,
      challengeType: challenge.type,
    });
  }

  steps.push({ index: steps.length, kind: "plate", label: "Plate up" });
  return steps;
}

/** The index of the last finished step, or -1 when none is. */
export function lastFinishedStep(progress: Progress, recipeId: string): number {
  const saved = progress.stationSteps[recipeId];
  return typeof saved === "number" && Number.isInteger(saved) ? saved : -1;
}

/**
 * A step is finished once the station has moved past it. A challenge step also
 * needs a saved result, so a step count and the stars can never disagree.
 */
export function isStepFinished(
  step: Step,
  progress: Progress,
  recipeId: string,
): boolean {
  if (step.kind === "plate") return false;
  if (lastFinishedStep(progress, recipeId) < step.index) return false;
  if (step.kind === "challenge" && step.challengeId) {
    return progress.challenges[step.challengeId] !== undefined;
  }
  return true;
}

/** Where a learner lands: the first step not yet finished, or Plate up. */
export function firstUnfinishedStep(
  steps: Step[],
  progress: Progress,
  recipeId: string,
): number {
  for (const step of steps) {
    if (step.kind === "plate") return step.index;
    if (!isStepFinished(step, progress, recipeId)) return step.index;
  }
  return steps.length - 1;
}

/** A station is finished when every step before Plate up is. */
export function isStationFinished(
  steps: Step[],
  progress: Progress,
  recipeId: string,
): boolean {
  return steps
    .filter((step) => step.kind !== "plate")
    .every((step) => isStepFinished(step, progress, recipeId));
}

/**
 * A learner can open a step they have finished, the one they are up to, and
 * Plate up once the station is finished. They cannot skip ahead.
 */
export function canVisit(
  step: Step,
  steps: Step[],
  progress: Progress,
  recipeId: string,
): boolean {
  if (step.kind === "plate") return isStationFinished(steps, progress, recipeId);
  return (
    isStepFinished(step, progress, recipeId) ||
    step.index === firstUnfinishedStep(steps, progress, recipeId)
  );
}

/**
 * Marks a step finished. The index only moves forward, so finishing an earlier
 * step again, as a replay does, leaves the station where it was.
 */
export function finishStep(
  progress: Progress,
  recipeId: string,
  index: number,
): Progress {
  const current = lastFinishedStep(progress, recipeId);
  if (index <= current) return progress;
  return {
    ...progress,
    stationSteps: { ...progress.stationSteps, [recipeId]: index },
  };
}

/** The stars a station has earned, and the most it could earn. */
export function stationStars(
  steps: Step[],
  progress: Progress,
): { earned: number; possible: number } {
  const challengeSteps = steps.filter((step) => step.kind === "challenge");
  const earned = challengeSteps.reduce(
    (sum, step) =>
      sum + (step.challengeId ? (progress.challenges[step.challengeId]?.stars ?? 0) : 0),
    0,
  );
  return { earned, possible: challengeSteps.length * 3 };
}
