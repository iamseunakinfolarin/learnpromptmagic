import { describe, expect, it } from "vitest";
import { allComboKeys, comboKey } from "../lib/content/combos";
import { getChallenge } from "../lib/content";
import type { TestKitchen } from "../lib/content/schemas";
import { inspectionSummary, isCorrectCombo, judgeServe, outputFor } from "../lib/games";

function realKitchen(): TestKitchen {
  const challenge = getChallenge("the-order-tk");
  if (!challenge || challenge.type !== "test-kitchen") {
    throw new Error("the-order-tk is not a Test Kitchen");
  }
  return challenge;
}

/** A kitchen with two correct combinations, which the real content lacks. */
const twoWays: Pick<TestKitchen, "correctCombos" | "ingredients" | "outputs"> = {
  correctCombos: ["a+b", "b+c"],
  ingredients: [
    { id: "a", label: "A", text: "a", missingHint: "Add a." },
    { id: "b", label: "B", text: "b", missingHint: "Add b." },
    { id: "c", label: "C", text: "c", missingHint: "Add c." },
  ],
  outputs: {
    base: "base out",
    a: "a out",
    b: "b out",
    c: "c out",
    "a+b": "ab out",
    "a+c": "ac out",
    "b+c": "bc out",
    "a+b+c": "abc out",
  },
};

describe("Test Kitchen output selection, on the real content", () => {
  const kitchen = realKitchen();
  const ids = kitchen.ingredients.map((ingredient) => ingredient.id);

  it("has an output for every combination key", () => {
    for (const key of allComboKeys(ids)) {
      expect(kitchen.outputs[key], `output for "${key}"`).toBeTypeOf("string");
    }
  });

  it("maps every way of switching ingredients to the output the content gives", () => {
    const total = 2 ** ids.length;
    for (let mask = 0; mask < total; mask++) {
      const on = ids.filter((_, index) => (mask & (1 << index)) !== 0);
      expect(outputFor(kitchen, on)).toBe(kitchen.outputs[comboKey(on)]);
    }
  });

  it("shows the same output whichever order the switches were turned on", () => {
    expect(outputFor(kitchen, ["trip", "format"])).toBe(
      outputFor(kitchen, ["format", "trip"]),
    );
  });

  it("shows the base output with nothing on", () => {
    expect(outputFor(kitchen, [])).toBe(kitchen.outputs.base);
  });

  it("throws on a combination the content does not cover", () => {
    expect(() => outputFor({ outputs: { base: "x" } }, ["trip"])).toThrow(
      /No output for the combination "trip"/,
    );
  });
});

describe("what counts as correct, on the real content", () => {
  const kitchen = realKitchen();

  it("accepts the combination the ticket needs", () => {
    expect(isCorrectCombo(kitchen, ["trip", "why", "format"])).toBe(true);
    expect(judgeServe(kitchen, ["format", "why", "trip"])).toEqual({ correct: true });
  });

  it("rejects every other combination", () => {
    for (const key of allComboKeys(kitchen.ingredients.map((i) => i.id))) {
      if (kitchen.correctCombos.includes(key)) continue;
      const on = key === "base" ? [] : key.split("+");
      expect(isCorrectCombo(kitchen, on), key).toBe(false);
    }
  });

  it("never treats base as correct, even if the content listed it", () => {
    expect(isCorrectCombo({ correctCombos: ["base"] }, [])).toBe(false);
    expect(kitchen.correctCombos).not.toContain("base");
  });
});

describe("the hint after a wrong Serve", () => {
  const kitchen = realKitchen();

  it("names the first missing ingredient in file order", () => {
    const verdict = judgeServe(kitchen, []);
    expect(verdict.correct).toBe(false);
    if (!verdict.correct) expect(verdict.missing?.id).toBe("trip");
  });

  it("skips ingredients that are already on", () => {
    const verdict = judgeServe(kitchen, ["trip"]);
    if (!verdict.correct) expect(verdict.missing?.id).toBe("why");

    const next = judgeServe(kitchen, ["trip", "why"]);
    if (!next.correct) expect(next.missing?.id).toBe("format");
  });

  it("gives the hint text that belongs to the missing ingredient", () => {
    const verdict = judgeServe(kitchen, ["trip", "format"]);
    expect(verdict.correct).toBe(false);
    if (!verdict.correct) {
      expect(verdict.missing?.id).toBe("why");
      expect(verdict.missing?.missingHint).toBe(
        kitchen.ingredients.find((i) => i.id === "why")?.missingHint,
      );
    }
  });
});

describe("with more than one correct combination", () => {
  it("accepts either of them", () => {
    expect(isCorrectCombo(twoWays, ["a", "b"])).toBe(true);
    expect(isCorrectCombo(twoWays, ["c", "b"])).toBe(true);
    expect(isCorrectCombo(twoWays, ["a", "c"])).toBe(false);
  });

  it("measures a wrong order against the nearest correct one", () => {
    // Only "c" is on: "b+c" is one step away, "a+b" is three.
    const verdict = judgeServe(twoWays, ["c"]);
    expect(verdict.correct).toBe(false);
    if (!verdict.correct) expect(verdict.missing?.id).toBe("b");
  });

  it("returns no missing ingredient when the order only has one too many", () => {
    const verdict = judgeServe(twoWays, ["a", "b", "c"]);
    expect(verdict.correct).toBe(false);
    if (!verdict.correct) expect(verdict.missing).toBeNull();
  });
});

describe("the words after a Health Inspector round", () => {
  it("is plain praise for a clean round", () => {
    const summary = inspectionSummary({ missed: [], falseFlags: [], slips: 0 });
    expect(summary.kind).toBe("good");
    expect(summary.title).toBe("Clean inspection.");
  });

  it("says 'you missed one' for a single missed problem", () => {
    const summary = inspectionSummary({ missed: ["s4"], falseFlags: [], slips: 1 });
    expect(summary.kind).toBe("hint");
    expect(summary.title).toBe("One slip this time.");
    expect(summary.body).toBe("You missed one problem.");
  });

  it("says a flagged line was fine for a single false flag", () => {
    const summary = inspectionSummary({ missed: [], falseFlags: ["s1"], slips: 1 });
    expect(summary.title).toBe("One slip this time.");
    expect(summary.body).toBe("One line you flagged was fine.");
  });

  it("names both kinds of slip when a round has both", () => {
    const summary = inspectionSummary({ missed: ["s4"], falseFlags: ["s1"], slips: 2 });
    expect(summary.title).toBe("2 slips this time.");
    expect(summary.body).toBe("You missed one problem. One line you flagged was fine.");
  });

  it("counts several of each", () => {
    const summary = inspectionSummary({
      missed: ["a", "b"],
      falseFlags: ["c", "d", "e"],
      slips: 5,
    });
    expect(summary.body).toBe("You missed 2 problems. 3 lines you flagged were fine.");
  });

  it("never scolds, whatever the round", () => {
    const rounds = [
      { missed: [], falseFlags: [], slips: 0 },
      { missed: ["a"], falseFlags: [], slips: 1 },
      { missed: [], falseFlags: ["a"], slips: 1 },
      { missed: ["a", "b"], falseFlags: ["c"], slips: 3 },
    ];
    for (const round of rounds) {
      const summary = inspectionSummary(round);
      expect(`${summary.title} ${summary.body}`).not.toMatch(/wrong|incorrect|mistake!|fail/i);
    }
  });
});
