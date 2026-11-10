const STAR_PATH =
  "M12 2.8l2.75 5.95 6.45.7-4.82 4.37 1.36 6.38L12 16.9l-5.74 3.3 1.36-6.38L2.8 9.45l6.45-.7z";

/** One star on its own, for chips and labels that count their own text. */
export function StarIcon({ filled = true }: { filled?: boolean }) {
  return (
    <svg
      className={filled ? "star on" : "star"}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d={STAR_PATH} />
    </svg>
  );
}

type StarsProps = {
  /** How many stars are filled in. */
  value: number;
  max?: number;
  /** Shows the count beside the stars. Off means it is read out instead. */
  showText?: boolean;
};

/** Stars are never on their own: the count is always there to be read. */
export default function Stars({ value, max = 3, showText = true }: StarsProps) {
  return (
    <span className="stars">
      <span className="stars" aria-hidden="true">
        {Array.from({ length: max }, (_, index) => (
          <StarIcon key={index} filled={index < value} />
        ))}
      </span>
      {showText ? (
        <span className="stars-text">
          {value} of {max}
        </span>
      ) : (
        <span className="sr-only">
          {value} of {max} stars
        </span>
      )}
    </span>
  );
}

export { STAR_PATH };
