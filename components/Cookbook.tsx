"use client";

import { useRef, useState } from "react";
import { stationLabel } from "@/lib/content/labels";
import { copyToClipboard, selectText } from "@/lib/copy";
import { isRecipeFinished, type UnlockRecipe } from "@/lib/unlocks";
import Button from "./Button";
import { useHydrated } from "./useHydrated";
import { useProgress } from "./useProgress";

export type RecipeCard = { id: string; title: string; template: string; howTo: string };

type CookbookProps = {
  /** The Release 1 stations, in order. */
  recipes: UnlockRecipe[];
  cards: RecipeCard[];
};

/**
 * The recipe cards a learner has earned. A card unlocks when its station is
 * finished, and the rest stay locked, so the book fills up as they play.
 */
export default function Cookbook({ recipes, cards }: CookbookProps) {
  const progress = useProgress();
  const known = useHydrated();
  const [announcement, setAnnouncement] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const refs = useRef<Record<string, HTMLPreElement | null>>({});

  const byId = new Map(cards.map((card) => [card.id, card]));
  const unlocked = recipes.filter((recipe) => isRecipeFinished(recipe, progress)).length;

  async function copy(card: RecipeCard) {
    if (await copyToClipboard(card.template)) {
      setCopied(card.id);
      setAnnouncement(`Copied the ${card.title} recipe.`);
    } else {
      selectText(refs.current[card.id] ?? null);
      setCopied(null);
      setAnnouncement("Text selected. Copy it with your keyboard.");
    }
  }

  if (!known) {
    return (
      <p className="lede" role="status">
        Opening your cookbook.
      </p>
    );
  }

  return (
    <div className="stack">
      <p className="fine" aria-live="polite">
        {unlocked} of {recipes.length} recipe cards unlocked.
      </p>
      <div className="cards">
        {recipes.map((recipe) => {
          const card = byId.get(recipe.id);
          const finished = isRecipeFinished(recipe, progress);

          if (finished && card) {
            return (
              <article className="recipe-card" key={recipe.id} aria-labelledby={`card-${recipe.id}`}>
                <p className="eyebrow">
                  Recipe {String(recipe.number).padStart(2, "0")} · {recipe.technique}
                </p>
                <h3 className="rc-title" id={`card-${recipe.id}`}>
                  {card.title}
                </h3>
                <pre
                  ref={(node) => {
                    refs.current[card.id] = node;
                  }}
                >
                  {card.template}
                </pre>
                <p className="fine">{card.howTo}</p>
                <div className="btn-row">
                  <Button onClick={() => copy(card)}>
                    {copied === card.id ? "Copied" : "Copy recipe"}
                  </Button>
                </div>
              </article>
            );
          }

          return (
            <article className="recipe-card is-locked" key={recipe.id} aria-labelledby={`card-${recipe.id}`}>
              <p className="eyebrow">
                Recipe {String(recipe.number).padStart(2, "0")} · {recipe.technique}
              </p>
              <h3 className="rc-title" id={`card-${recipe.id}`}>
                {recipe.name}
              </h3>
              <p className="fine">
                {recipe.status === "ready"
                  ? `Locked. Unlocks when you finish ${stationLabel(recipe)}.`
                  : "Locked. This station is being written."}
              </p>
            </article>
          );
        })}
      </div>

      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}
