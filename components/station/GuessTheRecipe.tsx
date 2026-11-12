"use client";

import { useState } from "react";
import type { GuessTheRecipe as GuessChallenge } from "@/lib/content/schemas";
import type { Stars } from "@/lib/progress";
import { guessStars } from "@/lib/scoring";
import Button from "../Button";
import Note from "../Note";
import Tag from "../Tag";
import Ticket from "../Ticket";
import ChoiceList from "./ChoiceList";
import ReplayButton from "./ReplayButton";
import ResultStars from "./ResultStars";
import StageHead from "./StageHead";
import { outputLabel, type GameProps } from "./types";

/**
 * Guess the Recipe. The kitchen served a dish, and the learner works backwards
 * to the order that produced it. Wrong options stay on the list, struck
 * through, so nobody picks the same one twice by accident.
 */
export default function GuessTheRecipe({
  challenge,
  step,
  total,
  best,
  nextLabel,
  onSolved,
  onNext,
  onReplay,
  showStars = true,
  announce,
}: GameProps<GuessChallenge>) {
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [stars, setStars] = useState<Stars | null>(null);

  const options = challenge.options.map((option) => ({ id: option.id, text: option.prompt }));
  const solved = stars !== null;

  function pick(id: string) {
    if (id === challenge.correctOption) {
      const earned = guessStars(wrongIds.length + 1);
      setStars(earned);
      onSolved(earned);
      announce(`Got it. ${earned} of 3 stars. ${challenge.explanation}`);
      return;
    }
    const letter = String.fromCharCode(65 + challenge.options.findIndex((option) => option.id === id));
    setWrongIds((ids) => [...ids, id]);
    announce(`Option ${letter} is not it. ${challenge.wrongHint}`);
  }

  return (
    <>
      <StageHead
        step={step}
        total={total}
        title="Guess the Recipe"
        lede="Here is what the kitchen served. Work backwards to the order that produced it."
      />
      <Ticket head="From the kitchen" aside={<Tag>{outputLabel(challenge)}</Tag>}>
        {challenge.output}
      </Ticket>

      <div className="stack">
        <h3 className="q">Which order made this?</h3>
        <ChoiceList
          label="Which order made this"
          mono
          choices={options}
          wrongIds={wrongIds}
          rightId={solved ? challenge.correctOption : null}
          locked={solved}
          onPick={pick}
        />
      </div>

      {!solved && wrongIds.length > 0 ? (
        <Note kind="bad" title="Not that one." live={false}>
          {challenge.wrongHint}
        </Note>
      ) : null}

      {solved ? (
        <div className="result">
          <Note kind="good" title="Got it." live={false}>
            {challenge.explanation}
          </Note>
          {showStars ? <ResultStars stars={stars} best={best} /> : null}
          <div className="btn-row">
            <Button variant="primary" onClick={onNext}>
              Next: {nextLabel}
            </Button>
            <ReplayButton onReplay={onReplay} />
          </div>
        </div>
      ) : null}
    </>
  );
}
