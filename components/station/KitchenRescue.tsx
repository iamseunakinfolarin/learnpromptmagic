"use client";

import { useState } from "react";
import type { KitchenRescue as KitchenRescueChallenge } from "@/lib/content/schemas";
import type { Stars } from "@/lib/progress";
import { rescueStars } from "@/lib/scoring";
import Button from "../Button";
import Note from "../Note";
import Tag from "../Tag";
import Ticket from "../Ticket";
import ChoiceList from "./ChoiceList";
import ReplayButton from "./ReplayButton";
import ResultStars from "./ResultStars";
import StageHead from "./StageHead";
import { outputLabel, type GameProps } from "./types";

type Phase = "diagnose" | "fix" | "done";

/**
 * Kitchen Rescue. An order went out and came back wrong. Step one is to say
 * why, step two is to pick the fix. A wrong pick in either step costs a star,
 * and the stars never drop below one.
 */
export default function KitchenRescue({
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
}: GameProps<KitchenRescueChallenge>) {
  const [phase, setPhase] = useState<Phase>("diagnose");
  const [wrongDiagnoses, setWrongDiagnoses] = useState<string[]>([]);
  const [wrongFixes, setWrongFixes] = useState<string[]>([]);
  const [stars, setStars] = useState<Stars | null>(null);

  const letterFor = (list: { id: string }[], id: string) =>
    String.fromCharCode(65 + list.findIndex((item) => item.id === id));

  function pickDiagnosis(id: string) {
    if (id === challenge.correctDiagnosis) {
      setPhase("fix");
      announce(`Right diagnosis. ${challenge.rightDiagnosisNote} Now pick the best fix.`);
      return;
    }
    setWrongDiagnoses((ids) => [...ids, id]);
    announce(
      `Option ${letterFor(challenge.diagnoses, id)} is not it. ${challenge.wrongDiagnosisHint}`,
    );
  }

  function pickFix(id: string) {
    if (id === challenge.correctFix) {
      const earned = rescueStars(wrongDiagnoses.length + wrongFixes.length);
      setStars(earned);
      setPhase("done");
      onSolved(earned);
      announce(`Rescued. ${earned} of 3 stars. ${challenge.explanation}`);
      return;
    }
    setWrongFixes((ids) => [...ids, id]);
    announce(`Option ${letterFor(challenge.fixes, id)} is not it. ${challenge.wrongFixHint}`);
  }

  return (
    <>
      <StageHead
        step={step}
        total={total}
        title="Kitchen Rescue"
        lede="This order went out and came back wrong. Work out why, then fix it."
      />

      {phase !== "done" ? (
        <div className="compare">
          <Ticket head="The order">{challenge.brokenPrompt}</Ticket>
          <Ticket head="What came back" aside={<Tag>{outputLabel(challenge)}</Tag>}>
            {challenge.brokenOutput}
          </Ticket>
        </div>
      ) : null}

      {phase === "diagnose" ? (
        <div className="stack">
          <p className="eyebrow">Question 1 of 2</p>
          <h3 className="q">What went wrong?</h3>
          <ChoiceList
            label="What went wrong"
            choices={challenge.diagnoses}
            wrongIds={wrongDiagnoses}
            onPick={pickDiagnosis}
          />
          {wrongDiagnoses.length > 0 ? (
            <Note kind="bad" title="Not quite." live={false}>
              {challenge.wrongDiagnosisHint}
            </Note>
          ) : null}
        </div>
      ) : null}

      {phase === "fix" ? (
        <>
          <Note kind="good" title="Right diagnosis." live={false}>
            {challenge.rightDiagnosisNote}
          </Note>
          <div className="stack">
            <p className="eyebrow">Question 2 of 2</p>
            <h3 className="q">Pick the best fix</h3>
            <ChoiceList
              label="Pick the best fix"
              mono
              choices={challenge.fixes.map((fix) => ({ id: fix.id, text: fix.prompt }))}
              wrongIds={wrongFixes}
              onPick={pickFix}
            />
            {wrongFixes.length > 0 ? (
              <Note kind="bad" title="That order still leaves the cook guessing." live={false}>
                {challenge.wrongFixHint}
              </Note>
            ) : null}
          </div>
        </>
      ) : null}

      {phase === "done" && stars !== null ? (
        <>
          <Note kind="good" title="Rescued." live={false}>
            {challenge.explanation}
          </Note>
          <div className="compare">
            <Ticket head="Before">{challenge.brokenOutput}</Ticket>
            <Ticket head="After the fix" aside={<Tag>{outputLabel(challenge)}</Tag>}>
              {challenge.fixedOutput}
            </Ticket>
          </div>
          <div className="result">
            {showStars ? <ResultStars stars={stars} best={best} /> : null}
            <div className="btn-row">
              <Button variant="primary" onClick={onNext}>
                Next: {nextLabel}
              </Button>
              <ReplayButton onReplay={onReplay} />
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
