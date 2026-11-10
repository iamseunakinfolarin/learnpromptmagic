import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { allComboKeys, templateSlots } from "../lib/content/combos";
import {
  challengeSchema,
  dailyScheduleSchema,
  homeDemoSchema,
  isRealDate,
  linesSchema,
  offMenuSchema,
  recipesSchema,
  type Challenge,
  type DailySchedule,
  type Line,
  type OffMenuItem,
  type Recipe,
} from "../lib/content/schemas";
import {
  contentFile,
  listChallengeFiles,
  listDailyFiles,
  readJson,
  type ChallengeFile,
  type ContentFile,
  type DailyFile,
} from "../lib/content/files";
import { bannedWordsIn, hasStrayMagic } from "./banned-words";

/**
 * Every check under "Checks" in docs/content-model.md. Each failure carries
 * the file it came from and the reason, so a broken build says what to fix.
 */

export type Failure = { check: number; file: string; reason: string };

export type CheckOptions = {
  /** The content directory to check. */
  contentDir: string;
  /** Directories scanned for banned words, usually app, components, and lib. */
  codeDirs?: string[];
  /** The date "no future dates" is measured against. Defaults to today. */
  today?: string;
};

function localToday(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

type Schema<T> = { safeParse: (input: unknown) => SafeParseResult<T> };
type SafeParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: { issues: { path: PropertyKey[]; message: string }[] } };

function parseFile<T>(
  file: ContentFile,
  schema: Schema<T>,
  failures: Failure[],
): T | null {
  let raw: unknown;
  try {
    raw = readJson(file);
  } catch (error) {
    failures.push({
      check: 1,
      file: file.label,
      reason: error instanceof Error ? error.message.replace(`${file.label}: `, "") : String(error),
    });
    return null;
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    for (const issue of result.error.issues) {
      const where = issue.path.length ? issue.path.join(".") : "(root)";
      failures.push({
        check: 1,
        file: file.label,
        reason: `${where}: ${issue.message}`,
      });
    }
    return null;
  }
  return result.data;
}

function duplicates<T>(values: T[]): T[] {
  const seen = new Set<T>();
  const dupes = new Set<T>();
  for (const value of values) {
    if (seen.has(value)) dupes.add(value);
    seen.add(value);
  }
  return [...dupes];
}

/** Every string in a parsed JSON value, keys included. */
function stringsIn(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(stringsIn);
  if (typeof value === "object" && value !== null) {
    return Object.entries(value).flatMap(([key, item]) => [
      key,
      ...stringsIn(item),
    ]);
  }
  return [];
}

function codeFiles(dir: string): string[] {
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return [];
  }
  return names.flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return codeFiles(full);
    return /\.(ts|tsx|css)$/.test(name) ? [full] : [];
  });
}

export function runContentChecks(options: CheckOptions): Failure[] {
  const { contentDir } = options;
  const codeDirs = options.codeDirs ?? [];
  const today = options.today ?? localToday();
  const failures: Failure[] = [];
  const fail = (check: number, file: string, reason: string) =>
    failures.push({ check, file, reason });

  /* ---- Check 1: every file matches its type, with no extra fields ---- */

  const linesFile = contentFile(contentDir, "lines.json");
  const recipesFile = contentFile(contentDir, "recipes.json");
  const scheduleFile = contentFile(contentDir, "daily-schedule.json");
  const offMenuFile = contentFile(contentDir, "off-the-menu.json");
  const homeDemoFile = contentFile(contentDir, "home-demo.json");

  const lines: Line[] | null = parseFile(linesFile, linesSchema, failures);
  const recipes: Recipe[] | null = parseFile(recipesFile, recipesSchema, failures);
  const schedule: DailySchedule | null = parseFile(scheduleFile, dailyScheduleSchema, failures);
  const offMenu: OffMenuItem[] | null = parseFile(offMenuFile, offMenuSchema, failures);
  parseFile(homeDemoFile, homeDemoSchema, failures);

  const challengeFiles = listChallengeFiles(contentDir);
  const dailyFiles = listDailyFiles(contentDir);

  type LoadedChallenge = { file: ChallengeFile | DailyFile; value: Challenge };
  const stationChallenges: LoadedChallenge[] = [];
  const dailyChallenges: LoadedChallenge[] = [];

  for (const file of challengeFiles) {
    const value = parseFile(file, challengeSchema, failures);
    if (value) stationChallenges.push({ file, value });
  }
  for (const file of dailyFiles) {
    const value = parseFile(file, challengeSchema, failures);
    if (value) dailyChallenges.push({ file, value });
  }

  const allChallenges = [...stationChallenges, ...dailyChallenges];

  /* ---- Check 2: ids and numbers are unique ---- */

  if (lines) {
    for (const id of duplicates(lines.map((line) => line.id))) {
      fail(2, linesFile.label, `line id "${id}" is used more than once`);
    }
    for (const number of duplicates(lines.map((line) => line.number))) {
      fail(2, linesFile.label, `line number ${number} is used more than once`);
    }
  }

  if (recipes) {
    for (const id of duplicates(recipes.map((recipe) => recipe.id))) {
      fail(2, recipesFile.label, `recipe id "${id}" is used more than once`);
    }
    for (const number of duplicates(recipes.map((recipe) => recipe.number))) {
      fail(2, recipesFile.label, `recipe number ${number} is used more than once`);
    }
  }

  for (const id of duplicates(allChallenges.map((item) => item.value.id))) {
    const where = allChallenges
      .filter((item) => item.value.id === id)
      .map((item) => item.file.label)
      .join(", ");
    fail(2, where, `challenge id "${id}" is used more than once`);
  }

  for (const { file, value } of allChallenges) {
    const listIds: { name: string; ids: string[] }[] = [];
    if (value.type === "test-kitchen") {
      listIds.push({ name: "ingredients", ids: value.ingredients.map((i) => i.id) });
    } else if (value.type === "kitchen-rescue") {
      listIds.push({ name: "diagnoses", ids: value.diagnoses.map((d) => d.id) });
      listIds.push({ name: "fixes", ids: value.fixes.map((f) => f.id) });
    } else if (value.type === "guess-the-recipe") {
      listIds.push({ name: "options", ids: value.options.map((o) => o.id) });
    } else {
      listIds.push({ name: "sentences", ids: value.sentences.map((s) => s.id) });
    }
    for (const list of listIds) {
      for (const id of duplicates(list.ids)) {
        fail(2, file.label, `${list.name} id "${id}" is used more than once`);
      }
    }
  }

  /* ---- Check 3: opensAfter points at a line that exists ---- */

  if (lines) {
    const lineIds = new Set(lines.map((line) => line.id));
    for (const line of lines) {
      if (line.opensAfter !== null && !lineIds.has(line.opensAfter)) {
        fail(3, linesFile.label, `line "${line.id}" opensAfter "${line.opensAfter}", which is not a line`);
      }
      if (line.opensAfter === line.id) {
        fail(3, linesFile.label, `line "${line.id}" opensAfter itself`);
      }
    }
  }

  /* ---- Check 4: a recipe's line exists, and its release is not earlier ---- */

  if (lines && recipes) {
    const byId = new Map(lines.map((line) => [line.id, line]));
    for (const recipe of recipes) {
      const line = byId.get(recipe.line);
      if (!line) {
        fail(4, recipesFile.label, `recipe "${recipe.id}" is on line "${recipe.line}", which is not a line`);
        continue;
      }
      if (recipe.release < line.release) {
        fail(
          4,
          recipesFile.label,
          `recipe "${recipe.id}" is release ${recipe.release} but its line "${line.id}" is release ${line.release}`,
        );
      }
    }
  }

  /* ---- Check 5: challenge files sit where their ids say ---- */

  for (const { file, value } of stationChallenges) {
    const challengeFile = file as ChallengeFile;
    if (value.id !== challengeFile.fileId) {
      fail(5, file.label, `challenge id "${value.id}" does not match the file name "${challengeFile.fileId}.json"`);
    }
    if (value.recipeId !== challengeFile.folder) {
      fail(5, file.label, `recipeId "${value.recipeId}" does not match the folder "${challengeFile.folder}"`);
    }
  }

  for (const { file, value } of dailyChallenges) {
    if (value.id !== (file as DailyFile).fileId) {
      fail(5, file.label, `challenge id "${value.id}" does not match the file name "${(file as DailyFile).fileId}.json"`);
    }
  }

  /* ---- Check 6: a ready recipe's station challenges line up ---- */

  if (recipes) {
    const byId = new Map(stationChallenges.map((item) => [item.value.id, item]));
    const listed = new Set<string>();

    for (const recipe of recipes) {
      if (recipe.status !== "ready") continue;
      const ids = recipe.stationChallengeIds;
      if (ids.length < 3 || ids.length > 4) {
        fail(6, recipesFile.label, `recipe "${recipe.id}" lists ${ids.length} station challenges, which must be 3 or 4`);
      }
      for (const [index, id] of ids.entries()) {
        const found = byId.get(id);
        if (!found) {
          fail(6, recipesFile.label, `recipe "${recipe.id}" lists challenge "${id}", which is not in challenges/`);
          continue;
        }
        listed.add(id);
        if (found.value.recipeId !== recipe.id) {
          fail(6, recipesFile.label, `recipe "${recipe.id}" lists challenge "${id}", which belongs to "${found.value.recipeId}"`);
        }
        if (index === 0 && found.value.type !== "test-kitchen") {
          fail(6, found.file.label, `challenge "${id}" is the first step of "${recipe.id}", so it must be a test-kitchen, not ${found.value.type}`);
        }
        if (index > 0 && found.value.type === "test-kitchen") {
          fail(6, found.file.label, `challenge "${id}" is step ${index + 1} of "${recipe.id}", so it must not be a test-kitchen`);
        }
      }
    }

    for (const { file, value } of stationChallenges) {
      if (!listed.has(value.id)) {
        fail(6, file.label, `challenge "${value.id}" is not listed by any ready recipe`);
      }
    }
  }

  /* ---- Check 7: dailies and the schedule agree ---- */

  if (recipes) {
    const recipeIds = new Set(recipes.map((recipe) => recipe.id));
    for (const { file, value } of dailyChallenges) {
      if (!recipeIds.has(value.recipeId)) {
        fail(7, file.label, `recipeId "${value.recipeId}" is not a recipe`);
      }
    }
  }

  if (schedule) {
    const onDisk = new Set(dailyFiles.map((file) => file.fileId));
    for (const id of duplicates(schedule.order)) {
      fail(7, scheduleFile.label, `"${id}" is listed more than once`);
    }
    for (const id of schedule.order) {
      if (!onDisk.has(id)) {
        fail(7, scheduleFile.label, `"${id}" is listed but there is no content/daily/${id}.json`);
      }
    }
    const inSchedule = new Set(schedule.order);
    for (const file of dailyFiles) {
      if (!inSchedule.has(file.fileId)) {
        fail(7, file.label, `"${file.fileId}" is not listed in daily-schedule.json`);
      }
    }
  }

  /* ---- Check 8: Test Kitchen slots, outputs, and correct combinations ---- */

  for (const { file, value } of allChallenges) {
    if (value.type !== "test-kitchen") continue;

    const ids = value.ingredients.map((ingredient) => ingredient.id);
    const slots = templateSlots(value.promptTemplate);

    for (const id of ids) {
      const uses = slots.filter((slot) => slot === id).length;
      if (uses !== 1) {
        fail(8, file.label, `ingredient "${id}" appears ${uses} times as a {slot} in promptTemplate, which must be once`);
      }
    }
    for (const slot of new Set(slots)) {
      if (!ids.includes(slot)) {
        fail(8, file.label, `promptTemplate has a {${slot}} slot with no ingredient`);
      }
    }

    const expected = allComboKeys(ids);
    const actual = Object.keys(value.outputs);
    for (const key of expected) {
      if (!(key in value.outputs)) {
        fail(8, file.label, `outputs is missing the combination "${key}"`);
      }
    }
    for (const key of actual) {
      if (!expected.includes(key)) {
        fail(8, file.label, `outputs has "${key}", which is not a combination of these ingredients`);
      }
    }

    for (const key of duplicates(value.correctCombos)) {
      fail(8, file.label, `correctCombos lists "${key}" more than once`);
    }
    for (const key of value.correctCombos) {
      if (key === "base") {
        fail(8, file.label, `correctCombos includes "base", which cannot satisfy a ticket`);
      } else if (!(key in value.outputs)) {
        fail(8, file.label, `correctCombos lists "${key}", which is not a key in outputs`);
      }
    }
  }

  /* ---- Check 9: Kitchen Rescue answers exist ---- */

  for (const { file, value } of allChallenges) {
    if (value.type !== "kitchen-rescue") continue;
    if (!value.diagnoses.some((item) => item.id === value.correctDiagnosis)) {
      fail(9, file.label, `correctDiagnosis "${value.correctDiagnosis}" is not one of the diagnoses`);
    }
    if (!value.fixes.some((item) => item.id === value.correctFix)) {
      fail(9, file.label, `correctFix "${value.correctFix}" is not one of the fixes`);
    }
  }

  /* ---- Check 10: Guess the Recipe has four options and an answer ---- */

  for (const { file, value } of allChallenges) {
    if (value.type !== "guess-the-recipe") continue;
    if (value.options.length !== 4) {
      fail(10, file.label, `there are ${value.options.length} options, which must be exactly 4`);
    }
    if (!value.options.some((option) => option.id === value.correctOption)) {
      fail(10, file.label, `correctOption "${value.correctOption}" is not one of the options`);
    }
  }

  /* ---- Check 11: Health Inspector has both kinds of line ---- */

  const recipeIds = new Set((recipes ?? []).map((recipe) => recipe.id));
  for (const { file, value } of allChallenges) {
    if (value.type !== "health-inspector") continue;
    if (!value.sentences.some((sentence) => sentence.isProblem)) {
      fail(11, file.label, "no sentence is a problem, so there is nothing to find");
    }
    if (!value.sentences.some((sentence) => !sentence.isProblem)) {
      fail(11, file.label, "every sentence is a problem, so there is nothing to leave alone");
    }
    for (const sentence of value.sentences) {
      if (sentence.isProblem && recipes && !recipeIds.has(sentence.preventedBy)) {
        fail(11, file.label, `sentence "${sentence.id}" is preventedBy "${sentence.preventedBy}", which is not a recipe`);
      }
    }
  }

  /* ---- Checks 12 and 13: the word rules ---- */

  const textSources: { label: string; strings: string[] }[] = [];

  for (const file of [linesFile, recipesFile, scheduleFile, offMenuFile, homeDemoFile, ...challengeFiles, ...dailyFiles]) {
    let raw: unknown;
    try {
      raw = readJson(file);
    } catch {
      continue;
    }
    textSources.push({ label: file.label, strings: stringsIn(raw) });
  }

  for (const dir of codeDirs) {
    for (const full of codeFiles(dir)) {
      textSources.push({
        label: path.relative(process.cwd(), full) || full,
        strings: [readFileSync(full, "utf8")],
      });
    }
  }

  for (const source of textSources) {
    const banned = new Set<string>();
    let stray = false;
    for (const text of source.strings) {
      for (const word of bannedWordsIn(text)) banned.add(word);
      if (hasStrayMagic(text)) stray = true;
    }
    for (const word of banned) {
      fail(12, source.label, `uses the banned word "${word}"`);
    }
    if (stray) {
      fail(
        13,
        source.label,
        'uses the word "magic" outside the name Prompt Magic and the tagline "The magic is in how you ask."',
      );
    }
  }

  /* ---- Check 14: every date is real, and none is in the future ---- */

  const dates: { label: string; field: string; value: string }[] = [];

  if (recipes) {
    for (const recipe of recipes) {
      if (recipe.status === "ready") {
        dates.push({ label: recipesFile.label, field: `${recipe.id}.lastVerified`, value: recipe.lastVerified });
      }
    }
  }
  if (offMenu) {
    for (const item of offMenu) {
      if (item.lastVerified !== null) {
        dates.push({ label: offMenuFile.label, field: `${item.id}.lastVerified`, value: item.lastVerified });
      }
    }
  }
  if (schedule) {
    dates.push({ label: scheduleFile.label, field: "launchDate", value: schedule.launchDate });
  }
  for (const { file, value } of allChallenges) {
    dates.push({ label: file.label, field: "generatedBy.date", value: value.generatedBy.date });
  }

  for (const date of dates) {
    if (!isRealDate(date.value)) {
      fail(14, date.label, `${date.field} is "${date.value}", which is not a real YYYY-MM-DD date`);
      continue;
    }
    // launchDate is allowed to be ahead of today: it is when the site opens.
    if (date.field === "launchDate") continue;
    if (date.value > today) {
      fail(14, date.label, `${date.field} is "${date.value}", which is in the future`);
    }
  }

  return failures;
}

export function reportFailures(failures: Failure[], title: string): void {
  if (failures.length === 0) {
    console.log(`${title}: every check passed.`);
    return;
  }
  const byCheck = [...failures].sort((a, b) => a.check - b.check || a.file.localeCompare(b.file));
  console.error(`${title}: ${failures.length} problem${failures.length === 1 ? "" : "s"} found.\n`);
  for (const failure of byCheck) {
    console.error(`  check ${failure.check}  ${failure.file}`);
    console.error(`            ${failure.reason}`);
  }
  console.error("");
}
