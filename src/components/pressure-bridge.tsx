import { useScrollSteps } from "../hooks/useScrollSteps";
import { Step } from "./step";

const bridgeChapters = [
  {
    id: "pressure-bridge-uneven",
    headline: "Pressure is uneven",
    body:
      "Curb congestion is not spread evenly across the city. It concentrates where demand for the curb is especially intense."
  },
  {
    id: "pressure-bridge-drivers",
    headline: "What drives demand",
    body:
      "Business density, retail activity, delivery-generating land uses, traffic volume, and bus routes all increase pressure on curb space."
  },
  {
    id: "pressure-bridge-stacking",
    headline: "Stacking factors",
    body:
      "Any one factor can matter. But the sharpest conflicts appear where several of them overlap on the same streets."
  }
] as const;

type BridgeStepId = (typeof bridgeChapters)[number]["id"];

const bridgeStepIds = bridgeChapters.map((chapter) => chapter.id) as BridgeStepId[];

const axisDots = ["11%", "24%", "38%", "52%", "66%", "80%"] as const;
const segmentGlows = [
  { top: "12.5%", height: "10%", tone: "yellow" },
  { top: "26.5%", height: "10%", tone: "orange" },
  { top: "40.5%", height: "10%", tone: "red" },
  { top: "54.5%", height: "10%", tone: "yellow-soft" },
  { top: "68.5%", height: "10%", tone: "red" }
] as const;
const demandLayers = [
  { label: "Business density", tone: "steel" },
  { label: "Retail activity", tone: "amber" },
  { label: "Delivery land uses", tone: "rust" },
  { label: "Traffic volume", tone: "slate" },
  { label: "Bus routes", tone: "teal" }
] as const;

function PressureBridgeGraphic({ activeStepId }: { activeStepId: BridgeStepId }) {
  return (
    <div
      className={`pressure-bridge-scene pressure-bridge-scene--${activeStepId}`}
      aria-hidden="true"
    >
      <div className="pressure-bridge-scene__axis">
        {segmentGlows.map((segment) => (
          <span
            key={`${segment.top}-${segment.tone}`}
            className={`pressure-bridge-scene__segment-glow pressure-bridge-scene__segment-glow--${segment.tone}`}
            style={{ top: segment.top, height: segment.height }}
          />
        ))}
        <span className="pressure-bridge-scene__axis-line" />
        {axisDots.map((top) => (
          <span
            key={top}
            className="pressure-bridge-scene__axis-dot"
            style={{ top }}
          />
        ))}
      </div>

      <div className="pressure-bridge-scene__layer-stack">
        {demandLayers.map((layer) => (
          <div
            key={layer.label}
            className={`pressure-bridge-scene__layer-item pressure-bridge-scene__layer-item--${layer.tone}`}
          >
            <div
              className={`pressure-bridge-scene__layer-plane pressure-bridge-scene__layer-plane--${layer.tone}`}
            />
            <span className="pressure-bridge-scene__layer-tag">{layer.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PressureBridge() {
  const activeStepId = useScrollSteps(bridgeStepIds);

  return (
    <section className="pressure-bridge-shell" aria-label="Bridge to citywide curb pressure">
      <div className="scrolly pressure-bridge-scrolly">
        <div className="scrolly__graphic">
          <div className="scrolly__sticky">
            <PressureBridgeGraphic activeStepId={activeStepId} />
          </div>
        </div>

        <div className="scrolly__text pressure-bridge-scrolly__text">
          {bridgeChapters.map((chapter) => (
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
