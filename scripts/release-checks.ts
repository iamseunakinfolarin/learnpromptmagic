import {
  dailyScheduleSchema,
  linesSchema,
  recipesSchema,
  type DailySchedule,
  type Line,
  type Recipe,
} from "../lib/content/schemas";
import {
  challengeSchema,
  type Challenge,
} from "../lib/content/schemas";
import {
  contentFile,
  listChallengeFiles,
  listDailyFiles,
  readJson,
} from "../lib/content/files";
import type { Failure } from "./content-checks";

/**
 * The extra rules from "Release check" in docs/content-model.md. These are
 * expected to fail until the launch phase, so they never run in prebuild.
 */

export type ReleaseCheckOptions = {
  contentDir: string;
  /** The real launch date, once it is known. */
  expectedLaunchDate?: string;
  /** How many dailies the schedule must list. */
  minimumDailies?: number;
};

export function runReleaseChecks(options: ReleaseCheckOptions): Failure[] {
  const { contentDir } = options;
  const minimumDailies = options.minimumDailies ?? 14;
  const failures: Failure[] = [];
  const fail = (file: string, reason: string) =>
    failures.push({ check: 15, file, reason });

  const linesFile = contentFile(contentDir, "lines.json");
  const recipesFile = contentFile(contentDir, "recipes.json");
  const scheduleFile = contentFile(contentDir, "daily-schedule.json");

  let lines: Line[] = [];
  let recipes: Recipe[] = [];
  let schedule: DailySchedule | null = null;

  try {
    lines = linesSchema.parse(readJson(linesFile));
  } catch {
    fail(linesFile.label, "could not be read; run npm run check:content first");
  }
  try {
    recipes = recipesSchema.parse(readJson(recipesFile));
  } catch {
    fail(recipesFile.label, "could not be read; run npm run check:content first");
  }
  try {
    schedule = dailyScheduleSchema.parse(readJson(scheduleFile));
  } catch {
    fail(scheduleFile.label, "could not be read; run npm run check:content first");
  }

  // Every Release 1 recipe is ready.
  for (const recipe of recipes) {
    if (recipe.release === 1 && recipe.status !== "ready") {
      fail(recipesFile.label, `recipe "${recipe.id}" is release 1 but still planned`);
    }
  }
  for (const line of lines) {
    if (line.release !== 1) continue;
    const inLine = recipes.filter((recipe) => recipe.line === line.id);
    if (inLine.length === 0) {
      fail(recipesFile.label, `line "${line.id}" is release 1 but has no recipes`);
    }
  }

  // No content is still a hand-written sample.
  const challengeFiles = [
    ...listChallengeFiles(contentDir),
    ...listDailyFiles(contentDir),
  ];
  for (const file of challengeFiles) {
    let challenge: Challenge;
    try {
      challenge = challengeSchema.parse(readJson(file));
    } catch {
      fail(file.label, "could not be read; run npm run check:content first");
      continue;
    }
    if (challenge.generatedBy.model === "sample") {
      fail(file.label, 'generatedBy.model is still "sample"');
    }
  }

  // The Daily Special has enough in the rotation, from the real launch date.
  if (schedule) {
    if (schedule.order.length < minimumDailies) {
      fail(
        scheduleFile.label,
        `lists ${schedule.order.length} dailies, which must be at least ${minimumDailies}`,
      );
    }
    if (options.expectedLaunchDate && schedule.launchDate !== options.expectedLaunchDate) {
      fail(
        scheduleFile.label,
        `launchDate is "${schedule.launchDate}" but the launch date is "${options.expectedLaunchDate}"`,
      );
    }
  }

  return failures;
}
