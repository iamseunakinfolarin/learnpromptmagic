import type { ReadyRecipe } from "@/lib/content/schemas";
import { stationLabel } from "@/lib/content/labels";
import type { Progress } from "@/lib/progress";
import { stationStars, type Step } from "@/lib/station";
import { ButtonLink } from "../Button";
import { BeakerIcon } from "../icons";
import Panel from "../Panel";
import Stars from "../Stars";
import StageHead from "./StageHead";

type PlateUpProps = {
  recipe: ReadyRecipe;
  steps: Step[];
  progress: Progress;
  step: number;
  total: number;
};

/** The last step: the stars, the recipe card the learner has earned, and the science. */
export default function PlateUp({ recipe, steps, progress, step, total }: PlateUpProps) {
  const { earned, possible } = stationStars(steps, progress);
  const challengeSteps = steps.filter((item) => item.kind === "challenge");

  return (
    <>
      <StageHead step={step} total={total} title="Plate up" />
      <span className="stamp" aria-hidden="true">
        Order up!
      </span>
      <p className="lede">
        {stationLabel(recipe)} is done with {earned} of {possible} stars. Your recipe card is
        ready.
      </p>

      <div className="tk-grid">
        <div className="stack">
          <p className="eyebrow">Your scores</p>
          <ul className="score-list">
            {challengeSteps.map((item) => (
              <li key={item.index}>
                <span>{item.label}</span>
                <Stars value={progress.challenges[item.challengeId ?? ""]?.stars ?? 0} />
              </li>
            ))}
          </ul>
          <Panel className="science" labelledBy="science-title">
            <BeakerIcon />
            <div className="stack">
              <p className="eyebrow">Kitchen Science</p>
              <h3 className="q" id="science-title">
                {recipe.kitchenScience.title}
              </h3>
              <p>{recipe.kitchenScience.body}</p>
            </div>
          </Panel>
        </div>

        <article className="recipe-card" aria-labelledby="card-title">
          <p className="eyebrow">New recipe card</p>
          <h3 className="rc-title" id="card-title">
            {recipe.recipeCard.title}
          </h3>
          <pre>{recipe.recipeCard.template}</pre>
          <p className="fine">{recipe.recipeCard.howTo}</p>
        </article>
      </div>

      <div className="btn-row">
        <ButtonLink href="/kitchen" variant="primary">
          Back to the kitchen
        </ButtonLink>
      </div>
      <p className="fine">
        Want a better score? Pick any finished step above to play it again. Your best result is
        kept.
      </p>
    </>
  );
}
