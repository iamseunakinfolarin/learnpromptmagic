import type { Stars } from "@/lib/progress";
import type { Challenge } from "@/lib/content/schemas";

/** What every game mode is handed by the station. */
export type GameProps<C extends Challenge> = {
  challenge: C;
  /** This step's place in the station, for "Step 2 of 6". */
  step: number;
  total: number;
  /** The best saved result for this challenge, 0 if it has never been solved. */
  best: number;
  /** The label of the step after this one, for the Next button. */
  nextLabel: string;
  /** Called once, when the learner has finished the challenge. */
  onSolved: (stars: Stars) => void;
  onNext: () => void;
  onReplay: () => void;
  /** Says something to screen readers through the station's live region. */
  announce: (message: string) => void;
};

/** What to call where an output came from. */
export function outputLabel(challenge: Pick<Challenge, "generatedBy">): string {
  return challenge.generatedBy.model === "sample" ? "Sample output" : "Saved output";
}
