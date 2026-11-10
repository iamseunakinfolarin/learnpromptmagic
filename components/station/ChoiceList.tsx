import { CheckIcon, CrossIcon } from "../icons";

export type Choice = { id: string; text: string };

type ChoiceListProps = {
  choices: Choice[];
  /** What the group is, for screen readers. */
  label: string;
  /** Ids the learner has already tried and got wrong. */
  wrongIds: string[];
  /** The id of the right answer, once it has been found. */
  rightId?: string | null;
  /** Locks the whole list, as it is once the answer is found. */
  locked?: boolean;
  /** Sets the choices in the typewriter face, for prompts. */
  mono?: boolean;
  onPick: (id: string) => void;
};

/**
 * The A, B, C, D pick list. Choices stay in file order, because the
 * explanations may refer to them by letter.
 *
 * A wrong choice is struck through and marked "Not this one", so it is never
 * carried by colour alone. It uses aria-disabled rather than disabled, so
 * keyboard focus is not thrown away when the learner picks it.
 */
export default function ChoiceList({
  choices,
  label,
  wrongIds,
  rightId = null,
  locked = false,
  mono = false,
  onPick,
}: ChoiceListProps) {
  return (
    <div className="choices" role="group" aria-label={label}>
      {choices.map((choice, index) => {
        const letter = String.fromCharCode(65 + index);
        const isWrong = wrongIds.includes(choice.id);
        const isRight = rightId === choice.id;
        const inactive = locked || isWrong;
        const classes = [
          "choice",
          mono ? "mono" : "",
          isWrong ? "is-wrong" : "",
          isRight ? "is-right" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <button
            key={choice.id}
            type="button"
            className={classes}
            aria-disabled={inactive || undefined}
            onClick={() => {
              if (!inactive) onPick(choice.id);
            }}
          >
            <span className="key" aria-hidden="true">
              {letter}
            </span>
            <span className="txt">
              <span className="sr-only">Option {letter}: </span>
              <span className="copy">{choice.text}</span>
              {isWrong ? (
                <span className="choice-flag">
                  <CrossIcon />
                  Not this one
                </span>
              ) : null}
              {isRight ? (
                <span className="choice-flag">
                  <CheckIcon />
                  Correct
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
