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

/**
 * Replaces each {id} slot in the template with a single space followed by the
 * ingredient's text when it is on, and with nothing when it is off.
 */
export function assemblePrompt(
  template: string,
  ingredients: PromptIngredient[],
  selected: Iterable<string>,
): string {
  const on = new Set(selected);
  return template.replace(/\{([^{}]+)\}/g, (slot, slotId: string) => {
    const ingredient = ingredients.find((item) => item.id === slotId);
    if (!ingredient) return slot;
    return on.has(slotId) ? ` ${ingredient.text}` : "";
  });
}

/** The {slot} ids in a template, in the order they appear. */
export function templateSlots(template: string): string[] {
  return [...template.matchAll(/\{([^{}]+)\}/g)].map((match) => match[1]);
}
