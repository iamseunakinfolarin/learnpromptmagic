"use client";

import Link from "next/link";
import type { Line } from "@/lib/content/schemas";
import { stationLabel } from "@/lib/content/labels";
import {
  certificateEarned,
  currentRank,
  kitchenSummary,
  lineProgress,
  lineStatus,
  recipeStars,
  startingRank,
  stationStatus,
  type StationStatus,
  type UnlockRecipe,
} from "@/lib/unlocks";
import { LockIcon, MedalIcon } from "./icons";
import Pill from "./Pill";
import Stars from "./Stars";
import { useHydrated } from "./useHydrated";
import { useProgress } from "./useProgress";

type KitchenMapProps = { lines: Line[]; recipes: UnlockRecipe[] };

/**
 * The kitchen map: every line of stations, with what is open, finished, locked,
 * or still to come. What is open depends on this device's progress, so until the
 * page is running here, the tiles are plain links with no status, and nothing
 * claims a station is locked that the learner may already have opened.
 */
export default function KitchenMap({ lines, recipes }: KitchenMapProps) {
  const progress = useProgress();
  const known = useHydrated();

  const summary = kitchenSummary(recipes, progress);
  const rank = currentRank(lines, recipes, progress);
  const starting = startingRank(lines);

  return (
    <div className="view">
      <div className="view-head">
        <p className="eyebrow">The line</p>
        <h1 className="view-title">The Kitchen</h1>
        <p className="lede">
          Pick a station. Each one teaches one recipe and takes about 10 minutes.
        </p>
      </div>

      {known ? (
        <div className="summary-row">
          {rank ? <span className="stat">Your rank: {rank.name}</span> : null}
          <span className="stat">
            {summary.stars} {summary.stars === 1 ? "star" : "stars"} earned
          </span>
          <span className="stat">
            {summary.stationsDone} of {summary.stationsTotal} stations finished
          </span>
        </div>
      ) : null}

      {lines.map((line) => {
        const inLine = recipes.filter((recipe) => recipe.line === line.id);
        const status = lineStatus(line, lines, recipes, progress);
        const { done, total } = lineProgress(line, recipes, progress);
        const parent = lines.find((candidate) => candidate.id === line.opensAfter);
        const earned = certificateEarned(line, recipes, progress);
        const percent = total > 0 ? Math.round((done / total) * 100) : 0;
        const soon = line.release === 2;

        return (
          <section className="line" key={line.id} aria-labelledby={`line-${line.id}`}>
            <div className="line-head">
              <h2 id={`line-${line.id}`}>{line.name}</h2>
              <span className="line-meta">
                {soon
                  ? "Coming soon"
                  : known && status === "locked"
                    ? "Locked"
                    : `${known ? `${done} of ${total}` : total} stations`}
              </span>
              {known && !soon && status !== "locked" ? (
                <span className="meter" aria-hidden="true">
                  <span style={{ width: `${percent}%` }} />
                </span>
              ) : null}
            </div>
            <p className="fine">{line.blurb}</p>

            {known && status === "locked" && parent ? (
              <p className="fine line-hint">
                <span>Opens after you finish {parent.name}.</span>
                {starting?.id === parent.id ? (
                  <Link href="/skip-ahead">Already use AI often? Take the Skip-ahead test.</Link>
                ) : null}
              </p>
            ) : null}

            {line.kind === "certificate" && !soon ? (
              earned ? (
                <p className="certificate">
                  <MedalIcon />
                  <span>
                    {line.certificateName}
                    <span className="sr-only">: earned</span>
                  </span>
                </p>
              ) : known ? (
                <p className="fine">Finish every station to earn {line.certificateName}.</p>
              ) : null
            ) : null}

            <div className="stations">
              {inLine.map((recipe) => (
                <Tile
                  key={recipe.id}
                  recipe={recipe}
                  // A Release 2 station is never playable, so it needs no progress to say so.
                  status={
                    recipe.release === 2
                      ? "soon"
                      : known
                        ? stationStatus(recipe, lines, recipes, progress)
                        : null
                  }
                  stars={recipeStars(recipe, progress)}
                  count={recipe.stationChallengeIds.length}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

type TileProps = {
  recipe: UnlockRecipe;
  /** Null until the page knows this device's progress. */
  status: StationStatus | null;
  stars: { earned: number; possible: number };
  count: number;
};

function Tile({ recipe, status, stars, count }: TileProps) {
  const rating = count > 0 ? Math.max(1, Math.round(stars.earned / count)) : 0;

  let foot: React.ReactNode = null;
  if (status === "done") {
    foot = (
      <>
        <Stars value={rating} />
        <Pill tone="done">Done</Pill>
      </>
    );
  } else if (status === "open") {
    foot = <Pill tone="open">{stars.earned > 0 ? "Continue" : "Play"}</Pill>;
  } else if (status === "locked") {
    foot = (
      <Pill>
        <LockIcon />
        Locked
      </Pill>
    );
  } else if (status === "soon") {
    foot = <Pill>Soon</Pill>;
  } else if (status === "writing") {
    foot = <Pill>Being written</Pill>;
  }

  const inner = (
    <>
      <span className="num">{stationLabel(recipe)}</span>
      <span className="name">{recipe.name}</span>
      <span className="tech">{recipe.technique}</span>
      {foot ? <span className="foot">{foot}</span> : null}
    </>
  );

  if (status === "locked" || status === "soon") {
    return <div className={`station is-${status}`}>{inner}</div>;
  }

  const playable = status === "open" || status === "done";
  return (
    <Link
      className={playable ? "station is-playable" : "station"}
      href={`/kitchen/${recipe.id}`}
    >
      {inner}
    </Link>
  );
}
