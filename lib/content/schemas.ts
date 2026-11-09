import { z } from "zod";

/**
 * Zod mirrors of the types in docs/content-model.md. Every object is strict,
 * so an unknown field is a failure rather than something that slips through.
 */

const text = z.string().min(1);
const id = text;
const kebabId = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be kebab-case");

export function isRealDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [, y, m, d] = match;
  const date = new Date(`${y}-${m}-${d}T00:00:00Z`);
  return (
    date.getUTCFullYear() === Number(y) &&
    date.getUTCMonth() + 1 === Number(m) &&
    date.getUTCDate() === Number(d)
  );
}

export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "must look like YYYY-MM-DD")
  .refine(isRealDate, "must be a real calendar date");

export const release = z.union([z.literal(1), z.literal(2)]);

/* ---------------------------------------------------------------- lines */

const lineBase = {
  id: kebabId,
  number: z.number().int().positive(),
  name: text,
  release,
  blurb: text,
  opensAfter: z.union([kebabId, z.null()]),
};

export const rankLineSchema = z.strictObject({
  ...lineBase,
  kind: z.literal("rank"),
});

export const certificateLineSchema = z.strictObject({
  ...lineBase,
  kind: z.literal("certificate"),
  certificateName: text,
});

export const lineSchema = z.discriminatedUnion("kind", [
  rankLineSchema,
  certificateLineSchema,
]);

export const linesSchema = z.array(lineSchema);

/* -------------------------------------------------------------- recipes */

const recipeBase = {
  id: kebabId,
  line: kebabId,
  number: z.number().int().positive(),
  name: text,
  technique: text,
  release,
};

export const plannedRecipeSchema = z.strictObject({
  ...recipeBase,
  status: z.literal("planned"),
});

export const readyRecipeSchema = z.strictObject({
  ...recipeBase,
  status: z.literal("ready"),
  oneLine: text,
  quick: text,
  deeper: z.array(text).min(1).max(4),
  recipeCard: z.strictObject({
    title: text,
    template: text,
    howTo: text,
  }),
  kitchenScience: z.strictObject({
    title: text,
    body: text,
  }),
  lastVerified: isoDate,
  stationChallengeIds: z.array(id).min(3).max(4),
});

export const recipeSchema = z.discriminatedUnion("status", [
  plannedRecipeSchema,
  readyRecipeSchema,
]);

export const recipesSchema = z.array(recipeSchema);

/* ----------------------------------------------------------- challenges */

export const generatedBySchema = z.strictObject({
  model: text,
  date: isoDate,
});

const challengeBase = {
  id,
  recipeId: kebabId,
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  title: text,
  explanation: text,
  generatedBy: generatedBySchema,
};

export const testKitchenSchema = z.strictObject({
  ...challengeBase,
  type: z.literal("test-kitchen"),
  ticket: text,
  promptTemplate: text,
  ingredients: z
    .array(
      z.strictObject({
        id,
        label: text,
        text,
        missingHint: text,
      }),
    )
    .min(2)
    .max(4),
  outputs: z.record(z.string(), text),
  correctCombos: z.array(text).min(1),
});

export const kitchenRescueSchema = z.strictObject({
  ...challengeBase,
  type: z.literal("kitchen-rescue"),
  brokenPrompt: text,
  brokenOutput: text,
  diagnoses: z.array(z.strictObject({ id, text })).min(3).max(4),
  correctDiagnosis: id,
  wrongDiagnosisHint: text,
  rightDiagnosisNote: text,
  fixes: z.array(z.strictObject({ id, prompt: text })).min(3).max(4),
  correctFix: id,
  wrongFixHint: text,
  fixedOutput: text,
});

export const guessTheRecipeSchema = z.strictObject({
  ...challengeBase,
  type: z.literal("guess-the-recipe"),
  output: text,
  options: z.array(z.strictObject({ id, prompt: text })).length(4),
  correctOption: id,
  wrongHint: text,
});

export const problemKinds = [
  "made-up",
  "ignored-order",
  "no-source",
  "private-detail",
  "scam-sign",
  "hidden-instruction",
] as const;

const plainSentenceSchema = z.strictObject({
  id,
  text,
  isProblem: z.literal(false),
});

const problemSentenceSchema = z.strictObject({
  id,
  text,
  isProblem: z.literal(true),
  problemKind: z.enum(problemKinds),
  note: text,
  preventedBy: kebabId,
});

export const healthInspectorSchema = z.strictObject({
  ...challengeBase,
  type: z.literal("health-inspector"),
  inspecting: z.enum(["answer", "prompt", "message"]),
  setup: text,
  sentences: z
    .array(
      z.discriminatedUnion("isProblem", [
        plainSentenceSchema,
        problemSentenceSchema,
      ]),
    )
    .min(2),
});

export const challengeSchema = z.discriminatedUnion("type", [
  testKitchenSchema,
  kitchenRescueSchema,
  guessTheRecipeSchema,
  healthInspectorSchema,
]);

/* ------------------------------------------------------ the other files */

export const dailyScheduleSchema = z.strictObject({
  launchDate: isoDate,
  order: z.array(id).min(1),
});

export const offMenuItemSchema = z.strictObject({
  id: kebabId,
  name: text,
  whyRetired: text,
  lastVerified: z.union([isoDate, z.null()]),
});

export const offMenuSchema = z.array(offMenuItemSchema);

export const homeDemoSchema = z.strictObject({
  vague: z.strictObject({ prompt: text, output: text }),
  clear: z.strictObject({ prompt: text, output: text }),
});

/* ---------------------------------------------------------------- types */

export type Line = z.infer<typeof lineSchema>;
export type Recipe = z.infer<typeof recipeSchema>;
export type PlannedRecipe = z.infer<typeof plannedRecipeSchema>;
export type ReadyRecipe = z.infer<typeof readyRecipeSchema>;
export type Challenge = z.infer<typeof challengeSchema>;
export type TestKitchen = z.infer<typeof testKitchenSchema>;
export type KitchenRescue = z.infer<typeof kitchenRescueSchema>;
export type GuessTheRecipe = z.infer<typeof guessTheRecipeSchema>;
export type HealthInspector = z.infer<typeof healthInspectorSchema>;
export type DailySchedule = z.infer<typeof dailyScheduleSchema>;
export type OffMenuItem = z.infer<typeof offMenuItemSchema>;
export type HomeDemo = z.infer<typeof homeDemoSchema>;
export type Release = z.infer<typeof release>;
