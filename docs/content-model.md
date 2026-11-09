# Prompt Magic content model

This is the contract for everything in `/content`. Where it differs from the PRD, this file wins.

All lesson text lives in `/content` as JSON. IDs are permanent once launched, because saved progress points at them. Never rename or reuse an ID.

## Files

| Path | Holds |
| --- | --- |
| `content/lines.json` | `Line[]`, the groups of stations on the kitchen map |
| `content/recipes.json` | `Recipe[]`, one per station |
| `content/challenges/<recipeId>/<challengeId>.json` | One `Challenge` used in a station |
| `content/daily/<challengeId>.json` | One `Challenge` used as a Daily Special |
| `content/daily-schedule.json` | `DailySchedule` |
| `content/off-the-menu.json` | `OffMenuItem[]` |
| `content/home-demo.json` | `HomeDemo`, the vague and clear lunch orders on the home page |

## Types

```ts
type ISODate = string;  // "YYYY-MM-DD"
type Release = 1 | 2;   // 2 means after the first launch

// content/lines.json
// A line is a group of stations on the kitchen map. Ranks are lines a learner rises through.
// A certificate line is a side track that ends in a card, such as Kitchen Safety.
type LineBase = {
  id: string;                 // kebab-case
  number: number;             // order on the map, unique
  name: string;
  release: Release;
  blurb: string;
  opensAfter: string | null;  // a line id that must be finished first; null means open from the start
};
type Line =
  | (LineBase & { kind: "rank" })
  | (LineBase & { kind: "certificate"; certificateName: string });

// content/recipes.json
type RecipeBase = {
  id: string;           // kebab-case
  line: string;         // a line id
  number: number;       // station number, unique across all recipes; shown as "Station 07"
  name: string;
  technique: string;
  release: Release;     // never earlier than its line's release
};
type PlannedRecipe = RecipeBase & { status: "planned" };
type ReadyRecipe = RecipeBase & {
  status: "ready";
  oneLine: string;
  quick: string;                 // readable at age 10
  deeper: string[];              // 1 to 4 paragraphs
  recipeCard: { title: string; template: string; howTo: string };
  kitchenScience: { title: string; body: string };
  lastVerified: ISODate;
  stationChallengeIds: string[]; // 3 or 4 ids in play order; the first is a test-kitchen
};
type Recipe = PlannedRecipe | ReadyRecipe;

// "sample" means written by hand for the prototype. Phase 4 replaces samples with real model outputs.
type GeneratedBy = { model: string; date: ISODate };

type ChallengeBase = {
  id: string;
  recipeId: string;
  difficulty: 1 | 2 | 3;
  title: string;
  explanation: string;  // shown after the challenge is solved
  generatedBy: GeneratedBy;
};

type TestKitchen = ChallengeBase & {
  type: "test-kitchen";
  ticket: string;          // the customer's goal
  promptTemplate: string;  // one {ingredientId} slot per ingredient
  ingredients: { id: string; label: string; text: string; missingHint: string }[]; // 2 to 4
  outputs: Record<string, string>;  // exactly one per combination key
  correctCombos: string[];          // combination keys that satisfy the ticket
};

type KitchenRescue = ChallengeBase & {
  type: "kitchen-rescue";
  brokenPrompt: string;
  brokenOutput: string;
  diagnoses: { id: string; text: string }[];  // 3 or 4
  correctDiagnosis: string;
  wrongDiagnosisHint: string;
  rightDiagnosisNote: string;
  fixes: { id: string; prompt: string }[];    // 3 or 4
  correctFix: string;
  wrongFixHint: string;
  fixedOutput: string;
};

type GuessTheRecipe = ChallengeBase & {
  type: "guess-the-recipe";
  output: string;
  options: { id: string; prompt: string }[];  // exactly 4
  correctOption: string;
  wrongHint: string;
};

// Tap every line with a problem. Used for AI answers, for prompts about to be sent,
// and for messages (such as a scam) that the learner receives.
type HealthInspector = ChallengeBase & {
  type: "health-inspector";
  inspecting: "answer" | "prompt" | "message";
  setup: string;  // shown above the lines: the order an answer responded to, or the situation
  sentences: (
    | { id: string; text: string; isProblem: false }
    | {
        id: string;
        text: string;
        isProblem: true;
        problemKind:
          | "made-up" | "ignored-order" | "no-source"
          | "private-detail" | "scam-sign" | "hidden-instruction";
        note: string;
        preventedBy: string;  // a recipe id
      }
  )[];
};

type Challenge = TestKitchen | KitchenRescue | GuessTheRecipe | HealthInspector;

// content/daily-schedule.json
// Daily Special number N (counting launchDate as 1) plays order[(N - 1) % order.length].
type DailySchedule = { launchDate: ISODate; order: string[] };  // ids of files in content/daily

// content/off-the-menu.json
// lastVerified null means the claim is still being checked; the page shows a Draft tag.
type OffMenuItem = { id: string; name: string; whyRetired: string; lastVerified: ISODate | null };

// content/home-demo.json
type HomeDemo = {
  vague: { prompt: string; output: string };
  clear: { prompt: string; output: string };
};
```

## Combination keys and prompt assembly

- A combination key is the ids of the switched-on ingredients, sorted alphabetically and joined with `+`. With nothing on, the key is `base`. Example: `format+trip`.
- To assemble a prompt, replace each `{id}` slot in `promptTemplate` with a single space followed by that ingredient's text when it is on, or with nothing when it is off.
- Example: `Make a packing list{trip}.{why}{format}` with only `trip` on gives `Make a packing list for a 3-day school trip to the coast in June.`

## Display rules

- Options and fixes show in file order, labeled A, B, C, D. Explanations may refer to them by letter, so never shuffle them.
- A station's label is `Station` plus its number padded to two digits, such as `Station 01`.
- Health Inspector answers are written for practice. Always show a Practice tag on them.

## Checks

`scripts/check-content.ts` fails the build when any of these is false.

1. Every file matches its type above, with no extra fields.
2. These are unique: line ids, line numbers, recipe ids, recipe numbers, and challenge ids across `challenges/` and `daily/`. Ids are also unique within each list of ingredients, diagnoses, fixes, options, and sentences.
3. Every line's `opensAfter` is null or another existing line id.
4. Every recipe's `line` exists, and the recipe's `release` is not earlier than its line's.
5. A station challenge sits at `content/challenges/<recipeId>/<id>.json` and its `recipeId` matches the folder. A daily challenge sits at `content/daily/<id>.json`.
6. A ready recipe lists 3 or 4 `stationChallengeIds`. Each exists in `challenges/` and belongs to that recipe. The first is a `test-kitchen`, and the rest are not. Every file in `challenges/` is listed by a ready recipe.
7. Every daily challenge's `recipeId` is an existing recipe. `daily-schedule.json` lists at least one id, with no repeats. Every id it lists exists in `daily/`, and every file in `daily/` is listed.
8. Test Kitchen: 2 to 4 ingredients. Each ingredient id appears exactly once as a `{slot}` in `promptTemplate`, and there are no other slots. `outputs` has exactly one entry for every combination key, with no extras. `correctCombos` is not empty, has no repeats, uses only keys in `outputs`, and does not include `base`.
9. Kitchen Rescue: 3 or 4 diagnoses and 3 or 4 fixes. `correctDiagnosis` and `correctFix` exist in their lists.
10. Guess the Recipe: exactly 4 options, and `correctOption` exists.
11. Health Inspector: at least one sentence is a problem and at least one is not. Every `preventedBy` is an existing recipe id.
12. Banned words: no string in `content/`, and no `.ts`, `.tsx`, or `.css` file in `app/`, `components/`, or `lib/`, contains any of these as a whole word, ignoring case: spell, spells, wizard, wizards, witch, witches, witchcraft, sorcerer, sorcery, familiar, summon, conjure, enchant, enchanted, enchanting, potion, potions, hex, curse, cursed, grimoire, ritual, rituals, magical, magician.
13. The word "magic" (whole word, ignoring case) appears only in "Prompt Magic" or in the tagline "The magic is in how you ask."
14. Every date is a real `YYYY-MM-DD` date. No `lastVerified` or `generatedBy.date` is in the future.

### Release check

`npm run check:release` adds these, and must pass before launch (Phase 5):

- Every Release 1 recipe is ready.
- No content has `generatedBy.model` set to `sample`.
- `daily-schedule.json` lists at least 14 dailies, and `launchDate` is the real launch date.

## Progress on the device

Stored in `localStorage` under the key `pm:progress:v1`, and touched only by `lib/progress.ts`.

```ts
type Progress = {
  version: 1;
  startedAt: ISODate;
  challenges: Record<string, {      // challenge id
    stars: 1 | 2 | 3;               // best result so far
    attempts: number;
    completedAt: ISODate;
  }>;
  stationSteps: Record<string, number>;  // recipe id -> index of the last finished step
  skipAhead: { passed: boolean; passedAt: ISODate | null };
  daily: {
    last: ISODate | null;
    streak: number;
    best: number;
    results: Record<ISODate, { challengeId: string; stars: 1 | 2 | 3 }>;
  };
  settings: { deeperOpenByDefault: boolean };
};
```

Ranks, unlocks, and certificates are worked out from progress and never stored. Dates use the learner's local calendar date.
