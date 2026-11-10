"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Challenge, ReadyRecipe } from "@/lib/content/schemas";
import { stationLabel } from "@/lib/content/labels";
import { load, recordChallenge, save, type Stars } from "@/lib/progress";
import {
  buildSteps,
  canVisit,
  finishStep,
  firstUnfinishedStep,
  type Step,
} from "@/lib/station";
import { useProgress } from "../useProgress";
import GuessTheRecipe from "./GuessTheRecipe";
import HealthInspector, { type RecipeRef } from "./HealthInspector";
import KitchenRescue from "./KitchenRescue";
import OrderUp from "./OrderUp";
import PlateUp from "./PlateUp";
import StepList from "./StepList";
import TestKitchen from "./TestKitchen";

type StationProps = {
  recipe: ReadyRecipe;
  /** The recipe's challenges, in play order. */
  challenges: Challenge[];
  lineName: string;
  /** Every recipe, so a Health Inspector line can point to the one that prevents it. */
  recipes: RecipeRef[];
};

/**
 * A station, played one step at a time: Order up, then each challenge, then
 * Plate up. It runs in the browser on a page that was built ahead of time, and
 * keeps nothing but progress, which it hands to lib/progress.
 *
 * Until the learner moves, the screen follows the resume point, which is the
 * first step they have not finished. Once they move, the screen stays where
 * they put it.
 */
export default function Station({ recipe, challenges, lineName, recipes }: StationProps) {
  const progress = useProgress();
  const steps = useMemo(() => buildSteps(recipe, challenges), [recipe, challenges]);
  const byId = useMemo(
    () => new Map(challenges.map((challenge) => [challenge.id, challenge])),
    [challenges],
  );

  const [pinned, setPinned] = useState<number | null>(null);
  const [replays, setReplays] = useState<Record<string, number>>({});
  const [announcement, setAnnouncement] = useState("");
  const focusPending = useRef(false);

  const resume = firstUnfinishedStep(steps, progress, recipe.id);
  const current =
    pinned !== null && steps[pinned] && canVisit(steps[pinned], steps, progress, recipe.id)
      ? pinned
      : resume;
  const step = steps[current];

  // After the learner changes step, or replays one, focus moves to the new
  // heading. It does not move on first load, or when the screen follows the
  // resume point after progress arrives.
  useEffect(() => {
    if (!focusPending.current) return;
    focusPending.current = false;
    window.scrollTo(0, 0);
    document.getElementById("stage-title")?.focus();
  }, [current, replays]);

  function go(index: number) {
    focusPending.current = true;
    setPinned(index);
  }

  /**
   * Marks a step finished and saves it, with stars when it was a challenge. The
   * screen is pinned first, so it stays on the result instead of jumping to the
   * next step the moment progress changes.
   */
  function finish(finished: Step, stars?: Stars) {
    setPinned(current);
    const saved =
      stars !== undefined && finished.challengeId
        ? recordChallenge(finished.challengeId, stars)
        : load();
    save(finishStep(saved, recipe.id, finished.index));
  }

  function replay(challengeId: string) {
    focusPending.current = true;
    setReplays((counts) => ({ ...counts, [challengeId]: (counts[challengeId] ?? 0) + 1 }));
  }

  function renderStep() {
    const total = steps.length;
    const number = step.index + 1;

    if (step.kind === "order") {
      return (
        <OrderUp
          recipe={recipe}
          step={number}
          total={total}
          nextLabel={steps[1].label}
          onContinue={() => {
            finish(step);
            go(1);
          }}
        />
      );
    }

    if (step.kind === "plate") {
      return (
        <PlateUp recipe={recipe} steps={steps} progress={progress} step={number} total={total} />
      );
    }

    const challenge = step.challengeId ? byId.get(step.challengeId) : undefined;
    if (!challenge) return null;

    const shared = {
      step: number,
      total,
      best: progress.challenges[challenge.id]?.stars ?? 0,
      nextLabel: steps[step.index + 1].label,
      onSolved: (stars: Stars) => finish(step, stars),
      onNext: () => go(step.index + 1),
      onReplay: () => replay(challenge.id),
      announce: setAnnouncement,
    };
    const key = `${challenge.id}:${replays[challenge.id] ?? 0}`;

    switch (challenge.type) {
      case "test-kitchen":
        return <TestKitchen key={key} challenge={challenge} {...shared} />;
      case "kitchen-rescue":
        return <KitchenRescue key={key} challenge={challenge} {...shared} />;
      case "guess-the-recipe":
        return <GuessTheRecipe key={key} challenge={challenge} {...shared} />;
      case "health-inspector":
        return <HealthInspector key={key} challenge={challenge} recipes={recipes} {...shared} />;
    }
  }

  return (
    <div className="view">
      <div className="view-head">
        <p className="crumb">
          <Link href="/kitchen">The Kitchen</Link> / {lineName} / {stationLabel(recipe)}
        </p>
        <h1 className="view-title">{recipe.name}</h1>
        <StepList
          steps={steps}
          current={current}
          progress={progress}
          recipeId={recipe.id}
          onGo={go}
        />
      </div>

      <div className="stage">{renderStep()}</div>

      {/* One live region for the whole station, so every result is announced
          once. It is always on the page, empty until there is something to say. */}
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}
