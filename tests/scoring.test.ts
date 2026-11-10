import { describe, expect, it } from "vitest";
import {
  guessStars,
  inspectorStars,
  inspectorTally,
  rescueStars,
  testKitchenStars,
} from "../lib/scoring";

describe("Test Kitchen stars", () => {
  it("gives 3 when the first Serve is correct", () => {
    expect(testKitchenStars(1)).toBe(3);
  });

  it("gives 2 when the second Serve is", () => {
    expect(testKitchenStars(2)).toBe(2);
  });

  it("gives 1 from the third Serve on, and never less", () => {
    expect(testKitchenStars(3)).toBe(1);
    expect(testKitchenStars(4)).toBe(1);
    expect(testKitchenStars(40)).toBe(1);
  });

  it("treats a count below one as the first Serve", () => {
    expect(testKitchenStars(0)).toBe(3);
    expect(testKitchenStars(-2)).toBe(3);
  });
});

describe("Kitchen Rescue stars", () => {
  it("starts at 3 with no wrong picks", () => {
    expect(rescueStars(0)).toBe(3);
  });

  it("loses 1 for each wrong pick", () => {
    expect(rescueStars(1)).toBe(2);
    expect(rescueStars(2)).toBe(1);
  });

  it("never drops below 1", () => {
    expect(rescueStars(3)).toBe(1);
    expect(rescueStars(7)).toBe(1);
  });

  it("counts wrong picks from both steps together", () => {
    const wrongDiagnoses = 1;
    const wrongFixes = 1;
    expect(rescueStars(wrongDiagnoses + wrongFixes)).toBe(1);
  });

  it("ignores a negative count", () => {
    expect(rescueStars(-1)).toBe(3);
  });
});

describe("Guess the Recipe stars", () => {
  it("gives 3 on the first try, 2 on the second, 1 after that", () => {
    expect(guessStars(1)).toBe(3);
    expect(guessStars(2)).toBe(2);
    expect(guessStars(3)).toBe(1);
    expect(guessStars(4)).toBe(1);
  });

  it("treats a count below one as the first try", () => {
    expect(guessStars(0)).toBe(3);
  });
});

describe("Health Inspector stars", () => {
  it("gives 3 for no slips, 2 for exactly one, 1 otherwise", () => {
    expect(inspectorStars(0)).toBe(3);
    expect(inspectorStars(1)).toBe(2);
    expect(inspectorStars(2)).toBe(1);
    expect(inspectorStars(5)).toBe(1);
  });
});

describe("Health Inspector tally", () => {
  const sentences = [
    { id: "s1", isProblem: false },
    { id: "s2", isProblem: true },
    { id: "s3", isProblem: false },
    { id: "s4", isProblem: true },
    { id: "s5", isProblem: false },
  ];

  it("is clean when every problem is flagged and nothing else is", () => {
    const tally = inspectorTally(sentences, ["s2", "s4"]);
    expect(tally.slips).toBe(0);
    expect(tally.caught).toEqual(["s2", "s4"]);
    expect(inspectorStars(tally.slips)).toBe(3);
  });

  it("counts one missed problem as one slip", () => {
    const tally = inspectorTally(sentences, ["s2"]);
    expect(tally.missed).toEqual(["s4"]);
    expect(tally.falseFlags).toEqual([]);
    expect(tally.slips).toBe(1);
    expect(inspectorStars(tally.slips)).toBe(2);
  });

  it("counts one false flag as one slip", () => {
    const tally = inspectorTally(sentences, ["s2", "s4", "s1"]);
    expect(tally.missed).toEqual([]);
    expect(tally.falseFlags).toEqual(["s1"]);
    expect(tally.slips).toBe(1);
    expect(inspectorStars(tally.slips)).toBe(2);
  });

  it("counts a miss and a false flag together as two slips", () => {
    const tally = inspectorTally(sentences, ["s2", "s1"]);
    expect(tally.missed).toEqual(["s4"]);
    expect(tally.falseFlags).toEqual(["s1"]);
    expect(tally.slips).toBe(2);
    expect(inspectorStars(tally.slips)).toBe(1);
  });

  it("scores flagging nothing as every problem missed", () => {
    const tally = inspectorTally(sentences, []);
    expect(tally.missed).toEqual(["s2", "s4"]);
    expect(tally.slips).toBe(2);
    expect(inspectorStars(tally.slips)).toBe(1);
  });

  it("scores flagging everything as every fine line flagged", () => {
    const tally = inspectorTally(sentences, ["s1", "s2", "s3", "s4", "s5"]);
    expect(tally.falseFlags).toEqual(["s1", "s3", "s5"]);
    expect(tally.slips).toBe(3);
    expect(inspectorStars(tally.slips)).toBe(1);
  });

  it("ignores ids that are not in the challenge", () => {
    const tally = inspectorTally(sentences, ["s2", "s4", "nope"]);
    expect(tally.slips).toBe(0);
  });
});
