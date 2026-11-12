import {
  challengeSchema,
  dailyScheduleSchema,
  homeDemoSchema,
  linesSchema,
  offMenuSchema,
  recipesSchema,
  type Challenge,
  type DailySchedule,
  type HomeDemo,
  type Line,
  type OffMenuItem,
  type ReadyRecipe,
  type Recipe,
} from "./schemas";
import type { UnlockRecipe } from "../unlocks";
import {
  contentDir,
  contentFile,
  listChallengeFiles,
  listDailyFiles,
  readJson,
  type ContentFile,
} from "./files";

/**
 * Typed loaders for everything in content/. Files are read and validated once
 * per process at build time, which is the only time these run: every route is
 * statically rendered.
 */

const cache = new Map<string, unknown>();

function loadOnce<T>(key: string, read: () => T): T {
  if (!cache.has(key)) cache.set(key, read());
  return cache.get(key) as T;
}

function parse<T>(
  file: ContentFile,
  schema: { parse: (input: unknown) => T },
): T {
  try {
    return schema.parse(readJson(file));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `${file.label} does not match the content model.\n${reason}\n` +
        `Run npm run check:content for the full report.`,
    );
  }
}

export function getLines(): Line[] {
  return loadOnce("lines", () =>
    parse(contentFile(contentDir, "lines.json"), linesSchema).sort(
      (a, b) => a.number - b.number,
    ),
  );
}

export function getRecipes(): Recipe[] {
  return loadOnce("recipes", () =>
    parse(contentFile(contentDir, "recipes.json"), recipesSchema).sort(
      (a, b) => a.number - b.number,
    ),
  );
}

export function getHomeDemo(): HomeDemo {
  return loadOnce("home-demo", () =>
    parse(contentFile(contentDir, "home-demo.json"), homeDemoSchema),
  );
}

export function getDailySchedule(): DailySchedule {
  return loadOnce("daily-schedule", () =>
    parse(contentFile(contentDir, "daily-schedule.json"), dailyScheduleSchema),
  );
}

export function getOffMenu(): OffMenuItem[] {
  return loadOnce("off-the-menu", () =>
    parse(contentFile(contentDir, "off-the-menu.json"), offMenuSchema),
  );
}

export function getStationChallenges(): Challenge[] {
  return loadOnce("challenges", () =>
    listChallengeFiles().map((file) => parse(file, challengeSchema)),
  );
}

export function getDailyChallenges(): Challenge[] {
  return loadOnce("daily-challenges", () =>
    listDailyFiles().map((file) => parse(file, challengeSchema)),
  );
}

/* ------------------------------------------------------------- lookups */

export function getLine(lineId: string): Line | undefined {
  return getLines().find((line) => line.id === lineId);
}

export function getRecipe(recipeId: string): Recipe | undefined {
  return getRecipes().find((recipe) => recipe.id === recipeId);
}

export function isReady(recipe: Recipe): recipe is ReadyRecipe {
  return recipe.status === "ready";
}

/** Recipes of a line, in station order. */
export function getRecipesInLine(lineId: string): Recipe[] {
  return getRecipes().filter((recipe) => recipe.line === lineId);
}

/** The recipes that get a page in this release. */
export function getRelease1Recipes(): Recipe[] {
  return getRecipes().filter((recipe) => recipe.release === 1);
}

export function getChallenge(challengeId: string): Challenge | undefined {
  return [...getStationChallenges(), ...getDailyChallenges()].find(
    (challenge) => challenge.id === challengeId,
  );
}

/** The challenges of a station, in the order the recipe lists them. */
export function getChallengesForRecipe(recipe: ReadyRecipe): Challenge[] {
  const byId = new Map(
    getStationChallenges().map((challenge) => [challenge.id, challenge]),
  );
  return recipe.stationChallengeIds
    .map((id) => byId.get(id))
    .filter((challenge): challenge is Challenge => challenge !== undefined);
}

/**
 * The lines and recipes as the map, the gate, and the Cookbook need them: plain
 * data, with each recipe's challenge ids, ready to hand to a component that runs
 * in the browser.
 */
export function getUnlockData(): { lines: Line[]; recipes: UnlockRecipe[] } {
  return {
    lines: getLines(),
    recipes: getRecipes().map((recipe) => ({
      id: recipe.id,
      line: recipe.line,
      number: recipe.number,
      name: recipe.name,
      technique: recipe.technique,
      release: recipe.release,
      status: recipe.status,
      stationChallengeIds: recipe.status === "ready" ? recipe.stationChallengeIds : [],
    })),
  };
}

export { pad2, stationLabel } from "./labels";
