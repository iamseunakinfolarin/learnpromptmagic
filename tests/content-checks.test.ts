import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { runContentChecks, type Failure } from "../scripts/content-checks";
import { bannedWords } from "../scripts/banned-words";

/**
 * Each case under tests/fixtures holds only the files that differ from
 * tests/fixtures/base, so a bad fixture stays small enough to read.
 *
 * Fixtures write __BANNED__ and __MAGICWORD__ rather than the words
 * themselves, and they are swapped in here, so the repository never carries
 * a word the project does not allow.
 */
const fixtures = path.join(import.meta.dirname, "fixtures");
const temporary: string[] = [];

afterEach(() => {
  while (temporary.length > 0) {
    const dir = temporary.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

function substitute(dir: string): void {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) {
      substitute(full);
      continue;
    }
    const before = readFileSync(full, "utf8");
    const after = before
      .split("__BANNED__")
      .join(bannedWords[0])
      .split("__MAGICWORD__")
      .join("magic");
    if (after !== before) writeFileSync(full, after);
  }
}

function tree(...layers: string[]): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), "pm-fixture-"));
  temporary.push(dir);
  cpSync(path.join(fixtures, "base"), dir, { recursive: true });
  for (const layer of layers) {
    cpSync(path.join(fixtures, layer), dir, { recursive: true });
  }
  substitute(dir);
  return dir;
}

function check(...layers: string[]): Failure[] {
  return runContentChecks({
    contentDir: tree(...layers),
    codeDirs: [],
    today: "2026-06-01",
  });
}

function checkNumbers(failures: Failure[]): number[] {
  return [...new Set(failures.map((failure) => failure.check))].sort(
    (a, b) => a - b,
  );
}

describe("the base fixture", () => {
  it("passes every check", () => {
    expect(check()).toEqual([]);
  });
});

describe("each check catches its own case", () => {
  const cases: { fixture: string; check: number; reason: RegExp }[] = [
    { fixture: "01-extra-field", check: 1, reason: /unrecognized key|extra/i },
    { fixture: "02-duplicate-id", check: 2, reason: /used more than once/ },
    { fixture: "03-dangling-opens-after", check: 3, reason: /opensAfter/ },
    { fixture: "04-release-before-line", check: 4, reason: /release 1 but its line/ },
    { fixture: "05-wrong-file-name", check: 5, reason: /does not match the file name/ },
    { fixture: "06-test-kitchen-not-first", check: 6, reason: /must be a test-kitchen/ },
    { fixture: "07-unknown-daily", check: 7, reason: /there is no content\/daily/ },
    { fixture: "08-missing-output", check: 8, reason: /missing the combination/ },
    { fixture: "09-unknown-diagnosis", check: 9, reason: /correctDiagnosis/ },
    { fixture: "10-unknown-option", check: 10, reason: /correctOption/ },
    { fixture: "11-no-problem-sentence", check: 11, reason: /nothing to find/ },
    { fixture: "12-banned-word", check: 12, reason: /banned word/ },
    { fixture: "13-stray-magic", check: 13, reason: /outside the name/ },
    { fixture: "14-future-date", check: 14, reason: /in the future/ },
  ];

  for (const testCase of cases) {
    it(`check ${testCase.check} fails on ${testCase.fixture}`, () => {
      const failures = check(testCase.fixture);
      const mine = failures.filter(
        (failure) => failure.check === testCase.check,
      );
      expect(
        mine.length,
        `expected check ${testCase.check}, got checks ${checkNumbers(failures).join(", ") || "none"}`,
      ).toBeGreaterThan(0);
      expect(mine.some((failure) => testCase.reason.test(failure.reason))).toBe(
        true,
      );
      expect(mine[0].file).toMatch(/\.(json|ts)$/);
    });
  }
});

describe("the word rules reach the code as well as the content", () => {
  it("finds a banned word in a .ts file under the code directories", () => {
    const codeDir = mkdtempSync(path.join(os.tmpdir(), "pm-code-"));
    temporary.push(codeDir);
    cpSync(path.join(fixtures, "bad-code"), codeDir, { recursive: true });
    substitute(codeDir);

    const failures = runContentChecks({
      contentDir: tree(),
      codeDirs: [path.join(codeDir, "lib")],
      today: "2026-06-01",
    });

    const banned = failures.filter((failure) => failure.check === 12);
    expect(banned.length).toBe(1);
    expect(banned[0].file).toMatch(/sample\.ts$/);
  });
});

describe("the real content", () => {
  it("passes every check, with the code scanned too", () => {
    const root = path.join(import.meta.dirname, "..");
    const failures = runContentChecks({
      contentDir: path.join(root, "content"),
      codeDirs: [
        path.join(root, "app"),
        path.join(root, "components"),
        path.join(root, "lib"),
      ],
    });
    expect(failures).toEqual([]);
  });
});
