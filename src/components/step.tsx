//these are the narrative blocks (layer D)
/*
  Renders one text step
  - headline
  - body
  - data-step-id for the hook
  - active styling
*/
type StepProps = {
  id: string;
  headline: string;
  body: string;
  isActive: boolean;
};

export function Step({ id, headline, body, isActive }: StepProps) {
  return (
    <section
      data-step-id={id}
      className={`step ${isActive ? "step--active" : ""}`}
    >
      <div className="step__inner">
        <h2>{headline}</h2>
        <p>{body}</p>
      </div>
    </section>
  );
}
