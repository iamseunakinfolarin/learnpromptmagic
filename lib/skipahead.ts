import type { ISODate, Progress, Stars } from "./progress";

/**
 * The Skip-ahead test, for learners who already use AI often. It reuses six
 * existing Prep Cook challenges, so it needs no content of its own, and it
 * touches no station stars: the only thing it can change is the passed flag.
 *
 * It covers all four Prep Cook stations. The ids are checked against the real
 * content in tests, so a renamed or removed challenge fails the build.
 */
export const SKIP_AHEAD_CHALLENGES = [
  "the-order-guess",
  "whos-cooking-rescue",
  "show-the-plate-guess",
  "plating-rescue",
  "whos-cooking-guess",
  "plating-guess",
] as const;

/** The test is passed with no more than this many wrong picks in all. */
export const MAX_WRONG_PICKS = 1;

/**
 * The wrong picks that a result implies. Guess the Recipe and Kitchen Rescue
 * both give 3 stars for none, 2 for one, and 1 for two or more, so that is as
 * much as the stars can say.
 */
export function wrongPicksFromStars(stars: Stars): number {
  if (stars === 3) return 0;
  if (stars === 2) return 1;
  return 2;
}

/** Whether a set of finished challenges, as stars, passes the test. */
export function skipAheadPassed(results: Stars[]): boolean {
  const wrong = results.reduce((sum, stars) => sum + wrongPicksFromStars(stars), 0);
  return wrong <= MAX_WRONG_PICKS;
}

/** Records a pass. A learner who has already passed keeps their first date. */
export function passSkipAhead(progress: Progress, date: ISODate): Progress {
  if (progress.skipAhead.passed) return progress;
  return { ...progress, skipAhead: { passed: true, passedAt: date } };
}
