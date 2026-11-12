"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { GuessTheRecipe, KitchenRescue as KitchenRescueChallenge } from "@/lib/content/schemas";
import { formatDate } from "@/lib/content/labels";
import { load, save, today, type Stars } from "@/lib/progress";
import { MAX_WRONG_PICKS, passSkipAhead, skipAheadPassed } from "@/lib/skipahead";
import Button, { ButtonLink } from "./Button";
import Note from "./Note";
import Panel from "./Panel";
import GuessTheRecipeGame from "./station/GuessTheRecipe";
import KitchenRescueGame from "./station/KitchenRescue";
import { useHydrated } from "./useHydrated";
import { useProgress } from "./useProgress";

export type SkipAheadItem = GuessTheRecipe | KitchenRescueChallenge;

type Phase = "intro" | "running" | "result";

/**
 * The Skip-ahead test: six Prep Cook challenges for a learner who already uses
 * AI often. It reuses the station games, awards no stars, and changes one thing
 * only, the passed flag, which opens the lines that follow Prep Cook.
 */
export default function SkipAhead({ items }: { items: SkipAheadItem[] }) {
  const progress = useProgress();
  const known = useHydrated();

  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Stars[]>([]);
  const [runKey, setRunKey] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const focusPending = useRef(false);

  useEffect(() => {
    if (!focusPending.current) return;
    focusPending.current = false;
    window.scrollTo(0, 0);
    document.getElementById("stage-title")?.focus();
  }, [phase, index, runKey]);

  const passedBefore = progress.skipAhead.passed;
  const passed = skipAheadPassed(results);
  const last = items.length - 1;

  function begin() {
    focusPending.current = true;
    setResults([]);
    setIndex(0);
    setRunKey((key) => key + 1);
    setPhase("running");
  }

  function finish() {
    focusPending.current = true;
    if (skipAheadPassed(results)) {
      save(passSkipAhead(load(), today()));
      setAnnouncement("You passed the Skip-ahead test. Sous Chef and Kitchen Safety are open.");
    } else {
      setAnnouncement("Not this time. That was more than one wrong pick.");
    }
    setPhase("result");
  }

  function next() {
    // Once a second wrong pick is in, the test cannot be passed, so it ends.
    if (index >= last || !skipAheadPassed(results)) {
      finish();
      return;
    }
    focusPending.current = true;
    setIndex(index + 1);
  }

  const item = items[index];

  return (
    <div className="view">
      <div className="view-head">
        <p className="eyebrow">For learners who already use AI often</p>
        <h1 className="view-title">Skip-ahead test</h1>
      </div>

      <div className="stage">
        {phase === "intro" ? (
          !known ? (
            <p className="lede" role="status">
              Checking your kitchen.
            </p>
          ) : (
            <Panel className="stack" labelledBy="stage-title">
              <h2 id="stage-title" tabIndex={-1}>
                {passedBefore ? "You have already passed" : "Prove you can order"}
              </h2>
              {passedBefore ? (
                <>
                  <p>
                    You passed on {formatDate(progress.skipAhead.passedAt ?? "")}. Sous Chef and
                    Kitchen Safety are open.
                  </p>
                  <div className="btn-row">
                    <ButtonLink href="/kitchen" variant="primary">
                      Go to the kitchen
                    </ButtonLink>
                  </div>
                </>
              ) : (
                <>
                  <p>
                    Six short challenges from Prep Cook. You can get {MAX_WRONG_PICKS} pick wrong in
                    all. Pass, and Sous Chef and Kitchen Safety open up.
                  </p>
                  <p className="fine">
                    The test gives no stars, and every Prep Cook station stays open to play.
                  </p>
                  <div className="btn-row">
                    <Button variant="primary" onClick={begin}>
                      Start the test
                    </Button>
                    <ButtonLink href="/kitchen/the-order">Start with Prep Cook instead</ButtonLink>
                  </div>
                </>
              )}
            </Panel>
          )
        ) : null}

        {phase === "running" && item ? (
          item.type === "guess-the-recipe" ? (
            <GuessTheRecipeGame
              key={`${runKey}:${item.id}`}
              challenge={item}
              step={index + 1}
              total={items.length}
              best={0}
              showStars={false}
              nextLabel={index >= last || !passed ? "Your result" : `Challenge ${index + 2}`}
              onSolved={(stars) => setResults((all) => [...all, stars])}
              onNext={next}
              announce={setAnnouncement}
            />
          ) : (
            <KitchenRescueGame
              key={`${runKey}:${item.id}`}
              challenge={item}
              step={index + 1}
              total={items.length}
              best={0}
              showStars={false}
              nextLabel={index >= last || !passed ? "Your result" : `Challenge ${index + 2}`}
              onSolved={(stars) => setResults((all) => [...all, stars])}
              onNext={next}
              announce={setAnnouncement}
            />
          )
        ) : null}

        {phase === "result" ? (
          <Panel className="stack" labelledBy="stage-title">
            <h2 id="stage-title" tabIndex={-1}>
              {passed ? "You passed" : "Not this time"}
            </h2>
            {passed ? (
              <>
                <Note kind="good" title="Sous Chef and Kitchen Safety are open." live={false}>
                  Prep Cook is still there to play whenever you like.
                </Note>
                <div className="btn-row">
                  <ButtonLink href="/kitchen" variant="primary">
                    Go to the kitchen
                  </ButtonLink>
                </div>
              </>
            ) : (
              <>
                <Note kind="hint" title="That was more than one wrong pick." live={false}>
                  Play through Prep Cook to build the skills, or try the test again.
                </Note>
                <div className="btn-row">
                  <Button variant="primary" onClick={begin}>
                    Try again
                  </Button>
                  <ButtonLink href="/kitchen/the-order">Start with Prep Cook</ButtonLink>
                </div>
              </>
            )}
            <p className="fine">
              <Link href="/kitchen">Back to the kitchen</Link>
            </p>
          </Panel>
        ) : null}
      </div>

      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}
