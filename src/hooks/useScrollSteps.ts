import { useEffect, useState } from "react";

export function useScrollSteps<T extends string>(stepIds: readonly T[]) {
  const [activeStepId, setActiveStepId] = useState<T>(stepIds[0]);
  const stepIdKey = stepIds.join("|");

  useEffect(() => {
    const activationLineRatio = 0.58;
    const steps = stepIds
      .map((id) => {
        const element = document.querySelector<HTMLElement>(
          `[data-step-id="${id}"] .step__inner`
        );

        if (!element) return null;

        return { id, element };
      })
      .filter((step): step is { id: T; element: HTMLElement } => step !== null);

    if (steps.length === 0) return;

    let frameId = 0;

    const updateActiveStep = () => {
      frameId = 0;
      const activationY = window.innerHeight * activationLineRatio;
      let nextActiveStepId = steps[0].id;
      let closestScore = Number.POSITIVE_INFINITY;

      for (const step of steps) {
        const rect = step.element.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;
        const distance = Math.abs(centerY - activationY);
        const isVisible = rect.bottom > 0 && rect.top < window.innerHeight;
        const score = isVisible ? distance : distance + window.innerHeight;

        if (score < closestScore) {
          closestScore = score;
          nextActiveStepId = step.id;
        }
      }

      setActiveStepId((currentStepId) =>
        currentStepId === nextActiveStepId ? currentStepId : nextActiveStepId
      );
    };

    const scheduleUpdate = () => {
      if (frameId !== 0) return;
      frameId = window.requestAnimationFrame(updateActiveStep);
    };

    updateActiveStep();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }

      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [stepIdKey]);

  return activeStepId;
}
