type StageHeadProps = {
  step: number;
  total: number;
  title: string;
  lede?: string;
};

/**
 * The heading of a step. The station moves keyboard focus here when the
 * learner changes step, so a screen reader starts reading at the new step.
 */
export default function StageHead({ step, total, title, lede }: StageHeadProps) {
  return (
    <div className="stage-head">
      <p className="eyebrow">
        Step {step} of {total}
      </p>
      <h2 id="stage-title" tabIndex={-1}>
        {title}
      </h2>
      {lede ? <p className="lede">{lede}</p> : null}
    </div>
  );
}
