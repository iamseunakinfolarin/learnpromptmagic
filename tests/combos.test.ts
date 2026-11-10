import { describe, expect, it } from "vitest";
import {
  allComboKeys,
  assemblePrompt,
  comboKey,
  promptSegments,
  templateSlots,
} from "../lib/content/combos";

/** The three ingredients from the worked example in docs/content-model.md. */
const ingredients = [
  { id: "trip", text: "for a 3-day school trip to the coast in June" },
  {
    id: "why",
    text: "I'm packing by myself for the first time, so only include what I really need.",
  },
  {
    id: "format",
    text: "Give it as a checklist under three headings.",
  },
];

const template = "Make a packing list{trip}.{why}{format}";

describe("comboKey", () => {
  it("is base when nothing is switched on", () => {
    expect(comboKey([])).toBe("base");
    expect(comboKey(new Set())).toBe("base");
  });

  it("sorts the ids alphabetically and joins them with a plus", () => {
    expect(comboKey(["trip", "format"])).toBe("format+trip");
    expect(comboKey(["why", "format", "trip"])).toBe("format+trip+why");
  });

  it("does not care which order the ids arrive in", () => {
    expect(comboKey(["format", "trip"])).toBe(comboKey(["trip", "format"]));
  });

  it("counts a repeated id once", () => {
    expect(comboKey(["trip", "trip"])).toBe("trip");
  });
});

describe("allComboKeys", () => {
  it("covers every combination, base included", () => {
    expect(allComboKeys(["trip", "why", "format"]).sort()).toEqual(
      [
        "base",
        "format",
        "format+trip",
        "format+trip+why",
        "format+why",
        "trip",
        "trip+why",
        "why",
      ].sort(),
    );
  });

  it("grows by a power of two", () => {
    expect(allComboKeys([]).length).toBe(1);
    expect(allComboKeys(["a", "b"]).length).toBe(4);
    expect(allComboKeys(["a", "b", "c", "d"]).length).toBe(16);
  });
});

describe("assemblePrompt", () => {
  it("matches the example in the content model", () => {
    expect(assemblePrompt(template, ingredients, ["trip"])).toBe(
      "Make a packing list for a 3-day school trip to the coast in June.",
    );
  });

  it("drops every slot that is switched off", () => {
    expect(assemblePrompt(template, ingredients, [])).toBe(
      "Make a packing list.",
    );
  });

  it("adds one space before each ingredient that is on", () => {
    expect(assemblePrompt(template, ingredients, ["trip", "format"])).toBe(
      "Make a packing list for a 3-day school trip to the coast in June." +
        " Give it as a checklist under three headings.",
    );
  });

  it("builds the same prompt whichever order the switches came on in", () => {
    const one = assemblePrompt(template, ingredients, ["why", "trip"]);
    const two = assemblePrompt(template, ingredients, ["trip", "why"]);
    expect(one).toBe(two);
  });

  it("leaves a slot alone when no ingredient claims it", () => {
    expect(assemblePrompt("Boil {rice}.", ingredients, ["rice"])).toBe(
      "Boil {rice}.",
    );
  });
});

describe("templateSlots", () => {
  it("lists the slots in the order they appear", () => {
    expect(templateSlots(template)).toEqual(["trip", "why", "format"]);
  });

  it("finds nothing in a template without slots", () => {
    expect(templateSlots("Make me lunch.")).toEqual([]);
  });
});

describe("promptSegments", () => {
  it("marks the words an ingredient added, and not the space before them", () => {
    expect(promptSegments(template, ingredients, ["trip"])).toEqual([
      { text: "Make a packing list", added: false },
      { text: " ", added: false },
      { text: "for a 3-day school trip to the coast in June", added: true },
      { text: ".", added: false },
    ]);
  });

  it("is only the plain template with nothing on", () => {
    expect(promptSegments(template, ingredients, [])).toEqual([
      { text: "Make a packing list", added: false },
      { text: ".", added: false },
    ]);
  });

  it("joins back into exactly what assemblePrompt gives, for every combination", () => {
    for (const key of allComboKeys(ingredients.map((item) => item.id))) {
      const on = key === "base" ? [] : key.split("+");
      const joined = promptSegments(template, ingredients, on)
        .map((segment) => segment.text)
        .join("");
      expect(joined, key).toBe(assemblePrompt(template, ingredients, on));
    }
  });

  it("keeps a slot that no ingredient claims", () => {
    expect(promptSegments("Boil {rice}.", ingredients, ["rice"])).toEqual([
      { text: "Boil ", added: false },
      { text: "{rice}", added: false },
      { text: ".", added: false },
    ]);
  });
});
