import type { CurbActor, GraphicState, StepId } from "../types";

type GraphicProps = {
  state: GraphicState;
  stepId: StepId;
};

type SceneAnnotation = {
  anchorX: number;
  anchorY: number;
  targetX: number;
  targetY: number;
  width?: string;
};

type ScenePlacement = {
  left: string;
  top: string;
  width?: string;
  rotate?: number;
  scale?: number;
  anchor?: "center" | "bottom-center";
  label?: string;
  annotation?: SceneAnnotation;
};

type ActorVisual = {
  kind: "image" | "dock" | "bus";
  src?: string;
  alt?: string;
  placements: ScenePlacement[];
};

const laneLabels = [
  {
    label: "SIDEWALK",
    color: "#55657f",
    backgroundColor: "rgba(139, 154, 183, 0.22)"
  },
  {
    label: "BUS LANE",
    color: "#c84e1d",
    backgroundColor: "rgba(255, 87, 51, 0.18)"
  },
  {
    label: "TRAVEL LANES",
    color: "#475569",
    backgroundColor: "rgba(100, 116, 139, 0.16)"
  },
  {
    label: "BIKE LANES",
    color: "#0056b3",
    backgroundColor: "rgba(0, 86, 179, 0.14)"
  },
  {
    label: "PARKING",
    color: "#8f6a00",
    backgroundColor: "rgba(255, 204, 0, 0.2)"
  } ,
   {
    label: "SIDEWALK",
    color: "#55657f",
    backgroundColor: "rgba(139, 154, 183, 0.22)"
  }
] as const;

const roadSrc = new URL(
  "../assets/plane_one_bikelane_semantic_grouped.svg",
  import.meta.url
).href;
const busStopSignSrc = new URL("../assets/bus-stop-sign.svg", import.meta.url)
  .href;
const busSrc = new URL("../assets/Bus.svg", import.meta.url).href;
const carSrc = new URL("../assets/car.svg", import.meta.url).href;
const deliveryTruckSrc = new URL(
  "../assets/delivery-truck.svg",
  import.meta.url
).href;
const docksSrc = new URL("../assets/docks.svg", import.meta.url).href;
const cyclistLaneSrc = new URL("../assets/cyclist1.svg", import.meta.url).href;
const cyclistMergeSrc = new URL("../assets/cyclist2.svg", import.meta.url).href;
const pickupPassengerSrc = new URL("../assets/passenger-fhv.svg", import.meta.url)
  .href;
const busPassengerOneSrc = new URL("../assets/passenger-bus1.svg", import.meta.url)
  .href;
const busPassengerTwoSrc = new URL("../assets/passenger-bus2.svg", import.meta.url)
  .href;
const treeSrc = new URL("../assets/tree_grey.png", import.meta.url).href;

const deliveryPlacement: ScenePlacement = {
  left: "60%",
  top: "63%",
  width: "9rem",
  rotate: -6,
  anchor: "bottom-center",
  label: "Delivery",
  annotation: {
    anchorX: 76,
    anchorY: -24,
    targetX: 20,
    targetY: -6
  }
};

const parkingAttemptPlacement: ScenePlacement = {
  left: "52%",
  top: "47%",
  width: "8rem",
  rotate: -2,
  anchor: "bottom-center"
};

const congestionQueuePlacements: ScenePlacement[] = [
  {
    left: "51%",
    top: "22%",
    width: "7rem",
    rotate: -2,
    anchor: "bottom-center"
  }
];

const pickupPlacement: ScenePlacement = {
  left: "68%",
  top: "48%",
  width: "7.5rem",
  rotate: 353.5,
  anchor: "bottom-center",
  label: "Pickup",
  annotation: {
    anchorX: 70,
    anchorY: -18,
    targetX: 18,
    targetY: -6
  }
};

const pickupPassengerPlacement: ScenePlacement = {
  left: "73%",
  top: "44%",
  width: "2.5rem",
  anchor: "bottom-center"
};

const busPlacement: ScenePlacement = {
  left: "30.5%",
  top: "90%",
  width: "11.5rem",
  rotate: 6.5,
  anchor: "bottom-center"
};

const busPassengerPlacements = [
  {
    src: busPassengerOneSrc,
    placement: {
      left: "21.2%",
      top: "54.5%",
      width: "3rem",
      anchor: "bottom-center"
    } satisfies ScenePlacement
  },
  {
    src: busPassengerTwoSrc,
    placement: {
      left: "18%",
      top: "55.6%",
      width: "6.5rem",
      anchor: "bottom-center"
    } satisfies ScenePlacement
  }
] as const;

const actorVisuals: Record<CurbActor, ActorVisual> = {
  "parked-cars": {
    kind: "image",
    src: carSrc,
    alt: "Parked cars using curb space",
    placements: [
      {
        left: "73.5%",
        top: "85%",
        width: "9rem",
        rotate: 353
      },
      { left: "71%", top: "61%", width: "8rem", rotate: 354 },
      {
        left: "65%",
        top: "14%",
        width: "6.5rem",
        rotate: 355,
        label: "Parked Vehicles",
        annotation: {
          anchorX: 70,
          anchorY: -18,
          targetX: 18,
          targetY: -8
        }
      }
    ]
  },
  "bike-docks": {
    kind: "image",
    src: docksSrc,
    alt: "Bike docks using curb space",
    placements: [
      {
        left: "75%",
        top: "34%",
        width: "5.6rem",
        label: "Bike dock",
        annotation: {
          anchorX: 54,
          anchorY: -20,
          targetX: 18,
          targetY: -4
        }
      }
    ]
  },
  buses: {
    kind: "image",
    src: busStopSignSrc,
    alt: "Bus stop sign showing transit curb access",
    placements: [
      {
        left: "24%",
        top: "40%",
        width: "6rem",
        label: "Bus stop",
        annotation: {
          anchorX: 46,
          anchorY: 6,
          targetX: 10,
          targetY: 8
        }
      }
    ]
  },
  "delivery-vehicles": {
    kind: "image",
    src: deliveryTruckSrc,
    alt: "Delivery vehicle competing for curb access",
    placements: [deliveryPlacement]
  },
  fhv: {
    kind: "image",
    src: carSrc,
    alt: "For-hire vehicle picking up or dropping off a passenger",
    placements: [pickupPlacement]
  }
};

const cyclistMergePlacement: ScenePlacement = {
  left: "60%",
  top: "30%",
  width: "2rem",
  rotate: 2,
  anchor: "bottom-center",
  label: "Cyclist forced to merge",
  annotation: {
    anchorX: 78,
    anchorY: -22,
    targetX: 20,
    targetY: -10,
    width: "9.5rem"
  }
};

const cyclistMergePathD =
  "M 59.8 33.6 C 56.7 38.1, 54.4 43.1, 54.1 48.5 C 53.8 54.3, 56.1 59.3, 59.2 63.2 C 61.4 66.1, 63.1 69.1, 64.3 72";

const cyclistLanePlacement: ScenePlacement = {
  left: "64.5%",
  top: "85%",
  width: "2.8rem",
  rotate: -10,
  anchor: "bottom-center"
};

const treePlacements: ScenePlacement[] = [
  {
    left: "18%",
    top: "93%",
    width: "15rem",
    anchor: "bottom-center"
  },
  {
    left: "26%",
    top: "30%",
    width: "10rem",
    anchor: "bottom-center"
  },
  {
    left: "81%",
    top: "78%",
    width: "14rem",
    anchor: "bottom-center"
  },
  {
    left: "72%",
    top: "20%",
    width: "10rem",
    anchor: "bottom-center"
  }
];

function actorAnchorStyle(placement: ScenePlacement) {
  return {
    left: placement.left,
    top: placement.top
  };
}

function actorBodyStyle(placement: ScenePlacement) {
  const scale = placement.scale ?? 1;
  const rotate = placement.rotate ?? 0;
  const translate =
    placement.anchor === "bottom-center"
      ? "translate(-50%, -100%)"
      : "translate(-50%, -50%)";

  return {
    left: 0,
    top: 0,
    width: placement.width,
    transform: `${translate} rotate(${rotate}deg) scale(${scale})`
  };
}

function fadeInActorAnchorClassName() {
  return "scene__actor-anchor scene__actor-anchor--fade-in";
}

function renderAnnotation(label: string, annotation: SceneAnnotation) {
  const dx = annotation.targetX - annotation.anchorX;
  const dy = annotation.targetY - annotation.anchorY;
  const length = Math.hypot(dx, dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const labelOffset = 30;
  const labelX = length === 0 ? 0 : (-dx / length) * labelOffset;
  const labelY = length === 0 ? 0 : (-dy / length) * labelOffset;

  return (
    <div
      className="scene__annotation"
      style={{ left: `${annotation.anchorX}px`, top: `${annotation.anchorY}px` }}
    >
      <span
        className="scene__annotation-text"
        style={{
          left: `${labelX}px`,
          top: `${labelY}px`,
          width: annotation.width
        }}
      >
        {label}
      </span>
      <span
        className="scene__annotation-line"
        style={{
          width: `${length}px`,
          transform: `rotate(${angle}deg)`
        }}
      />
      <span
        className="scene__annotation-dot"
        style={{ left: `${dx}px`, top: `${dy}px` }}
      />
    </div>
  );
}

function renderActor(actor: CurbActor) {
  const visual = actorVisuals[actor];

  return visual.placements.map((placement, index) => {
    const key = `${actor}-${index}`;
    const className = ["scene__actor", `scene__actor--${visual.kind}`]
      .filter(Boolean)
      .join(" ");

    return (
      <div
        key={key}
        className={fadeInActorAnchorClassName()}
        style={actorAnchorStyle(placement)}
      >
        <div className={className} style={actorBodyStyle(placement)}>
          {visual.kind === "image" ? (
            <img className="scene__vehicle" src={visual.src} alt={visual.alt} />
          ) : null}
        </div>
        {placement.label && placement.annotation
          ? renderAnnotation(placement.label, placement.annotation)
          : null}
      </div>
    );
  });
}

function renderCyclistMergePath() {
  return (
    <svg
      className="scene__merge-path"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <marker
          id="scene-merge-arrow"
          viewBox="0 0 12 12"
          refX="10"
          refY="6"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M 0 0 L 12 6 L 0 12 z" fill="#be123c" />
        </marker>
      </defs>
      <path
        className="scene__merge-path-line"
        d={cyclistMergePathD}
        pathLength={100}
        markerEnd="url(#scene-merge-arrow)"
      />
    </svg>
  );
}

export function Graphic({ state, stepId }: GraphicProps) {
  const hasDoubleParking = state.conflicts.includes("double-parking");
  const hasBikeMerge = state.conflicts.includes("bike-merge");
  const hasBuses = state.visibleActors.includes("buses");
  const hasBikeDocks = state.visibleActors.includes("bike-docks");
  const hasFhv = state.visibleActors.includes("fhv");
  const showBusPassengers = stepId === "claimant-buses";
  const showCongestionQueue = hasDoubleParking;
  const showParkingAttempt = hasDoubleParking && !hasBikeMerge;
  const showParkingBlinker = showParkingAttempt;
  const sceneClassName = [
    "scene",
    hasBikeMerge ? "scene--safety" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={sceneClassName}>
      <div className={sceneClassName.replace("scene", "scene__canvas")}>
        <img
          className="scene__road"
          src={roadSrc}
          alt="A stylized street section used as the base layer of the visualization."
        />

        <div className="scene__street-layer">
          {treePlacements.map((placement, index) => (
            <div
              key={`tree-${index}`}
              className={fadeInActorAnchorClassName()}
              style={actorAnchorStyle(placement)}
            >
              <div className="scene__actor" style={actorBodyStyle(placement)}>
                <img className="scene__tree" src={treeSrc} alt="" aria-hidden="true" />
              </div>
            </div>
          ))}

          {hasBikeMerge ? renderCyclistMergePath() : null}

          {state.visibleActors.flatMap((actor) => renderActor(actor))}

          {hasFhv ? (
            <div
              className={fadeInActorAnchorClassName()}
              style={actorAnchorStyle(pickupPassengerPlacement)}
            >
              <div className="scene__actor" style={actorBodyStyle(pickupPassengerPlacement)}>
                <img
                  className="scene__vehicle"
                  src={pickupPassengerSrc}
                  alt=""
                  aria-hidden="true"
                />
              </div>
            </div>
          ) : null}

          {showBusPassengers
            ? busPassengerPlacements.map(({ src, placement }, index) => (
                <div
                  key={`bus-passenger-${index}`}
                  className={fadeInActorAnchorClassName()}
                  style={actorAnchorStyle(placement)}
                >
                  <div className="scene__actor" style={actorBodyStyle(placement)}>
                    <img className="scene__vehicle" src={src} alt="" aria-hidden="true" />
                  </div>
                </div>
              ))
            : null}

          {hasBuses ? (
            <div
              className={fadeInActorAnchorClassName()}
              style={actorAnchorStyle(busPlacement)}
            >
              <div className="scene__actor" style={actorBodyStyle(busPlacement)}>
                <img
                  className="scene__vehicle"
                  src={busSrc}
                  alt="Bus arriving in the curb lane beside the stop"
                />
              </div>
            </div>
          ) : null}

          {showParkingAttempt ? (
            <div
              className={fadeInActorAnchorClassName()}
              style={actorAnchorStyle(parkingAttemptPlacement)}
            >
              <div
                className="scene__actor scene__actor--double-parked scene__actor--parking-attempt"
                style={actorBodyStyle(parkingAttemptPlacement)}
              >
                <img
                  className="scene__vehicle"
                  src={carSrc}
                  alt="Passenger vehicle edging into the lane while trying to park"
                />
                {showParkingBlinker ? (
                  <span className="scene__parking-blinker" aria-hidden="true" />
                ) : null}
              </div>
            </div>
          ) : null}

          {showCongestionQueue
            ? congestionQueuePlacements.map((placement, index) => (
                <div
                  key={`queue-car-${index}`}
                  className={[
                    "scene__actor-anchor",
                    hasBikeMerge ? "" : "scene__actor-anchor--fade-in",
                    hasBikeMerge ? "scene__actor-anchor--queue-hazard" : ""
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={actorAnchorStyle(placement)}
                >
                  <div className="scene__actor" style={actorBodyStyle(placement)}>
                    <img
                      className="scene__vehicle"
                      src={carSrc}
                      alt="Traffic queue forming behind the blocked lane"
                    />
                  </div>
                </div>
              ))
            : null}

          {hasBikeDocks ? (
            <div
              className={fadeInActorAnchorClassName()}
              style={actorAnchorStyle(cyclistLanePlacement)}
            >
              <div className="scene__actor" style={actorBodyStyle(cyclistLanePlacement)}>
                <img
                  className="scene__cyclist"
                  src={cyclistLaneSrc}
                  alt="Cyclist riding in the bike lane"
                />
              </div>
            </div>
          ) : null}

          {hasBikeMerge ? (
            <div
              className={[
                "scene__actor-anchor",
                "scene__actor-anchor--cyclist-merge-hazard"
              ].join(" ")}
              style={actorAnchorStyle(cyclistMergePlacement)}
            >
              <div
                className="scene__cyclist-merge"
                style={actorBodyStyle(cyclistMergePlacement)}
              >
                <img
                  className="scene__cyclist"
                  src={cyclistMergeSrc}
                  alt="Cyclist moving around a curbside obstruction"
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="scene__overlay">
        <div className="scene__panel">
          <h2>{state.title}</h2>
          <p>{state.note}</p>
        </div>
      </div>

      <div className="scene__lane-labels" aria-label="Street space labels">
        {laneLabels.map((item) => (
          <span
            key={item.label}
            className="scene__lane-label"
            style={{
              color: item.color,
              backgroundColor: item.backgroundColor,
              borderColor: item.color
            }}
          >
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
