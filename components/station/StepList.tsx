import type { Progress } from "@/lib/progress";
import { canVisit, isStepFinished, type Step } from "@/lib/station";
import { CheckIcon } from "../icons";

type StepListProps = {
  steps: Step[];
  /** The step on screen. */
  current: number;
  progress: Progress;
  recipeId: string;
  onGo: (index: number) => void;
};

/**
 * The steps of a station. A learner can go back to any step they have
 * finished, but cannot skip ahead. Finished steps carry a tick as well as a
 * colour, and every step has its name for screen readers even on a phone,
 * where only the current step shows its word.
 */
export default function StepList({ steps, current, progress, recipeId, onGo }: StepListProps) {
  return (
    <ol className="steps" aria-label="Station steps">
      {steps.map((step) => {
        const finished = isStepFinished(step, progress, recipeId);
        const open = canVisit(step, steps, progress, recipeId);
        const isCurrent = step.index === current;
        const className = [
          "step",
          isCurrent ? "is-current" : "",
          finished ? "is-done" : "",
          open ? "" : "is-locked",
        ]
          .filter(Boolean)
          .join(" ");

        const inner = (
          <>
            <span className="n" aria-hidden="true">
              {finished ? <CheckIcon /> : step.index + 1}
            </span>
            <span className="lbl">{step.label}</span>
            {finished ? <span className="sr-only">(finished)</span> : null}
            {!open ? <span className="sr-only">(not open yet)</span> : null}
          </>
        );

        return (
          <li key={step.index}>
            {open && !isCurrent ? (
              <button type="button" className={className} onClick={() => onGo(step.index)}>
                {inner}
              </button>
            ) : (
              <span className={className} aria-current={isCurrent ? "step" : undefined}>
                {inner}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
