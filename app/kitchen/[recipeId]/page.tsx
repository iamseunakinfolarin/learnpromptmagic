import type { Metadata } from "next";
import Link from "next/link";
import Panel from "@/components/Panel";
import { ButtonLink } from "@/components/Button";
import {
  getLine,
  getRecipe,
  getRelease1Recipes,
  stationLabel,
} from "@/lib/content";
import { notFound } from "next/navigation";

/** One page per Release 1 station, built at build time and nothing else. */
export function generateStaticParams() {
  return getRelease1Recipes().map((recipe) => ({ recipeId: recipe.id }));
}

export const dynamicParams = false;

type Params = { params: Promise<{ recipeId: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { recipeId } = await params;
  const recipe = getRecipe(recipeId);
  if (!recipe) return { title: "Not on the menu" };
  return {
    title: recipe.name,
    description:
      recipe.status === "ready"
        ? recipe.oneLine
        : `${stationLabel(recipe)}: ${recipe.technique}. This station is being written.`,
  };
}

export default async function StationPage({ params }: Params) {
  const { recipeId } = await params;
  const recipe = getRecipe(recipeId);
  if (!recipe || recipe.release !== 1) notFound();

  const line = getLine(recipe.line);

  return (
    <div className="view">
      <div className="view-head">
        <p className="crumb">
          <Link href="/kitchen">The Kitchen</Link>
          {line ? ` / ${line.name}` : ""} / {stationLabel(recipe)}
        </p>
        <h1 className="view-title">{recipe.name}</h1>
      </div>

      {recipe.status === "ready" ? (
        <div className="stage">
          <Panel className="stack" labelledBy="order-up">
            <p className="eyebrow">
              {stationLabel(recipe)} · {recipe.technique}
            </p>
            <h2 id="order-up">Order up</h2>
            <p className="one-line">{recipe.oneLine}</p>
            <p>{recipe.quick}</p>
            <details className="deeper">
              <summary>Go deeper</summary>
              <div className="stack">
                {recipe.deeper.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </details>
          </Panel>
          <p className="fine">
            The Test Kitchen and the rest of this station arrive in Phase 2.
          </p>
        </div>
      ) : (
        <Panel className="stack" labelledBy="being-written">
          <p className="eyebrow">
            {stationLabel(recipe)} · {recipe.technique}
          </p>
          <h2 id="being-written">{recipe.name}</h2>
          <p>This station is being written.</p>
          <div className="btn-row">
            <ButtonLink href="/kitchen">Back to the kitchen</ButtonLink>
          </div>
        </Panel>
      )}
    </div>
  );
}
