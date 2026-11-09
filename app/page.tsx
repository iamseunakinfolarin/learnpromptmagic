import type { Metadata } from "next";
import HomeDemo from "@/components/HomeDemo";
import MixerDrawing from "@/components/MixerDrawing";
import Panel from "@/components/Panel";
import Tag from "@/components/Tag";
import { ButtonLink } from "@/components/Button";
import { getHomeDemo, getLines, getRecipes } from "@/lib/content";

export const metadata: Metadata = {
  title: { absolute: "Prompt Magic" },
  description:
    "Your AI kitchen assistant cooks exactly what the ticket says. Learn to write tickets like a head chef, from your first clear order to the techniques the pros use.",
};

const traits = [
  { name: "Fast", note: "Answers in seconds." },
  { name: "Eager", note: "Never too busy for another order." },
  { name: "Literal", note: "Cooks what you wrote, not what you meant." },
];

export default function HomePage() {
  const demo = getHomeDemo();
  const lines = getLines();
  const recipes = getRecipes();

  // Ranks are the lines a learner rises through, so they are numbered among
  // themselves. A certificate line is a side track and says so instead.
  const rankNumbers = new Map<string, number>();
  lines
    .filter((line) => line.kind === "rank")
    .forEach((line, index) => rankNumbers.set(line.id, index + 1));

  return (
    <div className="view">
      <div className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Learn to talk to AI</p>
          <h1 className="wordmark">Prompt Magic</h1>
          <p className="tagline">The magic is in how you ask.</p>
          <p className="lede">
            Your AI kitchen assistant cooks exactly what the ticket says. Learn
            to write tickets like a head chef, from your first clear order to
            the techniques the pros use.
          </p>
          <div className="btn-row">
            <ButtonLink href="/kitchen/the-order" variant="primary">
              I&apos;m new: start cooking
            </ButtonLink>
            <ButtonLink href="/kitchen">I use AI often</ButtonLink>
          </div>
          <p className="fine">
            Free. No sign-up. Your progress stays on this device.
          </p>
        </div>
        <HomeDemo demo={demo} />
      </div>

      <Panel className="assistant" labelledBy="meet-title">
        <MixerDrawing />
        <div className="stack">
          <h2 className="h2" id="meet-title">
            Meet your kitchen assistant
          </h2>
          <p>
            It is the fastest cook you will ever work with, and it does exactly
            what the ticket says. Nothing more, nothing less. Learning to write
            the ticket is the whole game.
          </p>
          <ul className="traits">
            {traits.map((trait) => (
              <li key={trait.name}>
                <b>{trait.name}</b>
                {trait.note}
              </li>
            ))}
          </ul>
        </div>
      </Panel>

      <section className="stack" aria-labelledby="lines-title">
        <h2 className="h2" id="lines-title">
          Work your way up the kitchen
        </h2>
        <ol className="ranks">
          {lines.map((line) => {
            const count = recipes.filter(
              (recipe) => recipe.line === line.id,
            ).length;
            const soon = line.release === 2;
            const rank = rankNumbers.get(line.id);
            return (
              <li key={line.id} className={soon ? "is-soon" : undefined}>
                <span className="eyebrow">
                  {rank ? `Rank ${rank}` : "Certificate"}
                </span>
                <span className="rank-name">{line.name}</span>
                <span className="fine">
                  {count} {count === 1 ? "recipe" : "recipes"}
                  {line.kind === "certificate"
                    ? ` · ${line.certificateName}`
                    : ""}
                </span>
                <span>{line.blurb}</span>
                {soon ? <Tag>Coming soon</Tag> : null}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
