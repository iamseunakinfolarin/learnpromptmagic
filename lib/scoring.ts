import type { Stars } from "./progress";

/**
 * Every star rule in the project lives in this file. Components pass in what
 * happened and get stars back, and never work stars out for themselves.
 *
 * Stars are always 1, 2, or 3. A learner who finishes a challenge always earns
 * at least one.
 */

function toStars(value: number): Stars {
  if (value >= 3) return 3;
  if (value <= 1) return 1;
  return Math.round(value) as Stars;
}

/**
 * Test Kitchen. `serves` counts every press of Serve up to and including the
 * one that was correct: 3 stars for the first, 2 for the second, 1 after that.
 */
export function testKitchenStars(serves: number): Stars {
  return toStars(4 - Math.max(1, serves));
}

/**
 * Kitchen Rescue. Starts at 3 and loses 1 for each wrong pick across both
 * steps, never going below 1.
 */
export function rescueStars(wrongPicks: number): Stars {
  return toStars(3 - Math.max(0, wrongPicks));
}

/**
 * Guess the Recipe. `tries` counts every pick up to and including the right
 * one: 3 stars on the first, 2 on the second, 1 after that.
 */
export function guessStars(tries: number): Stars {
  return toStars(4 - Math.max(1, tries));
}

/**
 * Health Inspector. A slip is one problem that was missed or one line that
 * was flagged when it was fine. No slips earns 3, exactly one earns 2, and
 * anything more earns 1.
 */
export function inspectorStars(slips: number): Stars {
  return toStars(3 - Math.max(0, slips));
}

export type InspectableSentence = { id: string; isProblem: boolean };

export type InspectorTally = {
  /** Problems the learner did not flag. */
  missed: string[];
  /** Lines the learner flagged that had nothing wrong with them. */
  falseFlags: string[];
  /** Problems the learner flagged. */
  caught: string[];
  slips: number;
};

/** Compares what the learner flagged with what was actually wrong. */
export function inspectorTally(
  sentences: InspectableSentence[],
  flagged: Iterable<string>,
): InspectorTally {
  const flaggedIds = new Set(flagged);
  const missed: string[] = [];
  const falseFlags: string[] = [];
  const caught: string[] = [];

  for (const sentence of sentences) {
    const isFlagged = flaggedIds.has(sentence.id);
    if (sentence.isProblem && isFlagged) caught.push(sentence.id);
    else if (sentence.isProblem) missed.push(sentence.id);
    else if (isFlagged) falseFlags.push(sentence.id);
  }

  return {
    missed,
    falseFlags,
    caught,
    slips: missed.length + falseFlags.length,
  };
}
