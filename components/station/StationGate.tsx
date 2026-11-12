"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { Line } from "@/lib/content/schemas";
import { stationLabel } from "@/lib/content/labels";
import { lineProgress, lineStatus, startingRank, type UnlockRecipe } from "@/lib/unlocks";
import { ButtonLink } from "../Button";
import Panel from "../Panel";
import { useHydrated } from "../useHydrated";
import { useProgress } from "../useProgress";

type StationGateProps = {
  recipe: UnlockRecipe;
  lines: Line[];
  recipes: UnlockRecipe[];
  /** The station, shown when its line is open. */
  children: ReactNode;
};

/**
 * Keeps a station in a locked line closed. A line that is open from the start
 * shows its station straight away. For any other line, the page cannot know on
 * its own whether this learner has opened it, so it says it is checking until it
 * is running here. That avoids showing a locked learner the station, and an
 * unlocked learner a gate that then disappears.
 *
 * With no accounts, this is a courtesy and not a lock: progress is on the
 * learner's own device.
 */
export default function StationGate({ recipe, lines, recipes, children }: StationGateProps) {
  const progress = useProgress();
  const known = useHydrated();

  const line = lines.find((candidate) => candidate.id === recipe.line);
  if (!line || line.opensAfter === null) return <>{children}</>;

  if (!known) {
    return (
      <div className="view">
        <div className="view-head">
          <p className="crumb">
            <Link href="/kitchen">The Kitchen</Link> / {line.name} / {stationLabel(recipe)}
          </p>
          <h1 className="view-title">{recipe.name}</h1>
        </div>
        <p className="lede" role="status">
          Checking your kitchen.
        </p>
      </div>
    );
  }

  if (lineStatus(line, lines, recipes, progress) === "open") return <>{children}</>;

  const parent = lines.find((candidate) => candidate.id === line.opensAfter);
  const { done, total } = parent ? lineProgress(parent, recipes, progress) : { done: 0, total: 0 };
  const offerSkip = parent !== undefined && startingRank(lines)?.id === parent.id;

  return (
    <div className="view">
      <div className="view-head">
        <p className="crumb">
          <Link href="/kitchen">The Kitchen</Link> / {line.name} / {stationLabel(recipe)}
        </p>
        <h1 className="view-title">{recipe.name}</h1>
      </div>

      <Panel className="stack gate" labelledBy="gate-title">
        <p className="eyebrow">Not open yet</p>
        <h2 id="gate-title">{line.name} is locked</h2>
        <p>
          Finish every {parent?.name ?? "earlier"} station to open it.
          {parent ? ` You have finished ${done} of ${total}.` : ""}
        </p>
        {offerSkip ? <p>Already use AI often? You can take the Skip-ahead test instead.</p> : null}
        <div className="btn-row">
          <ButtonLink href="/kitchen" variant={offerSkip ? "secondary" : "primary"}>
            Back to the kitchen
          </ButtonLink>
          {offerSkip ? (
            <ButtonLink href="/skip-ahead" variant="primary">
              Take the Skip-ahead test
            </ButtonLink>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}
