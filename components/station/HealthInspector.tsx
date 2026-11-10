"use client";

import Link from "next/link";
import { useState } from "react";
import type { HealthInspector as HealthInspectorChallenge } from "@/lib/content/schemas";
import { inspectionSummary } from "@/lib/games";
import type { Stars } from "@/lib/progress";
import { inspectorStars, inspectorTally, type InspectorTally } from "@/lib/scoring";
import Button from "../Button";
import { FlagIcon } from "../icons";
import Note from "../Note";
import Tag from "../Tag";
import Ticket from "../Ticket";
import ResultStars from "./ResultStars";
import StageHead from "./StageHead";
import type { GameProps } from "./types";

/** The recipes a problem can point to, for the "Prevented by" link. */
export type RecipeRef = { id: string; name: string; release: 1 | 2 };

type Problem = Extract<HealthInspectorChallenge["sentences"][number], { isProblem: true }>;

/** Plain names for the kinds of problem, which are a fixed list in the content model. */
const kindNames: Record<Problem["problemKind"], string> = {
  "made-up": "Made up",
  "ignored-order": "Ignored the order",
  "no-source": "No source",
  "private-detail": "Private detail",
  "scam-sign": "Scam sign",
  "hidden-instruction": "Hidden instruction",
};

const subject = {
  answer: { head: "The order", lines: "The answer, line by line" },
  prompt: { head: "The situation", lines: "The prompt, line by line" },
  message: { head: "The situation", lines: "The message, line by line" },
} as const;

function PreventedBy({ id, recipes }: { id: string; recipes: RecipeRef[] }) {
  const recipe = recipes.find((item) => item.id === id);
  if (!recipe) return null;
  return (
    <span>
      Prevented by the{" "}
      {recipe.release === 1 ? (
        <Link href={`/kitchen/${recipe.id}`}>{recipe.name}</Link>
      ) : (
        <>
          {recipe.name} <span className="fine">(coming soon)</span>
        </>
      )}{" "}
      recipe.
    </span>
  );
}

/**
 * Health Inspector. Tap every line that has a problem, then submit. Nothing is
 * revealed until the learner submits, and a round with a slip is described
 * plainly, never as wrong.
 */
export default function HealthInspector({
  challenge,
  step,
  total,
  best,
  nextLabel,
  onSolved,
  onNext,
  onReplay,
  announce,
  recipes,
}: GameProps<HealthInspectorChallenge> & { recipes: RecipeRef[] }) {
  const [flagged, setFlagged] = useState<string[]>([]);
  const [result, setResult] = useState<{ tally: InspectorTally; stars: Stars } | null>(null);

  const words = subject[challenge.inspecting];
  const submitted = result !== null;

  function toggle(id: string) {
    if (submitted) return;
    setFlagged((ids) => (ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]));
  }

  function submit() {
    const tally = inspectorTally(challenge.sentences, flagged);
    const stars = inspectorStars(tally.slips);
    const summary = inspectionSummary(tally);
    setResult({ tally, stars });
    onSolved(stars);
    announce(`${summary.title} ${summary.body} ${stars} of 3 stars.`);
  }

  const summary = result ? inspectionSummary(result.tally) : null;

  return (
    <>
      <StageHead
        step={step}
        total={total}
        title="Health Inspector"
        lede="Tap every line that has a problem. Tap again to take the flag off. Nothing is revealed until you submit."
      />

      <Ticket head={words.head}>{challenge.setup}</Ticket>

      <div className="stack">
        <p className="eyebrow">
          {words.lines}{" "}
          {challenge.inspecting === "answer" ? <Tag>Practice answer</Tag> : null}
        </p>
        <ul className="receipt">
          {challenge.sentences.map((sentence) => {
            const isFlagged = flagged.includes(sentence.id);
            const caught = result?.tally.caught.includes(sentence.id) ?? false;
            const falseFlag = result?.tally.falseFlags.includes(sentence.id) ?? false;
            const noteId = `note-${sentence.id}`;
            const hasNote = submitted && (sentence.isProblem || falseFlag);

            return (
              <li className="line-item" key={sentence.id}>
                <button
                  type="button"
                  className="line-btn"
                  aria-pressed={isFlagged}
                  aria-disabled={submitted || undefined}
                  aria-describedby={hasNote ? noteId : undefined}
                  onClick={() => toggle(sentence.id)}
                >
                  <FlagIcon />
                  <span>{sentence.text}</span>
                </button>

                {submitted && sentence.isProblem ? (
                  <p className="line-note" id={noteId}>
                    <b>
                      {caught ? "Caught" : "Missed"}: {kindNames[sentence.problemKind]}.
                    </b>
                    <span>{sentence.note}</span>
                    <PreventedBy id={sentence.preventedBy} recipes={recipes} />
                  </p>
                ) : null}
                {submitted && !sentence.isProblem && falseFlag ? (
                  <p className="line-note ok" id={noteId}>
                    <b>This line was fine.</b>
                    <span>Nothing is wrong here.</span>
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>

      {!submitted ? (
        <div className="btn-row">
          <Button variant="primary" onClick={submit}>
            Submit inspection
          </Button>
          <span className="fine">
            {flagged.length} {flagged.length === 1 ? "line" : "lines"} flagged
          </span>
        </div>
      ) : null}

      {submitted && summary && result ? (
        <div className="result">
          <Note kind={summary.kind} title={summary.title} live={false}>
            {summary.body}
          </Note>
          <Note kind="good" title="What to take from this." live={false}>
            {challenge.explanation}
          </Note>
          <ResultStars stars={result.stars} best={best} />
          <div className="btn-row">
            <Button variant="primary" onClick={onNext}>
              Next: {nextLabel}
            </Button>
            <button type="button" className="linkish" onClick={onReplay}>
              Play this one again
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
