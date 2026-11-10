import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

/**
 * Finding and reading the raw files under content/. The app loaders and the
 * content checks both go through here, so they can never disagree about which
 * files exist or where they live.
 */

export const contentDir = path.join(process.cwd(), "content");

export type ContentFile = {
  /** Absolute path on disk. */
  path: string;
  /** Path relative to the repository root, for messages people read. */
  label: string;
};

export type ChallengeFile = ContentFile & {
  /** The file name without .json, which must match the challenge id. */
  fileId: string;
  /** The folder name, which must match the challenge's recipeId. */
  folder: string;
};

export type DailyFile = ContentFile & { fileId: string };

export function contentFile(root: string, ...parts: string[]): ContentFile {
  const full = path.join(root, ...parts);
  return { path: full, label: path.relative(process.cwd(), full) || full };
}

export function readJson(file: ContentFile): unknown {
  let raw: string;
  try {
    raw = readFileSync(file.path, "utf8");
  } catch {
    throw new Error(`${file.label}: file is missing or cannot be read`);
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`${file.label}: not valid JSON (${reason})`);
  }
}

function jsonFilesIn(dir: string): string[] {
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return [];
  }
  return names.filter((name) => name.endsWith(".json")).sort();
}

function directoriesIn(dir: string): string[] {
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return [];
  }
  return names
    .filter((name) => statSync(path.join(dir, name)).isDirectory())
    .sort();
}

/** Every file under content/challenges, grouped by the folder it sits in. */
export function listChallengeFiles(root: string = contentDir): ChallengeFile[] {
  const base = path.join(root, "challenges");
  return directoriesIn(base).flatMap((folder) =>
    jsonFilesIn(path.join(base, folder)).map((name) => ({
      ...contentFile(base, folder, name),
      fileId: name.replace(/\.json$/, ""),
      folder,
    })),
  );
}

/** Every file under content/daily. */
export function listDailyFiles(root: string = contentDir): DailyFile[] {
  const base = path.join(root, "daily");
  return jsonFilesIn(base).map((name) => ({
    ...contentFile(base, name),
    fileId: name.replace(/\.json$/, ""),
  }));
}

/** Every JSON file under content/, used by the whole-file text scans. */
export function listAllContentFiles(root: string = contentDir): ContentFile[] {
  return [
    contentFile(root, "lines.json"),
    contentFile(root, "recipes.json"),
    contentFile(root, "daily-schedule.json"),
    contentFile(root, "off-the-menu.json"),
    contentFile(root, "home-demo.json"),
    ...listChallengeFiles(root),
    ...listDailyFiles(root),
  ];
}
