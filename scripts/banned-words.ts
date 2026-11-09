/**
 * The word list from docs/content-model.md, check 12.
 *
 * This file sits in scripts/ on purpose. The scan covers content/ and the
 * .ts, .tsx, and .css files under app/, components/, and lib/, so the list
 * itself is the one place in the project allowed to name these words.
 */
export const bannedWords = [
  "spell",
  "spells",
  "wizard",
  "wizards",
  "witch",
  "witches",
  "witchcraft",
  "sorcerer",
  "sorcery",
  "familiar",
  "summon",
  "conjure",
  "enchant",
  "enchanted",
  "enchanting",
  "potion",
  "potions",
  "hex",
  "curse",
  "cursed",
  "grimoire",
  "ritual",
  "rituals",
  "magical",
  "magician",
] as const;

/** The only two places the word "magic" is allowed to appear. */
export const allowedMagicPhrases = [
  "Prompt Magic",
  "The magic is in how you ask.",
] as const;

export function bannedWordsIn(text: string): string[] {
  const pattern = new RegExp(`\\b(?:${bannedWords.join("|")})\\b`, "gi");
  const found = new Set<string>();
  for (const match of text.matchAll(pattern)) found.add(match[0].toLowerCase());
  return [...found];
}

/** True when "magic" is used outside the name and the tagline. */
export function hasStrayMagic(text: string): boolean {
  let stripped = text;
  for (const phrase of allowedMagicPhrases) {
    stripped = stripped.split(phrase).join(" ");
  }
  return /\bmagic\b/i.test(stripped);
}
