"use client";

import { useRef, useState } from "react";
import type { GuessTheRecipe } from "@/lib/content/schemas";
import { formatDate, pad2 } from "@/lib/content/labels";
import { copyToClipboard, selectText } from "@/lib/copy";
import { dailyIdFor, dailyNumber, recordDaily, shareText, streakNow } from "@/lib/daily";
import { load, save, today } from "@/lib/progress";
import { guessStars } from "@/lib/scoring";
import Button from "./Button";
import Note from "./Note";
import Panel from "./Panel";
import Stars from "./Stars";
import Tag from "./Tag";
import Ticket from "./Ticket";
import ChoiceList from "./station/ChoiceList";
import { outputLabel } from "./station/types";
import { useHydrated } from "./useHydrated";
import { useProgress } from "./useProgress";

type DailySpecialProps = {
  /** The day the first special played, counted as number 1. */
  launchDate: string;
  /** The specials, in the order the schedule plays them. */
  items: GuessTheRecipe[];
};

function Heading({ children }: { children?: React.ReactNode }) {
  return (
    <div className="view">
      <div className="view-head">
        <p className="eyebrow">One a day</p>
        <h1 className="view-title">Daily Special</h1>
        {children}
      </div>
    </div>
  );
}

/**
 * The Daily Special: one Guess the Recipe a day, the same for everyone, played
 * once. Which one is today's depends on the date on this device, so nothing
 * about it is drawn until the page is running here.
 */
export default function DailySpecial({ launchDate, items }: DailySpecialProps) {
  const progress = useProgress();
  const known = useHydrated();

  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const [copyNote, setCopyNote] = useState("");
  const shareRef = useRef<HTMLPreElement>(null);

  if (!known) {
    return (
      <Heading>
        <p className="lede" role="status">
          Checking today&apos;s special.
        </p>
      </Heading>
    );
  }

  const date = today();
  const number = dailyNumber(launchDate, date);
  const id = dailyIdFor(
    items.map((item) => item.id),
    number,
  );
  const item = items.find((candidate) => candidate.id === id);

  if (!item) {
    return (
      <Heading>
        <p className="lede">
          The first Daily Special opens on {formatDate(launchDate)}. Come back then.
        </p>
      </Heading>
    );
  }

  const played = progress.daily.results[date];
  const options = item.options.map((option) => ({ id: option.id, text: option.prompt }));
  const streak = streakNow(progress, date);

  function pick(optionId: string) {
    if (!item || played) return;
    if (optionId === item.correctOption) {
      const stars = guessStars(wrongIds.length + 1);
      save(recordDaily(load(), date, item.id, stars));
      setWrongIds([]);
      setAnnouncement(`That's the one. ${stars} of 3 stars. ${item.explanation}`);
      return;
    }
    const letter = String.fromCharCode(65 + item.options.findIndex((option) => option.id === optionId));
    setWrongIds((ids) => [...ids, optionId]);
    setAnnouncement(`Option ${letter} is not it. ${item.wrongHint}`);
  }

  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const share = played ? shareText({ number, stars: played.stars, origin }) : "";

  async function copy() {
    if (await copyToClipboard(share)) {
      setCopyNote("Copied.");
      setAnnouncement("Copied.");
    } else {
      selectText(shareRef.current);
      setCopyNote("Text selected. Copy it with your keyboard.");
      setAnnouncement("Text selected. Copy it with your keyboard.");
    }
  }

  return (
    <div className="view">
      <section className="board" aria-labelledby="daily-title">
        <div className="stack">
          <p className="board-meta">
            No. {pad2(number)} · {formatDate(date)}
          </p>
          <h1 className="board-title" id="daily-title">
            Daily Special
          </h1>
          <p className="board-ask">Which order made this?</p>
        </div>
        <Ticket head="From the kitchen" aside={<Tag>{outputLabel(item)}</Tag>}>
          {item.output}
        </Ticket>
      </section>

      <div className="stack">
        <ChoiceList
          label="Which order made this"
          mono
          choices={options}
          wrongIds={played ? [] : wrongIds}
          rightId={played ? item.correctOption : null}
          locked={Boolean(played)}
          onPick={pick}
        />

        {!played && wrongIds.length > 0 ? (
          <Note kind="bad" title="Not that one." live={false}>
            {item.wrongHint}
          </Note>
        ) : null}

        {played ? (
          <>
            <Note kind="good" title="Order up! That's the one." live={false}>
              {item.explanation}
            </Note>
            <p className="result-stars">
              <span>
                Today: <Stars value={played.stars} />
              </span>
            </p>
            <Panel className="stack">
              <p className="eyebrow">Share your result</p>
              <pre className="share-text" id="daily-share" ref={shareRef}>
                {share}
              </pre>
              <div className="btn-row">
                <Button variant="primary" onClick={copy}>
                  Copy result
                </Button>
                {copyNote ? <span className="fine">{copyNote}</span> : null}
              </div>
              <p className="fine">
                Streak: {streak} {streak === 1 ? "day" : "days"} · Best: {progress.daily.best}
              </p>
              <p className="fine">A new Daily Special arrives tomorrow. It is the same for everyone.</p>
            </Panel>
          </>
        ) : (
          <p className="fine">
            One Daily Special a day, the same for everyone. Your streak: {streak}{" "}
            {streak === 1 ? "day" : "days"}.
          </p>
        )}
      </div>

      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}
