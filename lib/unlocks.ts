import type { Line, Recipe } from "./content/schemas";
import { totalStars, type Progress } from "./progress";

/**
 * Which stations and lines are open, finished, or locked, and what rank a
 * learner holds. All of it is worked out from saved progress each time and
 * never stored, as the content model says.
 *
 * Pure functions over plain data, so they can be tested without a page and run
 * in the browser without touching the file system.
 */

/** A recipe as the map needs it: the plain fields, and its challenge ids. */
export type UnlockRecipe = Pick<
  Recipe,
  "id" | "line" | "number" | "name" | "technique" | "release" | "status"
> & { stationChallengeIds: string[] };

export type LineStatus = "open" | "locked" | "soon";
export type StationStatus = "done" | "open" | "locked" | "soon" | "writing";

/** A station is finished once every one of its challenges has a saved result. */
export function isRecipeFinished(recipe: UnlockRecipe, progress: Progress): boolean {
  if (recipe.status !== "ready" || recipe.stationChallengeIds.length === 0) return false;
  return recipe.stationChallengeIds.every((id) => progress.challenges[id] !== undefined);
}

/** The Release 1 stations that are written. A line is finished when these are. */
function requiredRecipes(line: Pick<Line, "id">, recipes: UnlockRecipe[]): UnlockRecipe[] {
  return recipes.filter(
    (recipe) => recipe.line === line.id && recipe.release === 1 && recipe.status === "ready",
  );
}

/** A line is finished when all its written Release 1 stations are. */
export function isLineFinished(
  line: Pick<Line, "id">,
  recipes: UnlockRecipe[],
  progress: Progress,
): boolean {
  const required = requiredRecipes(line, recipes);
  return required.length > 0 && required.every((recipe) => isRecipeFinished(recipe, progress));
}

/** The rank every learner starts in: the rank line that opens from the start. */
export function startingRank(lines: Line[]): Line | undefined {
  return lines
    .filter((line) => line.kind === "rank" && line.opensAfter === null)
    .sort((a, b) => a.number - b.number)[0];
}

/**
 * Whether a line counts as done for opening the lines after it. Passing the
 * Skip-ahead test counts the starting rank as done, without any stars.
 */
function countsAsDone(
  line: Line,
  lines: Line[],
  recipes: UnlockRecipe[],
  progress: Progress,
): boolean {
  if (isLineFinished(line, recipes, progress)) return true;
  return progress.skipAhead.passed && startingRank(lines)?.id === line.id;
}

export function lineStatus(
  line: Line,
  lines: Line[],
  recipes: UnlockRecipe[],
  progress: Progress,
): LineStatus {
  if (line.release === 2) return "soon";
  if (line.opensAfter === null) return "open";
  const parent = lines.find((candidate) => candidate.id === line.opensAfter);
  if (!parent) return "locked";
  return countsAsDone(parent, lines, recipes, progress) ? "open" : "locked";
}

export function stationStatus(
  recipe: UnlockRecipe,
  lines: Line[],
  recipes: UnlockRecipe[],
  progress: Progress,
): StationStatus {
  if (recipe.release === 2) return "soon";
  if (recipe.status !== "ready") return "writing";
  if (isRecipeFinished(recipe, progress)) return "done";
  const line = lines.find((candidate) => candidate.id === recipe.line);
  if (!line) return "locked";
  return lineStatus(line, lines, recipes, progress) === "open" ? "open" : "locked";
}

/** The stars a station has earned, and the most it could earn. */
export function recipeStars(
  recipe: UnlockRecipe,
  progress: Progress,
): { earned: number; possible: number } {
  const earned = recipe.stationChallengeIds.reduce(
    (sum, id) => sum + (progress.challenges[id]?.stars ?? 0),
    0,
  );
  return { earned, possible: recipe.stationChallengeIds.length * 3 };
}

/** How far through a line a learner is, over every Release 1 station in it. */
export function lineProgress(
  line: Pick<Line, "id">,
  recipes: UnlockRecipe[],
  progress: Progress,
): { done: number; total: number } {
  const inLine = recipes.filter((recipe) => recipe.line === line.id && recipe.release === 1);
  return {
    done: inLine.filter((recipe) => isRecipeFinished(recipe, progress)).length,
    total: inLine.length,
  };
}

/** The highest rank line a learner has open. Fresh learners hold the first. */
export function currentRank(
  lines: Line[],
  recipes: UnlockRecipe[],
  progress: Progress,
): Line | undefined {
  return lines
    .filter((line) => line.kind === "rank" && lineStatus(line, lines, recipes, progress) === "open")
    .sort((a, b) => b.number - a.number)[0];
}

/** A certificate line earns its certificate when it is finished. */
export function certificateEarned(
  line: Line,
  recipes: UnlockRecipe[],
  progress: Progress,
): boolean {
  return line.kind === "certificate" && isLineFinished(line, recipes, progress);
}

/** The numbers for the top of the map. */
export function kitchenSummary(
  recipes: UnlockRecipe[],
  progress: Progress,
): { stars: number; stationsDone: number; stationsTotal: number } {
  const release1 = recipes.filter((recipe) => recipe.release === 1);
  return {
    stars: totalStars(progress),
    stationsDone: release1.filter((recipe) => isRecipeFinished(recipe, progress)).length,
    stationsTotal: release1.length,
  };
}
