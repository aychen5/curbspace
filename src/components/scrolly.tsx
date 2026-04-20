//This is the state lookup, see activeStepId → chapter → state 
/*
  Connects story data to the UI
  - renders all Step components
  - finds the active chapter from chapters + activeStepId
  - passes activeChapter.state into <Graphic />
*/
import { Step } from "./step";
import { Graphic } from "./graphic";
import type { Chapter, StepId } from "../types";

type ScrollyProps = {
  chapters: Chapter[];
  activeStepId: StepId;
};

export function Scrolly({ chapters, activeStepId }: ScrollyProps) {
  const activeChapter =
    chapters.find((chapter) => chapter.id === activeStepId) ?? chapters[0];

  return (
    <div className="scrolly">
      <div className="scrolly__graphic">
        <div className="scrolly__sticky">
          <Graphic state={activeChapter.state} stepId={activeStepId} />
        </div>
      </div>

      <div className="scrolly__text">
        {chapters.map((chapter) => (
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
  );
}
