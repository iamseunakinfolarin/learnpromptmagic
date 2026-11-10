/**
 * Combination keys and prompt assembly, exactly as docs/content-model.md
 * describes them. A Test Kitchen stores one output per combination key, so
 * these two functions decide which output a learner sees.
 */

/**
 * The ids of the switched-on ingredients, sorted alphabetically and joined
 * with "+". With nothing on, the key is "base".
 */
export function comboKey(selected: Iterable<string>): string {
  const ids = [...selected];
  if (ids.length === 0) return "base";
  return [...new Set(ids)].sort().join("+");
}

/** Every combination key for a list of ingredient ids, "base" first. */
export function allComboKeys(ingredientIds: string[]): string[] {
  const keys: string[] = [];
  const total = 2 ** ingredientIds.length;
  for (let mask = 0; mask < total; mask++) {
    const on = ingredientIds.filter((_, i) => (mask & (1 << i)) !== 0);
    keys.push(comboKey(on));
  }
  return keys;
}

export type PromptIngredient = { id: string; text: string };

/** A piece of an assembled prompt, and whether an ingredient put it there. */
export type PromptSegment = { text: string; added: boolean };

/**
 * Assembles a prompt as pieces, so a page can mark which words came from an
 * ingredient. Each {id} slot becomes a single space followed by that
 * ingredient's text when it is on, and nothing when it is off.
 */
export function promptSegments(
  template: string,
  ingredients: PromptIngredient[],
  selected: Iterable<string>,
): PromptSegment[] {
  const on = new Set(selected);
  const segments: PromptSegment[] = [];
  let cursor = 0;

  const pushPlain = (text: string) => {
    if (text) segments.push({ text, added: false });
  };

  for (const match of template.matchAll(/\{([^{}]+)\}/g)) {
    const [slot, slotId] = match;
    const start = match.index ?? 0;
    pushPlain(template.slice(cursor, start));
    cursor = start + slot.length;

    const ingredient = ingredients.find((item) => item.id === slotId);
    if (!ingredient) {
      pushPlain(slot);
    } else if (on.has(slotId)) {
      pushPlain(" ");
      segments.push({ text: ingredient.text, added: true });
    }
  }

  pushPlain(template.slice(cursor));
  return segments;
}

/**
 * Replaces each {id} slot in the template with a single space followed by the
 * ingredient's text when it is on, or with nothing when it is off.
 */
export function assemblePrompt(
  template: string,
  ingredients: PromptIngredient[],
  selected: Iterable<string>,
): string {
  return promptSegments(template, ingredients, selected)
    .map((segment) => segment.text)
    .join("");
}

/** The {slot} ids in a template, in the order they appear. */
export function templateSlots(template: string): string[] {
  return [...template.matchAll(/\{([^{}]+)\}/g)].map((match) => match[1]);
}
