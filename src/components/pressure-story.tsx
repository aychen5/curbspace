import { useEffect, useState } from "react";

import { useScrollSteps } from "../hooks/useScrollSteps";
import { pressureChapters } from "../story/pressureChapters";
import { PressureGraphic } from "./pressure-graphic";
import { Step } from "./step";

const pressureStepIds = pressureChapters.map((chapter) => chapter.id);

export function PressureStory() {
  const activeStepId = useScrollSteps(pressureStepIds);
  const [hotspotChartsVisible, setHotspotChartsVisible] = useState(false);
  const activeChapter =
    pressureChapters.find((chapter) => chapter.id === activeStepId) ??
    pressureChapters[0];

  useEffect(() => {
    let frameId = 0;

    const updateHotspotChartVisibility = () => {
      frameId = 0;
      const hotspotHeadline = document.querySelector<HTMLElement>(
        '[data-step-id="pressure-hotspot"] .step__inner h2'
      );

      if (!hotspotHeadline) {
        setHotspotChartsVisible(false);
        return;
      }

      const rect = hotspotHeadline.getBoundingClientRect();
      const halfwayY = window.innerHeight * 0.5;
      const centerY = rect.top + rect.height / 2;
      const isVisible = rect.bottom > 0 && rect.top < window.innerHeight;

      setHotspotChartsVisible(isVisible && centerY <= halfwayY);
    };

    const scheduleUpdate = () => {
      if (frameId !== 0) {
        return;
      }

      frameId = window.requestAnimationFrame(updateHotspotChartVisibility);
    };

    updateHotspotChartVisibility();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }

      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, []);

  return (
    <section className="pressure-story-shell" aria-labelledby="pressure-story-title">
      <div className="pressure-story__intro">
        <p className="pressure-story__eyebrow">Uneven curb pressure</p>
        <h2 id="pressure-story-title">Explore where curb pressure is highest across the city</h2>
        <p className="pressure-story__summary">
          Zoom into a location where competing uses put the curb under the greatest strain.
        </p>
      </div>

      <div className="scrolly pressure-scrolly">
        <div className="scrolly__graphic">
          <div className="scrolly__sticky">
            <PressureGraphic
              state={activeChapter.state}
              revealHotspotMetrics={hotspotChartsVisible}
            />
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
