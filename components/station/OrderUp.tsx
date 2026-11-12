import type { ReadyRecipe } from "@/lib/content/schemas";
import { formatDate, stationLabel } from "@/lib/content/labels";
import Button from "../Button";
import Panel from "../Panel";
import StageHead from "./StageHead";

type OrderUpProps = {
  recipe: ReadyRecipe;
  step: number;
  total: number;
  /** The label of the first challenge, for the button. */
  nextLabel: string;
  onContinue: () => void;
};

/** The first step of a station: the idea in one line, a short version, and more. */
export default function OrderUp({ recipe, step, total, nextLabel, onContinue }: OrderUpProps) {
  return (
    <>
      <StageHead step={step} total={total} title="Order up" />
      <Panel className="stack" labelledBy="stage-title">
        <p className="eyebrow">
          {stationLabel(recipe)} · {recipe.technique}
        </p>
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
        <p className="fine">Last checked {formatDate(recipe.lastVerified)}.</p>
      </Panel>
      <div className="btn-row">
        <Button variant="primary" onClick={onContinue}>
          Open the {nextLabel}
        </Button>
      </div>
    </>
  );
}
