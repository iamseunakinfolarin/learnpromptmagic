"use client";

import { useState } from "react";
import { promptSegments } from "@/lib/content/combos";
import type { TestKitchen as TestKitchenChallenge } from "@/lib/content/schemas";
import { judgeServe, outputFor } from "@/lib/games";
import type { Stars } from "@/lib/progress";
import { testKitchenStars } from "@/lib/scoring";
import Button from "../Button";
import Note from "../Note";
import Tag from "../Tag";
import Ticket from "../Ticket";
import ReplayButton from "./ReplayButton";
import ResultStars from "./ResultStars";
import StageHead from "./StageHead";
import { outputLabel, type GameProps } from "./types";

const NOT_QUITE =
  "That is not quite what the customer asked for. Read the ticket again for anything to add, or anything to leave out.";

/**
 * Test Kitchen. Switch ingredients on and off, and the order and the dish
 * change at once, because every output was made ahead of time. Nothing here
 * waits on a network.
 */
export default function TestKitchen({
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
}: GameProps<TestKitchenChallenge>) {
  const [on, setOn] = useState<string[]>([]);
  const [serves, setServes] = useState(0);
  const [solved, setSolved] = useState<Stars | null>(null);
  const [sentBack, setSentBack] = useState<string | null>(null);

  const ingredients = challenge.ingredients;
  const segments = promptSegments(challenge.promptTemplate, ingredients, on);

  function toggle(id: string) {
    const ingredient = ingredients.find((item) => item.id === id);
    if (!ingredient) return;
    const next = on.includes(id) ? on.filter((item) => item !== id) : [...on, id];
    setOn(next);
    if (solved === null) setSentBack(null);
    announce(
      `${ingredient.label} ${next.includes(id) ? "on" : "off"}. ` +
        `${next.length} of ${ingredients.length} ingredients on. The dish has changed.`,
    );
  }

  function serve() {
    const count = serves + 1;
    setServes(count);
    const verdict = judgeServe(challenge, on);

    if (verdict.correct) {
      const stars = testKitchenStars(count);
      setSolved(stars);
      setSentBack(null);
      onSolved(stars);
      announce(
        `Order up. That is exactly what the customer asked for. ` +
          `${stars} of 3 stars. ${challenge.explanation}`,
      );
      return;
    }

    const hint = verdict.missing ? verdict.missing.missingHint : NOT_QUITE;
    setSentBack(hint);
    announce(`Serve ${count}. Sent back by the customer. ${hint}`);
  }

  return (
    <>
      <StageHead
        step={step}
        total={total}
        title="Test Kitchen"
        lede="Switch ingredients on to build your order. When the dish matches the customer's ticket, serve it."
      />
      <div className="tk-grid">
        <div className="tk-col">
          <Ticket head="Customer's ticket">{challenge.ticket}</Ticket>
          <div className="stack">
            <p className="eyebrow" id="ingredients-label">
              Ingredients
            </p>
            <div className="knobs" role="group" aria-labelledby="ingredients-label">
              {ingredients.map((ingredient) => {
                const isOn = on.includes(ingredient.id);
                return (
                  <button
                    key={ingredient.id}
                    type="button"
                    role="switch"
                    aria-checked={isOn}
                    className="knob-btn"
                    onClick={() => toggle(ingredient.id)}
                  >
                    <span className="knob" aria-hidden="true" />
                    <span>
                      <span className="knob-label">{ingredient.label}</span>
                      <span className="knob-text">{ingredient.text}</span>
                    </span>
                    <span className="knob-state" aria-hidden="true">
                      {isOn ? "On" : "Off"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="tk-col">
          <Ticket head="Your order">
            {segments.map((segment, index) =>
              segment.added ? (
                <mark className="prompt-added" key={index}>
                  {segment.text}
                </mark>
              ) : (
                <span key={index}>{segment.text}</span>
              ),
            )}
          </Ticket>
          <Ticket head="From the kitchen" aside={<Tag>{outputLabel(challenge)}</Tag>}>
            {outputFor(challenge, on)}
          </Ticket>

          <div className="btn-row">
            {solved === null ? (
              <Button variant="primary" onClick={serve}>
                Serve it
              </Button>
            ) : (
              <Button variant="primary" onClick={onNext}>
                Next: {nextLabel}
              </Button>
            )}
            {serves > 0 ? (
              <span className="fine">
                Served {serves} {serves === 1 ? "time" : "times"}
              </span>
            ) : null}
          </div>

          {sentBack !== null && solved === null ? (
            <Note kind="hint" title="Sent back by the customer." live={false}>
              {sentBack}
            </Note>
          ) : null}

          {solved !== null ? (
            <div className="result">
              <Note kind="good" title="Order up! That is exactly what the customer asked for." live={false}>
                {challenge.explanation}
              </Note>
              {showStars ? <ResultStars stars={solved} best={best} /> : null}
              <ReplayButton onReplay={onReplay} />
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
