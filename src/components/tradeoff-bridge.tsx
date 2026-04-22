import { useScrollSteps } from "../hooks/useScrollSteps";
import { Step } from "./step";

const cyclistSrc = new URL("../assets/cyclist1.svg", import.meta.url).href;
const passengerFhvSrc = new URL("../assets/passenger-fhv.svg", import.meta.url).href;
const carSrc = new URL("../assets/car.svg", import.meta.url).href;
const busStopSignSrc = new URL("../assets/bus-stop-sign.svg", import.meta.url).href;

const tradeoffBridgeChapters = [
  {
    id: "tradeoff-bridge-question",
    headline:
      "The next question is how to allocate limited space once those pressures converge?",
    body:
      "Hotspots show where curb demand stacks up. The design challenge is deciding which outcomes to protect when the same few feet of curb must do many jobs."
  },
  {
    id: "tradeoff-bridge-safety",
    headline: "Some tradeoffs are about who feels safe using the street.",
    body:
      "The scorecards track Bike safety and Pedestrian safety so you can compare how each design changes exposure to conflict."
  },
  {
    id: "tradeoff-bridge-operations",
    headline: "Others are about how reliably the street can keep working.",
    body:
      "Traffic reliability and Curb flexibility capture how well a layout keeps movement flowing while still adapting to loading, pickup, and short-term curb demand."
  },
  {
    id: "tradeoff-bridge-scorecards",
    headline: "Scroll down to compare all four dimensions at once.",
    body:
      "Bike safety, Pedestrian safety, Traffic reliability, and Curb flexibility make the tradeoffs legible across every curb configuration."
  }
] as const;

type TradeoffBridgeStepId = (typeof tradeoffBridgeChapters)[number]["id"];

const tradeoffBridgeStepIds = tradeoffBridgeChapters.map(
  (chapter) => chapter.id
) as TradeoffBridgeStepId[];

const axisDots = ["14%", "35%", "56%", "77%"] as const;

const tradeoffDimensions = [
  {
    label: "Bike safety",
    assetSrc: cyclistSrc,
    tone: "safety"
  },
  {
    label: "Pedestrian safety",
    assetSrc: passengerFhvSrc,
    tone: "walk"
  },
  {
    label: "Traffic reliability",
    assetSrc: carSrc,
    tone: "flow"
  },
  {
    label: "Curb flexibility",
    assetSrc: busStopSignSrc,
    tone: "flex"
  }
] as const;

function TradeoffBridgeGraphic({
  activeStepId
}: {
  activeStepId: TradeoffBridgeStepId;
}) {
  return (
    <div
      className={`tradeoff-bridge-scene tradeoff-bridge-scene--${activeStepId}`}
      aria-hidden="true"
    >
      <div className="tradeoff-bridge-scene__axis">
        <span className="tradeoff-bridge-scene__axis-line" />
        {axisDots.map((top, index) => (
          <span
            key={top}
            className="tradeoff-bridge-scene__axis-dot"
            data-index={index}
            style={{ top }}
          />
        ))}
      </div>

      <div className="tradeoff-bridge-scene__panel-shell">
        <div className="tradeoff-bridge-scene__chip-grid">
          {tradeoffDimensions.map((dimension) => (
            <article
              key={dimension.label}
              className={`tradeoff-bridge-scene__chip tradeoff-bridge-scene__chip--${dimension.tone}`}
            >
              <div className="tradeoff-bridge-scene__chip-top">
                <span className="tradeoff-bridge-scene__chip-label-wrap">
                  <span className="tradeoff-bridge-scene__chip-swatch" />
                  <span className="tradeoff-bridge-scene__chip-label">
                    {dimension.label}
                  </span>
                </span>
                <img
                  className="tradeoff-bridge-scene__chip-icon"
                  src={dimension.assetSrc}
                  alt=""
                />
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TradeoffBridge() {
  const activeStepId = useScrollSteps(tradeoffBridgeStepIds);

  return (
    <section
      className="tradeoff-bridge-shell"
      aria-label="Bridge from curb pressure to scorecard tradeoffs"
    >
      <div className="scrolly tradeoff-bridge-scrolly">
        <div className="scrolly__graphic">
          <div className="scrolly__sticky">
            <TradeoffBridgeGraphic activeStepId={activeStepId} />
          </div>
        </div>

        <div className="scrolly__text tradeoff-bridge-scrolly__text">
          {tradeoffBridgeChapters.map((chapter) => (
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
