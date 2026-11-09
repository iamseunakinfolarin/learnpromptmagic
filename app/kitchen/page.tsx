import type { Metadata } from "next";
import Link from "next/link";
import Pill from "@/components/Pill";
import { getLines, getRecipes, stationLabel } from "@/lib/content";

export const metadata: Metadata = {
  title: "The Kitchen",
  description:
    "Every station in the kitchen, grouped by line. Each station teaches one recipe for talking to AI.",
};

export default function KitchenPage() {
  const lines = getLines();
  const recipes = getRecipes();

  return (
    <div className="view">
      <div className="view-head">
        <p className="eyebrow">The line</p>
        <h1 className="view-title">The Kitchen</h1>
        <p className="lede">
          Pick a station. Each one teaches one recipe and takes about 10
          minutes.
        </p>
      </div>

      {lines.map((line) => {
        const inLine = recipes.filter((recipe) => recipe.line === line.id);
        return (
          <section className="line" key={line.id} aria-labelledby={`line-${line.id}`}>
            <div className="line-head">
              <h2 id={`line-${line.id}`}>{line.name}</h2>
              <span className="line-meta">
                {inLine.length} {inLine.length === 1 ? "station" : "stations"}
                {line.release === 2 ? " · Coming soon" : ""}
              </span>
            </div>
            <p className="fine">{line.blurb}</p>
            <div className="stations">
              {inLine.map((recipe) => {
                const inner = (
                  <>
                    <span className="num">{stationLabel(recipe)}</span>
                    <span className="name">{recipe.name}</span>
                    <span className="tech">{recipe.technique}</span>
                    <span className="foot">
                      {recipe.release === 2 ? (
                        <Pill>Soon</Pill>
                      ) : recipe.status === "ready" ? (
                        <Pill tone="open">Open</Pill>
                      ) : (
                        <Pill>Being written</Pill>
                      )}
                    </span>
                  </>
                );

                if (recipe.release === 2) {
                  return (
                    <div className="station is-soon" key={recipe.id}>
                      {inner}
                    </div>
                  );
                }

                return (
                  <Link
                    key={recipe.id}
                    className={
                      recipe.status === "ready"
                        ? "station is-playable"
                        : "station"
                    }
                    href={`/kitchen/${recipe.id}`}
                  >
                    {inner}
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
