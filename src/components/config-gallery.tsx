import { useEffect, useState } from "react";
import {
  curbConfigurations,
  scoreMeaning,
  type CurbConfiguration
} from "../data/curbConfigurations";

type ScoreMetric = {
  key: keyof CurbConfiguration["scores"];
  label: string;
  shortLabel: string;
  tone: "safety" | "walk" | "flow" | "flex";
};

const scoreMetrics: ScoreMetric[] = [
  { key: "bikeSafety", label: "Bike safety", shortLabel: "Bike", tone: "safety" },
  {
    key: "pedestrianSafety",
    label: "Pedestrian safety",
    shortLabel: "Ped.",
    tone: "walk"
  },
  {
    key: "trafficReliability",
    label: "Traffic reliability",
    shortLabel: "Flow",
    tone: "flow"
  },
  {
    key: "curbFlexibility",
    label: "Curb flexibility",
    shortLabel: "Flex",
    tone: "flex"
  }
];

function averageScore(config: CurbConfiguration) {
  const values = Object.values(config.scores);
  const total = values.reduce((sum, value) => sum + value, 0);
  return (total / values.length).toFixed(1);
}

const scoreToneColors: Record<ScoreMetric["tone"], string> = {
  safety: "#15835f",
  walk: "var(--teal)",
  flow: "var(--amber)",
  flex: "var(--blue)"
};

function formatConflictLabel(conflict: string) {
  const spaced = conflict.split("_").join(" ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function radarPoint(index: number, value: number, axisCount: number, radius: number) {
  const angle = -Math.PI / 2 + (index * Math.PI * 2) / axisCount;

  return {
    x: 140 + Math.cos(angle) * radius * (value / 5),
    y: 140 + Math.sin(angle) * radius * (value / 5)
  };
}

function labelAnchor(x: number) {
  if (x < 124) return "end";
  if (x > 156) return "start";
  return "middle";
}

function ScoreRadarChart({ config }: { config: CurbConfiguration }) {
  const radius = 86;
  const axisCount = scoreMetrics.length;
  const gradientId = `score-radar-fill-${config.id}`;
  const overallScore = averageScore(config);
  const polygonPoints = scoreMetrics
    .map((metric, index) => {
      const value = config.scores[metric.key];
      const point = radarPoint(index, value, axisCount, radius);
      return `${point.x},${point.y}`;
    })
    .join(" ");
  const ariaLabel = scoreMetrics
    .map((metric) => `${metric.label} ${config.scores[metric.key]} out of 5`)
    .join(", ");

  return (
    <div className="score-radar" role="img" aria-label={ariaLabel}>
      <svg className="score-radar__svg" viewBox="0 0 280 280" aria-hidden="true">
        <defs>
          <radialGradient id={gradientId} cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#11786e" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#163047" stopOpacity="0.12" />
          </radialGradient>
        </defs>

        {Array.from({ length: 5 }, (_, levelIndex) => {
          const level = levelIndex + 1;
          const points = scoreMetrics
            .map((_, index) => {
              const point = radarPoint(index, level, axisCount, radius);
              return `${point.x},${point.y}`;
            })
            .join(" ");

          return <polygon key={level} className="score-radar__grid" points={points} />;
        })}

        {scoreMetrics.map((_, index) => {
          const outerPoint = radarPoint(index, 5, axisCount, radius);

          return (
            <line
              key={`axis-${index}`}
              className="score-radar__axis"
              x1="140"
              y1="140"
              x2={outerPoint.x}
              y2={outerPoint.y}
            />
          );
        })}

        <polygon
          className="score-radar__shape"
          points={polygonPoints}
          fill={`url(#${gradientId})`}
        />

        <circle className="score-radar__center-ring" cx="140" cy="140" r="26" />
        <text className="score-radar__center-value" x="140" y="136">
          {overallScore}
        </text>
        <text className="score-radar__center-label" x="140" y="155">
          Overall
        </text>

        {scoreMetrics.map((metric, index) => {
          const point = radarPoint(index, config.scores[metric.key], axisCount, radius);
          const labelPoint = radarPoint(index, 5, axisCount, radius + 24);

          return (
            <g key={metric.key}>
              <circle
                className="score-radar__point"
                cx={point.x}
                cy={point.y}
                r="5"
                fill={scoreToneColors[metric.tone]}
              />
              <text
                className={`score-radar__label score-radar__label--${metric.tone}`}
                x={labelPoint.x}
                y={labelPoint.y}
                textAnchor={labelAnchor(labelPoint.x)}
                dominantBaseline="central"
              >
                {metric.shortLabel}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function ScoreLegendItem({
  label,
  value,
  tone
}: {
  label: string;
  value: number;
  tone: ScoreMetric["tone"];
}) {
  return (
    <div className={`score-chip score-chip--${tone}`}>
      <div className="score-chip__top">
        <span className="score-chip__label-wrap">
          <span className="score-chip__swatch" aria-hidden="true" />
          <span className="score-chip__label">{label}</span>
        </span>
        <span className="score-chip__value">{value}/5</span>
      </div>
      <p className="score-chip__meaning">{scoreMeaning[value as keyof typeof scoreMeaning]}</p>
    </div>
  );
}

function DetailOverlay({
  config,
  isFlipped,
  onClose
}: {
  config: CurbConfiguration;
  isFlipped: boolean;
  onClose: () => void;
}) {
  return (
    <div className="detail-layer" onClick={onClose}>
      <div
        className="detail-shell"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`detail-title-${config.id}`}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="detail-close"
          onClick={onClose}
          aria-label="Close selected configuration"
        >
          Back to all 12
        </button>

        <div className="detail-card-frame">
          <div className={`detail-card ${isFlipped ? "detail-card--flipped" : ""}`}>
            <article className="detail-card__face detail-card__face--front">
              <div className="detail-media">
                <p className="detail-eyebrow">Selected configuration</p>
                <h2 id={`detail-title-${config.id}`}>{config.title}</h2>
                <div className="detail-media__frame">
                  <img
                    src={config.assetSrc}
                    alt={`${config.title} curb configuration diagram`}
                  />
                </div>
              </div>

              <div className="detail-side">
                <div className="detail-note">
                  <p className="detail-note__label">Flip reveal</p>
                  <p>
                    The selected section zooms into focus first, then flips to
                    the score side so the comparison feels like a decision card.
                  </p>
                </div>

              </div>
            </article>

            <article className="detail-card__face detail-card__face--back">
              <div className="detail-media detail-media--back">
                <p className="detail-eyebrow">Score card</p>
                <h2>{config.title}</h2>
                <p className="detail-copy">{config.oneLineExplanation}</p>
                <div className="detail-media__frame">
                  <img
                    src={config.assetSrc}
                    alt={`${config.title} curb configuration diagram`}
                  />
                </div>
              </div>

              <div className="detail-side detail-side--scores">
                <div className="score-panel">
                  <ScoreRadarChart config={config} />

                  <div className="score-list">
                  {scoreMetrics.map((metric) => (
                    <ScoreLegendItem
                      key={metric.key}
                      label={metric.label}
                      value={config.scores[metric.key]}
                      tone={metric.tone}
                    />
                  ))}
                  </div>
                </div>

                <div className="detail-tradeoff">
                  <p className="detail-tradeoff__label">Main tradeoff</p>
                  <p>{formatConflictLabel(config.keyConflictType)}</p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ConfigGallery() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  const selectedConfig =
    curbConfigurations.find((config) => config.id === selectedId) ?? null;

  useEffect(() => {
    if (!selectedConfig) {
      return;
    }

    setIsFlipped(false);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const flipTimer = window.setTimeout(() => {
      setIsFlipped(true);
    }, 220);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(flipTimer);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedConfig]);

  const handleSelect = (configId: string) => {
    setSelectedId(configId);
    setIsFlipped(false);
  };

  return (
    <section
      className={`gallery-shell ${selectedConfig ? "gallery-shell--detail-open" : ""}`}
    >
      <div className="gallery-toolbar">
        <div className="gallery-toolbar__copy">
          <p className="gallery-toolbar__eyebrow">Choose your curb</p>
          <h2>When everyone wants the curb, design becomes a negotiation.</h2>
          <p className="gallery-toolbar__subhead">
            Each layout makes different choices about who gets space, who waits, and who moves safely. Browse the configurations and flip each card to compare the tradeoffs.
          </p>
        </div>
      </div>

      <div className="config-grid" aria-label="Curb configuration options">
        {curbConfigurations.map((config) => (
          <button
            key={config.id}
            type="button"
            className="config-card"
            onClick={() => handleSelect(config.id)}
            aria-label={`Open ${config.title}`}
          >
            <span className="config-card__preview">
              <img
                src={config.assetSrc}
                alt={`${config.title} curb configuration diagram`}
                loading="lazy"
              />
            </span>

            <span className="config-card__body">
              <span className="config-card__headline">
                <span className="config-card__title">{config.title}</span>
                <span className="config-card__overall">
                  <span className="config-card__overall-label">Overall</span>
                  <span className="config-card__overall-value">
                    {averageScore(config)}
                  </span>
                </span>
              </span>
            </span>
          </button>
        ))}
      </div>

      {selectedConfig ? (
        <DetailOverlay
          config={selectedConfig}
          isFlipped={isFlipped}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </section>
  );
}
