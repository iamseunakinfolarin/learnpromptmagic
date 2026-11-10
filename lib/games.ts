import { comboKey } from "./content/combos";
import type { TestKitchen } from "./content/schemas";

/**
 * Game logic that is not a star rule: what a Serve does in the Test Kitchen,
 * which output to show, and which hint to give. Pure, so it can be tested
 * without a page.
 */

/** The output for the ingredients that are switched on. */
export function outputFor(
  kitchen: Pick<TestKitchen, "outputs">,
  selected: Iterable<string>,
): string {
  const key = comboKey(selected);
  const output = kitchen.outputs[key];
  if (output === undefined) {
    throw new Error(`No output for the combination "${key}"`);
  }
  return output;
}

/**
 * Whether a combination satisfies the ticket. With nothing switched on the key
 * is "base", which can never be correct, whatever the content says.
 */
export function isCorrectCombo(
  kitchen: Pick<TestKitchen, "correctCombos">,
  selected: Iterable<string>,
): boolean {
  const key = comboKey(selected);
  if (key === "base") return false;
  return kitchen.correctCombos.includes(key);
}

export type ServeVerdict =
  | { correct: true }
  | {
      correct: false;
      /** The first ingredient, in file order, that the order is missing. */
      missing: TestKitchen["ingredients"][number] | null;
    };

function keyIds(key: string): string[] {
  return key === "base" ? [] : key.split("+");
}

/**
 * Judges a Serve. When the order is not right, finds the correct combination
 * nearest to it, then names the first ingredient (in file order) that the
 * learner has not switched on. A wrong order that is only missing nothing, such
 * as one with an extra ingredient, comes back with `missing: null`.
 */
export function judgeServe(
  kitchen: Pick<TestKitchen, "correctCombos" | "ingredients">,
  selected: Iterable<string>,
): ServeVerdict {
  const on = new Set(selected);
  if (isCorrectCombo(kitchen, on)) return { correct: true };

  let nearest: string[] = [];
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (const combo of kitchen.correctCombos) {
    const wanted = new Set(keyIds(combo));
    let distance = 0;
    for (const id of wanted) if (!on.has(id)) distance += 1;
    for (const id of on) if (!wanted.has(id)) distance += 1;
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = [...wanted];
    }
  }

  const missing =
    kitchen.ingredients.find(
      (ingredient) => nearest.includes(ingredient.id) && !on.has(ingredient.id),
    ) ?? null;

  return { correct: false, missing };
}

export type InspectionSummary = {
  kind: "good" | "hint";
  title: string;
  body: string;
};

/**
 * The words after a Health Inspector round. They say what happened and never
 * scold: a slip is "a slip", and nothing is called wrong.
 */
export function inspectionSummary(tally: {
  missed: unknown[];
  falseFlags: unknown[];
  slips: number;
}): InspectionSummary {
  if (tally.slips === 0) {
    return {
      kind: "good",
      title: "Clean inspection.",
      body: "You found every problem and flagged nothing by mistake.",
    };
  }

  const missed = tally.missed.length;
  const falseFlags = tally.falseFlags.length;
  const parts: string[] = [];
  if (missed > 0) {
    parts.push(missed === 1 ? "You missed one problem." : `You missed ${missed} problems.`);
  }
  if (falseFlags > 0) {
    parts.push(
      falseFlags === 1
        ? "One line you flagged was fine."
        : `${falseFlags} lines you flagged were fine.`,
    );
  }

  return {
    kind: "hint",
    title: tally.slips === 1 ? "One slip this time." : `${tally.slips} slips this time.`,
    body: parts.join(" "),
  };
}
