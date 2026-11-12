import type { Metadata } from "next";
import Cookbook, { type RecipeCard } from "@/components/Cookbook";
import Tag from "@/components/Tag";
import { formatDate } from "@/lib/content/labels";
import { getOffMenu, getRecipes, getUnlockData, isReady } from "@/lib/content";

export const metadata: Metadata = {
  title: "Cookbook",
  description:
    "Every recipe you master lands here as a card you can copy into any AI tool you are allowed to use. Plus the tricks that used to help and no longer do.",
};

export default function CookbookPage() {
  // Release 2 stations are not in the book yet, so only Release 1 is shown.
  const recipes = getUnlockData().recipes.filter((recipe) => recipe.release === 1);
  const cards: RecipeCard[] = getRecipes()
    .filter(isReady)
    .map((recipe) => ({ id: recipe.id, ...recipe.recipeCard }));
  const offMenu = getOffMenu();

  return (
    <div className="view">
      <div className="view-head">
        <p className="eyebrow">Your recipes</p>
        <h1 className="view-title">Cookbook</h1>
        <p className="lede">
          Every recipe you master lands here as a card you can copy into any AI tool you are
          allowed to use.
        </p>
      </div>

      <Cookbook recipes={recipes} cards={cards} />

      <section className="stack" aria-labelledby="menu-title">
        <p className="eyebrow">86&apos;d is kitchen talk for &quot;taken off the menu&quot;</p>
        <h2 className="h2" id="menu-title">
          Off the Menu
        </h2>
        <p className="lede">
          Tricks that used to help and don&apos;t anymore. AI changes fast, so this list keeps
          growing.
        </p>
        <div className="menu-86">
          {offMenu.map((item) => (
            <article className="item-86" key={item.id}>
              <span className="stamp-86" aria-hidden="true">
                86&apos;d
              </span>
              <div className="stack">
                <h3>{item.name}</h3>
                <p>{item.whyRetired}</p>
                {item.lastVerified ? (
                  <p className="fine">Last checked {formatDate(item.lastVerified)}.</p>
                ) : (
                  <Tag>Draft: still being verified</Tag>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
