import Stars from "../Stars";

type ResultStarsProps = {
  /** Stars earned on this run. */
  stars: number;
  /** The best saved result, which a replay never lowers. */
  best: number;
};

/** What a run earned, and the best result so far when that is higher. */
export default function ResultStars({ stars, best }: ResultStarsProps) {
  return (
    <p className="result-stars">
      <span>
        This time: <Stars value={stars} />
      </span>
      {best > stars ? (
        <span className="fine">
          Best so far: <Stars value={best} />
        </span>
      ) : null}
    </p>
  );
}
