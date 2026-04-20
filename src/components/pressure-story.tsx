import { useScrollSteps } from "../hooks/useScrollSteps";
import { pressureChapters } from "../story/pressureChapters";
import { PressureGraphic } from "./pressure-graphic";
import { Step } from "./step";

const pressureStepIds = pressureChapters.map((chapter) => chapter.id);

export function PressureStory() {
  const activeStepId = useScrollSteps(pressureStepIds);
  const activeChapter =
    pressureChapters.find((chapter) => chapter.id === activeStepId) ??
    pressureChapters[0];

  return (
    <section className="pressure-story-shell" aria-labelledby="pressure-story-title">
      <div className="pressure-story__intro">
        <p className="pressure-story__eyebrow">Where curb pressure is highest</p>
        <h2 id="pressure-story-title">The curb is contested across the city, but the pressure is not evenly distributed.</h2>
        <p className="pressure-story__summary">
         Explore the citywide pattern, then zoom into a location where competing demands overwhelm the available curb.
        </p>
      </div>

      <div className="scrolly pressure-scrolly">
        <div className="scrolly__graphic">
          <div className="scrolly__sticky">
            <PressureGraphic state={activeChapter.state} />
          </div>
        </div>

        <div className="scrolly__text pressure-scrolly__text">
          {pressureChapters.map((chapter) => (
            <Step
              key={chapter.id}
              id={chapter.id}
              headline={chapter.headline}
              body={chapter.body}
              isActive={chapter.id === activeStepId}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
