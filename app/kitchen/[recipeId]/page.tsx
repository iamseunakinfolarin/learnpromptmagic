import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Panel from "@/components/Panel";
import { ButtonLink } from "@/components/Button";
import Station from "@/components/station/Station";
import StationGate from "@/components/station/StationGate";
import {
  getChallengesForRecipe,
  getLine,
  getRecipe,
  getRecipes,
  getUnlockData,
  getRelease1Recipes,
  isReady,
  stationLabel,
} from "@/lib/content";

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

  // A ready station is played in the browser. Everything it needs is read here,
  // at build time, and handed over as plain data, so the page stays static.
  if (isReady(recipe)) {
    const unlock = getUnlockData();
    const entry = unlock.recipes.find((item) => item.id === recipe.id);
    if (!entry) notFound();

    return (
      <StationGate recipe={entry} lines={unlock.lines} recipes={unlock.recipes}>
        <Station
          recipe={recipe}
          challenges={getChallengesForRecipe(recipe)}
          lineName={line?.name ?? ""}
          recipes={getRecipes().map(({ id, name, release }) => ({ id, name, release }))}
        />
      </StationGate>
    );
  }

  return (
    <div className="view">
      <div className="view-head">
        <p className="crumb">
          <Link href="/kitchen">The Kitchen</Link>
          {line ? ` / ${line.name}` : ""} / {stationLabel(recipe)}
        </p>
        <h1 className="view-title">{recipe.name}</h1>
      </div>

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
    </div>
  );
}
